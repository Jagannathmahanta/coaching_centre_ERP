import api from "../../../shared/services/api";
import { getLocalizedText, normalizeLocalizedText } from "../localization";

function normalizeQuestion(question = {}) {
  const textTranslations = normalizeLocalizedText(
    question.question_text_translations
    || question.text_translations
    || question.textTranslations
    || question.question_text_localized
    || question.text_localized
    || question.question_text
    || question.text
  );
  const explanationTranslations = normalizeLocalizedText(
    question.explanation_translations
    || question.explanationTranslations
    || question.explanation_localized
    || question.explanation
  );
  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const rawOptionTranslations = Array.isArray(question.option_translations)
    ? question.option_translations
    : Array.isArray(question.optionTranslations)
      ? question.optionTranslations
      : [];
  const optionTranslations = (rawOptionTranslations.length ? rawOptionTranslations : rawOptions).map((option) => normalizeLocalizedText(
    option?.translations
    || option?.option_translations
    || option?.text_translations
    || option?.label_translations
    || option?.localized
    || option?.text
    || option?.label
    || option
  ));

  return {
    id: question.id,
    orderNo: question.order_no ?? question.orderNo ?? 0,
    type: question.type || "mcq",
    text: getLocalizedText(textTranslations, "en", question.question_text || question.text || ""),
    textTranslations,
    options: optionTranslations.map((option, index) => getLocalizedText(option, "en", rawOptions[index]?.text || rawOptions[index]?.label || rawOptions[index] || "")),
    optionTranslations,
    correct: question.correct_option ?? question.correct ?? null,
    marks: Number(question.marks || 0),
    explanation: getLocalizedText(explanationTranslations, "en", question.explanation || ""),
    explanationTranslations,
  };
}

export function normalizeSubmission(submission = {}) {
  return {
    id: submission.id,
    examId: submission.exam_id ?? submission.examId,
    studentId: submission.student_id ?? submission.studentId,
    studentName: submission.student_name ?? submission.studentName ?? "",
    roll: submission.roll_number ?? submission.roll ?? "",
    class: submission.class ?? "",
    answers: submission.answers || {},
    subAnswers: submission.sub_answers || submission.subAnswers || {},
    detailedResults: submission.detailed_results || submission.detailedResults || {},
    mcqScore: Number(submission.mcq_score || submission.mcqScore || 0),
    subScore: Number(submission.sub_score || submission.subScore || 0),
    totalScore: Number(submission.total_score || submission.totalScore || 0),
    grade: submission.grade || null,
    timeTaken: Number(submission.time_taken_minutes || submission.timeTaken || 0),
    status: submission.status || "submitted",
    autoSubmitted: Boolean(submission.auto_submitted || submission.autoSubmitted),
    submittedAt: submission.submitted_at || submission.submittedAt || null,
    rank: submission.rank ? Number(submission.rank) : null,
  };
}

export function normalizeExam(exam = {}) {
  const questions = Array.isArray(exam.questions) ? exam.questions.map(normalizeQuestion) : [];
  const computedTotalMarks = questions.reduce((sum, item) => sum + Number(item.marks || 0), 0);
  const titleTranslations = normalizeLocalizedText(
    exam.title_translations
    || exam.titleTranslations
    || exam.title_localized
    || exam.title
  );
  const instructionsTranslations = normalizeLocalizedText(
    exam.instructions_translations
    || exam.instructionsTranslations
    || exam.instructions_localized
    || exam.instructions
  );

  return {
    id: exam.id,
    title: getLocalizedText(titleTranslations, "en", exam.title || ""),
    titleTranslations,
    subject: exam.subject || "",
    class: exam.class || "",
    duration: Number(exam.duration || 0),
    passMark: Number(exam.pass_mark ?? exam.passMark ?? 0),
    status: exam.status || "draft",
    startTime: exam.start_time || exam.startTime || "",
    endTime: exam.end_time || exam.endTime || "",
    instructions: getLocalizedText(instructionsTranslations, "en", exam.instructions || ""),
    instructionsTranslations,
    totalMarks: Number(exam.total_marks ?? exam.totalMarks ?? computedTotalMarks),
    questionCount: Number(exam.question_count ?? exam.questionCount ?? questions.length),
    submissionCount: Number(exam.submission_count ?? exam.submissionCount ?? 0),
    questions,
    submissionId: exam.submission_id ?? null,
    submissionStatus: exam.submission_status || null,
    submissionScore: exam.total_score ?? null,
    submissionGrade: exam.grade || null,
    studentSubmission: exam.student_submission ? normalizeSubmission(exam.student_submission) : null,
  };
}

function toExamPayload(exam = {}) {
  return {
    title: exam.title,
    subject: exam.subject,
    class: exam.class,
    duration: Number(exam.duration || 0),
    pass_mark: Number(exam.passMark || 0),
    status: exam.status,
    start_time: exam.startTime || null,
    end_time: exam.endTime || null,
    instructions: exam.instructions || "",
  };
}

function toQuestionsPayload(questions = []) {
  return questions.map((question) => ({
    type: question.type,
    text: question.text,
    options: question.options || [],
    correct: question.correct,
    marks: Number(question.marks || 0),
    explanation: question.explanation || "",
  }));
}

export async function getOnlineExams() {
  const response = await api.get("/online-exams");
  return Array.isArray(response.data) ? response.data.map(normalizeExam) : [];
}

export async function getOnlineExamClassOptions() {
  const response = await api.get("/catalog/bootstrap");
  const classes = Array.isArray(response.data?.classes) ? response.data.classes : [];
  return classes
    .filter((item) => item && item.class_name)
    .sort((left, right) => String(left.class_name).localeCompare(String(right.class_name)))
    .map((item) => ({
      id: item.id,
      label: item.class_name,
      status: item.status || "active",
    }));
}

export async function getOnlineExam(examId) {
  const response = await api.get(`/online-exams/${examId}`);
  return normalizeExam(response.data || {});
}

export async function createOnlineExam(exam) {
  const response = await api.post("/online-exams", toExamPayload(exam));
  return normalizeExam(response.data || {});
}

export async function updateOnlineExam(examId, exam) {
  const response = await api.put(`/online-exams/${examId}`, toExamPayload(exam));
  return normalizeExam(response.data || {});
}

export async function deleteOnlineExam(examId) {
  const response = await api.delete(`/online-exams/${examId}`);
  return response.data;
}

export async function saveOnlineExamQuestions(examId, questions) {
  const response = await api.put(`/online-exams/${examId}/questions`, {
    questions: toQuestionsPayload(questions),
  });
  return response.data;
}

export async function submitOnlineExam(examId, payload) {
  const response = await api.post(`/online-exams/${examId}/submit`, payload);
  const data = response.data || {};
  return {
    ...data,
    submission: normalizeSubmission(data.submission || {}),
  };
}

export async function getOnlineExamSubmissions(examId) {
  const response = await api.get(`/online-exams/${examId}/submissions`);
  return Array.isArray(response.data) ? response.data.map(normalizeSubmission) : [];
}

export async function getMyOnlineExamSubmission(examId) {
  const response = await api.get(`/online-exams/${examId}/my-submission`);
  return normalizeSubmission(response.data || {});
}

export async function gradeOnlineExamSubmission(submissionId, payload) {
  const response = await api.patch(`/online-exams/submissions/${submissionId}/grade`, payload);
  return normalizeSubmission(response.data || {});
}
