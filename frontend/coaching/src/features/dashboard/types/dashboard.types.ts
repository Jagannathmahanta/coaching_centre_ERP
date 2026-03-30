
export type DashboardStatBlock = {
  total_students: number;
  active_students: number;
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

export type DashboardResponse = {
  stats: DashboardStatBlock;
  recent_notices: NoticeItem[];
  upcoming_exams: ExamItem[];
  recent_results: RecentResultItem[];
  upcoming_holidays: HolidayItem[];
  pending_fees: PendingFeeItem[];
};