export type TeacherOption = {
  id: number;
  name: string;
  status: string;
};

export type SalaryStructure = {
  id: number;
  teacher_id: number;
  teacher_name: string;
  pay_type: "monthly" | "per_day" | "per_period";
  basic_amount: number | string;
  ta_amount: number | string;
  da_amount: number | string;
  hra_amount: number | string;
  other_allowance: number | string;
  per_day_rate: number | string;
  per_period_rate: number | string;
  allowed_paid_leaves: number | string;
  status: string;
};

export type SalarySlip = {
  id: number;
  teacher_id: number;
  teacher_name: string;
  salary_month: string;
  pay_type: string;
  working_days: number | string;
  attended_days: number | string;
  periods_taken: number | string;
  paid_leaves_taken: number | string;
  gross_salary: number | string;
  leave_deduction: number | string;
  other_deduction: number | string;
  net_salary: number | string;
  paid_amount?: number | string;
  status: string;
  paid_date?: string | null;
  payment_mode?: string | null;
  remarks?: string | null;
};

export type SalaryStructureForm = {
  teacher_id: string;
  pay_type: "monthly" | "per_day" | "per_period";
  basic_amount: string;
  ta_amount: string;
  da_amount: string;
  hra_amount: string;
  other_allowance: string;
  per_day_rate: string;
  per_period_rate: string;
  allowed_paid_leaves: string;
  status: string;
};

export type SalaryPaymentDraft = {
  slipId: number;
  teacherName: string;
  salaryMonth: string;
  netSalary: string;
  paid_amount: string;
  paid_date: string;
  payment_mode: string;
  remarks: string;
};

export const initialSalaryStructureForm: SalaryStructureForm = {
  teacher_id: "",
  pay_type: "monthly",
  basic_amount: "10000",
  ta_amount: "0",
  da_amount: "0",
  hra_amount: "0",
  other_allowance: "0",
  per_day_rate: "0",
  per_period_rate: "0",
  allowed_paid_leaves: "1",
  status: "active",
};

export const initialSalaryPaymentDraft: SalaryPaymentDraft = {
  slipId: 0,
  teacherName: "",
  salaryMonth: "",
  netSalary: "",
  paid_amount: "",
  paid_date: new Date().toISOString().slice(0, 10),
  payment_mode: "cash",
  remarks: "",
};
