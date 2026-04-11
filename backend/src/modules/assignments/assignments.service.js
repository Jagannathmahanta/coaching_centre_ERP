const pool = require("../../config/db");
const { createAppError } = require("../fees/fees.shared");
const { deleteObjectByUrl, getSignedObjectUrl, sanitizeSegment, uploadDataUrl } = require("../../utils/s3Upload");

const AUTHOR_ROLES = new Set(["admin", "teacher"]);
const VIEWER_ROLES = new Set(["admin", "teacher", "student"]);
const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]);

const baseSelect = `
  SELECT
    a.*,
    cd.class_name,
    s.name AS student_name,
    s.roll_number AS student_roll_number,
    u.name AS created_by_name
  FROM assignments a
  LEFT JOIN class_definitions cd ON cd.id = a.class_id
  LEFT JOIN students s ON s.id = a.student_id
  LEFT JOIN users u ON u.id = a.created_by
`;

function ensureViewer(req) {
  if (!VIEWER_ROLES.has(req.user.role)) {
    throw createAppError("You do not have access to assignments.", 403);
  }
  if (req.user.role === "teacher" && req.user.is_staff) {
    throw createAppError("Staff accounts do not have access to assignments.", 403);
  }
}

function ensureAuthor(req) {
  if (!AUTHOR_ROLES.has(req.user.role)) {
    throw createAppError("Only admin and teacher can manage assignments.", 403);
  }
  if (req.user.role === "teacher" && req.user.is_staff) {
    throw createAppError("Staff accounts do not have access to assignments.", 403);
  }
}

function buildAttachmentUrl(attachmentPath) {
  if (!attachmentPath) return null;
  if (/^https?:\/\//i.test(String(attachmentPath))) {
    return String(attachmentPath);
  }
  return `/${String(attachmentPath).replace(/^\/+/, "")}`;
}

async function withSignedAttachment(row) {
  return {
    ...row,
    attachment_url: await getSignedObjectUrl(buildAttachmentUrl(row.attachment_path)),
  };
}

async function removeAttachmentFile(attachmentPath) {
  if (!attachmentPath) return;
  if (/^https?:\/\//i.test(String(attachmentPath))) {
    await deleteObjectByUrl(String(attachmentPath)).catch(() => {});
  }
}

async function resolveCenterSlug(centerId, fallbackSlug) {
  if (fallbackSlug) {
    return String(fallbackSlug).trim().toLowerCase();
  }

  const { rows } = await pool.query(
    `
    SELECT slug
    FROM coaching_centers
    WHERE id = $1
    LIMIT 1
    `,
    [centerId]
  );

  if (!rows[0] || !rows[0].slug) {
    throw createAppError("Institute slug not found.", 404);
  }

  return String(rows[0].slug).trim().toLowerCase();
}

async function saveAttachment(centerId, centerSlug, assignmentId, payload) {
  if (!payload || !payload.content) {
    return {
      attachmentName: null,
      attachmentMimeType: null,
      attachmentPath: null,
      attachmentSize: null,
    };
  }

  const uploaded = await uploadDataUrl({
    keyPrefix: `${sanitizeSegment(centerSlug)}/assignments/assignment-${assignmentId}`,
    fileNamePrefix: "attachment",
    dataUrl: payload.content,
    originalName: payload.name || `assignment-${assignmentId}-attachment`,
    allowedMimeTypes: ALLOWED_ATTACHMENT_TYPES,
    maxBytes: 5 * 1024 * 1024,
  });

  return {
    attachmentName: uploaded.name,
    attachmentMimeType: uploaded.mimeType,
    attachmentPath: uploaded.url,
    attachmentSize: uploaded.size,
  };
}

async function ensureClass(centerId, classId) {
  const parsedId = Number(classId);
  if (!parsedId) {
    throw createAppError("class_id is required.");
  }

  const { rows } = await pool.query(
    `
    SELECT id, class_name
    FROM class_definitions
    WHERE id = $1 AND center_id = $2
    LIMIT 1
    `,
    [parsedId, centerId]
  );

  if (!rows[0]) {
    throw createAppError("Selected class was not found.");
  }

  return rows[0];
}

