const pool = require("../../config/db");
const {
  createAppError,
  normalizeBillingCycle,
  roundMoney,
  formatDate,
  resolveStatus,
  validatePositiveAmount,
  getDefaultAcademicYear,
  getStudentWithCharges,
  getProfileByStudentId,
  createStudentFeePlan,
} = require("./fees.shared");
const { getBatchById, getClassById, getCourseById, normalizeProgramType } = require("../catalog/catalog.shared");

const buildComponentSummarySelect = (totalPaidAlias, statusExpr) => `
  COALESCE(SUM(total_amount), 0) AS total_billed,
  COALESCE(SUM(paid_amount), 0) AS ${totalPaidAlias},
  COALESCE(SUM(balance), 0) AS total_pending,
  COALESCE(SUM(admission_amount), 0) AS admission_billed,
  COALESCE(SUM(paid_admission_amount), 0) AS admission_paid,
  COALESCE(SUM(admission_amount - paid_admission_amount), 0) AS admission_pending,
  COALESCE(SUM(tuition_amount), 0) AS tuition_billed,
  COALESCE(SUM(paid_tuition_amount), 0) AS tuition_paid,
  COALESCE(SUM(tuition_amount - paid_tuition_amount), 0) AS tuition_pending,
  COALESCE(SUM(hostel_amount), 0) AS hostel_billed,
  COALESCE(SUM(paid_hostel_amount), 0) AS hostel_paid,
  COALESCE(SUM(hostel_amount - paid_hostel_amount), 0) AS hostel_pending,
  COALESCE(SUM(transport_amount), 0) AS transport_billed,
  COALESCE(SUM(paid_transport_amount), 0) AS transport_paid,
  COALESCE(SUM(transport_amount - paid_transport_amount), 0) AS transport_pending,
  COUNT(*) FILTER (WHERE ${statusExpr} = 'paid') AS paid_count,
  COUNT(*) FILTER (WHERE ${statusExpr} = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE ${statusExpr} = 'partial') AS partial_count
`;

const getFeeComponentBalances = (fee) => {
  let admission = roundMoney(Number(fee.admission_amount || 0) - Number(fee.paid_admission_amount || 0));
  let tuition = roundMoney(Number(fee.tuition_amount) - Number(fee.paid_tuition_amount || 0));
  let hostel = roundMoney(Number(fee.hostel_amount) - Number(fee.paid_hostel_amount || 0));
  let transport = roundMoney(Number(fee.transport_amount) - Number(fee.paid_transport_amount || 0));

  let concessionLeft = roundMoney(Number(fee.discount_amount || 0) + Number(fee.waived_amount || 0));
  if (concessionLeft > 0) {
    const admissionReduction = roundMoney(Math.min(concessionLeft, admission));
    admission = roundMoney(admission - admissionReduction);
    concessionLeft = roundMoney(concessionLeft - admissionReduction);
  }
  if (concessionLeft > 0) {
    const tuitionReduction = roundMoney(Math.min(concessionLeft, tuition));
    tuition = roundMoney(tuition - tuitionReduction);
    concessionLeft = roundMoney(concessionLeft - tuitionReduction);
  }
  if (concessionLeft > 0) {
    const hostelReduction = roundMoney(Math.min(concessionLeft, hostel));
    hostel = roundMoney(hostel - hostelReduction);
    concessionLeft = roundMoney(concessionLeft - hostelReduction);
  }
  if (concessionLeft > 0) {
    const transportReduction = roundMoney(Math.min(concessionLeft, transport));
    transport = roundMoney(transport - transportReduction);
    concessionLeft = roundMoney(concessionLeft - transportReduction);
  }

  const adjustment = roundMoney(Math.max(0, Number(fee.late_fee_amount || 0) - Number(fee.paid_adjustment_amount || 0)));

  return { admission, tuition, hostel, transport, adjustment };
};

const allocateSequentially = (amount, fee) => {
  const remaining = getFeeComponentBalances(fee);
  let pending = amount;

  const admission = roundMoney(Math.min(pending, remaining.admission));
  pending = roundMoney(pending - admission);

  const tuition = roundMoney(Math.min(pending, remaining.tuition));
  pending = roundMoney(pending - tuition);

  const hostel = roundMoney(Math.min(pending, remaining.hostel));
  pending = roundMoney(pending - hostel);

  const transport = roundMoney(Math.min(pending, remaining.transport));
  pending = roundMoney(pending - transport);
  const adjustment = roundMoney(Math.min(pending, remaining.adjustment));

  return { admission, tuition, hostel, transport, adjustment };
};

