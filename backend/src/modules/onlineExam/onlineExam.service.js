const pool = require("../../config/db");
const {
  ensureEnglishAndOdiaTranslations,
  ensureOptionTranslations,
  getTranslation,
  normalizeLanguage,
} = require("./translation.service");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

function ensureRoles(req, roles) {
  const role = normalizeRole(req.user && req.user.role);
  if (!roles.includes(role)) {
    throw createError("You are not allowed to perform this action.", 403);
  }
  if (role === "teacher" && req.user && req.user.is_staff) {
    throw createError("Staff accounts do not have access to online exams.", 403);
  }
  return role;
}

function normalizeNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function calcGrade(totalScore, totalMarks) {
  const safeTotal = Number(totalMarks) || 0;
  if (safeTotal <= 0) return null;
  const pct = Math.round((Number(totalScore || 0) / safeTotal) * 100);
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

function normalizeExamPayload(body = {}) {
  return {
    title: String(body.title || "").trim(),
    titleTranslations: body.title_translations || body.titleTranslations || null,
    subject: body.subject ? String(body.subject).trim() : null,
    className: String(body.class || body.className || "").trim() || null,
    duration: normalizeNumber(body.duration, 60),
    passMark: normalizeNumber(body.pass_mark ?? body.passMark, 40),
    status: ["draft", "published", "ended"].includes(String(body.status || "").trim().toLowerCase())
      ? String(body.status).trim().toLowerCase()
      : "draft",
    startTime: body.start_time || body.startTime || null,
    endTime: body.end_time || body.endTime || null,
    instructions: body.instructions ? String(body.instructions) : null,
    instructionsTranslations: body.instructions_translations || body.instructionsTranslations || null,
    sourceLanguage: normalizeLanguage(body.source_language || body.sourceLanguage || "en", "en"),
  };
}

async function getExam(examId, centerId, client = pool) {
  const { rows } = await client.query(
    `
    SELECT *
    FROM online_exams
    WHERE id = $1 AND center_id = $2
    `,
    [examId, centerId]
  );

  if (!rows[0]) {
    throw createError("Online exam not found.", 404);
  }

  return rows[0];
}

async function getStudentProfile(centerId, studentId, client = pool) {
  const { rows } = await client.query(
    `
    SELECT id, name, roll_number, class
    FROM students
    WHERE id = $1 AND center_id = $2
    `,
    [studentId, centerId]
  );

  if (!rows[0]) {
    throw createError("Student profile not found.", 404);
  }

  return rows[0];
}

async function getQuestions(examId, includeAnswers, client = pool) {
  const select = includeAnswers
    ? "id, order_no, type, question_text, question_text_translations, options, option_translations, correct_option, marks, explanation, explanation_translations"
    : "id, order_no, type, question_text, question_text_translations, options, option_translations, marks, explanation, explanation_translations";

  const { rows } = await client.query(
    `
    SELECT ${select}
    FROM exam_questions
    WHERE exam_id = $1
    ORDER BY order_no, id
    `,
    [examId]
  );

  return rows;
}

async function getSubmissionByExamAndStudent(examId, studentId, client = pool) {
  const { rows } = await client.query(
    `
    SELECT *
    FROM exam_submissions
    WHERE exam_id = $1 AND student_id = $2
    `,
    [examId, studentId]
  );
  return rows[0] || null;
}

async function getSubmissionWithExam(submissionId, centerId, client = pool) {
  const { rows } = await client.query(
    `
    SELECT
      es.*,
      oe.center_id,
      oe.pass_mark,
      oe.id AS exam_id,
      COALESCE(SUM(eq.marks), 0) AS exam_total_marks
    FROM exam_submissions es
    JOIN online_exams oe ON oe.id = es.exam_id
    LEFT JOIN exam_questions eq ON eq.exam_id = oe.id
    WHERE es.id = $1
      AND oe.center_id = $2
    GROUP BY es.id, oe.id
    `,
    [submissionId, centerId]
  );

  if (!rows[0]) {
    throw createError("Submission not found.", 404);
  }

  return rows[0];
}

async function assertStudentCanAccessExam(req, exam, client = pool) {
  const studentId = Number(req.user && req.user.student_id);
  if (!studentId) {
    throw createError("Student account is not linked to a student profile.", 403);
  }

  const student = await getStudentProfile(req.user.center_id, studentId, client);
  if (exam.class && student.class && exam.class !== student.class) {
    throw createError("This exam is not assigned to the current student.", 403);
  }

  return student;
}

exports.getExams = async (req) => {
  const role = normalizeRole(req.user && req.user.role);

  if (role === "student") {
    const studentId = Number(req.user && req.user.student_id);
    if (!studentId) {
      throw createError("Student account is not linked to a student profile.", 403);
    }

    const student = await getStudentProfile(req.user.center_id, studentId);
    const { rows } = await pool.query(
      `
      SELECT
        e.*,
        COUNT(DISTINCT eq.id)::int AS question_count,
        COALESCE(SUM(eq.marks), 0)::int AS total_marks,
        es.id AS submission_id,
        es.status AS submission_status,
        es.total_score,
        es.grade,
        es.submitted_at
      FROM online_exams e
      LEFT JOIN exam_questions eq ON eq.exam_id = e.id
      LEFT JOIN exam_submissions es
        ON es.exam_id = e.id
       AND es.student_id = $2
      WHERE e.center_id = $1
        AND e.status IN ('published', 'ended')
        AND ($3::text IS NULL OR e.class IS NULL OR e.class = $3)
      GROUP BY e.id, es.id
      ORDER BY e.created_at DESC
      `,
      [req.user.center_id, studentId, student.class || null]
    );

    return rows;
  }

  ensureRoles(req, ["admin", "teacher"]);
  const { rows } = await pool.query(
    `
    SELECT
      e.*,
      COUNT(DISTINCT eq.id)::int AS question_count,
      COALESCE(SUM(eq.marks), 0)::int AS total_marks,
      COUNT(DISTINCT es.id)::int AS submission_count
    FROM online_exams e
    LEFT JOIN exam_questions eq ON eq.exam_id = e.id
    LEFT JOIN exam_submissions es ON es.exam_id = e.id
    WHERE e.center_id = $1
    GROUP BY e.id
    ORDER BY e.created_at DESC
    `,
    [req.user.center_id]
  );

  return rows;
};

exports.getExamById = async (req) => {
  const examId = Number(req.params.id);
  if (!examId) throw createError("Invalid online exam id.");

  const exam = await getExam(examId, req.user.center_id);
  const role = normalizeRole(req.user && req.user.role);

  if (role === "student") {
    const student = await assertStudentCanAccessExam(req, exam);
    if (!["published", "ended"].includes(String(exam.status || "").toLowerCase())) {
      throw createError("This exam is not available to students.", 403);
    }

    const submission = await getSubmissionByExamAndStudent(examId, student.id);
    exam.questions = await getQuestions(examId, false);
    exam.student_submission = submission;
    return exam;
  }

  ensureRoles(req, ["admin", "teacher"]);
  exam.questions = await getQuestions(examId, true);
  return exam;
};

exports.createExam = async (req) => {
  ensureRoles(req, ["admin", "teacher"]);
  const payload = normalizeExamPayload(req.body);

  if (!payload.title) throw createError("Exam title is required.");
  if (!payload.className) throw createError("Class is required.");
  if (!payload.duration || payload.duration <= 0) throw createError("Duration must be a positive number.");

  const titleTranslations = await ensureEnglishAndOdiaTranslations(
    payload.titleTranslations || payload.title,
    payload.sourceLanguage
  );
  const instructionsTranslations = payload.instructions || payload.instructionsTranslations
    ? await ensureEnglishAndOdiaTranslations(
      payload.instructionsTranslations || payload.instructions,
      payload.sourceLanguage
    )
    : {};

  const { rows } = await pool.query(
    `
    INSERT INTO online_exams
      (title, title_translations, subject, class, duration, pass_mark, status, start_time, end_time, instructions, instructions_translations, center_id, created_by)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *
    `,
    [
      getTranslation(titleTranslations, "en", payload.title),
      JSON.stringify(titleTranslations),
      payload.subject,
      payload.className,
      payload.duration,
      payload.passMark,
      payload.status,
      payload.startTime,
      payload.endTime,
      getTranslation(instructionsTranslations, "en", payload.instructions),
      JSON.stringify(instructionsTranslations),
      req.user.center_id,
      req.user.id,
    ]
  );

  return rows[0];
};

exports.updateExam = async (req) => {
  ensureRoles(req, ["admin", "teacher"]);
  const examId = Number(req.params.id);
  if (!examId) throw createError("Invalid online exam id.");

  const existing = await getExam(examId, req.user.center_id);
  const payload = normalizeExamPayload({ ...existing, ...req.body });

  if (!payload.title) throw createError("Exam title is required.");
  if (!payload.className) throw createError("Class is required.");
  if (!payload.duration || payload.duration <= 0) throw createError("Duration must be a positive number.");

  const titleTranslations = await ensureEnglishAndOdiaTranslations(
    payload.titleTranslations || payload.title,
    payload.sourceLanguage
  );
  const instructionsSeed = payload.instructionsTranslations || payload.instructions || existing.instructions_translations || existing.instructions;
  const instructionsTranslations = instructionsSeed
    ? await ensureEnglishAndOdiaTranslations(instructionsSeed, payload.sourceLanguage)
    : {};

  const { rows } = await pool.query(
    `
    UPDATE online_exams
    SET
      title = $1,
      title_translations = $2,
      subject = $3,
      class = $4,
      duration = $5,
      pass_mark = $6,
      status = $7,
      start_time = $8,
      end_time = $9,
      instructions = $10,
      instructions_translations = $11,
      updated_at = NOW()
    WHERE id = $12 AND center_id = $13
    RETURNING *
    `,
    [
      getTranslation(titleTranslations, "en", payload.title),
      JSON.stringify(titleTranslations),
      payload.subject,
      payload.className,
      payload.duration,
      payload.passMark,
      payload.status,
      payload.startTime,
      payload.endTime,
      getTranslation(instructionsTranslations, "en", payload.instructions),
      JSON.stringify(instructionsTranslations),
      examId,
      req.user.center_id,
    ]
  );

  return rows[0];
};

exports.deleteExam = async (req) => {
  ensureRoles(req, ["admin", "teacher"]);
  const examId = Number(req.params.id);
  if (!examId) throw createError("Invalid online exam id.");

  await getExam(examId, req.user.center_id);
  await pool.query(
    `
    DELETE FROM online_exams
    WHERE id = $1 AND center_id = $2
    `,
    [examId, req.user.center_id]
  );

  return { success: true };
};

exports.saveQuestions = async (req) => {
  ensureRoles(req, ["admin", "teacher"]);
  const examId = Number(req.params.id);
  if (!examId) throw createError("Invalid online exam id.");

  await getExam(examId, req.user.center_id);
  const questions = Array.isArray(req.body && req.body.questions) ? req.body.questions : [];
  const sourceLanguage = normalizeLanguage(req.body && (req.body.source_language || req.body.sourceLanguage || "en"), "en");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM exam_questions WHERE exam_id = $1", [examId]);

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index] || {};
      const type = String(question.type || "mcq").trim().toLowerCase() === "subjective" ? "subjective" : "mcq";
      const text = String(question.text || question.question_text || "").trim();
      const marks = normalizeNumber(question.marks, 2);
      const options = Array.isArray(question.options) ? question.options.map((item) => String(item || "").trim()) : [];
      const correctOption = normalizeNumber(question.correct ?? question.correct_option, null);
      const textTranslations = await ensureEnglishAndOdiaTranslations(
        question.question_text_translations
          || question.text_translations
          || question.textTranslations
          || question.question_text_localized
          || question.text_localized
          || text,
        sourceLanguage
      );
      const optionTranslations = type === "mcq"
        ? await ensureOptionTranslations(
          question.option_translations
            || question.optionTranslations
            || question.options_localized
            || options,
          sourceLanguage
        )
        : [];
      const explanationTranslations = question.explanation
        || question.explanation_translations
        || question.explanationTranslations
        || question.explanation_localized
        ? await ensureEnglishAndOdiaTranslations(
          question.explanation_translations
            || question.explanationTranslations
            || question.explanation_localized
            || question.explanation,
          sourceLanguage
        )
        : {};
      const resolvedQuestionText = getTranslation(textTranslations, "en", text);
      const resolvedOptions = optionTranslations.map((option, optionIndex) =>
        getTranslation(option, "en", options[optionIndex] || "")
      );
      const resolvedExplanation = getTranslation(
        explanationTranslations,
        "en",
        question.explanation ? String(question.explanation) : null
      );

      if (!resolvedQuestionText) throw createError(`Question ${index + 1} text is required.`);
      if (!marks || marks <= 0) throw createError(`Question ${index + 1} marks must be a positive number.`);
      if (type === "mcq") {
        if (resolvedOptions.length < 2 || resolvedOptions.some((item) => !item)) {
          throw createError(`Question ${index + 1} must include all MCQ options.`);
        }
        if (correctOption === null || correctOption < 0 || correctOption >= resolvedOptions.length) {
          throw createError(`Question ${index + 1} must include a valid correct option.`);
        }
      }

      await client.query(
        `
        INSERT INTO exam_questions
          (exam_id, type, question_text, question_text_translations, options, option_translations, correct_option, marks, explanation, explanation_translations, order_no)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          examId,
          type,
          resolvedQuestionText,
          JSON.stringify(textTranslations),
          type === "mcq" ? JSON.stringify(resolvedOptions) : null,
          type === "mcq" ? JSON.stringify(optionTranslations) : JSON.stringify([]),
          type === "mcq" ? correctOption : null,
          marks,
          resolvedExplanation,
          JSON.stringify(explanationTranslations),
          index,
        ]
      );
    }

    await client.query("COMMIT");
    return { success: true, count: questions.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.submitExam = async (req) => {
  ensureRoles(req, ["student"]);
  const examId = Number(req.params.id);
  if (!examId) throw createError("Invalid online exam id.");

  const studentId = Number(req.user && req.user.student_id);
  if (!studentId) {
    throw createError("Student account is not linked to a student profile.", 403);
  }

  const exam = await getExam(examId, req.user.center_id);
  await assertStudentCanAccessExam(req, exam);
  if (String(exam.status || "").toLowerCase() !== "published") {
    throw createError("This exam is not open for submission.", 403);
  }

  const alreadySubmitted = await getSubmissionByExamAndStudent(examId, studentId);
  if (alreadySubmitted) {
    throw createError("Exam already submitted.");
  }

  const answers = req.body && typeof req.body.answers === "object" ? req.body.answers : {};
  const subAnswers = req.body && typeof req.body.sub_answers === "object"
    ? req.body.sub_answers
    : (req.body && typeof req.body.subAnswers === "object" ? req.body.subAnswers : {});
  const timeTaken = normalizeNumber(req.body && (req.body.time_taken ?? req.body.timeTaken), null);
  const autoSubmitted = Boolean(req.body && (req.body.auto_submitted ?? req.body.autoSubmitted));

  const questions = await getQuestions(examId, true);
  let mcqScore = 0;
  let subjectiveCount = 0;
  const detailedResults = {};

  for (const question of questions) {
    if (question.type === "mcq") {
      const given = answers[String(question.id)] ?? answers[question.id];
      const isCorrect = Number(given) === Number(question.correct_option);
      const marksAwarded = isCorrect ? Number(question.marks || 0) : 0;
      mcqScore += marksAwarded;
      detailedResults[question.id] = {
        given: given ?? null,
        correct: question.correct_option,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
      };
    } else {
      subjectiveCount += 1;
      detailedResults[question.id] = {
        answer_text: subAnswers[String(question.id)] ?? subAnswers[question.id] ?? "",
        marks_awarded: null,
      };
    }
  }

  const totalScore = mcqScore;
  const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks || 0), 0);
  const finalStatus = subjectiveCount > 0 ? "submitted" : "graded";
  const finalGrade = subjectiveCount > 0 ? null : calcGrade(totalScore, totalMarks);

  const { rows } = await pool.query(
    `
    INSERT INTO exam_submissions
      (exam_id, student_id, answers, sub_answers, detailed_results, mcq_score, sub_score, total_score, grade, time_taken_minutes, status, auto_submitted)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
    `,
    [
      examId,
      studentId,
      JSON.stringify(answers || {}),
      JSON.stringify(subAnswers || {}),
      JSON.stringify(detailedResults),
      mcqScore,
      0,
      totalScore,
      finalGrade,
      timeTaken,
      finalStatus,
      autoSubmitted,
    ]
  );

  return {
    submission: rows[0],
    mcq_score: mcqScore,
    total_score: totalScore,
    grade: finalGrade,
  };
};

exports.getSubmissions = async (req) => {
  ensureRoles(req, ["admin", "teacher"]);
  const examId = Number(req.params.id);
  if (!examId) throw createError("Invalid online exam id.");

  await getExam(examId, req.user.center_id);
  const { rows } = await pool.query(
    `
    SELECT
      es.*,
      s.name AS student_name,
      s.roll_number,
      s.class,
      RANK() OVER (ORDER BY es.total_score DESC, es.time_taken_minutes ASC NULLS LAST, es.submitted_at ASC) AS rank
    FROM exam_submissions es
    JOIN students s
      ON s.id = es.student_id
    JOIN online_exams oe
      ON oe.id = es.exam_id
    WHERE es.exam_id = $1
      AND oe.center_id = $2
    ORDER BY rank, s.name
    `,
    [examId, req.user.center_id]
  );

  return rows;
};

exports.getMySubmission = async (req) => {
  ensureRoles(req, ["student"]);
  const examId = Number(req.params.id);
  if (!examId) throw createError("Invalid online exam id.");

  const studentId = Number(req.user && req.user.student_id);
  if (!studentId) {
    throw createError("Student account is not linked to a student profile.", 403);
  }

  const exam = await getExam(examId, req.user.center_id);
  await assertStudentCanAccessExam(req, exam);
  const submission = await getSubmissionByExamAndStudent(examId, studentId);
  if (!submission) {
    throw createError("Submission not found.", 404);
  }

  return submission;
};

exports.gradeSubmission = async (req) => {
  ensureRoles(req, ["admin", "teacher"]);
  const submissionId = Number(req.params.id);
  if (!submissionId) throw createError("Invalid submission id.");

  const questionId = Number(req.body && req.body.question_id);
  const marksAwarded = normalizeNumber(req.body && req.body.marks_awarded, null);
  const feedback = req.body && req.body.feedback ? String(req.body.feedback) : null;

  if (!questionId) throw createError("Question id is required.");
  if (marksAwarded === null || marksAwarded < 0) throw createError("Marks awarded must be zero or more.");

  const submission = await getSubmissionWithExam(submissionId, req.user.center_id);
  const { rows: questionRows } = await pool.query(
    `
    SELECT *
    FROM exam_questions
    WHERE id = $1 AND exam_id = $2
    `,
    [questionId, submission.exam_id]
  );

  const question = questionRows[0];
  if (!question) throw createError("Question not found for this submission.", 404);
  if (question.type !== "subjective") throw createError("Only subjective answers can be graded.");
  if (marksAwarded > Number(question.marks || 0)) {
    throw createError("Marks awarded cannot exceed question marks.");
  }

  const detailedResults = submission.detailed_results || {};
  detailedResults[questionId] = {
    ...(detailedResults[questionId] || {}),
    marks_awarded: marksAwarded,
    feedback,
  };

  const subjectiveQuestionIds = (await pool.query(
    `
    SELECT id
    FROM exam_questions
    WHERE exam_id = $1 AND type = 'subjective'
    `,
    [submission.exam_id]
  )).rows.map((row) => String(row.id));

  const subScore = subjectiveQuestionIds.reduce((sum, id) => {
    const item = detailedResults[id] || detailedResults[Number(id)] || {};
    return sum + Number(item.marks_awarded || 0);
  }, 0);

  const totalScore = Number(submission.mcq_score || 0) + subScore;
  const grade = calcGrade(totalScore, Number(submission.exam_total_marks || 0));

  const { rows } = await pool.query(
    `
    UPDATE exam_submissions
    SET
      detailed_results = $1,
      sub_score = $2,
      total_score = $3,
      grade = $4,
      status = 'graded',
      updated_at = NOW()
    WHERE id = $5
    RETURNING *
    `,
    [JSON.stringify(detailedResults), subScore, totalScore, grade, submissionId]
  );

  return rows[0];
};
