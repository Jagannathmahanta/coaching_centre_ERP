const createAppError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const BILLING_CYCLE_CONFIG = {
  monthly: { monthsCovered: 1 },
  quarterly: { monthsCovered: 3 },
  half_yearly: { monthsCovered: 6 },
  yearly: { monthsCovered: 12 },
  full_package: { monthsCovered: null },
};

const normalizeBillingCycle = (value = "monthly") => {
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!BILLING_CYCLE_CONFIG[normalized]) {
    throw createAppError("Invalid billing cycle. Use monthly, quarterly, half_yearly, yearly or full_package.");
  }

  return normalized;
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const startOfMonth = (value) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (value) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const formatDate = (value) => {
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};

const buildInstallmentLabel = (periodStart, periodEnd) => {
  const start = new Date(periodStart).toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });
  const end = new Date(periodEnd).toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return start === end ? start : `${start} - ${end}`;
};

const resolveStatus = (totalAmount, paidAmount) => {
  if (paidAmount <= 0) return "pending";
  if (paidAmount >= totalAmount) return "paid";
  return "partial";
};

const validatePositiveAmount = (amount, fieldName = "amount") => {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw createAppError(`${fieldName} must be a positive number.`);
  }

  return roundMoney(parsed);
};

const getDefaultAcademicYear = () => {
  const today = new Date();
  const year = today.getMonth() >= 2 ? today.getFullYear() : today.getFullYear() - 1;
  return `${year}-${year + 1}`;
};

const monthsBetweenInclusive = (startDate, endDate) => {
  const start = startOfMonth(startDate);
  const end = startOfMonth(endDate);
  return ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth()) + 1;
};

const buildAcademicSessionDates = (academicYear, sessionStartMonth, sessionEndMonth) => {
  const parts = String(academicYear || "").split("-");
  if (parts.length !== 2) {
    throw createAppError("Invalid academic year format. Use YYYY-YYYY.");
  }

  const startYear = Number(parts[0]);
  const endYear = Number(parts[1]);
  if (!startYear || !endYear) {
    throw createAppError("Invalid academic year format. Use YYYY-YYYY.");
  }

  return {
    sessionStart: new Date(startYear, Number(sessionStartMonth) - 1, 1),
    sessionEnd: endOfMonth(new Date(endYear, Number(sessionEndMonth) - 1, 1)),
  };
};

const getStudentWithCharges = async (client, centerId, studentId) => {
  const { rows } = await client.query(
    `
    SELECT
      s.id,
      s.name,
      s.class,
      s.join_date,
      s.advance_fee_balance,
      s.center_id
    FROM students s
    WHERE s.id = $1 AND s.center_id = $2
    `,
    [studentId, centerId]
  );

  if (!rows[0]) {
    throw createAppError("Student not found.", 404);
  }

  return rows[0];
};

