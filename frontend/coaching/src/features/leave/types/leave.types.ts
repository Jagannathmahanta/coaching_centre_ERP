export type Student = {
  id: number;
  name: string;
  class: string;
  roll_number?: string | null;
  status?: string | null;
};

export type Teacher = {
  id: number;
  name: string;
  status: string;
};

export type LeaveRequest = {
  id: number;
  applicant_type: "student" | "teacher";
  student_id?: number | null;
  teacher_id?: number | null;
  applicant_name: string;
  student_class?: string | null;
  roll_number?: string | null;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason?: string | null;
  status: "pending" | "approved" | "rejected";
  review_note?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
};

export type LeaveFilters = {
  applicant_type: string;
  status: string;
};

export type LeaveFormValues = {
  applicant_type: string;
  student_id: string;
  teacher_id: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
};
