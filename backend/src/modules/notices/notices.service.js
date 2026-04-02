
const pool = require("../../config/db");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeAudience(value) {
  const audience = String(value || "all").trim().toLowerCase();
  if (["all", "student", "students", "parent", "parents", "teacher", "teachers"].includes(audience)) {
    return audience;
  }
  return "all";
}

function normalizeScope(value) {
  return String(value || "all").trim().toLowerCase() === "filtered" ? "filtered" : "all";
}

function normalizeProgramType(value) {
  const programType = String(value || "").trim().toLowerCase();
  if (programType === "academic" || programType === "non_academic") {
    return programType;
  }
  return null;
}

const baseSelect = `
  SELECT
    n.*,
    cd.class_name AS class_label,
    cr.course_name AS course_label,
    bd.batch_name,
    bd.shift AS batch_shift,
    bd.start_time AS batch_start_time,
    bd.end_time AS batch_end_time
  FROM notices n
  LEFT JOIN class_definitions cd ON cd.id = n.class_id
  LEFT JOIN course_definitions cr ON cr.id = n.course_id
  LEFT JOIN batch_definitions bd ON bd.id = n.batch_id
`;

exports.getNotices = async (req) => {
  const centerId = req.user.center_id;
  const role = String(req.user.role || "").toLowerCase();

  if (["admin", "staff"].includes(role)) {
    const { rows } = await pool.query(
      `
      ${baseSelect}
      WHERE n.center_id = $1
      ORDER BY n.created_at DESC
      `,
      [centerId]
    );
    return rows;
  }

  if (role === "student") {
    const studentId = Number(req.user.student_id);
    const { rows } = await pool.query(
      `
      ${baseSelect}
      JOIN students s
        ON s.id = $2
       AND s.center_id = n.center_id
      WHERE n.center_id = $1
        AND (n.expires_at IS NULL OR n.expires_at >= CURRENT_DATE)
        AND lower(COALESCE(n.target_audience, 'all')) IN ('all', 'student', 'students')
        AND (
          COALESCE(n.target_scope, 'all') = 'all'
          OR (
            n.program_type = 'academic'
            AND s.class_id = n.class_id
            AND (n.batch_id IS NULL OR n.batch_id = s.batch_id)
          )
          OR (
            n.program_type = 'non_academic'
            AND s.course_id = n.course_id
            AND (n.batch_id IS NULL OR n.batch_id = s.batch_id)
          )
        )
      ORDER BY n.created_at DESC
      `,
      [centerId, studentId]
    );
    return rows;
  }

  if (role === "parent") {
    const parentId = Number(req.user.parent_id);
    const { rows } = await pool.query(
      `
      ${baseSelect}
      WHERE n.center_id = $1
        AND (n.expires_at IS NULL OR n.expires_at >= CURRENT_DATE)
        AND lower(COALESCE(n.target_audience, 'all')) IN ('all', 'parent', 'parents')
        AND (
          COALESCE(n.target_scope, 'all') = 'all'
          OR EXISTS (
            SELECT 1
            FROM students s
            WHERE s.center_id = n.center_id
              AND s.parent_id = $2
              AND (
                (
                  n.program_type = 'academic'
                  AND s.class_id = n.class_id
                  AND (n.batch_id IS NULL OR n.batch_id = s.batch_id)
                )
                OR (
                  n.program_type = 'non_academic'
                  AND s.course_id = n.course_id
                  AND (n.batch_id IS NULL OR n.batch_id = s.batch_id)
                )
              )
          )
        )
      ORDER BY n.created_at DESC
      `,
      [centerId, parentId]
    );
    return rows;
  }

  if (role === "teacher") {
    const { rows } = await pool.query(
      `
      ${baseSelect}
      WHERE n.center_id = $1
        AND (n.expires_at IS NULL OR n.expires_at >= CURRENT_DATE)
        AND lower(COALESCE(n.target_audience, 'all')) IN ('all', 'teacher', 'teachers')
      ORDER BY n.created_at DESC
      `,
      [centerId]
    );
    return rows;
  }

  const { rows } = await pool.query(
    `
    ${baseSelect}
    WHERE n.center_id = $1
      AND (n.expires_at IS NULL OR n.expires_at >= CURRENT_DATE)
    ORDER BY n.created_at DESC
    `,
    [centerId]
  );

  return rows;
};

exports.createNotice = async (req) => {
  const {
    title,
    content,
    target_audience,
    target_scope,
    program_type,
    class_id,
    course_id,
    batch_id,
    priority,
    expires_at,
  } = req.body;

  if (!String(title || "").trim()) {
    throw createError("Title is required.");
  }

  if (!String(content || "").trim()) {
    throw createError("Description is required.");
  }

  const normalizedAudience = normalizeAudience(target_audience);
  const normalizedScope = normalizeScope(target_scope);
  const normalizedProgramType = normalizeProgramType(program_type);
  const normalizedClassId = class_id ? Number(class_id) : null;
  const normalizedCourseId = course_id ? Number(course_id) : null;
  const normalizedBatchId = batch_id ? Number(batch_id) : null;

  if (normalizedScope === "filtered") {
    if (!normalizedProgramType) {
      throw createError("Program type is required for a specific-group notice.");
    }

    if (normalizedProgramType === "academic" && !normalizedClassId) {
      throw createError("Class is required for academic notice targeting.");
    }

    if (normalizedProgramType === "non_academic" && !normalizedCourseId) {
      throw createError("Course is required for non-academic notice targeting.");
    }
  }

  const { rows } = await pool.query(
    `
    INSERT INTO notices
    (title, content, target_audience, target_scope, program_type, class_id, course_id, batch_id, priority, expires_at, center_id, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
    `,
    [
      String(title).trim(),
      String(content).trim(),
      normalizedAudience,
      normalizedScope,
      normalizedScope === "filtered" ? normalizedProgramType : null,
      normalizedScope === "filtered" && normalizedProgramType === "academic" ? normalizedClassId : null,
      normalizedScope === "filtered" && normalizedProgramType === "non_academic" ? normalizedCourseId : null,
      normalizedScope === "filtered" ? normalizedBatchId : null,
      priority || "medium",
      expires_at || null,
      req.user.center_id,
      req.user.id,
    ]
  );

  return rows[0];
};

exports.deleteNotice = async (req) => {
  await pool.query(
    `
    DELETE FROM notices
    WHERE id=$1 AND center_id=$2
    `,
    [req.params.id, req.user.center_id]
  );

  return { success: true };
};
