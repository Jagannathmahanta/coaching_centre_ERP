export type FeeDefinition = {
  id: number;
  name: string;
  program_type: "academic" | "course";
  description?: string | null;
  board?: string | null;
  class_name?: string | null;
  course_name?: string | null;
  academic_year?: string | null;
  duration_months: number;
  session_start_month?: number | null;
  session_end_month?: number | null;
  tuition_total: string | number;
  hostel_total: string | number;
  transport_total: string | number;
  monthly_tuition_fee: string | number;
  monthly_hostel_fee: string | number;
  monthly_transport_fee: string | number;
};

export type Student = {
  id: number;
  name: string;
  class: string;
  roll_number?: string | null;
  board?: string | null;
  academic_year?: string | null;
  fee_definition_name?: string | null;
};

export type Installment = {
  id: number;
  installment_label: string;
  total_amount: string | number;
  late_fee_amount?: string | number;
  discount_amount?: string | number;
  waived_amount?: string | number;
  tuition_amount: string | number;
  hostel_amount: string | number;
  transport_amount: string | number;
  paid_amount: string | number;
  paid_tuition_amount?: string | number;
  paid_hostel_amount?: string | number;
  paid_transport_amount?: string | number;
  paid_adjustment_amount?: string | number;
  balance: string | number;
  status: string;
  due_date: string;
  last_payment_date?: string | null;
  months_covered: number;
};

export type FeeSummary = {
  label?: string;
  total_billed: string | number;
  total_collected?: string | number;
  total_paid?: string | number;
  total_pending: string | number;
  tuition_billed: string | number;
  tuition_collected?: string | number;
  tuition_paid?: string | number;
  tuition_pending: string | number;
  hostel_billed: string | number;
  hostel_collected?: string | number;
  hostel_paid?: string | number;
  hostel_pending: string | number;
  transport_billed: string | number;
  transport_collected?: string | number;
  transport_paid?: string | number;
  transport_pending: string | number;
};

export type StudentFeeResponse = {
  profile: any;
  summary: FeeSummary;
  installments: Installment[];
};

export type FeePaymentRecord = {
  id: number;
  fee_id?: number | null;
  amount: string | number;
  advance_amount?: string | number;
  tuition_amount?: string | number;
  hostel_amount?: string | number;
  transport_amount?: string | number;
  adjustment_amount?: string | number;
  payment_date: string;
  payment_mode?: string | null;
  notes?: string | null;
  installment_label?: string | null;
  billing_cycle?: string | null;
};

export type CollectionBoard = {
  month: string;
  stats: {
    overdue_count: string | number;
    current_month_count: string | number;
    reminded_count: string | number;
    overdue_amount: string | number;
    current_month_amount: string | number;
  };
  pending_installments: Array<{
    id: number;
    student_id: number;
    installment_label: string;
    due_date: string;
    balance: string | number;
    status: string;
    student_name: string;
    class: string;
    fee_definition_name?: string | null;
  }>;
};

export type PaymentDraftState = Record<number, { tuition: string; hostel: string; transport: string; adjustment: string }>;
export type AdjustmentDraftState = Record<number, { late_fee_amount: string; discount_amount: string; waived_amount: string }>;

export type PlanFormState = {
  fee_structure_id: string;
  billing_cycle: string;
  due_day: string;
  include_hostel: boolean;
  include_transport: boolean;
};

export type DefinitionFormState = {
  name: string;
  program_type: string;
  board: string;
  class_name: string;
  course_name: string;
  academic_year: string;
  duration_months: string;
  session_start_month: string;
  session_end_month: string;
  tuition_total: string;
  hostel_total: string;
  transport_total: string;
  description: string;
};

export const boardOptions = ["CBSE", "State Board", "ICSE", "Other"];
export const defaultMonth = new Date().toISOString().slice(0, 7);

export const emptyFeeSummary: FeeSummary = {
  total_billed: 0,
  total_collected: 0,
  total_paid: 0,
  total_pending: 0,
  tuition_billed: 0,
  tuition_collected: 0,
  tuition_paid: 0,
  tuition_pending: 0,
  hostel_billed: 0,
  hostel_collected: 0,
  hostel_paid: 0,
  hostel_pending: 0,
  transport_billed: 0,
  transport_collected: 0,
  transport_paid: 0,
  transport_pending: 0,
};

export const initialPlanForm: PlanFormState = {
  fee_structure_id: "",
  billing_cycle: "monthly",
  due_day: "5",
  include_hostel: false,
  include_transport: false,
};

export const initialDefinitionForm: DefinitionFormState = {
  name: "Class X CBSE",
  program_type: "academic",
  board: "CBSE",
  class_name: "Class X",
  course_name: "",
  academic_year: "2026-2027",
  duration_months: "12",
  session_start_month: "3",
  session_end_month: "2",
  tuition_total: "24000",
  hostel_total: "18000",
  transport_total: "18000",
  description: "Academic session fee definition",
};
