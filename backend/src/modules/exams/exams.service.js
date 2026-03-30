const pool = require("../../config/db");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

async function getExamById(examId, centerId, client = pool) {
  const { rows } = await client.query(
    `
    SELECT *
    FROM exams
    WHERE id = $1 AND center_id = $2
    `,
    [examId, centerId]
  );

  if (!rows[0]) {
    throw notFound("Exam not found.");
  }

  return rows[0];
}

function normalizeResultStatus(status) {
  return ["present", "absent", "excused"].includes(status) ? status : "present";
}

exports.getExams = async (req) => {
  const { class: className, board, academic_year, exam_type, search } = req.query;
  let query = `
    SELECT
      e.*,
      COUNT(er.id) AS results_count
    FROM exams e
    LEFT JOIN exam_results er ON er.exam_id = e.id
    WHERE e.center_id = $1
  `;
  const params = [req.user.center_id];

  if (className) {
    params.push(className);
    query += ` AND e.class = $${params.length}`;
  }

  if (board) {
    params.push(board);
    query += ` AND e.board = $${params.length}`;
  }

  if (academic_year) {
    params.push(academic_year);
    query += ` AND e.academic_year = $${params.length}`;
  }

  if (exam_type) {
    params.push(exam_type);
    query += ` AND e.exam_type = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (e.exam_name ILIKE $${params.length} OR e.subject ILIKE $${params.length})`;
  }

  query += `
    GROUP BY e.id
    ORDER BY e.exam_date DESC, e.time NULLS LAST, e.id DESC
  `;

  const { rows } = await pool.query(query, params);
  return rows;
};

