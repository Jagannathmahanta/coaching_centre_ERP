export type Teacher = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  qualification?: string | null;
  assigned_subjects?: string[] | null;
  assigned_classes?: string[] | null;
  join_date?: string | null;
  status: string;
  notes?: string | null;
  has_login_account?: boolean;
  login_email?: string | null;
  login_phone?: string | null;
};

export type FeeStructureOption = {
  id: number;
  name: string;
  class_name?: string | null;
  course_name?: string | null;
};

export type ExamOption = {
  id: number;
  class: string;
};

export type TeacherFormState = {
  name: string;
  phone: string;
  email: string;
  gender: string;
  qualification: string;
  assigned_subjects: string[];
  assigned_classes: string[];
  join_date: string;
  status: string;
  notes: string;
  create_login: boolean;
  login_email: string;
  login_phone: string;
  login_password: string;
};

export type TeacherLoginDraft = {
  open: boolean;
  teacherId: number;
  teacherName: string;
  email: string;
  phone: string;
  password: string;
};

export type TeacherStat = {
  total: number;
  active: number;
  classes: number;
  subjects: number;
};

export const SUBJECT_OPTIONS = [
  "Mathematics",
  "Science",
  "English",
  "Social Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Computer",
  "Hindi",
  "Odia",
  "Sanskrit",
];

export const initialTeacherForm: TeacherFormState = {
  name: "",
  phone: "",
  email: "",
  gender: "male",
  qualification: "",
  assigned_subjects: [],
  assigned_classes: [],
  join_date: new Date().toISOString().slice(0, 10),
  status: "active",
  notes: "",
  create_login: false,
  login_email: "",
  login_phone: "",
  login_password: "",
};

export const initialTeacherLoginDraft: TeacherLoginDraft = {
  open: false,
  teacherId: 0,
  teacherName: "",
  email: "",
  phone: "",
  password: "",
};