const getFeeStructure = async (client, centerId, filters) => {
  if (filters.fee_structure_id) {
    const { rows } = await client.query(
      `
      SELECT *
      FROM fee_structures
      WHERE id = $1 AND center_id = $2
      `,
      [filters.fee_structure_id, centerId]
    );

    if (!rows[0]) {
      throw createAppError("Fee definition not found.", 404);
    }

    return rows[0];
  }

  const { rows } = await client.query(
    `
    SELECT *
    FROM fee_structures
    WHERE center_id = $1
      AND class_name = $2
      AND academic_year = $3
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [centerId, filters.className, filters.academicYear]
  );

  if (!rows[0]) {
    throw createAppError(`No fee definition found for ${filters.className} in ${filters.academicYear}.`);
  }

  return rows[0];
};

const calculateFeeWindow = (structure, planStartDate) => {
  const startDate = startOfMonth(planStartDate);

  if (structure.program_type === "academic") {
    const session = buildAcademicSessionDates(
      structure.academic_year,
      structure.session_start_month,
      structure.session_end_month
    );
    const effectiveStart = startDate > session.sessionStart ? startDate : session.sessionStart;

    if (effectiveStart > session.sessionEnd) {
      throw createAppError("Student joined after the academic session ended.");
    }

    return {
      effectiveStart,
      effectiveEnd: session.sessionEnd,
      applicableMonths: monthsBetweenInclusive(effectiveStart, session.sessionEnd),
    };
  }

  const durationMonths = Number(structure.duration_months);
  return {
    effectiveStart: startDate,
    effectiveEnd: endOfMonth(addMonths(startDate, durationMonths - 1)),
    applicableMonths: durationMonths,
  };
};

const generateInstallments = ({
  structure,
  billingCycle,
  includeHostel,
  includeTransport,
  planStartDate,
  dueDay,
}) => {
  const feeWindow = calculateFeeWindow(structure, planStartDate);
  const tuitionMonthly = roundMoney(Number(structure.tuition_total) / Number(structure.duration_months));
  const hostelMonthly = includeHostel
    ? roundMoney(Number(structure.hostel_total) / Number(structure.duration_months))
    : 0;
  const transportMonthly = includeTransport
    ? roundMoney(Number(structure.transport_total) / Number(structure.duration_months))
    : 0;

  const installments = [];
  let monthsRemaining = feeWindow.applicableMonths;
  let currentStart = feeWindow.effectiveStart;
  let installmentNo = 1;

  while (monthsRemaining > 0) {
    const cycleMonths = billingCycle === "full_package"
      ? monthsRemaining
      : Math.min(BILLING_CYCLE_CONFIG[billingCycle].monthsCovered, monthsRemaining);

    const periodEnd = endOfMonth(addMonths(currentStart, cycleMonths - 1));
    const dueDate = new Date(currentStart.getFullYear(), currentStart.getMonth(), dueDay);
    const tuitionAmount = roundMoney(tuitionMonthly * cycleMonths);
    const hostelAmount = roundMoney(hostelMonthly * cycleMonths);
    const transportAmount = roundMoney(transportMonthly * cycleMonths);
    const totalAmount = roundMoney(tuitionAmount + hostelAmount + transportAmount);

    installments.push({
      installment_no: installmentNo,
      installment_label: buildInstallmentLabel(currentStart, periodEnd),
      period_start: formatDate(currentStart),
      period_end: formatDate(periodEnd),
      due_date: formatDate(dueDate),
      months_covered: cycleMonths,
      tuition_amount: tuitionAmount,
      transport_amount: transportAmount,
      hostel_amount: hostelAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      balance: totalAmount,
      status: "pending",
    });

    currentStart = startOfMonth(addMonths(currentStart, cycleMonths));
    monthsRemaining -= cycleMonths;
    installmentNo += 1;
  }

  return {
    installments,
    applicableMonths: feeWindow.applicableMonths,
    tuitionFeeTotal: roundMoney(tuitionMonthly * feeWindow.applicableMonths),
    hostelFeeTotal: roundMoney(hostelMonthly * feeWindow.applicableMonths),
    transportFeeTotal: roundMoney(transportMonthly * feeWindow.applicableMonths),
  };
};

const getProfileByStudentId = async (client, centerId, studentId) => {
  const { rows } = await client.query(
    `
    SELECT
      fp.*,
      fs.name AS fee_definition_name,
      fs.program_type,
      fs.board,
      fs.class_name,
      fs.course_name,
      fs.academic_year,
      fs.duration_months,
      fs.tuition_total AS definition_tuition_total,
      fs.hostel_total AS definition_hostel_total,
      fs.transport_total AS definition_transport_total,
      s.name AS student_name,
      s.roll_number,
      s.class AS student_class,
      s.advance_fee_balance
    FROM student_fee_profiles fp
    JOIN fee_structures fs ON fs.id = fp.fee_structure_id
    JOIN students s ON s.id = fp.student_id
    WHERE fp.student_id = $1
      AND fp.center_id = $2
      AND fp.status = 'active'
    `,
    [studentId, centerId]
  );

  return rows[0] || null;
};

const createStudentFeePlan = async (client, req, options) => {
  const studentId = Number(options.studentId);
  if (!studentId) {
    throw createAppError("student_id is required.");
  }

  const existingProfile = await getProfileByStudentId(client, req.user.center_id, studentId);
  if (existingProfile) {
    throw createAppError("This student already has an active fee plan. Close it before creating a new one.");
  }

  const student = await getStudentWithCharges(client, req.user.center_id, studentId);
  const academicYear = options.academic_year || getDefaultAcademicYear();
  const billingCycle = normalizeBillingCycle(options.billing_cycle);
  const dueDay = options.due_day ? Number(options.due_day) : 5;
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    throw createAppError("due_day must be a number between 1 and 28.");
  }

  const structure = await getFeeStructure(client, req.user.center_id, {
    fee_structure_id: options.fee_structure_id,
    className: student.class,
    academicYear,
  });

  const includeTransport = Boolean(options.include_transport);
  const includeHostel = Boolean(options.include_hostel);
  const planStartDate = options.plan_start_date || student.join_date || formatDate(new Date());

  const generatedPlan = generateInstallments({
    structure,
    billingCycle,
    includeHostel,
    includeTransport,
    planStartDate,
    dueDay,
  });

  const { rows: profileRows } = await client.query(
    `
    INSERT INTO student_fee_profiles (
      student_id,
      fee_structure_id,
      billing_cycle,
      plan_start_date,
      due_day,
      include_transport,
      include_hostel,
      transport_fee_total,
      hostel_fee_total,
      tuition_fee_total,
      applicable_months,
      notes,
      center_id
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *
    `,
    [
      studentId,
      structure.id,
      billingCycle,
      planStartDate,
      dueDay,
      includeTransport,
      includeHostel,
      generatedPlan.transportFeeTotal,
      generatedPlan.hostelFeeTotal,
      generatedPlan.tuitionFeeTotal,
      generatedPlan.applicableMonths,
      options.notes || null,
      req.user.center_id,
    ]
  );

  const profile = profileRows[0];
  const createdFees = [];
  for (const installment of generatedPlan.installments) {
    const { rows } = await client.query(
      `
      INSERT INTO fees (
        fee_profile_id,
        student_id,
        installment_no,
        installment_label,
        billing_cycle,
        period_start,
        period_end,
        due_date,
        months_covered,
        tuition_amount,
        transport_amount,
        hostel_amount,
        total_amount,
        late_fee_amount,
        discount_amount,
        waived_amount,
        paid_amount,
        paid_tuition_amount,
        paid_hostel_amount,
        paid_transport_amount,
        paid_adjustment_amount,
        balance,
        status,
        notes,
        center_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,0,0,0,0,0,0,0,$13,'pending',$14,$15)
      RETURNING *
      `,
      [
        profile.id,
        studentId,
        installment.installment_no,
        installment.installment_label,
        billingCycle,
        installment.period_start,
        installment.period_end,
        installment.due_date,
        installment.months_covered,
        installment.tuition_amount,
        installment.transport_amount,
        installment.hostel_amount,
        installment.total_amount,
        options.notes || null,
        req.user.center_id,
      ]
    );

    createdFees.push(rows[0]);
  }

  return {
    profile,
    fee_structure: structure,
    installments: createdFees,
    breakdown: {
      tuition_total: generatedPlan.tuitionFeeTotal,
      hostel_total: generatedPlan.hostelFeeTotal,
      transport_total: generatedPlan.transportFeeTotal,
      total_fee: roundMoney(
        generatedPlan.tuitionFeeTotal +
        generatedPlan.hostelFeeTotal +
        generatedPlan.transportFeeTotal
      ),
      applicable_months: generatedPlan.applicableMonths,
    },
  };
};

module.exports = {
  BILLING_CYCLE_CONFIG,
  createAppError,
  normalizeBillingCycle,
  roundMoney,
  formatDate,
  resolveStatus,
  validatePositiveAmount,
  getDefaultAcademicYear,
  getStudentWithCharges,
  getFeeStructure,
  generateInstallments,
  getProfileByStudentId,
  createStudentFeePlan,
};
