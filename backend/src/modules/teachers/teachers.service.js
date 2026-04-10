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

function buildTeacherPassword(name, joinDate) {
  const letters = String(name || "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  const year = new Date(joinDate || new Date()).getFullYear();
  return `${letters}${year}`;
}

exports.getTeachers = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT
      t.id,
      t.name,
      t.phone,
      t.email,
      COALESCE(t.is_staff, u.is_staff, FALSE) AS is_staff,
      t.gender,
      t.qualification,
      t.assigned_subjects,
      t.assigned_classes,
      t.join_date,
      t.status,
      t.notes,
      t.center_id,
      t.created_at,
      t.updated_at,
      u.id AS user_id,
      u.email AS login_email,
      u.phone AS login_phone,
      COALESCE(u.is_staff, t.is_staff, FALSE) AS login_is_staff,
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
    is_staff,
    gender,
    qualification,
    assigned_subjects,
    assigned_classes,
    join_date,
    status,
    notes,
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
      (name, phone, email, is_staff, gender, qualification, assigned_subjects, assigned_classes, join_date, status, notes, center_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        name,
        phone || null,
        email || null,
        Boolean(is_staff),
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

    const normalizedEmail = String(email || "").trim().toLowerCase() || null;
    const normalizedPhone = String(phone || "").trim() || null;
    if (normalizedEmail || normalizedPhone) {
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

      const passwordHash = await bcrypt.hash(buildTeacherPassword(teacher.name, teacher.join_date), 10);
      await client.query(
        `
        INSERT INTO users
          (name, email, phone, password_hash, role, is_staff, center_id, teacher_id, must_change_password)
        VALUES
          ($1,$2,$3,$4,'teacher',$5,$6,$7,$8)
        `,
        [teacher.name, normalizedEmail, normalizedPhone, passwordHash, Boolean(teacher.is_staff), req.user.center_id, teacher.id, true]
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
      is_staff = $4,
      gender = $5,
      qualification = $6,
      assigned_subjects = $7,
      assigned_classes = $8,
      join_date = $9,
      status = $10,
      notes = $11,
      updated_at = NOW()
    WHERE id = $12 AND center_id = $13
    RETURNING *
    `,
    [
      payload.name,
      payload.phone || null,
      payload.email || null,
      Boolean(payload.is_staff),
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

  await pool.query(
    `
    UPDATE users
    SET
      name = $1,
      is_staff = $2
    WHERE teacher_id = $3 AND center_id = $4
    `,
    [payload.name, Boolean(payload.is_staff), teacherId, req.user.center_id]
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
