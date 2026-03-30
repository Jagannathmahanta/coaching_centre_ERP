const pool = require("../../config/db");
const bcrypt = require("bcryptjs");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function getTeacherById(id, centerId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM teachers
    WHERE id = $1 AND center_id = $2
    `,
    [id, centerId]
  );

  if (!rows[0]) {
    const error = new Error("Teacher not found.");
    error.statusCode = 404;
    throw error;
  }

  return rows[0];
}

function normalizeTextArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

exports.getTeachers = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT
      t.*,
      u.id AS user_id,
      u.email AS login_email,
      u.phone AS login_phone,
      CASE WHEN u.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_login_account
    FROM teachers t
    LEFT JOIN users u
      ON u.teacher_id = t.id
     AND u.center_id = t.center_id
    WHERE t.center_id = $1
    ORDER BY t.name
    `,
    [req.user.center_id]
  );

  return rows;
};

exports.createTeacher = async (req) => {
  const {
    name,
    phone,
    email,
    gender,
    qualification,
    assigned_subjects,
    assigned_classes,
    join_date,
    status,
    notes,
    create_login,
    login_email,
    login_phone,
    login_password,
  } = req.body;

  if (!name) {
    throw badRequest("Teacher name is required.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      INSERT INTO teachers
      (name, phone, email, gender, qualification, assigned_subjects, assigned_classes, join_date, status, notes, center_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        name,
        phone || null,
        email || null,
        gender || null,
        qualification || null,
        normalizeTextArray(assigned_subjects),
        normalizeTextArray(assigned_classes),
        join_date || null,
        status || "active",
        notes || null,
        req.user.center_id,
      ]
    );

    const teacher = rows[0];

    if (create_login) {
      const normalizedEmail = String(login_email || email || "").trim().toLowerCase() || null;
      const normalizedPhone = String(login_phone || phone || "").trim() || null;

      if (!normalizedEmail && !normalizedPhone) {
        throw badRequest("Teacher login needs an email or mobile.");
      }

      if (!login_password || String(login_password).length < 6) {
        throw badRequest("Teacher login password must be at least 6 characters.");
      }

      const existingUser = await client.query(
        `
        SELECT id
        FROM users
        WHERE ($1::text IS NOT NULL AND email = $1)
           OR ($2::text IS NOT NULL AND phone = $2)
           OR teacher_id = $3
        LIMIT 1
        `,
        [normalizedEmail, normalizedPhone, teacher.id]
      );

      if (existingUser.rows[0]) {
        throw badRequest("A login account already exists for this teacher, email, or mobile.");
      }

      const passwordHash = await bcrypt.hash(String(login_password), 10);
      await client.query(
        `
        INSERT INTO users
          (name, email, phone, password_hash, role, center_id, teacher_id)
        VALUES
          ($1,$2,$3,$4,'teacher',$5,$6)
        `,
        [teacher.name, normalizedEmail, normalizedPhone, passwordHash, req.user.center_id, teacher.id]
      );
    }

    await client.query("COMMIT");
    return teacher;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updateTeacher = async (req) => {
  const teacherId = Number(req.params.id);
  const existing = await getTeacherById(teacherId, req.user.center_id);
  const payload = { ...existing, ...req.body };

  if (!payload.name) {
    throw badRequest("Teacher name is required.");
  }

  const { rows } = await pool.query(
    `
    UPDATE teachers
    SET
      name = $1,
      phone = $2,
      email = $3,
      gender = $4,
      qualification = $5,
      assigned_subjects = $6,
      assigned_classes = $7,
      join_date = $8,
      status = $9,
      notes = $10,
      updated_at = NOW()
    WHERE id = $11 AND center_id = $12
    RETURNING *
    `,
    [
      payload.name,
      payload.phone || null,
      payload.email || null,
      payload.gender || null,
      payload.qualification || null,
      normalizeTextArray(payload.assigned_subjects),
      normalizeTextArray(payload.assigned_classes),
      payload.join_date || null,
      payload.status || "active",
      payload.notes || null,
      teacherId,
      req.user.center_id,
    ]
  );

  return rows[0];
};

exports.deleteTeacher = async (req) => {
  const teacherId = Number(req.params.id);
  await getTeacherById(teacherId, req.user.center_id);

  await pool.query(
    `
    DELETE FROM teachers
    WHERE id = $1 AND center_id = $2
    `,
    [teacherId, req.user.center_id]
  );

  return { success: true };
};
