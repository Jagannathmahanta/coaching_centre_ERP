import type { CatalogBatch, CatalogBootstrap, CatalogClass, CatalogCourse, CatalogProgramType } from "../../../shared/types/catalog";

export type StudentRecord = {
  id: number;
  name: string;
  class: string;
  status?: string;
  left_date?: string | null;
  left_reason?: string | null;
  phone?: string | null;
  email?: string | null;
  roll_number?: string | null;
  join_date?: string | null;
  board?: string | null;
  academic_year?: string | null;
  billing_cycle?: string | null;
  include_hostel?: boolean;
  include_transport?: boolean;
  overdue_count?: number | string;
  current_due_count?: number | string;
  has_login_account?: boolean;
  login_email?: string | null;
  login_phone?: string | null;
};

export type StudentFiltersState = {
  className: string;
  board: string;
  academicYear: string;
  status: string;
};

export type StudentLoginDraft = {
  open: boolean;
  studentId: number;
  studentName: string;
  email: string;
  phone: string;
  password: string;
};

export type FeeDefinition = {
  id: number;
  name: string;
  program_type: CatalogProgramType;
  board?: string | null;
  class_name?: string | null;
  course_name?: string | null;
  class_id?: number | null;
  course_id?: number | null;
  batch_id?: number | null;
  class_label?: string | null;
  course_label?: string | null;
  batch_name?: string | null;
  batch_shift?: string | null;
  batch_start_time?: string | null;
  batch_end_time?: string | null;
  academic_year?: string | null;
  duration_months: number;
  session_start_month?: number | null;
  session_end_month?: number | null;
  admission_total: string | number;
  tuition_total: string | number;
  hostel_total: string | number;
  transport_total: string | number;
};

export type StudentDetail = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  gender?: string | null;
  join_date?: string | null;
  class: string;
  program_type?: CatalogProgramType | null;
  board?: string | null;
  class_id?: number | null;
  course_id?: number | null;
  batch_id?: number | null;
  class_label?: string | null;
  course_label?: string | null;
  batch_name?: string | null;
  batch_shift?: string | null;
  batch_start_time?: string | null;
  batch_end_time?: string | null;
  roll_number?: string | null;
  fee_structure_id?: number | null;
  billing_cycle?: string | null;
  academic_year?: string | null;
  admission_year?: number | null;
  due_day?: number | null;
  include_hostel?: boolean;
  include_transport?: boolean;
  hostel_id?: number | null;
  room_id?: number | null;
  hostel_name?: string | null;
  room_number?: string | null;
  notes?: string | null;
  status?: string | null;
  left_date?: string | null;
  left_reason?: string | null;
};

export type HostelOption = {
  id: number;
  hostel_name: string;
  gender_type: "boys" | "girls";
  status: string;
  vacant_beds?: string | number;
};

export type HostelRoomOption = {
  id: number;
  hostel_id: number;
  room_number: string;
  capacity: number;
  occupied: number;
  vacant_seats?: string | number;
  status: string;
};

export type StudentAdmissionForm = {
  name: string;
  phone: string;
  email: string;
  gender: string;
  status: string;
  left_date: string;
  left_reason: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  join_date: string;
  program_type: CatalogProgramType;
  board: string;
  class_id: string;
  course_id: string;
  batch_id: string;
  admission_year: string;
  fee_structure_id: string;
  class: string;
  billing_cycle: string;
  academic_year: string;
  due_day: string;
  include_hostel: boolean;
  hostel_id: string;
  room_id: string;
  include_transport: boolean;
  notes: string;
};

export type FeePreview = {
  applicableMonths: number;
  installmentCount: number;
  firstInstallmentMonths: number;
  admissionTotal: number;
  tuitionTotal: number;
  hostelTotal: number;
  transportTotal: number;
  grandTotal: number;
  firstInstallmentTotal: number;
};

export type AdmissionBootstrap = {
  definitions: FeeDefinition[];
  hostels: HostelOption[];
  classes: CatalogClass[];
  courses: CatalogCourse[];
  batches: CatalogBatch[];
  student: StudentDetail | null;
};

export const initialStudentFilters: StudentFiltersState = {
  className: "",
  board: "",
  academicYear: "",
  status: "all",
};

export const initialStudentLoginDraft: StudentLoginDraft = {
  open: false,
  studentId: 0,
  studentName: "",
  email: "",
  phone: "",
  password: "",
};

export const initialStudentAdmissionForm: StudentAdmissionForm = {
  name: "",
  phone: "",
  email: "",
  gender: "male",
  status: "active",
  left_date: "",
  left_reason: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  program_type: "academic",
  board: "CBSE",
  class_id: "",
  course_id: "",
  batch_id: "",
  admission_year: String(new Date().getFullYear()),
  join_date: new Date().toISOString().slice(0, 10),
  fee_structure_id: "",
  class: "",
  billing_cycle: "monthly",
  academic_year: "2026-2027",
  due_day: "5",
  include_hostel: false,
  hostel_id: "",
  room_id: "",
  include_transport: false,
  notes: "",
};

export type { CatalogBatch, CatalogBootstrap, CatalogClass, CatalogCourse, CatalogProgramType };

export const cycleLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half Yearly",
  yearly: "Yearly",
  full_package: "Full Package",
};
