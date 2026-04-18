const pool = require("../../config/db");
const { createAppError } = require("../fees/fees.shared");
const {
  ensureTime,
  getBatchById,
  getClassById,
  getCourseById,
  normalizeProgramType,
  normalizeShift,
} = require("./catalog.shared");

exports.getBootstrap = async (req) => {
  const centerId = req.user.center_id;
  const [classesRes, coursesRes, batchesRes] = await Promise.all([
    pool.query(
      `
      SELECT *
      FROM class_definitions
      WHERE center_id = $1
      ORDER BY class_name
      `,
      [centerId]
    ),
    pool.query(
      `
      SELECT *
      FROM course_definitions
      WHERE center_id = $1
      ORDER BY course_name
      `,
      [centerId]
    ),
    pool.query(
      `
      SELECT
        b.*,
        cd.class_name,
        cr.course_name,
        COALESCE(s.enrolled_count, 0) AS enrolled_count
      FROM batch_definitions b
      LEFT JOIN class_definitions cd ON cd.id = b.class_id
      LEFT JOIN course_definitions cr ON cr.id = b.course_id
      LEFT JOIN (
        SELECT batch_id, COUNT(*) AS enrolled_count
        FROM students
        WHERE center_id = $1 AND batch_id IS NOT NULL
        GROUP BY batch_id
      ) s ON s.batch_id = b.id
      WHERE b.center_id = $1
      ORDER BY b.program_type, b.shift, b.start_time
      `,
      [centerId]
    ),
  ]);

  return {
    classes: classesRes.rows,
    courses: coursesRes.rows,
    batches: batchesRes.rows,
  };
};

exports.getPublicLanding = async (req) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  if (!slug) {
    throw createAppError("slug is required.");
  }

  const tenantRes = await pool.query(
    `
    SELECT id, name, slug, city, address, phone, email, logo_url, status, plan
    FROM coaching_centers
    WHERE LOWER(slug) = $1
    LIMIT 1
    `,
    [slug]
  );

  const tenant = tenantRes.rows[0];
  if (!tenant) {
    throw createAppError("Institute not found.");
  }

  const [classesRes, coursesRes, batchesRes] = await Promise.all([
    pool.query(
      `
      SELECT *
      FROM class_definitions
      WHERE center_id = $1 AND status = 'active'
      ORDER BY class_name
      `,
      [tenant.id]
    ),
    pool.query(
      `
      SELECT *
      FROM course_definitions
      WHERE center_id = $1 AND status = 'active'
      ORDER BY course_name
      `,
      [tenant.id]
    ),
    pool.query(
      `
      SELECT
        b.*,
        cd.class_name,
        cr.course_name,
        COALESCE(s.enrolled_count, 0) AS enrolled_count
      FROM batch_definitions b
      LEFT JOIN class_definitions cd ON cd.id = b.class_id
      LEFT JOIN course_definitions cr ON cr.id = b.course_id
      LEFT JOIN (
        SELECT batch_id, COUNT(*) AS enrolled_count
        FROM students
        WHERE center_id = $1 AND batch_id IS NOT NULL
        GROUP BY batch_id
      ) s ON s.batch_id = b.id
      WHERE b.center_id = $1 AND b.status = 'active'
      ORDER BY b.program_type, b.shift, b.start_time
      `,
      [tenant.id]
    ),
  ]);

  return {
    tenant,
    classes: classesRes.rows,
    courses: coursesRes.rows,
    batches: batchesRes.rows,
  };
};

exports.getClasses = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM class_definitions
    WHERE center_id = $1
    ORDER BY class_name
    `,
    [req.user.center_id]
  );
  return rows;
};

exports.createClass = async (req) => {
  const className = String(req.body.class_name || "").trim();
  if (!className) {
    throw createAppError("class_name is required.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO class_definitions (center_id, class_name, status)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [req.user.center_id, className, req.body.status || "active"]
  );

  return rows[0];
};

exports.updateClass = async (req) => {
  const classId = Number(req.params.id);
  const existing = await getClassById(pool, req.user.center_id, classId);
  const className = String(req.body.class_name || existing.class_name || "").trim();
  if (!className) {
    throw createAppError("class_name is required.");
  }

  const { rows } = await pool.query(
    `
    UPDATE class_definitions
    SET class_name = $1, status = $2, updated_at = NOW()
    WHERE id = $3 AND center_id = $4
    RETURNING *
    `,
    [className, req.body.status || existing.status, classId, req.user.center_id]
  );

  return rows[0];
};

exports.getCourses = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM course_definitions
    WHERE center_id = $1
    ORDER BY course_name
    `,
    [req.user.center_id]
  );
  return rows;
};