const parsePaymentBreakdown = (paymentInput, fee) => {
  const hasExplicitBreakdown =
    paymentInput.admission_amount !== undefined ||
    paymentInput.tuition_amount !== undefined ||
    paymentInput.hostel_amount !== undefined ||
    paymentInput.transport_amount !== undefined ||
    paymentInput.adjustment_amount !== undefined;

  if (!hasExplicitBreakdown) {
    const amount = validatePositiveAmount(paymentInput.amount);
    if (amount > Number(fee.balance)) {
      throw createAppError("Payment amount cannot be greater than the remaining balance for this installment.");
    }
    return {
      amount,
      ...allocateSequentially(amount, fee),
    };
  }

  const remaining = getFeeComponentBalances(fee);
  const admission = roundMoney(Number(paymentInput.admission_amount || 0));
  const tuition = roundMoney(Number(paymentInput.tuition_amount || 0));
  const hostel = roundMoney(Number(paymentInput.hostel_amount || 0));
  const transport = roundMoney(Number(paymentInput.transport_amount || 0));
  const adjustment = roundMoney(Number(paymentInput.adjustment_amount || 0));
  const amount = roundMoney(admission + tuition + hostel + transport + adjustment);

  if (amount <= 0) {
    throw createAppError("Enter at least one fee head amount to record payment.");
  }

  if (
    admission > remaining.admission ||
    tuition > remaining.tuition ||
    hostel > remaining.hostel ||
    transport > remaining.transport ||
    adjustment > remaining.adjustment
  ) {
    throw createAppError("Entered installment payment is greater than the pending admission, tuition, hostel, transport, or adjustment amount. For extra or advance payment, use Student Payment And Advance.");
  }

  if (amount > Number(fee.balance)) {
    throw createAppError("Payment amount cannot be greater than the remaining balance for this installment.");
  }

  return { amount, admission, tuition, hostel, transport, adjustment };
};

const normalizeStudentPaymentMode = (value) => {
  const normalized = String(value || "adjust_pending").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized !== "adjust_pending" && normalized !== "store_as_advance") {
    throw createAppError("Invalid student payment mode. Use adjust_pending or store_as_advance.");
  }

  return normalized;
};

const resolveAdjustedStatus = (totalAmount, paidAmount, waivedAmount) => {
  const balance = roundMoney(totalAmount - paidAmount);
  if (balance <= 0 && paidAmount <= 0 && Number(waivedAmount || 0) > 0) {
    return "waived";
  }

  return resolveStatus(totalAmount, paidAmount);
};

exports.getFeeStructures = async (req) => {
  const { program_type, academic_year, class_id, course_id, batch_id } = req.query;
  let query = `
    SELECT
      fs.*,
      cd.class_name AS class_label,
      cr.course_name AS course_label,
      bd.batch_name,
      bd.shift AS batch_shift,
      bd.start_time AS batch_start_time,
      bd.end_time AS batch_end_time
    FROM fee_structures
    fs
    LEFT JOIN class_definitions cd ON cd.id = fs.class_id
    LEFT JOIN course_definitions cr ON cr.id = fs.course_id
    LEFT JOIN batch_definitions bd ON bd.id = fs.batch_id
    WHERE fs.center_id = $1
  `;
  const params = [req.user.center_id];

  if (program_type) {
    params.push(program_type);
    query += ` AND fs.program_type = $${params.length}`;
  }

  if (academic_year) {
    params.push(academic_year);
    query += ` AND (fs.academic_year = $${params.length} OR fs.academic_year IS NULL)`;
  }

  if (class_id) {
    params.push(Number(class_id));
    query += ` AND fs.class_id = $${params.length}`;
  }

  if (course_id) {
    params.push(Number(course_id));
    query += ` AND fs.course_id = $${params.length}`;
  }

  if (batch_id) {
    params.push(Number(batch_id));
    query += ` AND fs.batch_id = $${params.length}`;
  }

  query += " ORDER BY fs.program_type, fs.class_name NULLS LAST, fs.course_name NULLS LAST, fs.name";

  const { rows } = await pool.query(query, params);
  return rows;
};