exports.createExam = async (req) => {
  const {
    exam_name,
    exam_type,
    subject,
    class: cls,
    board,
    academic_year,
    exam_date,
    time,
    duration,
    max_marks,
    pass_marks,
    examiner,
    hall,
    notes,
  } = req.body;

  if (!exam_name || !exam_type || !subject || !cls || !exam_date) {
    throw badRequest("Exam name, exam type, subject, class, and exam date are required.");
  }

  if (pass_marks !== undefined && pass_marks !== null && Number(pass_marks) > Number(max_marks || 100)) {
    throw badRequest("Pass marks cannot be greater than max marks.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO exams
    (exam_name, exam_type, subject, class, board, academic_year, exam_date, time, duration, max_marks, pass_marks, examiner, hall, notes, center_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *
    `,
    [
      exam_name,
      exam_type,
      subject,
      cls,
      board || null,
      academic_year || null,
      exam_date,
      time || null,
      duration || null,
      max_marks ? Number(max_marks) : 100,
      pass_marks ? Number(pass_marks) : 35,
      examiner || null,
      hall || null,
      notes || null,
      req.user.center_id,
    ]
  );

  return rows[0];
};

exports.updateExam = async (req) => {
  const examId = Number(req.params.id);
  const existing = await getExamById(examId, req.user.center_id);
  const payload = { ...existing, ...req.body };

  if (!payload.exam_name || !payload.exam_type || !payload.subject || !payload.class || !payload.exam_date) {
    throw badRequest("Exam name, exam type, subject, class, and exam date are required.");
  }

  if (payload.pass_marks !== undefined && payload.pass_marks !== null && Number(payload.pass_marks) > Number(payload.max_marks || 100)) {
    throw badRequest("Pass marks cannot be greater than max marks.");
  }

  const { rows } = await pool.query(
    `
    UPDATE exams
    SET
      exam_name = $1,
      exam_type = $2,
      subject = $3,
      class = $4,
      board = $5,
      academic_year = $6,
      exam_date = $7,
      time = $8,
      duration = $9,
      max_marks = $10,
      pass_marks = $11,
      examiner = $12,
      hall = $13,
      notes = $14
    WHERE id = $15 AND center_id = $16
    RETURNING *
    `,
    [
      payload.exam_name,
      payload.exam_type,
      payload.subject,
      payload.class,
      payload.board || null,
      payload.academic_year || null,
      payload.exam_date,
      payload.time || null,
      payload.duration || null,
      payload.max_marks ? Number(payload.max_marks) : 100,
      payload.pass_marks ? Number(payload.pass_marks) : 35,
      payload.examiner || null,
      payload.hall || null,
      payload.notes || null,
      examId,
      req.user.center_id,
    ]
  );

  return rows[0];
};

exports.deleteExam = async (req) => {
  const examId = Number(req.params.id);
  await getExamById(examId, req.user.center_id);

  await pool.query(
    `
    DELETE FROM exams
    WHERE id = $1 AND center_id = $2
    `,
    [examId, req.user.center_id]
  );

  return { success: true };
};

exports.getExamRoster = async (req) => {
  const examId = Number(req.params.id);
  const exam = await getExamById(examId, req.user.center_id);

  const { rows } = await pool.query(
    `
    SELECT
      s.id AS student_id,
      s.name AS student_name,
      s.roll_number,
      s.class,
      fs.board,
      fs.academic_year,
      er.id AS result_id,
      er.status,
      er.marks_obtained,
      er.grade,
      er.rank,
      er.remarks
    FROM students s
    LEFT JOIN student_fee_profiles fp
      ON fp.student_id = s.id
     AND fp.center_id = s.center_id
     AND fp.status = 'active'
    LEFT JOIN fee_structures fs
      ON fs.id = fp.fee_structure_id
    LEFT JOIN exam_results er
      ON er.student_id = s.id
     AND er.exam_id = $1
    WHERE s.center_id = $2
      AND s.class = $3
      AND ($4::text IS NULL OR fs.board = $4)
      AND ($5::text IS NULL OR fs.academic_year = $5)
    ORDER BY s.roll_number NULLS LAST, s.name
    `,
    [examId, req.user.center_id, exam.class, exam.board || null, exam.academic_year || null]
  );

  return { exam, students: rows };
};

exports.addResult = async (req) => {
  const examId = Number(req.params.id);
  const exam = await getExamById(examId, req.user.center_id);
  const {
    student_id,
    marks_obtained,
    grade,
    remarks,
    rank,
    status,
  } = req.body;

  if (!student_id) {
    throw badRequest("Student is required.");
  }

  if (marks_obtained !== null && marks_obtained !== undefined && Number(marks_obtained) > Number(exam.max_marks || 100)) {
    throw badRequest("Marks obtained cannot be greater than max marks.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO exam_results
    (exam_id, student_id, status, marks_obtained, grade, rank, remarks)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (exam_id, student_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      marks_obtained = EXCLUDED.marks_obtained,
      grade = EXCLUDED.grade,
      rank = EXCLUDED.rank,
      remarks = EXCLUDED.remarks
    RETURNING *
    `,
    [
      examId,
      Number(student_id),
      normalizeResultStatus(status),
      marks_obtained === "" || marks_obtained === null || marks_obtained === undefined ? null : Number(marks_obtained),
      grade || null,
      rank ? Number(rank) : null,
      remarks || null,
    ]
  );

  return rows[0];
};

exports.bulkUpsertResults = async (req) => {
  const examId = Number(req.params.id);
  const results = Array.isArray(req.body.results) ? req.body.results : [];

  if (!results.length) {
    throw badRequest("At least one result row is required.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const exam = await getExamById(examId, req.user.center_id, client);
    const roster = await client.query(
      `
      SELECT id, roll_number
      FROM students
      WHERE center_id = $1 AND class = $2
      `,
      [req.user.center_id, exam.class]
    );

    const studentMap = new Map();
    for (const row of roster.rows) {
      studentMap.set(String(row.id), row.id);
      if (row.roll_number) studentMap.set(String(row.roll_number), row.id);
    }

    let savedCount = 0;
    for (const row of results) {
      const studentKey =
        row.student_id !== undefined && row.student_id !== null && row.student_id !== ""
          ? row.student_id
          : row.roll_number !== undefined && row.roll_number !== null && row.roll_number !== ""
            ? row.roll_number
            : row.admission_no;
      const studentId = studentMap.get(String(studentKey));

      if (!studentId) {
        continue;
      }

      const marksObtained =
        row.marks_obtained === "" || row.marks_obtained === null || row.marks_obtained === undefined
          ? null
          : Number(row.marks_obtained);

      if (marksObtained !== null && marksObtained > Number(exam.max_marks || 100)) {
        throw badRequest(`Marks cannot be greater than max marks for student ${studentKey}.`);
      }

      await client.query(
        `
        INSERT INTO exam_results
        (exam_id, student_id, status, marks_obtained, grade, rank, remarks)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (exam_id, student_id)
        DO UPDATE SET
          status = EXCLUDED.status,
          marks_obtained = EXCLUDED.marks_obtained,
          grade = EXCLUDED.grade,
          rank = EXCLUDED.rank,
          remarks = EXCLUDED.remarks
        `,
        [
          examId,
          studentId,
          normalizeResultStatus(row.status),
          marksObtained,
          row.grade || null,
          row.rank ? Number(row.rank) : null,
          row.remarks || null,
        ]
      );
      savedCount += 1;
    }

    await client.query("COMMIT");
    return { success: true, saved_count: savedCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.getResults = async (req) => {
  const examId = Number(req.params.id);
  await getExamById(examId, req.user.center_id);

  const { rows } = await pool.query(
    `
    SELECT 
      er.*,
      s.name as student_name,
      s.roll_number
    FROM exam_results er
    JOIN students s ON er.student_id = s.id
    WHERE er.exam_id=$1
    ORDER BY s.roll_number NULLS LAST, s.name
    `,
    [examId]
  );

  return rows;
};
