import api from "../../../shared/services/api";
import type { CatalogBootstrap } from "../../../shared/types/catalog";
import type {
  AdjustmentDraftState,
  DefinitionFormState,
  FeePaymentRecord,
  FeeSummary,
  Installment,
  StudentFeeResponse,
} from "../types/fees.types";

export async function getFeeStructures() {
  const response = await api.get("/fees/structures");
  return response.data || [];
}

export async function getFeeCatalogOptions(): Promise<CatalogBootstrap> {
  const response = await api.get("/catalog/bootstrap");
  return response.data || { classes: [], courses: [], batches: [] };
}

export async function getStudents() {
  const response = await api.get("/students");
  return response.data || [];
}

export async function getFeeSummary(scope: "current_month" | "all", month: string): Promise<FeeSummary | null> {
  const response = await api.get("/fees/summary", { params: { scope, month } });
  return response.data || null;
}

export async function getCollectionBoard(month: string) {
  const response = await api.get("/fees/board", { params: { month } });
  return response.data || null;
}

export async function getStudentFeeDetails(studentId: string): Promise<StudentFeeResponse | null> {
  const response = await api.get(`/fees/student/${studentId}`);
  return response.data || null;
}

export async function getStudentPaymentHistory(studentId: string): Promise<FeePaymentRecord[]> {
  const response = await api.get(`/fees/student/${studentId}/payments`);
  return response.data || [];
}

export async function saveFeeDefinition(editingStructureId: number | null, form: DefinitionFormState) {
  const payload = {
    name: form.name,
    program_type: form.program_type,
    board: form.program_type === "academic" ? form.board : undefined,
    class_id: form.program_type === "academic" && form.class_id ? Number(form.class_id) : undefined,
    course_id: form.program_type === "non_academic" && form.course_id ? Number(form.course_id) : undefined,
    batch_id: form.batch_id ? Number(form.batch_id) : undefined,
    academic_year: form.program_type === "academic" ? form.academic_year : undefined,
    duration_months: Number(form.duration_months),
    session_start_month: form.program_type === "academic" ? Number(form.session_start_month) : undefined,
    session_end_month: form.program_type === "academic" ? Number(form.session_end_month) : undefined,
    tuition_total: Number(form.tuition_total),
    hostel_total: Number(form.hostel_total || 0),
    transport_total: Number(form.transport_total || 0),
    description: form.description,
  };

  if (editingStructureId) {
    const response = await api.patch(`/fees/structures/${editingStructureId}`, payload);
    return response.data;
  }

  const response = await api.post("/fees/structures", payload);
  return response.data;
}

export async function deleteFeeDefinition(definitionId: number) {
  const response = await api.delete(`/fees/structures/${definitionId}`);
  return response.data;
}

export async function updateStudentPlan(studentId: string, planForm: {
  fee_structure_id: string;
  billing_cycle: string;
  due_day: string;
  include_hostel: boolean;
  include_transport: boolean;
}) {
  const response = await api.patch(`/fees/student/${studentId}/plan`, {
    fee_structure_id: Number(planForm.fee_structure_id),
    billing_cycle: planForm.billing_cycle,
    due_day: Number(planForm.due_day),
    include_hostel: planForm.include_hostel,
    include_transport: planForm.include_transport,
  });
  return response.data;
}

export async function applyStudentPayment(studentId: string, amount: number, mode: "adjust_pending" | "store_as_advance") {
  const response = await api.post(`/fees/students/${studentId}/pay`, {
    amount,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: "cash",
    student_payment_mode: mode,
  });
  return response.data;
}

export async function updateInstallmentAdjustments(installmentId: number, draft: AdjustmentDraftState[number]) {
  const response = await api.patch(`/fees/${installmentId}/adjust`, {
    late_fee_amount: Number(draft.late_fee_amount || 0),
    discount_amount: Number(draft.discount_amount || 0),
    waived_amount: Number(draft.waived_amount || 0),
  });
  return response.data;
}

export async function payInstallment(installmentId: number, payload: {
  amount: number;
  tuition_amount: number;
  hostel_amount: number;
  transport_amount: number;
  adjustment_amount: number;
}) {
  const response = await api.patch(`/fees/${installmentId}/pay`, {
    ...payload,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: "cash",
  });
  return response.data;
}

export async function useAdvanceOnInstallment(installmentId: number) {
  const response = await api.post(`/fees/${installmentId}/use-advance`);
  return response.data;
}

export function currency(value: string | number | null | undefined) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

export function getRemainingByHead(installment: Installment, getAdjustmentPreview: (installment: Installment) => { lateFee: number; discount: number; waived: number; adjustedTotal: number; balance: number }) {
  let tuition = Math.max(0, Number(installment.tuition_amount) - Number(installment.paid_tuition_amount || 0));
  let hostel = Math.max(0, Number(installment.hostel_amount) - Number(installment.paid_hostel_amount || 0));
  let transport = Math.max(0, Number(installment.transport_amount) - Number(installment.paid_transport_amount || 0));

  const adjustmentPreview = getAdjustmentPreview(installment);
  let concessionLeft = Math.max(0, adjustmentPreview.discount + adjustmentPreview.waived);

  if (concessionLeft > 0) {
    const tuitionReduction = Math.min(concessionLeft, tuition);
    tuition -= tuitionReduction;
    concessionLeft -= tuitionReduction;
  }
  if (concessionLeft > 0) {
    const hostelReduction = Math.min(concessionLeft, hostel);
    hostel -= hostelReduction;
    concessionLeft -= hostelReduction;
  }
  if (concessionLeft > 0) {
    const transportReduction = Math.min(concessionLeft, transport);
    transport -= transportReduction;
  }

  const adjustment = Math.max(0, adjustmentPreview.lateFee - Number(installment.paid_adjustment_amount || 0));
  return { tuition, hostel, transport, adjustment };
}
