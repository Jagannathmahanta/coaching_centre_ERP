import type { Exam, ResultDraft, RosterRow } from "./exams.types";

export function toDraft(row: RosterRow): ResultDraft {
  return {
    status: row.status || "present",
    marks_obtained: row.marks_obtained === null || row.marks_obtained === undefined ? "" : String(row.marks_obtained),
    grade: row.grade || "",
    rank: row.rank === null || row.rank === undefined ? "" : String(row.rank),
    remarks: row.remarks || "",
  };
}

export function parseCsvText(text: string) {
  const [headerLine, ...dataLines] = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!headerLine) return [];

  const headers = headerLine.split(",").map((header) => header.trim().toLowerCase());
  return dataLines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] || "";
      return acc;
    }, {});
  });
}

export function formatExamType(examType: string) {
  return examType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapExamToForm(exam: Exam) {
  return {
    exam_name: exam.exam_name,
    exam_type: exam.exam_type,
    subject: exam.subject,
    class: exam.class,
    board: exam.board || "CBSE",
    academic_year: exam.academic_year || "",
    exam_date: exam.exam_date,
    time: exam.time ? exam.time.slice(0, 5) : "",
    duration: exam.duration || "",
    max_marks: String(exam.max_marks || 100),
    pass_marks: String(exam.pass_marks || 35),
    examiner: exam.examiner || "",
    hall: exam.hall || "",
    notes: exam.notes || "",
  };
}

export function toLocaleDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

export function getResultFeedback(status: string | null | undefined, marksObtained: string | number | null | undefined, maxMarks: string | number | null | undefined) {
  if (status === "absent") return "Absent";
  if (status === "excused") return "Excused";

  const secured = Number(marksObtained ?? 0);
  const fullMarks = Number(maxMarks || 100);

  if (!Number.isFinite(secured) || secured <= 0) return "Needs Improvement";
  if (!Number.isFinite(fullMarks) || fullMarks <= 0) return "Needs Improvement";

  const percent = (secured / fullMarks) * 100;

  if (percent >= 85) return "Excellent";
  if (percent >= 70) return "Very Good";
  if (percent >= 50) return "Good";
  if (percent >= 35) return "Average";
  return "Needs Improvement";
}

export function getResultPercentage(marksObtained: string | number | null | undefined, maxMarks: string | number | null | undefined) {
  const secured = Number(marksObtained ?? 0);
  const fullMarks = Number(maxMarks || 100);

  if (!Number.isFinite(secured) || !Number.isFinite(fullMarks) || fullMarks <= 0) {
    return "-";
  }

  return `${((secured / fullMarks) * 100).toFixed(2)}%`;
}

export function getPassFail(
  status: string | null | undefined,
  marksObtained: string | number | null | undefined,
  _maxMarks: string | number | null | undefined,
  passMarks: string | number | null | undefined
) {
  if (status === "absent") return "Absent";
  if (status === "excused") return "Excused";

  const secured = Number(marksObtained ?? 0);
  const passMarkValue = Number(passMarks || 35);

  if (!Number.isFinite(secured) || !Number.isFinite(passMarkValue) || passMarkValue <= 0) {
    return "Fail";
  }

  return secured >= passMarkValue ? "Pass" : "Fail";
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