exports.createFeeStructure = async (req) => {
  const body = req.body;
  const programType = normalizeProgramType(body.program_type || "academic");
  const classRow = body.class_id ? await getClassById(pool, req.user.center_id, body.class_id) : null;
  const courseRow = body.course_id ? await getCourseById(pool, req.user.center_id, body.course_id) : null;
  const batchRow = body.batch_id ? await getBatchById(pool, req.user.center_id, body.batch_id) : null;
  const name = body.name || (classRow && classRow.class_name) || body.class_name || (courseRow && courseRow.course_name) || body.course_name;

  if (!name) {
    throw createAppError("name is required.");
  }

  if (programType === "academic" && !body.class_name && !classRow) {
    throw createAppError("class_id or class_name is required for academic fee definitions.");
  }

  if (programType === "non_academic" && !body.course_name && !courseRow) {
    throw createAppError("course_id or course_name is required for course fee definitions.");
  }

  if (batchRow && batchRow.program_type !== programType) {
    throw createAppError("Selected batch does not match the program type.");
  }

  const durationMonths = Number(body.duration_months || (programType === "academic" ? 12 : 6));
  if (!Number.isInteger(durationMonths) || durationMonths <= 0) {
    throw createAppError("duration_months must be a positive integer.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO fee_structures (
      center_id,
      name,
      program_type,
      board,
      class_name,
      course_name,
      class_id,
      course_id,
      batch_id,
      academic_year,
      duration_months,
      session_start_month,
      session_end_month,
      admission_total,
      tuition_total,
      hostel_total,
      transport_total,
      description
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING *
    `,
    [
      req.user.center_id,
      name,
      programType,
      body.board || (batchRow ? batchRow.board : null),
      (classRow && classRow.class_name) || body.class_name || null,
      (courseRow && courseRow.course_name) || body.course_name || null,
      classRow ? classRow.id : null,
      courseRow ? courseRow.id : null,
      batchRow ? batchRow.id : null,
      body.academic_year || null,
      durationMonths,
      body.session_start_month ? Number(body.session_start_month) : null,
      body.session_end_month ? Number(body.session_end_month) : null,
      roundMoney(body.admission_total || 0),
      validatePositiveAmount(body.tuition_total, "tuition_total"),
      roundMoney(body.hostel_total || 0),
      roundMoney(body.transport_total || 0),
      body.description || null,
    ]
  );

  return rows[0];
};

exports.updateFeeStructure = async (req) => {
  const structureId = Number(req.params.id);
  const body = req.body;
  const existing = await pool.query(`SELECT * FROM fee_structures WHERE id = $1 AND center_id = $2`, [structureId, req.user.center_id]);
  if (!existing.rows[0]) {
    throw createAppError("Fee definition not found.", 404);
  }
  const current = existing.rows[0];
  const programType = normalizeProgramType(body.program_type || current.program_type || "academic");
  const classRow = body.class_id ? await getClassById(pool, req.user.center_id, body.class_id) : null;
  const courseRow = body.course_id ? await getCourseById(pool, req.user.center_id, body.course_id) : null;
  const batchRow = body.batch_id ? await getBatchById(pool, req.user.center_id, body.batch_id) : null;
  const name = body.name || (classRow && classRow.class_name) || body.class_name || (courseRow && courseRow.course_name) || body.course_name || current.name;

  if (!structureId) {
    throw createAppError("Fee definition id is required.");
  }

  if (!name) {
    throw createAppError("name is required.");
  }

  if (programType === "academic" && !body.class_name && !classRow && !current.class_id) {
    throw createAppError("class_id or class_name is required for academic fee definitions.");
  }

  if (programType === "non_academic" && !body.course_name && !courseRow && !current.course_id) {
    throw createAppError("course_id or course_name is required for course fee definitions.");
  }

  if (batchRow && batchRow.program_type !== programType) {
    throw createAppError("Selected batch does not match the program type.");
  }

  const durationMonths = Number(body.duration_months || (programType === "academic" ? 12 : 6));
  if (!Number.isInteger(durationMonths) || durationMonths <= 0) {
    throw createAppError("duration_months must be a positive integer.");
  }

  const { rows } = await pool.query(
    `
    UPDATE fee_structures
    SET
      name = $1,
      program_type = $2,
      board = $3,
      class_name = $4,
      course_name = $5,
      class_id = $6,
      course_id = $7,
      batch_id = $8,
      academic_year = $9,
      duration_months = $10,
      session_start_month = $11,
      session_end_month = $12,
      admission_total = $13,
      tuition_total = $14,
      hostel_total = $15,
      transport_total = $16,
      description = $17,
      updated_at = NOW()
    WHERE id = $18
      AND center_id = $19
    RETURNING *
    `,
    [
      name,
      programType,
      body.board !== undefined ? body.board : current.board,
      (classRow && classRow.class_name) || body.class_name || current.class_name || null,
      (courseRow && courseRow.course_name) || body.course_name || current.course_name || null,
      classRow ? classRow.id : (current.class_id || null),
      courseRow ? courseRow.id : (current.course_id || null),
      batchRow ? batchRow.id : (current.batch_id || null),
      body.academic_year !== undefined ? body.academic_year : current.academic_year,
      durationMonths,
      body.session_start_month !== undefined ? Number(body.session_start_month || 0) || null : current.session_start_month,
      body.session_end_month !== undefined ? Number(body.session_end_month || 0) || null : current.session_end_month,
      roundMoney(body.admission_total !== undefined ? body.admission_total : current.admission_total || 0),
      validatePositiveAmount(body.tuition_total !== undefined ? body.tuition_total : current.tuition_total, "tuition_total"),
      roundMoney(body.hostel_total !== undefined ? body.hostel_total : current.hostel_total || 0),
      roundMoney(body.transport_total !== undefined ? body.transport_total : current.transport_total || 0),
      body.description !== undefined ? body.description : current.description,
      structureId,
      req.user.center_id,
    ]
  );

  if (!rows[0]) {
    throw createAppError("Fee definition not found.", 404);
  }

  return rows[0];
};

exports.deleteFeeStructure = async (req) => {
  const structureId = Number(req.params.id);
  if (!structureId) {
    throw createAppError("Fee definition id is required.");
  }

  const usageResult = await pool.query(
    `
    SELECT COUNT(*) AS usage_count
    FROM student_fee_profiles
    WHERE fee_structure_id = $1
      AND center_id = $2
    `,
    [structureId, req.user.center_id]
  );

  if (Number(usageResult.rows[0] ? usageResult.rows[0].usage_count : 0) > 0) {
    throw createAppError("This fee definition is already used by student fee plans and cannot be deleted.");
  }

  const { rows } = await pool.query(
    `
    DELETE FROM fee_structures
    WHERE id = $1
      AND center_id = $2
    RETURNING id
    `,
    [structureId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Fee definition not found.", 404);
  }

  return { success: true };
};

exports.getStudentPlan = async (req) => {
  const studentId = Number(req.params.id);
  const profile = await getProfileByStudentId(pool, req.user.center_id, studentId);

  if (!profile) {
    throw createAppError("No active fee plan found for this student.", 404);
  }

  return profile;
};

exports.updateStudentFeePlan = async (req) => {
  const studentId = Number(req.params.id);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const profile = await getProfileByStudentId(client, req.user.center_id, studentId);
    if (!profile) {
      throw createAppError("No active fee plan found for this student.", 404);
    }

    const paidCheck = await client.query(
      `
      SELECT COUNT(*) AS paid_count
      FROM fees
      WHERE fee_profile_id = $1
        AND center_id = $2
        AND paid_amount > 0
      `,
      [profile.id, req.user.center_id]
    );

    if (Number(paidCheck.rows[0] ? paidCheck.rows[0].paid_count : 0) > 0) {
      throw createAppError("This fee plan already has payments. Edit is blocked to protect fee history. Use installment adjustment instead.");
    }

    await client.query(
      `
      DELETE FROM fees
      WHERE fee_profile_id = $1
        AND center_id = $2
      `,
      [profile.id, req.user.center_id]
    );

    await client.query(
      `
      DELETE FROM student_fee_profiles
      WHERE id = $1
        AND center_id = $2
      `,
      [profile.id, req.user.center_id]
    );

    const plan = await createStudentFeePlan(client, req, {
      studentId,
      billing_cycle: req.body.billing_cycle || profile.billing_cycle,
      academic_year: req.body.academic_year || profile.academic_year,
      fee_structure_id: req.body.fee_structure_id || profile.fee_structure_id,
      due_day: req.body.due_day || profile.due_day,
      include_transport: req.body.include_transport !== undefined ? req.body.include_transport : profile.include_transport,
      include_hostel: req.body.include_hostel !== undefined ? req.body.include_hostel : profile.include_hostel,
      plan_start_date: req.body.plan_start_date || profile.plan_start_date,
      notes: req.body.notes !== undefined ? req.body.notes : profile.notes,
    });

    await client.query("COMMIT");
    return plan;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.createFee = async (req) => exports.createStudentFeePlan(req);

exports.createStudentFeePlan = async (req) => {
  const client = await pool.connect();
  const studentId = Number(req.body.student_id || req.params.id);

  try {
    await client.query("BEGIN");
    const plan = await createStudentFeePlan(client, req, {
      studentId,
      billing_cycle: req.body.billing_cycle,
      academic_year: req.body.academic_year,
      fee_structure_id: req.body.fee_structure_id,
      due_day: req.body.due_day,
      include_transport: req.body.include_transport,
      include_hostel: req.body.include_hostel,
      plan_start_date: req.body.plan_start_date,
      notes: req.body.notes,
    });

    const student = await getStudentWithCharges(client, req.user.center_id, studentId);
    if (Number(student.advance_fee_balance || 0) > 0 && plan.installments.length) {
      const appliedAdvance = await applyStoredAdvanceToFees(
        client,
        req,
        studentId,
        plan.installments,
        Number(student.advance_fee_balance),
        "Applied from student advance balance during fee plan creation."
      );

      plan.installments = plan.installments.map((installment) => {
        const updated = appliedAdvance.appliedInstallments.find((item) => item.id === installment.id);
        return updated || installment;
      });
      plan.advance_balance = appliedAdvance.remainingAdvanceBalance;
    } else {
      plan.advance_balance = Number(student.advance_fee_balance || 0);
    }

    await client.query("COMMIT");
    return plan;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.getFees = async (req) => {
  const { status, student_id, billing_cycle } = req.query;
  let query = `
    SELECT
      f.*,
      s.name AS student_name,
      s.class,
      s.roll_number,
      fp.billing_cycle AS plan_billing_cycle,
      fs.name AS fee_definition_name
    FROM fees f
    JOIN students s ON s.id = f.student_id
    LEFT JOIN student_fee_profiles fp ON fp.id = f.fee_profile_id
    LEFT JOIN fee_structures fs ON fs.id = fp.fee_structure_id
    WHERE f.center_id = $1
  `;
  const params = [req.user.center_id];

  if (status) {
    params.push(status);
    query += ` AND f.status = $${params.length}`;
  }

  if (student_id) {
    params.push(Number(student_id));
    query += ` AND f.student_id = $${params.length}`;
  }

  if (billing_cycle) {
    params.push(normalizeBillingCycle(billing_cycle));
    query += ` AND f.billing_cycle = $${params.length}`;
  }

  query += " ORDER BY f.due_date ASC, f.installment_no ASC";

  const { rows } = await pool.query(query, params);
  return rows;
};

const applyPaymentToFee = async (client, fee, paymentInput, req) => {
  const paymentBreakdown = parsePaymentBreakdown(paymentInput, fee);
  const amount = paymentBreakdown.amount;
  const paymentDate = paymentInput.payment_date || formatDate(new Date());

  const newPaidAmount = roundMoney(Number(fee.paid_amount) + amount);
  const newPaidAdmissionAmount = roundMoney(Number(fee.paid_admission_amount || 0) + paymentBreakdown.admission);
  const newPaidTuitionAmount = roundMoney(Number(fee.paid_tuition_amount || 0) + paymentBreakdown.tuition);
  const newPaidHostelAmount = roundMoney(Number(fee.paid_hostel_amount || 0) + paymentBreakdown.hostel);
  const newPaidTransportAmount = roundMoney(Number(fee.paid_transport_amount || 0) + paymentBreakdown.transport);
  const newPaidAdjustmentAmount = roundMoney(Number(fee.paid_adjustment_amount || 0) + Number(paymentBreakdown.adjustment || 0));
  const newBalance = roundMoney(Number(fee.total_amount) - newPaidAmount);
  const status = resolveStatus(Number(fee.total_amount), newPaidAmount);

  const { rows: updatedRows } = await client.query(
    `
    UPDATE fees
    SET paid_amount = $1,
        paid_admission_amount = $2,
        paid_tuition_amount = $3,
        paid_hostel_amount = $4,
        paid_transport_amount = $5,
        paid_adjustment_amount = $6,
        balance = $7,
        status = $8,
        last_payment_date = $9,
        updated_at = NOW()
    WHERE id = $10
      AND center_id = $11
    RETURNING *
    `,
    [
      newPaidAmount,
      newPaidAdmissionAmount,
      newPaidTuitionAmount,
      newPaidHostelAmount,
      newPaidTransportAmount,
      newPaidAdjustmentAmount,
      newBalance,
      status,
      paymentDate,
      fee.id,
      req.user.center_id,
    ]
  );

  await client.query(
    `
    INSERT INTO fee_payments (
      fee_id,
      student_id,
      center_id,
      amount,
      admission_amount,
      tuition_amount,
      hostel_amount,
      transport_amount,
      adjustment_amount,
      payment_date,
      payment_mode,
      transaction_id,
      notes
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `,
    [
      fee.id,
      fee.student_id,
      req.user.center_id,
      amount,
      paymentBreakdown.admission,
      paymentBreakdown.tuition,
      paymentBreakdown.hostel,
      paymentBreakdown.transport,
      paymentBreakdown.adjustment || 0,
      paymentDate,
      paymentInput.payment_mode || null,
      paymentInput.transaction_id || null,
      paymentInput.notes || null,
    ]
  );

  return updatedRows[0];
};

const updateStudentAdvanceBalance = async (client, centerId, studentId, nextBalance) => {
  const { rows } = await client.query(
    `
    UPDATE students
    SET advance_fee_balance = $1,
        updated_at = NOW()
    WHERE id = $2
      AND center_id = $3
    RETURNING advance_fee_balance
    `,
    [roundMoney(nextBalance), studentId, centerId]
  );

  return Number(rows[0] ? rows[0].advance_fee_balance : 0);
};

const createAdvancePaymentRecord = async (client, req, studentId, paymentInput) => {
  await client.query(
    `
    INSERT INTO fee_payments (
      fee_id,
      student_id,
      center_id,
      amount,
      advance_amount,
      admission_amount,
      tuition_amount,
      hostel_amount,
      transport_amount,
      adjustment_amount,
      payment_date,
      payment_mode,
      transaction_id,
      notes
    )
    VALUES (NULL,$1,$2,$3,$4,0,0,0,0,0,$5,$6,$7,$8)
    `,
    [
      studentId,
      req.user.center_id,
      paymentInput.amount,
      paymentInput.advance_amount,
      paymentInput.payment_date,
      paymentInput.payment_mode || null,
      paymentInput.transaction_id || null,
      paymentInput.notes || null,
    ]
  );
};

const useAdvanceOnFee = async (client, req, fee, studentAdvanceBalance) => {
  const availableAdvance = roundMoney(studentAdvanceBalance || 0);
  if (availableAdvance <= 0) {
    throw createAppError("No advance balance available for this student.");
  }

  if (Number(fee.balance) <= 0) {
    throw createAppError("This installment is already fully paid.");
  }

  const amountToApply = roundMoney(Math.min(availableAdvance, Number(fee.balance)));
  const updatedFee = await applyPaymentToFee(
    client,
    fee,
    {
      amount: amountToApply,
      payment_date: formatDate(new Date()),
      payment_mode: "advance_credit",
      notes: "Applied from student advance balance.",
    },
    req
  );

  const remainingAdvanceBalance = await updateStudentAdvanceBalance(
    client,
    req.user.center_id,
    fee.student_id,
    availableAdvance - amountToApply
  );

  return {
    updatedFee,
    amountApplied: amountToApply,
    remainingAdvanceBalance,
  };
};

const applyAmountAcrossFees = async (client, fees, amount, req, paymentInput) => {
  let remaining = roundMoney(amount);
  const appliedInstallments = [];

  for (const fee of fees) {
    if (remaining <= 0) break;

    const amountToApply = Math.min(remaining, Number(fee.balance));
    const updatedFee = await applyPaymentToFee(
      client,
      fee,
      {
        amount: amountToApply,
        payment_date: paymentInput.payment_date,
        payment_mode: paymentInput.payment_mode,
        transaction_id: paymentInput.transaction_id,
        notes: paymentInput.notes,
      },
      req
    );

    appliedInstallments.push(updatedFee);
    remaining = roundMoney(remaining - amountToApply);
  }

  return { appliedInstallments, remaining };
};

const applyStoredAdvanceToFees = async (client, req, studentId, fees, advanceBalance, note) => {
  if (!advanceBalance || advanceBalance <= 0 || !fees.length) {
    return {
      appliedInstallments: [],
      remainingAdvanceBalance: roundMoney(advanceBalance || 0),
    };
  }

  const result = await applyAmountAcrossFees(
    client,
    fees,
    advanceBalance,
    req,
    {
      payment_date: formatDate(new Date()),
      payment_mode: "advance_credit",
      transaction_id: null,
      notes: note || "Applied from advance fee balance.",
    }
  );

  const remainingAdvanceBalance = await updateStudentAdvanceBalance(
    client,
    req.user.center_id,
    studentId,
    result.remaining
  );

  return {
    appliedInstallments: result.appliedInstallments,
    remainingAdvanceBalance,
  };
};

exports.payFee = async (req) => {
  const feeId = Number(req.params.id);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      SELECT *
      FROM fees
      WHERE id = $1 AND center_id = $2
      FOR UPDATE
      `,
      [feeId, req.user.center_id]
    );

    if (!rows[0]) {
      throw createAppError("Fee installment not found.", 404);
    }

    const updatedFee = await applyPaymentToFee(client, rows[0], req.body, req);
    await client.query("COMMIT");
    return updatedFee;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.payStudentFee = async (req) => {
  const studentId = Number(req.params.id);
  const totalAmount = validatePositiveAmount(req.body.amount);
  const paymentDate = req.body.payment_date || formatDate(new Date());
  const paymentModeType = normalizeStudentPaymentMode(req.body.student_payment_mode);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const student = await getStudentWithCharges(client, req.user.center_id, studentId);

    const { rows: pendingFees } = await client.query(
      `
      SELECT *
      FROM fees
      WHERE student_id = $1
        AND center_id = $2
        AND status IN ('pending', 'partial')
      ORDER BY due_date ASC, installment_no ASC
      FOR UPDATE
      `,
      [studentId, req.user.center_id]
    );

    const totalPending = roundMoney(
      pendingFees.reduce((sum, fee) => sum + Number(fee.balance), 0)
    );

    let paymentResult = { appliedInstallments: [], remaining: totalAmount };
    if (paymentModeType === "adjust_pending") {
      paymentResult = await applyAmountAcrossFees(
        client,
        pendingFees,
        totalAmount,
        req,
        {
          payment_date: paymentDate,
          payment_mode: req.body.payment_mode,
          transaction_id: req.body.transaction_id,
          notes: req.body.notes,
        }
      );
    }

    let availableAdvanceBalance = Number(student.advance_fee_balance || 0);
    let advanceAdded = 0;

    if (paymentResult.remaining > 0) {
      advanceAdded = paymentResult.remaining;
      availableAdvanceBalance = await updateStudentAdvanceBalance(
        client,
        req.user.center_id,
        studentId,
        Number(student.advance_fee_balance || 0) + advanceAdded
      );

      await createAdvancePaymentRecord(client, req, studentId, {
        amount: advanceAdded,
        advance_amount: advanceAdded,
        payment_date: paymentDate,
        payment_mode: req.body.payment_mode || (paymentModeType === "store_as_advance" ? "advance_deposit" : "advance_credit"),
        transaction_id: req.body.transaction_id,
        notes: req.body.notes || (paymentModeType === "store_as_advance"
          ? "Advance deposit stored for future installments."
          : "Advance payment stored for future installments."),
      });
    }

    await client.query("COMMIT");

    return {
      paid_amount: totalAmount,
      payment_date: paymentDate,
      student_payment_mode: paymentModeType,
      pending_before_payment: totalPending,
      applied_installments: paymentResult.appliedInstallments,
      advance_added: advanceAdded,
      available_advance_balance: availableAdvanceBalance,
      remaining_unallocated: 0,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.useAdvanceForFee = async (req) => {
  const feeId = Number(req.params.id);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      SELECT f.*, s.advance_fee_balance
      FROM fees f
      JOIN students s ON s.id = f.student_id
      WHERE f.id = $1
        AND f.center_id = $2
      FOR UPDATE
      `,
      [feeId, req.user.center_id]
    );

    const fee = rows[0];
    if (!fee) {
      throw createAppError("Fee installment not found.", 404);
    }

    const result = await useAdvanceOnFee(client, req, fee, Number(fee.advance_fee_balance || 0));

    await client.query("COMMIT");
    return {
      fee: result.updatedFee,
      amount_applied: result.amountApplied,
      available_advance_balance: result.remainingAdvanceBalance,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.adjustFee = async (req) => {
  const feeId = Number(req.params.id);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      SELECT *
      FROM fees
      WHERE id = $1
        AND center_id = $2
      FOR UPDATE
      `,
      [feeId, req.user.center_id]
    );

    const fee = rows[0];
    if (!fee) {
      throw createAppError("Fee installment not found.", 404);
    }

    const lateFeeAmount = roundMoney(req.body.late_fee_amount !== undefined ? req.body.late_fee_amount : fee.late_fee_amount || 0);
    const discountAmount = roundMoney(req.body.discount_amount !== undefined ? req.body.discount_amount : fee.discount_amount || 0);
    const waivedAmount = roundMoney(req.body.waived_amount !== undefined ? req.body.waived_amount : fee.waived_amount || 0);
    if (lateFeeAmount < 0 || discountAmount < 0 || waivedAmount < 0) {
      throw createAppError("late_fee_amount, discount_amount, and waived_amount cannot be negative.");
    }

    const baseAmount = roundMoney(
      Number(fee.admission_amount || 0) +
      Number(fee.tuition_amount) +
      Number(fee.hostel_amount) +
      Number(fee.transport_amount)
    );
    const adjustedTotal = roundMoney(baseAmount + lateFeeAmount - discountAmount - waivedAmount);
    if (adjustedTotal < 0) {
      throw createAppError("Adjusted total cannot be negative.");
    }

    if (adjustedTotal < Number(fee.paid_amount)) {
      throw createAppError("Adjusted total cannot be less than the amount already paid.");
    }

    const balance = roundMoney(adjustedTotal - Number(fee.paid_amount));
    const status = resolveAdjustedStatus(adjustedTotal, Number(fee.paid_amount), waivedAmount);

    const { rows: updatedRows } = await client.query(
      `
      UPDATE fees
      SET total_amount = $1,
          late_fee_amount = $2,
          discount_amount = $3,
          waived_amount = $4,
          balance = $5,
          status = $6,
          notes = $7,
          updated_at = NOW()
      WHERE id = $8
        AND center_id = $9
      RETURNING *
      `,
      [
        adjustedTotal,
        lateFeeAmount,
        discountAmount,
        waivedAmount,
        balance,
        status,
        req.body.notes !== undefined ? req.body.notes : fee.notes,
        feeId,
        req.user.center_id,
      ]
    );

    await client.query("COMMIT");
    return updatedRows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.getCollectionBoard = async (req) => {
  const selectedMonth = typeof req.query.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month)
    ? req.query.month
    : formatDate(new Date()).slice(0, 7);
  const monthStart = `${selectedMonth}-01`;

  const [statsResult, listResult] = await Promise.all([
    pool.query(
      `
      WITH scoped AS (
        SELECT *
        FROM fees
        WHERE center_id = $1
          AND status IN ('pending', 'partial')
      )
      SELECT
        COUNT(*) FILTER (WHERE due_date < date_trunc('month', $2::date)) AS overdue_count,
        COUNT(*) FILTER (WHERE date_trunc('month', due_date) = date_trunc('month', $2::date)) AS current_month_count,
        COUNT(*) FILTER (WHERE reminder_sent_at IS NOT NULL AND date_trunc('month', due_date) = date_trunc('month', $2::date)) AS reminded_count,
        COALESCE(SUM(balance) FILTER (WHERE due_date < date_trunc('month', $2::date)), 0) AS overdue_amount,
        COALESCE(SUM(balance) FILTER (WHERE date_trunc('month', due_date) = date_trunc('month', $2::date)), 0) AS current_month_amount
      FROM scoped
      `,
      [req.user.center_id, monthStart]
    ),
    pool.query(
      `
      SELECT
        f.id,
        f.student_id,
        f.installment_label,
        f.due_date,
        f.balance,
        f.status,
        s.name AS student_name,
        s.class,
        fs.name AS fee_definition_name
      FROM fees f
      JOIN students s ON s.id = f.student_id
      LEFT JOIN student_fee_profiles fp ON fp.id = f.fee_profile_id
      LEFT JOIN fee_structures fs ON fs.id = fp.fee_structure_id
      WHERE f.center_id = $1
        AND f.status IN ('pending', 'partial')
        AND f.due_date <= (date_trunc('month', $2::date) + interval '1 month - 1 day')
      ORDER BY f.due_date ASC, s.name ASC
      LIMIT 25
      `,
      [req.user.center_id, monthStart]
    ),
  ]);

  return {
    month: selectedMonth,
    stats: statsResult.rows[0],
    pending_installments: listResult.rows,
  };
};

exports.getSummary = async (req) => {
  const scope = req.query.scope === "all" ? "all" : "current_month";
  const selectedMonth = typeof req.query.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month)
    ? req.query.month
    : formatDate(new Date()).slice(0, 7);
  const monthStart = `${selectedMonth}-01`;

  if (scope === "all") {
    const { rows } = await pool.query(
      `
      SELECT
        ${buildComponentSummarySelect("total_collected", "status")}
      FROM fees
      WHERE center_id = $1
      `,
      [req.user.center_id]
    );

    return {
      scope,
      label: "Overall",
      ...rows[0],
    };
  }

  const { rows } = await pool.query(
    `
    WITH monthly_fees AS (
      SELECT *
      FROM fees
      WHERE center_id = $1
        AND date_trunc('month', due_date) = date_trunc('month', $2::date)
    )
    SELECT
      ${buildComponentSummarySelect("total_collected", "mf.status")}
    FROM monthly_fees mf
    `,
    [req.user.center_id, monthStart]
  );

  return {
    scope,
    label: selectedMonth,
    ...rows[0],
  };
};

exports.getPaymentHistory = async (req) => {
  const feeId = Number(req.params.id);
  const { rows } = await pool.query(
    `
    SELECT *
    FROM fee_payments
    WHERE fee_id = $1
      AND center_id = $2
    ORDER BY payment_date DESC, created_at DESC
    `,
    [feeId, req.user.center_id]
  );

  return rows;
};

exports.getStudentSummary = async (req) => {
  const studentId = Number(req.params.id);

  const [summaryResult, profile, studentResult] = await Promise.all([
    pool.query(
      `
      SELECT
        ${buildComponentSummarySelect("total_paid", "status")}
      FROM fees
      WHERE student_id = $1
        AND center_id = $2
      `,
      [studentId, req.user.center_id]
    ),
    getProfileByStudentId(pool, req.user.center_id, studentId),
    pool.query(
      `
      SELECT advance_fee_balance
      FROM students
      WHERE id = $1
        AND center_id = $2
      `,
      [studentId, req.user.center_id]
    ),
  ]);

  return {
    ...summaryResult.rows[0],
    advance_balance: Number(studentResult.rows[0] ? studentResult.rows[0].advance_fee_balance : 0),
    active_plan: profile,
  };
};

exports.getStudentPaymentHistory = async (req) => {
  const studentId = Number(req.params.id);
  const { rows } = await pool.query(
    `
    SELECT
      fp.*,
      f.installment_label,
      f.billing_cycle,
      f.installment_no
    FROM fee_payments fp
    LEFT JOIN fees f ON f.id = fp.fee_id
    WHERE fp.student_id = $1
      AND fp.center_id = $2
    ORDER BY fp.payment_date DESC, fp.created_at DESC
    `,
    [studentId, req.user.center_id]
  );

  return rows;
};

exports.getStudentFees = async (req) => {
  const studentId = Number(req.params.id);
  const [profile, feesResult, summaryResult, studentResult] = await Promise.all([
    getProfileByStudentId(pool, req.user.center_id, studentId),
    pool.query(
      `
      SELECT *
      FROM fees
      WHERE student_id = $1
        AND center_id = $2
      ORDER BY due_date ASC, installment_no ASC
      `,
      [studentId, req.user.center_id]
    ),
    pool.query(
      `
      SELECT
        ${buildComponentSummarySelect("total_paid", "status")}
      FROM fees
      WHERE student_id = $1
        AND center_id = $2
      `,
      [studentId, req.user.center_id]
    ),
    pool.query(
      `
      SELECT advance_fee_balance
      FROM students
      WHERE id = $1
        AND center_id = $2
      `,
      [studentId, req.user.center_id]
    ),
  ]);

  const advanceBalance = Number(studentResult.rows[0] ? studentResult.rows[0].advance_fee_balance : 0);

  return {
    profile: profile ? { ...profile, advance_fee_balance: advanceBalance } : { advance_fee_balance: advanceBalance },
    summary: summaryResult.rows[0],
    installments: feesResult.rows,
  };
};
