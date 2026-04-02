const pool = require("../../config/db");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function getStudentById(id, centerId) {
  const { rows } = await pool.query(
    `
    SELECT id, name, class, roll_number
    FROM students
    WHERE id = $1 AND center_id = $2
    `,
    [id, centerId]
  );

  return rows[0] || null;
}

async function getTeacherById(id, centerId) {
  const { rows } = await pool.query(
    `
    SELECT id, name
    FROM teachers
    WHERE id = $1 AND center_id = $2
    `,
    [id, centerId]
  );

  return rows[0] || null;
}

async function getLeaveRequestById(id, centerId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM leave_requests
    WHERE id = $1 AND center_id = $2
    `,
    [id, centerId]
  );

  if (!rows[0]) {
    const error = new Error("Leave request not found.");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

function getTotalDays(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

exports.getLeaves = async (req) => {
  const { applicant_type, status } = req.query;
  let query = `
    SELECT
      lr.*,
      CASE
        WHEN lr.applicant_type = 'student' THEN s.name
        ELSE t.name
      END AS applicant_name,
      s.class AS student_class,
      s.roll_number,
      reviewer.name AS reviewed_by_name
    FROM leave_requests lr
    LEFT JOIN students s
      ON s.id = lr.student_id
     AND s.center_id = lr.center_id
    LEFT JOIN teachers t
      ON t.id = lr.teacher_id
     AND t.center_id = lr.center_id
    LEFT JOIN users reviewer
      ON reviewer.id = lr.reviewed_by
    WHERE lr.center_id = $1
  `;
  const params = [req.user.center_id];

  if (applicant_type) {
    params.push(applicant_type);
    query += ` AND lr.applicant_type = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND lr.status = $${params.length}`;
  }

  query += " ORDER BY lr.created_at DESC, lr.id DESC";

  const { rows } = await pool.query(query, params);
  return rows;
};

exports.createLeave = async (req) => {
  const {
    applicant_type,
    student_id,
    teacher_id,
    leave_type,
    from_date,
    to_date,
    reason,
  } = req.body;

  if (!applicant_type || !leave_type || !from_date || !to_date) {
    throw badRequest("Applicant type, leave type, from date, and to date are required.");
  }

  if (!["student", "teacher"].includes(applicant_type)) {
    throw badRequest("Applicant type must be student or teacher.");
  }

  if (new Date(to_date) < new Date(from_date)) {
    throw badRequest("To date cannot be before from date.");
  }

  let normalizedStudentId = null;
  let normalizedTeacherId = null;

  if (applicant_type === "student") {
    if (!student_id) throw badRequest("Student is required.");
    const student = await getStudentById(Number(student_id), req.user.center_id);
    if (!student) throw badRequest("Selected student was not found in this center.");
    normalizedStudentId = student.id;
  }

  if (applicant_type === "teacher") {
    if (!teacher_id) throw badRequest("Teacher is required.");
    const teacher = await getTeacherById(Number(teacher_id), req.user.center_id);
    if (!teacher) throw badRequest("Selected teacher was not found in this center.");
    normalizedTeacherId = teacher.id;
  }

  const totalDays = getTotalDays(from_date, to_date);

  const { rows } = await pool.query(
    `
    INSERT INTO leave_requests
      (center_id, applicant_type, student_id, teacher_id, leave_type, from_date, to_date, total_days, reason, status, created_by)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10)
    RETURNING *
    `,
    [
      req.user.center_id,
      applicant_type,
      normalizedStudentId,
      normalizedTeacherId,
      leave_type,
      from_date,
      to_date,
      totalDays,
      reason || null,
      req.user.id,
    ]
  );

  return rows[0];
};

exports.updateLeaveStatus = async (req) => {
  const leaveId = Number(req.params.id);
  const { status, review_note } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    throw badRequest("Status must be pending, approved, or rejected.");
  }

  await getLeaveRequestById(leaveId, req.user.center_id);

  const { rows } = await pool.query(
    `
    UPDATE leave_requests
    SET
      status = $1,
      review_note = $2,
      reviewed_by = $3,
      reviewed_at = CASE WHEN $6 THEN NULL ELSE NOW() END,
      updated_at = NOW()
    WHERE id = $4
      AND center_id = $5
    RETURNING *
    `,
    [status, review_note || null, req.user.id, leaveId, req.user.center_id, status === "pending"]
  );

  return rows[0];
};

exports.deleteLeave = async (req) => {
  const leaveId = Number(req.params.id);
  const existing = await getLeaveRequestById(leaveId, req.user.center_id);

  if (existing.status !== "pending") {
    throw badRequest("Only pending leave requests can be deleted.");
  }

  await pool.query(
    `
    DELETE FROM leave_requests
    WHERE id = $1 AND center_id = $2
    `,
    [leaveId, req.user.center_id]
  );

  return { success: true };
};