exports.createCourse = async (req) => {
  const courseName = String(req.body.course_name || "").trim();
  if (!courseName) {
    throw createAppError("course_name is required.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO course_definitions (center_id, course_name, description, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [req.user.center_id, courseName, req.body.description || null, req.body.status || "active"]
  );

  return rows[0];
};

exports.updateCourse = async (req) => {
  const courseId = Number(req.params.id);
  const existing = await getCourseById(pool, req.user.center_id, courseId);
  const courseName = String(req.body.course_name || existing.course_name || "").trim();
  if (!courseName) {
    throw createAppError("course_name is required.");
  }

  const { rows } = await pool.query(
    `
    UPDATE course_definitions
    SET course_name = $1, description = $2, status = $3, updated_at = NOW()
    WHERE id = $4 AND center_id = $5
    RETURNING *
    `,
    [courseName, req.body.description !== undefined ? req.body.description : existing.description, req.body.status || existing.status, courseId, req.user.center_id]
  );

  return rows[0];
};

exports.getBatches = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT
      b.*,
      cd.class_name,
      cr.course_name,
      COALESCE(s.enrolled_count, 0) AS enrolled_count
    FROM batch_definitions b
    LEFT JOIN class_definitions cd ON cd.id = b.class_id
    LEFT JOIN course_definitions cr ON cr.id = b.course_id
    LEFT JOIN (
      SELECT batch_id, COUNT(*) AS enrolled_count
      FROM students
      WHERE center_id = $1 AND batch_id IS NOT NULL
      GROUP BY batch_id
    ) s ON s.batch_id = b.id
    WHERE b.center_id = $1
    ORDER BY b.program_type, b.shift, b.start_time
    `,
    [req.user.center_id]
  );
  return rows;
};

exports.createBatch = async (req) => {
  const programType = normalizeProgramType(req.body.program_type);
  const classId = req.body.class_id ? Number(req.body.class_id) : null;
  const courseId = req.body.course_id ? Number(req.body.course_id) : null;

  if (programType === "academic" && !classId) {
    throw createAppError("class_id is required for academic batches.");
  }
  if (programType === "non_academic" && !courseId) {
    throw createAppError("course_id is required for non-academic batches.");
  }

  if (classId) await getClassById(pool, req.user.center_id, classId);
  if (courseId) await getCourseById(pool, req.user.center_id, courseId);

  const { rows } = await pool.query(
    `
    INSERT INTO batch_definitions (
      center_id,
      program_type,
      board,
      class_id,
      course_id,
      shift,
      batch_name,
      start_time,
      end_time,
      capacity,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
    `,
    [
      req.user.center_id,
      programType,
      programType === "academic" ? (req.body.board || null) : null,
      classId,
      courseId,
      normalizeShift(req.body.shift),
      String(req.body.batch_name || "").trim(),
      ensureTime(req.body.start_time, "start_time"),
      ensureTime(req.body.end_time, "end_time"),
      req.body.capacity ? Number(req.body.capacity) : null,
      req.body.status || "active",
    ]
  );

  return rows[0];
};

exports.updateBatch = async (req) => {
  const batchId = Number(req.params.id);
  const existing = await getBatchById(pool, req.user.center_id, batchId);
  const programType = normalizeProgramType(req.body.program_type || existing.program_type);
  const classId = req.body.class_id !== undefined ? Number(req.body.class_id || 0) || null : existing.class_id;
  const courseId = req.body.course_id !== undefined ? Number(req.body.course_id || 0) || null : existing.course_id;

  if (programType === "academic" && !classId) {
    throw createAppError("class_id is required for academic batches.");
  }
  if (programType === "non_academic" && !courseId) {
    throw createAppError("course_id is required for non-academic batches.");
  }

  if (classId) await getClassById(pool, req.user.center_id, classId);
  if (courseId) await getCourseById(pool, req.user.center_id, courseId);

  const { rows } = await pool.query(
    `
    UPDATE batch_definitions
    SET
      program_type = $1,
      board = $2,
      class_id = $3,
      course_id = $4,
      shift = $5,
      batch_name = $6,
      start_time = $7,
      end_time = $8,
      capacity = $9,
      status = $10,
      updated_at = NOW()
    WHERE id = $11 AND center_id = $12
    RETURNING *
    `,
    [
      programType,
      programType === "academic" ? (req.body.board !== undefined ? req.body.board : existing.board) : null,
      classId,
      courseId,
      normalizeShift(req.body.shift || existing.shift),
      req.body.batch_name !== undefined
        ? String(req.body.batch_name || "").trim()
        : String(existing.batch_name || "").trim(),
      ensureTime(req.body.start_time || existing.start_time, "start_time"),
      ensureTime(req.body.end_time || existing.end_time, "end_time"),
      req.body.capacity !== undefined ? Number(req.body.capacity || 0) || null : existing.capacity,
      req.body.status || existing.status,
      batchId,
      req.user.center_id,
    ]
  );

  return rows[0];
};