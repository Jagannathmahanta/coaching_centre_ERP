
export type DashboardStatBlock = {
  total_students: number;
  active_students: number;
  total_teachers: number;
  active_teachers: number;
  checked_in_teachers_today: number;
  checked_out_teachers_today: number;
  teachers_on_duty_now: number;
  collected_this_month: number;
  pending_this_month: number;
  pending_fee_count: number;
  upcoming_exam_count: number;
  recent_result_count: number;
  active_notice_count: number;
  holiday_notice_count: number;
};

export type NoticeItem = {
  id: number;
  title: string;
  content: string;
  priority?: string | null;
  created_at: string;
};

export type HolidayItem = {
  id: number;
  title: string;
  content: string;
  start_date: string;
  end_date: string;
};

export type ExamItem = {
  id: number;
  exam_name: string;
  subject: string;
  class: string;
  board?: string | null;
  exam_date: string;
  time?: string | null;
};

export type RecentResultItem = {
  exam_id: number;
  exam_name: string;
  subject: string;
  class: string;
  last_result_at?: string | null;
  child_name?: string | null;
};

export type PendingFeeItem = {
  fee_id: number;
  student_name: string;
  class: string;
  roll_number?: string | null;
  installment_label: string;
  due_date: string;
  balance: number;
  status: string;
};

export type MonthlyOverviewItem = {
  month_start: string;
  month_label: string;
  collected_amount: number;
  pending_amount: number;
  new_enrollments: number;
};

export type AttendancePeriodStats = {
  present_count: number;
  absent_count: number;
  leave_count: number;
  total_marked: number;
  present_percentage: number;
};

export type AttendanceComparison = {
  this_month: AttendancePeriodStats;
  last_month: AttendancePeriodStats;
};

export type TodayAttendance = {
  present_count: number;
  absent_count: number;
  leave_count: number;
  total_marked: number;
  present_percentage: number;
};

export type DistributionItem = {
  label: string;
  value: number;
};

export type AdmissionsComparison = {
  this_month: number;
  last_month: number;
  change_percent: number;
};

export type DashboardAnalytics = {
  monthly_overview: MonthlyOverviewItem[];
  admissions_comparison: AdmissionsComparison;
  attendance_comparison: AttendanceComparison;
  today_attendance: TodayAttendance;
  class_wise_students: DistributionItem[];
  course_wise_students: DistributionItem[];
};

export type DashboardResponse = {
  tenant?: {
    id: number;
    name: string;
    slug: string;
    city?: string | null;
    status: string;
    plan?: string | null;
    created_at: string;
  } | null;
  stats: DashboardStatBlock;
  recent_notices: NoticeItem[];
  upcoming_exams: ExamItem[];
  recent_results: RecentResultItem[];
  upcoming_holidays: HolidayItem[];
  teacher_attendance_today: Array<{
    id: number;
    teacher_id: number;
    teacher_name: string;
    attendance_date: string;
    check_in_at?: string | null;
    check_out_at?: string | null;
    total_minutes: number;
    status: string;
  }>;
  pending_fees: PendingFeeItem[];
  analytics: DashboardAnalytics;
};

export type PlatformCenterItem = {
  id: number;
  name: string;
  slug: string;
  city?: string | null;
  status: string;
  plan?: string | null;
  created_at: string;
  admin_count: number;
  student_count: number;
  active_teacher_count: number;
};

export type PlatformCentersResponse = {
  centers: PlatformCenterItem[];
};

export type TeacherTodaySession = {
  id: number;
  attendance_date: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  check_in_latitude?: string | number | null;
  check_in_longitude?: string | number | null;
  check_out_latitude?: string | number | null;
  check_out_longitude?: string | number | null;
  total_minutes: number;
  status: "checked_in" | "checked_out";
};

export type TeacherClassAttendanceItem = {
  label: string;
  present_count: number;
  absent_count: number;
  leave_count: number;
  total_marked: number;
};

export type TeacherDashboardResponse = {
  teacher: {
    id: number;
    name: string;
    qualification?: string | null;
    assigned_classes?: string[] | null;
    assigned_subjects?: string[] | null;
    join_date?: string | null;
    status: string;
  };
  today_attendance: TeacherTodaySession | null;
  stats: {
    assigned_class_count: number;
    total_student_count: number;
    pending_leave_count: number;
    classes_pending_attendance: number;
  };
  analytics: {
    today_attendance: TodayAttendance;
    class_attendance: TeacherClassAttendanceItem[];
  };
  recent_notices: NoticeItem[];
  upcoming_exams: ExamItem[];
  recent_results: RecentResultItem[];
  upcoming_holidays: HolidayItem[];
};

export type StudentDashboardResponse = {
  student: {
    id: number;
    name: string;
    class: string;
    board?: string | null;
    roll_number?: string | null;
    join_date?: string | null;
    status: string;
  };
  stats: {
    pending_amount: number;
    pending_fee_count: number;
    upcoming_exam_count: number;
    recent_result_count: number;
  };
  analytics: {
    today_attendance: TodayAttendance;
    month_attendance: TodayAttendance;
  };
  recent_notices: NoticeItem[];
  upcoming_exams: ExamItem[];
  recent_results: RecentResultItem[];
  upcoming_holidays: HolidayItem[];
  pending_fees: PendingFeeItem[];
};

export type ParentDashboardResponse = {
  parent: {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
  };
  children: Array<{
    id: number;
    name: string;
    class: string;
    roll_number?: string | null;
    status: string;
    join_date?: string | null;
  }>;
  stats: {
    total_children: number;
    active_children: number;
    pending_amount: number;
    pending_fee_count: number;
    upcoming_exam_count: number;
  };
  analytics: {
    today_attendance: TodayAttendance;
  };
  recent_notices: NoticeItem[];
  upcoming_exams: ExamItem[];
  recent_results: RecentResultItem[];
  upcoming_holidays: HolidayItem[];
  pending_fees: PendingFeeItem[];
};
