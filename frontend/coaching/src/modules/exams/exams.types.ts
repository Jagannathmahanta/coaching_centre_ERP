export type Exam = {
  id: number;
  exam_name: string;
  exam_type: string;
  subject: string;
  class: string;
  board?: string | null;
  academic_year?: string | null;
  exam_date: string;
  time?: string | null;
  duration?: string | null;
  max_marks?: number | string | null;
  pass_marks?: number | string | null;
  examiner?: string | null;
  hall?: string | null;
  notes?: string | null;
  results_count?: number | string;
};

export type RosterRow = {
  student_id: number;
  student_name: string;
  roll_number?: string | null;
  class: string;
  board?: string | null;
  academic_year?: string | null;
  result_id?: number | null;
  status?: string | null;
  marks_obtained?: number | string | null;
  grade?: string | null;
  rank?: number | string | null;
  remarks?: string | null;
};

export type ResultDraft = {
  status: string;
  marks_obtained: string;
  grade: string;
  rank: string;
  remarks: string;
};

export type FeeStructureOption = {
  id: number;
  name: string;
  class_name?: string | null;
  course_name?: string | null;
  board?: string | null;
  academic_year?: string | null;
};

export type ExamFormState = {
  exam_name: string;
  exam_type: string;
  subject: string;
  class: string;
  board: string;
  academic_year: string;
  exam_date: string;
  time: string;
  duration: string;
  max_marks: string;
  pass_marks: string;
  examiner: string;
  hall: string;
  notes: string;
};
