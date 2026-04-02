const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { buildStudentPassword } = require("../catalog/catalog.shared");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

exports.login = async ({ email, password }) => {
  const loginId = String(email || "").trim();
  if (!loginId || !password) {
    throw createError("Email or mobile and password are required.");
  }

  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1 OR phone = $1",
    [loginId]
  );

  if (!rows[0]) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      phone: rows[0].phone,
      role: rows[0].role,
      center_id: rows[0].center_id,
      student_id: rows[0].student_id,
      teacher_id: rows[0].teacher_id,
      parent_id: rows[0].parent_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: rows[0],
  };
};

exports.register = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const center = await client.query(
      "INSERT INTO coaching_centers(name, city) VALUES($1,$2) RETURNING id",
      [data.centerName, data.city]
    );

    const hash = await bcrypt.hash(data.password, 10);

    const user = await client.query(
      "INSERT INTO users(name,email,password_hash,role,center_id) VALUES($1,$2,$3,'admin',$4) RETURNING *",
      [data.name, data.email, hash, center.rows[0].id]
    );

    await client.query("COMMIT");

    return user.rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

exports.createLinkedAccount = async (req) => {
  const actorRole = String((req.user && req.user.role) || "").toLowerCase();
  if (!["admin", "staff"].includes(actorRole)) {
    throw createError("Only admin or staff can create linked login accounts.", 403);
  }

  const {
    role,
    email,
    phone,
    password,
    student_id,
    teacher_id,
    parent_id,
  } = req.body;

  if (!role || !["student", "teacher", "parent"].includes(role)) {
    throw createError("Role must be student, teacher, or parent.");
  }

  const normalizedEmail = String(email || "").trim().toLowerCase() || null;
  const normalizedPhone = String(phone || "").trim() || null;

  if (!normalizedEmail && !normalizedPhone) {
    throw createError("Email or mobile is required to create a login account.");
  }

  let profileQuery = null;
  let profileId = null;

  if (role === "student") {
    profileId = Number(student_id);
    if (!profileId) throw createError("Student is required.");
    profileQuery = await pool.query(
      "SELECT id, name, phone, admission_year FROM students WHERE id = $1 AND center_id = $2",
      [profileId, req.user.center_id]
    );
  }

  if (role === "teacher") {
    profileId = Number(teacher_id);
    if (!profileId) throw createError("Teacher is required.");
    profileQuery = await pool.query(
      "SELECT id, name, phone FROM teachers WHERE id = $1 AND center_id = $2",
      [profileId, req.user.center_id]
    );
  }

  if (role === "parent") {
    profileId = Number(parent_id);
    if (!profileId) throw createError("Parent is required.");
    profileQuery = await pool.query(
      "SELECT id, name, phone FROM parents WHERE id = $1 AND center_id = $2",
      [profileId, req.user.center_id]
    );
  }

  const profile = profileQuery && profileQuery.rows ? profileQuery.rows[0] : null;
  if (!profile) {
    throw createError("Linked profile was not found in this center.");
  }

  const existingQuery = await pool.query(
    `
    SELECT id
    FROM users
    WHERE ($1::text IS NOT NULL AND email = $1)
       OR ($2::text IS NOT NULL AND phone = $2)
       OR ($3::int IS NOT NULL AND student_id = $3)
       OR ($4::int IS NOT NULL AND teacher_id = $4)
       OR ($5::int IS NOT NULL AND parent_id = $5)
    LIMIT 1
    `,
    [
      normalizedEmail,
      normalizedPhone,
      role === "student" ? profileId : null,
      role === "teacher" ? profileId : null,
      role === "parent" ? profileId : null,
    ]
  );

  if (existingQuery.rows[0]) {
    throw createError("A login account already exists for this email, mobile, or linked profile.");
  }

  const resolvedPassword =
    password ||
    (role === "student" ? buildStudentPassword(profile.name, profile.admission_year) : null);

  if (!resolvedPassword || String(resolvedPassword).length < 6) {
    throw createError("Password must be at least 6 characters.");
  }

  const passwordHash = await bcrypt.hash(resolvedPassword, 10);
  const { rows } = await pool.query(
    `
    INSERT INTO users
      (name, email, phone, password_hash, role, center_id, student_id, teacher_id, parent_id, must_change_password)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id, name, email, phone, role, center_id, student_id, teacher_id, parent_id, must_change_password, created_at
    `,
    [
      profile.name,
      normalizedEmail,
      normalizedPhone || profile.phone || null,
      passwordHash,
      role,
      req.user.center_id,
      role === "student" ? profileId : null,
      role === "teacher" ? profileId : null,
      role === "parent" ? profileId : null,
      !password,
    ]
  );

  return rows[0];
};
