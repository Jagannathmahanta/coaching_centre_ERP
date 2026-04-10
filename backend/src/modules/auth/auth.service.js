const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { buildStudentPassword } = require("../catalog/catalog.shared");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || null;
}

function normalizePhone(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function slugifyCenterName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function resolveUniqueCenterSlug(client, requestedSlug, centerName) {
  const baseSlug = slugifyCenterName(requestedSlug || centerName);
  if (!baseSlug) {
    throw createError("Center slug could not be generated. Add a valid center name.", 400);
  }

  const { rows } = await client.query(
    `
    SELECT slug
    FROM coaching_centers
    WHERE slug = $1
       OR slug LIKE $2
    `,
    [baseSlug, `${baseSlug}-%`]
  );

  const usedSlugs = new Set(rows.map((row) => row.slug));
  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

async function ensureUserCanAccess(user, centerIdOverride = null) {
  const effectiveCenterId = centerIdOverride || user.center_id || null;

  if (user.role === "super_admin" && !effectiveCenterId) {
    return;
  }

  if (!effectiveCenterId) {
    throw createError("This account is not linked to an active institute.", 403);
  }

  const centerResult = await pool.query(
    `
    SELECT id, status
    FROM coaching_centers
    WHERE id = $1
    LIMIT 1
    `,
    [effectiveCenterId]
  );

  const center = centerResult.rows[0];
  if (!center) {
    throw createError("Institute was not found.", 404);
  }
  if (center.status !== "active") {
    throw createError("This institute is currently inactive.", 403);
  }

  if (user.role === "student") {
    const result = await pool.query(
      `
      SELECT status
      FROM students
      WHERE id = $1 AND center_id = $2
      LIMIT 1
      `,
      [user.student_id, effectiveCenterId]
    );
    if (!result.rows[0] || result.rows[0].status !== "active") {
      throw createError("This student account is inactive.", 403);
    }
  }

  if (user.role === "teacher") {
    const result = await pool.query(
      `
      SELECT status
      FROM teachers
      WHERE id = $1 AND center_id = $2
      LIMIT 1
      `,
      [user.teacher_id, effectiveCenterId]
    );
    if (!result.rows[0] || result.rows[0].status !== "active") {
      throw createError("This teacher account is inactive.", 403);
    }
  }

  if (user.role === "parent") {
    const result = await pool.query(
      `
      SELECT 1
      FROM students
      WHERE parent_id = $1
        AND center_id = $2
        AND status = 'active'
      LIMIT 1
      `,
      [user.parent_id, effectiveCenterId]
    );
    if (!result.rows[0]) {
      throw createError("This parent account is inactive because no linked student is active.", 403);
    }
  }
}

exports.login = async ({ email, password, centerSlug }) => {
  const loginId = String(email || "").trim();
  if (!loginId || !password) {
    throw createError("Email or mobile and password are required.");
  }

  const normalizedCenterSlug = String(centerSlug || "").trim().toLowerCase();
  const normalizedEmail = normalizeEmail(loginId);
  const normalizedPhone = normalizePhone(loginId);

  let centerId = null;
  if (normalizedCenterSlug) {
    const centerResult = await pool.query(
      `
      SELECT id, slug, status
      FROM coaching_centers
      WHERE slug = $1
      LIMIT 1
      `,
      [normalizedCenterSlug]
    );

    const center = centerResult.rows[0];
    if (!center) throw createError("Institute was not found for the provided slug.", 404);
    if (center.status && center.status !== "active") {
      throw createError("This institute is currently inactive.", 403);
    }
    centerId = center.id;
  }

  const { rows } = await pool.query(
    `
    SELECT *
    FROM users
    WHERE (
      $1::int IS NOT NULL
      AND center_id = $1
      AND (
        ($2::text IS NOT NULL AND LOWER(email) = $2)
        OR ($3::text IS NOT NULL AND phone = $3)
      )
    )
    OR (
      $1::int IS NULL
      AND center_id IS NULL
      AND role = 'super_admin'
      AND (
        ($2::text IS NOT NULL AND LOWER(email) = $2)
        OR ($3::text IS NOT NULL AND phone = $3)
      )
    )
    LIMIT 1
    `,
    [centerId, normalizedEmail, normalizedPhone]
  );

  if (!rows[0]) throw new Error("Invalid credentials");

  await ensureUserCanAccess(rows[0], centerId);

  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      phone: rows[0].phone,
      role: rows[0].role,
      is_staff: Boolean(rows[0].is_staff),
      center_id: rows[0].center_id,
      center_slug: normalizedCenterSlug || null,
      student_id: rows[0].student_id,
      teacher_id: rows[0].teacher_id,
      parent_id: rows[0].parent_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      ...rows[0],
      center_slug: normalizedCenterSlug || null,
    },
  };
};

exports.register = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const normalizedEmail = normalizeEmail(data.email);
    if (!normalizedEmail) {
      throw createError("Email is required.");
    }

    const centerSlug = await resolveUniqueCenterSlug(client, data.centerSlug, data.centerName);

    const center = await client.query(
      "INSERT INTO coaching_centers(name, city, slug) VALUES($1,$2,$3) RETURNING id, slug",
      [data.centerName, data.city, centerSlug]
    );

    const hash = await bcrypt.hash(data.password, 10);

    const user = await client.query(
      "INSERT INTO users(name,email,password_hash,role,center_id) VALUES($1,$2,$3,'admin',$4) RETURNING *",
      [data.name, normalizedEmail, hash, center.rows[0].id]
    );

    await client.query("COMMIT");

    return {
      ...user.rows[0],
      center_slug: center.rows[0].slug,
    };
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

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

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
      "SELECT id, name, phone, is_staff FROM teachers WHERE id = $1 AND center_id = $2",
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
    WHERE (($1::text IS NOT NULL AND center_id = $6 AND LOWER(email) = $1))
       OR (($2::text IS NOT NULL AND center_id = $6 AND phone = $2))
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
      req.user.center_id,
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
      (name, email, phone, password_hash, role, is_staff, center_id, student_id, teacher_id, parent_id, must_change_password)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id, name, email, phone, role, is_staff, center_id, student_id, teacher_id, parent_id, must_change_password, created_at
    `,
    [
      profile.name,
      normalizedEmail,
      normalizedPhone || profile.phone || null,
      passwordHash,
      role,
      role === "teacher" ? Boolean(profile.is_staff) : false,
      req.user.center_id,
      role === "student" ? profileId : null,
      role === "teacher" ? profileId : null,
      role === "parent" ? profileId : null,
      !password,
    ]
  );

  return rows[0];
};
