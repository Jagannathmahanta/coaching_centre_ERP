const pool = require("../../config/db");
const { createAppError } = require("../fees/fees.shared");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const AUTHOR_ROLES = new Set(["admin", "teacher"]);
const VIEWER_ROLES = new Set(["admin", "teacher", "student"]);
const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]);
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "uploads", "assignments");

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

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

function buildAttachmentUrl(attachmentPath) {
  if (!attachmentPath) return null;
  return `/${String(attachmentPath).replace(/^\/+/, "")}`;
}

function removeAttachmentFile(attachmentPath) {
  if (!attachmentPath) return;
  const resolved = path.join(__dirname, "..", "..", "..", String(attachmentPath));
  if (fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw createAppError("Invalid attachment payload.");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function saveAttachment(centerId, payload) {
  if (!payload || !payload.content) {
    return {
      attachmentName: null,
      attachmentMimeType: null,
      attachmentPath: null,
      attachmentSize: null,
    };
  }

  const { mimeType, buffer } = parseDataUrl(payload.content);
  if (!ALLOWED_ATTACHMENT_TYPES.has(mimeType)) {
    throw createAppError("Only PDF, PNG, JPG, JPEG, and WEBP files are allowed.");
  }

  const size = buffer.byteLength;
  if (size > 5 * 1024 * 1024) {
    throw createAppError("Attachment size must be 5 MB or less.");
  }

  const extensionByMime = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
  };

  ensureUploadDir();
  const extension = extensionByMime[mimeType] || "";
  const fileName = `${centerId}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
  const filePath = path.join(UPLOAD_ROOT, fileName);
  fs.writeFileSync(filePath, buffer);

  return {
    attachmentName: String(payload.name || fileName),
    attachmentMimeType: mimeType,
    attachmentPath: path.posix.join("uploads", "assignments", fileName),
    attachmentSize: size,
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

    return rows.map((row) => ({
      ...row,
      attachment_url: buildAttachmentUrl(row.attachment_path),
    }));
  }

  const { rows } = await pool.query(
    `
    ${baseSelect}
    WHERE a.center_id = $1
    ORDER BY a.created_at DESC
    `,
    [centerId]
  );

  return rows.map((row) => ({
    ...row,
    attachment_url: buildAttachmentUrl(row.attachment_path),
  }));
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

  const attachment = saveAttachment(req.user.center_id, req.body.attachment);

  const { rows } = await pool.query(
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
      attachment.attachmentName,
      attachment.attachmentMimeType,
      attachment.attachmentPath,
      attachment.attachmentSize,
      "active",
      req.user.center_id,
      req.user.id,
    ]
  );

  const populated = await pool.query(
    `
    ${baseSelect}
    WHERE a.id = $1 AND a.center_id = $2
    LIMIT 1
    `,
    [rows[0].id, req.user.center_id]
  );

  return {
    ...populated.rows[0],
    attachment_url: buildAttachmentUrl(populated.rows[0].attachment_path),
  };
};

exports.updateAssignment = async (req) => {
  ensureAuthor(req);

  const existing = await getAssignmentById(req.user.center_id, req.params.id);
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
    removeAttachmentFile(existing.attachment_path);
    attachmentName = null;
    attachmentMimeType = null;
    attachmentPath = null;
    attachmentSize = null;
  }

  if (req.body.attachment && req.body.attachment.content) {
    const nextAttachment = saveAttachment(req.user.center_id, req.body.attachment);
    removeAttachmentFile(existing.attachment_path);
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
  return {
    ...updated,
    attachment_url: buildAttachmentUrl(updated.attachment_path),
  };
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

  removeAttachmentFile(existing.rows[0]?.attachment_path);

  return { success: true };
};
