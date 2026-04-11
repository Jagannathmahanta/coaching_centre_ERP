export type Teacher = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  is_staff?: boolean;
  gender?: string | null;
  photo_url?: string | null;
  experience?: string | null;
  qualification?: string | null;
  assigned_subjects?: string[] | null;
  assigned_classes?: string[] | null;
  join_date?: string | null;
  status: string;
  notes?: string | null;
  has_login_account?: boolean;
  login_email?: string | null;
  login_phone?: string | null;
  login_is_staff?: boolean;
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
  is_staff: boolean;
  gender: string;
  photo_url: string;
  photo: File | null;
  experience: string;
  qualification: string;
  assigned_subjects: string[];
  assigned_classes: string[];
  join_date: string;
  status: string;
  notes: string;
};

export type TeacherStat = {
  total: number;
  active: number;
  absentToday: number;
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
  is_staff: false,
  gender: "male",
  photo_url: "",
  photo: null,
  experience: "",
  qualification: "",
  assigned_subjects: [],
  assigned_classes: [],
  join_date: new Date().toISOString().slice(0, 10),
  status: "active",
  notes: "",
};