async function ensureStudent(centerId, studentId) {
  const parsedId = Number(studentId);
  if (!parsedId) {
    throw createAppError("student_id is required.");
  }

  const { rows } = await pool.query(
    `
    SELECT id, name, class_id
    FROM students
    WHERE id = $1 AND center_id = $2
    LIMIT 1
    `,
    [parsedId, centerId]
  );

  if (!rows[0]) {
    throw createAppError("Selected student was not found.");
  }

  return rows[0];
}

async function getAssignmentById(centerId, assignmentId) {
  const { rows } = await pool.query(
    `
    ${baseSelect}
    WHERE a.id = $1 AND a.center_id = $2
    LIMIT 1
    `,
    [Number(assignmentId), centerId]
  );

  if (!rows[0]) {
    throw createAppError("Assignment not found.", 404);
  }

  return rows[0];
}

exports.getAssignments = async (req) => {
  ensureViewer(req);

  const centerId = req.user.center_id;

  if (req.user.role === "student") {
    const studentId = Number(req.user.student_id || 0);
    if (!studentId) {
      throw createAppError("Student profile is not linked to this account.", 403);
    }

    const student = await ensureStudent(centerId, studentId);
    const { rows } = await pool.query(
      `
      ${baseSelect}
      WHERE a.center_id = $1
        AND a.status = 'active'
        AND (
          (a.target_type = 'student' AND a.student_id = $2)
          OR
          (a.target_type = 'class' AND a.class_id = $3)
        )
      ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC
      `,
      [centerId, studentId, student.class_id || null]
    );

    return Promise.all(rows.map(withSignedAttachment));
  }

  const { rows } = await pool.query(
    `
    ${baseSelect}
    WHERE a.center_id = $1
    ORDER BY a.created_at DESC
    `,
    [centerId]
  );

  return Promise.all(rows.map(withSignedAttachment));
};

