export type StudentOption = {
  id: number;
  name: string;
  class: string;
  roll_number?: string | null;
  academic_year?: string | null;
  status?: string | null;
};

export type FeeStructureOption = {
  id: number;
  name: string;
  class_name?: string | null;
  academic_year?: string | null;
};

export type AttendanceRow = {
  attendance_id?: number | null;
  student_id: number;
  name: string;
  class: string;
  roll_number?: string | null;
  academic_year?: string | null;
  status: "present" | "absent" | "leave";
  remarks?: string | null;
  attendance_date?: string | null;
  academic_session?: string | null;
};

export type AttendanceFilters = {
  className: string;
  session: string;
  date: string;
  studentId: string;
};
