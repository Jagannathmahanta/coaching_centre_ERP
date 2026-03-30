import type { ExamFormState } from "../types/exams.types";

export const examTypeOptions = [
  { value: "monthly_test", label: "Monthly Test" },
  { value: "unit_test", label: "Unit Test" },
  { value: "weekly_test", label: "Weekly Test" },
  { value: "mid_term", label: "Mid Term" },
  { value: "final_exam", label: "Final Exam" },
  { value: "mock_test", label: "Mock Test" },
];

export const boardOptions = ["CBSE", "State Board", "ICSE", "Course"];

function getDefaultAcademicYear() {
  const today = new Date();
  return today.getMonth() + 1 >= 3
    ? `${today.getFullYear()}-${today.getFullYear() + 1}`
    : `${today.getFullYear() - 1}-${today.getFullYear()}`;
}

export function createInitialExamForm(): ExamFormState {
  return {
    exam_name: "",
    exam_type: "monthly_test",
    subject: "",
    class: "",
    board: "CBSE",
    academic_year: getDefaultAcademicYear(),
    exam_date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    duration: "1 hr",
    max_marks: "100",
    pass_marks: "35",
    examiner: "",
    hall: "",
    notes: "",
  };
}