exports.createAssignment = async (req) => {
  ensureAuthor(req);

  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const targetType = String(req.body.target_type || "").trim().toLowerCase();
  const dueDate = req.body.due_date ? String(req.body.due_date) : null;

  if (!title) {
    throw createAppError("Assignment title is required.");
  }

  if (!description) {
    throw createAppError("Assignment description is required.");
  }

  if (!["class", "student"].includes(targetType)) {
    throw createAppError("target_type must be class or student.");
  }

  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    throw createAppError("due_date must be a valid date.");
  }

  let classId = null;
  let studentId = null;
  const requestedClassId = req.body.class_id ? Number(req.body.class_id) : null;

  if (targetType === "class") {
    const classRow = await ensureClass(req.user.center_id, requestedClassId);
    classId = classRow.id;
  } else {
    const classRow = await ensureClass(req.user.center_id, requestedClassId);
    const studentRow = await ensureStudent(req.user.center_id, req.body.student_id);
    if (Number(studentRow.class_id || 0) !== classRow.id) {
      throw createAppError("Selected student does not belong to the selected class.");
    }
    classId = classRow.id;
    studentId = studentRow.id;
  }

  const centerSlug = await resolveCenterSlug(req.user.center_id, req.user.center_slug);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      INSERT INTO assignments (
        title,
        description,
        target_type,
        class_id,
        student_id,
        due_date,
        attachment_name,
        attachment_mime_type,
        attachment_path,
        attachment_size,
        status,
        center_id,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id
      `,
      [
        title,
        description,
        targetType,
        classId,
        studentId,
        dueDate,
        null,
        null,
        null,
        null,
        "active",
        req.user.center_id,
        req.user.id,
      ]
    );

    if (req.body.attachment && req.body.attachment.content) {
      const attachment = await saveAttachment(req.user.center_id, centerSlug, rows[0].id, req.body.attachment);
      await client.query(
        `
        UPDATE assignments
        SET
          attachment_name = $1,
          attachment_mime_type = $2,
          attachment_path = $3,
          attachment_size = $4,
          updated_at = NOW()
        WHERE id = $5 AND center_id = $6
        `,
        [
          attachment.attachmentName,
          attachment.attachmentMimeType,
          attachment.attachmentPath,
          attachment.attachmentSize,
          rows[0].id,
          req.user.center_id,
        ]
      );
    }

    const populated = await client.query(
      `
      ${baseSelect}
      WHERE a.id = $1 AND a.center_id = $2
      LIMIT 1
      `,
      [rows[0].id, req.user.center_id]
    );

    await client.query("COMMIT");

    return withSignedAttachment(populated.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updateAssignment = async (req) => {
  ensureAuthor(req);

  const existing = await getAssignmentById(req.user.center_id, req.params.id);
  const centerSlug = await resolveCenterSlug(req.user.center_id, req.user.center_slug);
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const targetType = String(req.body.target_type || "").trim().toLowerCase();
  const dueDate = req.body.due_date ? String(req.body.due_date) : null;
  const requestedClassId = req.body.class_id ? Number(req.body.class_id) : null;

  if (!title) {
    throw createAppError("Assignment title is required.");
  }

  if (!description) {
    throw createAppError("Assignment description is required.");
  }

  if (!["class", "student"].includes(targetType)) {
    throw createAppError("target_type must be class or student.");
  }

  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    throw createAppError("due_date must be a valid date.");
  }

  let classId = null;
  let studentId = null;

  if (targetType === "class") {
    const classRow = await ensureClass(req.user.center_id, requestedClassId);
    classId = classRow.id;
  } else {
    const classRow = await ensureClass(req.user.center_id, requestedClassId);
    const studentRow = await ensureStudent(req.user.center_id, req.body.student_id);
    if (Number(studentRow.class_id || 0) !== classRow.id) {
      throw createAppError("Selected student does not belong to the selected class.");
    }
    classId = classRow.id;
    studentId = studentRow.id;
  }

  let attachmentName = existing.attachment_name;
  let attachmentMimeType = existing.attachment_mime_type;
  let attachmentPath = existing.attachment_path;
  let attachmentSize = existing.attachment_size;

  if (req.body.remove_attachment) {
    await removeAttachmentFile(existing.attachment_path);
    attachmentName = null;
    attachmentMimeType = null;
    attachmentPath = null;
    attachmentSize = null;
  }

  if (req.body.attachment && req.body.attachment.content) {
    const nextAttachment = await saveAttachment(req.user.center_id, centerSlug, req.params.id, req.body.attachment);
    await removeAttachmentFile(existing.attachment_path);
    attachmentName = nextAttachment.attachmentName;
    attachmentMimeType = nextAttachment.attachmentMimeType;
    attachmentPath = nextAttachment.attachmentPath;
    attachmentSize = nextAttachment.attachmentSize;
  }

  await pool.query(
    `
    UPDATE assignments
    SET
      title = $1,
      description = $2,
      target_type = $3,
      class_id = $4,
      student_id = $5,
      due_date = $6,
      attachment_name = $7,
      attachment_mime_type = $8,
      attachment_path = $9,
      attachment_size = $10,
      updated_at = NOW()
    WHERE id = $11 AND center_id = $12
    `,
    [
      title,
      description,
      targetType,
      classId,
      studentId,
      dueDate,
      attachmentName,
      attachmentMimeType,
      attachmentPath,
      attachmentSize,
      Number(req.params.id),
      req.user.center_id,
    ]
  );

  const updated = await getAssignmentById(req.user.center_id, req.params.id);
  return withSignedAttachment(updated);
};

exports.deleteAssignment = async (req) => {
  ensureAuthor(req);

  const existing = await pool.query(
    `
    SELECT attachment_path
    FROM assignments
    WHERE id = $1 AND center_id = $2
    LIMIT 1
    `,
    [Number(req.params.id), req.user.center_id]
  );

  await pool.query(
    `
    DELETE FROM assignments
    WHERE id = $1 AND center_id = $2
    `,
    [Number(req.params.id), req.user.center_id]
  );

  await removeAttachmentFile(existing.rows[0] ? existing.rows[0].attachment_path : null);

  return { success: true };
};
