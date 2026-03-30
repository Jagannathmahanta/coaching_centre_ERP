const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const {
  createAppError,
  getDefaultAcademicYear,
  createStudentFeePlan,
} = require("../fees/fees.shared");
const { syncStudentHostelAllocation } = require("../hostel/hostel.service");

const createLinkedUser = async (client, req, payload) => {
  const {
    role,
    name,
    email,
    phone,
    password,
    studentId,
    parentId,
  } = payload;

  const normalizedEmail = String(email || "").trim().toLowerCase() || null;
  const normalizedPhone = String(phone || "").trim() || null;

  if (!normalizedEmail && !normalizedPhone) {
    throw createAppError("Email or mobile is required to create a login account.");
  }

  if (!password || String(password).length < 6) {
    throw createAppError("Password must be at least 6 characters.");
  }

  const existingUser = await client.query(
    `
    SELECT id
    FROM users
    WHERE ($1::text IS NOT NULL AND email = $1)
       OR ($2::text IS NOT NULL AND phone = $2)
       OR ($3::int IS NOT NULL AND student_id = $3)
       OR ($4::int IS NOT NULL AND parent_id = $4)
    LIMIT 1
    `,
    [normalizedEmail, normalizedPhone, studentId || null, parentId || null]
  );

  if (existingUser.rows[0]) {
    throw createAppError("A login account already exists for this email, mobile, or linked profile.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await client.query(
    `
    INSERT INTO users
      (name, email, phone, password_hash, role, center_id, student_id, parent_id)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [name, normalizedEmail, normalizedPhone, passwordHash, role, req.user.center_id, studentId || null, parentId || null]
  );
};

const buildAdmissionNumber = async (client, centerId, joinDate) => {
  const date = new Date(joinDate || new Date());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `${year}${month}`;

  const { rows } = await client.query(
    `
    SELECT roll_number
    FROM students
    WHERE center_id = $1
      AND roll_number LIKE $2
    ORDER BY roll_number DESC
    LIMIT 1
    `,
    [centerId, `${prefix}%`]
  );

  const lastNumber = rows[0] && rows[0].roll_number
    ? Number(String(rows[0].roll_number).slice(-3))
    : 0;

  return `${prefix}${String(lastNumber + 1).padStart(3, "0")}`;
};

exports.getStudents = async (req) => {
  const { class: className, board, academic_year } = req.query;
  let query = `
    SELECT
      s.*,
      u.id AS user_id,
      u.email AS login_email,
      u.phone AS login_phone,
      CASE WHEN u.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_login_account,
      fp.billing_cycle,
      fp.include_hostel,
      fp.include_transport,
      fp.tuition_fee_total,
      fp.hostel_fee_total,
      fp.transport_fee_total,
      fp.applicable_months,
      fp.status AS fee_plan_status,
      fs.name AS fee_definition_name,
      fs.program_type,
      fs.board,
      fs.academic_year,
      h.hostel_name,
      hr.room_number,
      COALESCE(fee_state.overdue_count, 0) AS overdue_count,
      COALESCE(fee_state.current_due_count, 0) AS current_due_count
    FROM students s
    LEFT JOIN users u
      ON u.student_id = s.id
     AND u.center_id = s.center_id
    LEFT JOIN student_fee_profiles fp
      ON fp.student_id = s.id
     AND fp.center_id = s.center_id
     AND fp.status = 'active'
    LEFT JOIN fee_structures fs
      ON fs.id = fp.fee_structure_id
    LEFT JOIN student_allocations sa
      ON sa.student_id = s.id
     AND sa.center_id = s.center_id
     AND sa.type = 'hostel'
     AND sa.status = 'active'
     AND sa.end_date IS NULL
    LEFT JOIN hostels h ON h.id = sa.hostel_id
    LEFT JOIN hostel_rooms hr ON hr.id = sa.room_id
    LEFT JOIN (
      SELECT
        student_id,
        COUNT(*) FILTER (WHERE status IN ('pending', 'partial') AND due_date < date_trunc('month', CURRENT_DATE)) AS overdue_count,
        COUNT(*) FILTER (WHERE status IN ('pending', 'partial') AND date_trunc('month', due_date) = date_trunc('month', CURRENT_DATE)) AS current_due_count
      FROM fees
      WHERE center_id = $1
      GROUP BY student_id
    ) fee_state
      ON fee_state.student_id = s.id
    WHERE s.center_id = $1
  `;
  const params = [req.user.center_id];

  if (className) {
    params.push(className);
    query += ` AND s.class = $${params.length}`;
  }

  if (board) {
    params.push(board);
    query += ` AND fs.board = $${params.length}`;
  }

  if (academic_year) {
    params.push(academic_year);
    query += ` AND fs.academic_year = $${params.length}`;
  }

  query += " ORDER BY s.created_at DESC";

  const { rows } = await pool.query(
    query,
    params
  );
  return rows;
};

exports.getStudentById = async (req) => {
  const studentId = Number(req.params.id);
  const { rows } = await pool.query(
    `
    SELECT
      s.*,
      fp.fee_structure_id,
      fp.billing_cycle,
      fp.include_hostel,
      fp.include_transport,
      fp.due_day,
      fp.notes,
      fp.status AS fee_plan_status,
      fs.name AS fee_definition_name,
      fs.board,
      fs.academic_year,
      sa.hostel_id,
      sa.room_id,
      sa.start_date AS hostel_join_date,
      sa.end_date AS hostel_left_date,
      h.hostel_name,
      hr.room_number
    FROM students s
    LEFT JOIN student_fee_profiles fp
      ON fp.student_id = s.id
     AND fp.center_id = s.center_id
     AND fp.status = 'active'
    LEFT JOIN fee_structures fs
      ON fs.id = fp.fee_structure_id
    LEFT JOIN student_allocations sa
      ON sa.student_id = s.id
     AND sa.center_id = s.center_id
     AND sa.type = 'hostel'
     AND sa.status = 'active'
     AND sa.end_date IS NULL
    LEFT JOIN hostels h ON h.id = sa.hostel_id
    LEFT JOIN hostel_rooms hr ON hr.id = sa.room_id
    WHERE s.id = $1
      AND s.center_id = $2
    `,
    [studentId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Student not found.", 404);
  }

  return rows[0];
};

exports.createStudent = async (req) => {
  const {
    name,
    class: className,
    phone,
    gender,
    parent_name,
    parent_phone,
    parent_email,
    create_parent_login,
    parent_login_password,
    join_date,
    billing_cycle,
    academic_year,
    due_day,
    notes,
    fee_structure_id,
    include_hostel,
    hostel_id,
    room_id,
    include_transport,
    create_fee_plan,
    create_student_login,
    student_login_email,
    student_login_phone,
    student_login_password,
  } = req.body;

  if (!name || !className) {
    throw createAppError("name and class are required.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let parentId = null;
    const normalizedParentName = String(parent_name || "").trim();
    const normalizedParentPhone = String(parent_phone || "").trim();
    const normalizedParentEmail = String(parent_email || "").trim().toLowerCase();

    if (normalizedParentName || normalizedParentPhone || normalizedParentEmail) {
      if (!normalizedParentName || !normalizedParentPhone) {
        throw createAppError("Guardian name and mobile are required together.");
      }

      const existingParent = await client.query(
        `
        SELECT id
        FROM parents
        WHERE phone = $1 AND center_id = $2
        LIMIT 1
        `,
        [normalizedParentPhone, req.user.center_id]
      );

      if (existingParent.rows[0]) {
        parentId = existingParent.rows[0].id;
      } else {
        const { rows: parentRows } = await client.query(
          `
          INSERT INTO parents (name, phone, email, center_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id
          `,
          [normalizedParentName, normalizedParentPhone, normalizedParentEmail || null, req.user.center_id]
        );
        parentId = parentRows[0].id;
      }
    }

    const admissionNumber = await buildAdmissionNumber(client, req.user.center_id, join_date);
    const { rows: studentRows } = await client.query(
      `
      INSERT INTO students (name, class, phone, gender, parent_id, roll_number, join_date, center_id)
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_DATE), $8)
      RETURNING *
      `,
      [
        name,
        className,
        phone || null,
        gender || null,
        parentId,
        admissionNumber,
        join_date || null,
        req.user.center_id,
      ]
    );

    const student = studentRows[0];

    let feePlan = null;
    const shouldCreateFeePlan = create_fee_plan !== false && Boolean(billing_cycle) && Boolean(fee_structure_id);
    if (shouldCreateFeePlan) {
      feePlan = await createStudentFeePlan(client, req, {
        studentId: student.id,
        fee_structure_id,
        billing_cycle,
        academic_year: academic_year || getDefaultAcademicYear(),
        due_day,
        include_transport: Boolean(include_transport),
        include_hostel: Boolean(include_hostel),
        plan_start_date: join_date || student.join_date,
        notes,
      });
    }

    await syncStudentHostelAllocation(client, req, {
      studentId: student.id,
      includeHostel: Boolean(include_hostel),
      hostelId: hostel_id,
      roomId: room_id,
      startDate: join_date || student.join_date,
    });

    if (create_student_login) {
      await createLinkedUser(client, req, {
        role: "student",
        name: student.name,
        email: student_login_email,
        phone: student_login_phone || phone,
        password: student_login_password,
        studentId: student.id,
      });
    }

    if (create_parent_login && parentId) {
      await createLinkedUser(client, req, {
        role: "parent",
        name: normalizedParentName,
        email: normalizedParentEmail,
        phone: normalizedParentPhone,
        password: parent_login_password,
        parentId,
      });
    }

    await client.query("COMMIT");

    return {
      student,
      fee_plan: feePlan,
      parent_id: parentId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updateStudent = async (req) => {
  const studentId = Number(req.params.id);
  const { name, class: className, phone, gender, join_date, include_hostel, hostel_id, room_id } = req.body;

  if (!studentId) {
    throw createAppError("Student id is required.");
  }

  if (!name || !className) {
    throw createAppError("name and class are required.");
  }

  const { rows } = await pool.query(
    `
    UPDATE students
    SET
      name = $1,
      class = $2,
      phone = $3,
      gender = $4,
      join_date = COALESCE($5, join_date),
      updated_at = NOW()
    WHERE id = $6
      AND center_id = $7
    RETURNING *
    `,
    [name, className, phone || null, gender || null, join_date || null, studentId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Student not found.", 404);
  }

  if (include_hostel !== undefined) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await syncStudentHostelAllocation(client, req, {
        studentId,
        includeHostel: Boolean(include_hostel),
        hostelId: hostel_id,
        roomId: room_id,
        startDate: join_date || rows[0].join_date,
      });
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return rows[0];
};

exports.deleteStudent = async (req) => {
  const studentId = Number(req.params.id);
  if (!studentId) {
    throw createAppError("Student id is required.");
  }

  const paymentCheck = await pool.query(
    `
    SELECT COUNT(*) AS payment_count
    FROM fee_payments
    WHERE student_id = $1
      AND center_id = $2
    `,
    [studentId, req.user.center_id]
  );

  if (Number(paymentCheck.rows[0] ? paymentCheck.rows[0].payment_count : 0) > 0) {
    throw createAppError("This student already has payment history and cannot be deleted.");
  }

  const { rows } = await pool.query(
    `
    DELETE FROM students
    WHERE id = $1
      AND center_id = $2
    RETURNING id
    `,
    [studentId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Student not found.", 404);
  }

  return { success: true };
};
