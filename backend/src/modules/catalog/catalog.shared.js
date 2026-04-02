const { createAppError } = require("../fees/fees.shared");

const normalizeProgramType = (value, fallback = "academic") => {
  const normalized = String(value || fallback).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized !== "academic" && normalized !== "non_academic") {
    throw createAppError("program_type must be academic or non_academic.");
  }
  return normalized;
};

const normalizeShift = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!["morning", "afternoon", "evening"].includes(normalized)) {
    throw createAppError("shift must be morning, afternoon, or evening.");
  }
  return normalized;
};

const ensureTime = (value, fieldName) => {
  if (!value || !/^\d{2}:\d{2}(:\d{2})?$/.test(String(value))) {
    throw createAppError(`${fieldName} must be in HH:MM or HH:MM:SS format.`);
  }
  return String(value);
};

const buildStudentPassword = (name, admissionYear) => {
  const prefix = String(name || "")
    .replace(/[^a-z]/gi, "")
    .toUpperCase()
    .slice(0, 4);

  if (!prefix || !admissionYear) {
    throw createAppError("Cannot generate default student password without name and admission_year.");
  }

  return `${prefix}${admissionYear}`;
};

const getClassById = async (client, centerId, classId) => {
  if (!classId) return null;
  const { rows } = await client.query(
    `
    SELECT *
    FROM class_definitions
    WHERE id = $1 AND center_id = $2
    `,
    [Number(classId), centerId]
  );
  if (!rows[0]) {
    throw createAppError("Selected class was not found.", 404);
  }
  return rows[0];
};

const getClassByName = async (client, centerId, className) => {
  if (!className) return null;
  const { rows } = await client.query(
    `
    SELECT *
    FROM class_definitions
    WHERE center_id = $1
      AND class_name = $2
    `,
    [centerId, String(className).trim()]
  );
  return rows[0] || null;
};

const getCourseById = async (client, centerId, courseId) => {
  if (!courseId) return null;
  const { rows } = await client.query(
    `
    SELECT *
    FROM course_definitions
    WHERE id = $1 AND center_id = $2
    `,
    [Number(courseId), centerId]
  );
  if (!rows[0]) {
    throw createAppError("Selected course was not found.", 404);
  }
  return rows[0];
};

const getCourseByName = async (client, centerId, courseName) => {
  if (!courseName) return null;
  const { rows } = await client.query(
    `
    SELECT *
    FROM course_definitions
    WHERE center_id = $1
      AND course_name = $2
    `,
    [centerId, String(courseName).trim()]
  );
  return rows[0] || null;
};

const getBatchById = async (client, centerId, batchId) => {
  if (!batchId) return null;
  const { rows } = await client.query(
    `
    SELECT *
    FROM batch_definitions
    WHERE id = $1 AND center_id = $2
    `,
    [Number(batchId), centerId]
  );
  if (!rows[0]) {
    throw createAppError("Selected batch was not found.", 404);
  }
  return rows[0];
};

const resolveAdmissionSelection = async (client, centerId, payload) => {
  const hasStructuredInput = Boolean(
    payload.program_type ||
      payload.class_id ||
      payload.course_id ||
      payload.batch_id ||
      payload.board
  );

  if (!hasStructuredInput) {
    return {
      isStructured: false,
      programType: null,
      board: payload.board || null,
      classRow: null,
      courseRow: null,
      batchRow: null,
      legacyClassValue: payload.class || null,
      admissionYear: payload.admission_year || null,
    };
  }

  const programType = normalizeProgramType(payload.program_type);
  const classRow = payload.class_id
    ? await getClassById(client, centerId, payload.class_id)
    : await getClassByName(client, centerId, payload.class);
  const courseRow = payload.course_id
    ? await getCourseById(client, centerId, payload.course_id)
    : await getCourseByName(client, centerId, payload.course_name);
  const batchRow = await getBatchById(client, centerId, payload.batch_id);
  const admissionYear = Number(payload.admission_year || 0) || new Date(payload.join_date || new Date()).getFullYear();

  if (programType === "academic" && !classRow) {
    throw createAppError("class_id is required for academic admissions.");
  }

  if (programType === "non_academic" && !courseRow) {
    throw createAppError("course_id is required for non-academic admissions.");
  }

  if (!batchRow) {
    throw createAppError("batch_id is required for structured admissions.");
  }

  if (batchRow.program_type !== programType) {
    throw createAppError("Selected batch does not match the chosen program type.");
  }

  if (programType === "academic") {
    if (!payload.board && !batchRow.board) {
      throw createAppError("board is required for academic admissions.");
    }
    if (Number(batchRow.class_id) !== Number(classRow.id)) {
      throw createAppError("Selected batch does not belong to the chosen class.");
    }
  }

  if (programType === "non_academic" && Number(batchRow.course_id) !== Number(courseRow.id)) {
    throw createAppError("Selected batch does not belong to the chosen course.");
  }

  return {
    isStructured: true,
    programType,
    board: programType === "academic" ? String(payload.board || batchRow.board || "").trim() || null : null,
    classRow,
    courseRow,
    batchRow,
    legacyClassValue: programType === "academic" ? classRow.class_name : courseRow.course_name,
    admissionYear,
  };
};

module.exports = {
  buildStudentPassword,
  ensureTime,
  getBatchById,
  getClassById,
  getCourseById,
  normalizeProgramType,
  normalizeShift,
  resolveAdmissionSelection,
};
