const pool = require("../../config/db");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function toNumber(value) {
  return Number(value || 0);
}

function monthStart(month) {
  const date = month ? new Date(month) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function computeGross(structure, payload) {
  const allowances =
    toNumber(structure.ta_amount) +
    toNumber(structure.da_amount) +
    toNumber(structure.hra_amount) +
    toNumber(structure.other_allowance);

  if (structure.pay_type === "per_day") {
    return (toNumber(structure.per_day_rate) * toNumber(payload.attended_days)) + allowances;
  }

  if (structure.pay_type === "per_period") {
    return (toNumber(structure.per_period_rate) * toNumber(payload.periods_taken)) + allowances;
  }

  return toNumber(structure.basic_amount) + allowances;
}

function computeLeaveDeduction(structure, payload, grossSalary) {
  const extraLeaves = Math.max(0, toNumber(payload.paid_leaves_taken) - toNumber(structure.allowed_paid_leaves || 1));
  if (extraLeaves <= 0) return 0;

  if (structure.pay_type === "per_day") {
    return extraLeaves * toNumber(structure.per_day_rate);
  }

  if (structure.pay_type === "monthly") {
    const workingDays = Math.max(1, toNumber(payload.working_days));
    return (grossSalary / workingDays) * extraLeaves;
  }

  return 0;
}

exports.getStructures = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT
      s.*,
      t.name AS teacher_name
    FROM teacher_salary_structures s
    JOIN teachers t ON t.id = s.teacher_id
    WHERE s.center_id = $1
    ORDER BY t.name
    `,
    [req.user.center_id]
  );

  return rows;
};

exports.saveStructure = async (req) => {
  const payload = req.body;

  if (!payload.teacher_id || !payload.pay_type) {
    throw badRequest("Teacher and pay type are required.");
  }

  const values = [
    Number(payload.teacher_id),
    payload.pay_type,
    toNumber(payload.basic_amount),
    toNumber(payload.ta_amount),
    toNumber(payload.da_amount),
    toNumber(payload.hra_amount),
    toNumber(payload.other_allowance),
    toNumber(payload.per_day_rate),
    toNumber(payload.per_period_rate),
    Math.max(0, Number(payload.allowed_paid_leaves || 1)),
    payload.status || "active",
    req.user.center_id,
  ];

  const { rows } = await pool.query(
    `
    INSERT INTO teacher_salary_structures
    (teacher_id, pay_type, basic_amount, ta_amount, da_amount, hra_amount, other_allowance, per_day_rate, per_period_rate, allowed_paid_leaves, status, center_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (teacher_id)
    DO UPDATE SET
      pay_type = EXCLUDED.pay_type,
      basic_amount = EXCLUDED.basic_amount,
      ta_amount = EXCLUDED.ta_amount,
      da_amount = EXCLUDED.da_amount,
      hra_amount = EXCLUDED.hra_amount,
      other_allowance = EXCLUDED.other_allowance,
      per_day_rate = EXCLUDED.per_day_rate,
      per_period_rate = EXCLUDED.per_period_rate,
      allowed_paid_leaves = EXCLUDED.allowed_paid_leaves,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *
    `,
    values
  );

  return rows[0];
};

exports.getSlips = async (req) => {
  const targetMonth = monthStart(req.query.month);

  const { rows } = await pool.query(
    `
    SELECT
      ss.*,
      t.name AS teacher_name
    FROM teacher_salary_slips ss
    JOIN teachers t ON t.id = ss.teacher_id
    WHERE ss.center_id = $1
      AND ss.salary_month = $2
    ORDER BY t.name
    `,
    [req.user.center_id, targetMonth]
  );

  return rows;
};

exports.generateSlips = async (req) => {
  const targetMonth = monthStart(req.body.month);
  const workingDays = Math.max(1, Number(req.body.working_days || 30));

  const { rows: structures } = await pool.query(
    `
    SELECT
      s.*,
      t.name AS teacher_name
    FROM teacher_salary_structures s
    JOIN teachers t ON t.id = s.teacher_id
    WHERE s.center_id = $1
      AND s.status = 'active'
      AND t.status = 'active'
    ORDER BY t.name
    `,
    [req.user.center_id]
  );

  const generated = [];
  for (const structure of structures) {
    const attendancePayload = {
      working_days: workingDays,
      attended_days: Number(req.body.attended_days?.[structure.teacher_id] || workingDays),
      periods_taken: Number(req.body.periods_taken?.[structure.teacher_id] || 0),
      paid_leaves_taken: Number(req.body.paid_leaves_taken?.[structure.teacher_id] || 0),
    };

    const grossSalary = computeGross(structure, attendancePayload);
    const leaveDeduction = computeLeaveDeduction(structure, attendancePayload, grossSalary);
    const otherDeduction = Number(req.body.other_deduction?.[structure.teacher_id] || 0);
    const netSalary = Math.max(0, grossSalary - leaveDeduction - otherDeduction);

    const { rows } = await pool.query(
      `
      INSERT INTO teacher_salary_slips
      (teacher_id, structure_id, salary_month, pay_type, working_days, attended_days, periods_taken, paid_leaves_taken, gross_salary, leave_deduction, other_deduction, net_salary, status, center_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',$13)
      ON CONFLICT (teacher_id, salary_month)
      DO UPDATE SET
        structure_id = EXCLUDED.structure_id,
        pay_type = EXCLUDED.pay_type,
        working_days = EXCLUDED.working_days,
        attended_days = EXCLUDED.attended_days,
        periods_taken = EXCLUDED.periods_taken,
        paid_leaves_taken = EXCLUDED.paid_leaves_taken,
        gross_salary = EXCLUDED.gross_salary,
        leave_deduction = EXCLUDED.leave_deduction,
        other_deduction = EXCLUDED.other_deduction,
        net_salary = EXCLUDED.net_salary,
        updated_at = NOW()
      RETURNING *
      `,
      [
        structure.teacher_id,
        structure.id,
        targetMonth,
        structure.pay_type,
        attendancePayload.working_days,
        attendancePayload.attended_days,
        attendancePayload.periods_taken,
        attendancePayload.paid_leaves_taken,
        grossSalary,
        leaveDeduction,
        otherDeduction,
        netSalary,
        req.user.center_id,
      ]
    );

    generated.push(rows[0]);
  }

  return { success: true, generated_count: generated.length };
};

exports.paySlip = async (req) => {
  const slipId = Number(req.params.id);
  const { payment_mode, remarks, paid_date, paid_amount } = req.body;

  const { rows } = await pool.query(
    `
    UPDATE teacher_salary_slips
    SET
      status = 'paid',
      paid_date = COALESCE($1::date, CURRENT_DATE),
      paid_amount = COALESCE($2, net_salary),
      payment_mode = $3,
      remarks = $4,
      updated_at = NOW()
    WHERE id = $5 AND center_id = $6
    RETURNING *
    `,
    [paid_date || null, paid_amount ? Number(paid_amount) : null, payment_mode || "cash", remarks || null, slipId, req.user.center_id]
  );

  if (!rows[0]) {
    throw badRequest("Salary slip not found.");
  }

  return rows[0];
};
