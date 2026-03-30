import api from "../../../shared/services/api";
import type {
  SalaryPaymentDraft,
  SalarySlip,
  SalaryStructure,
  SalaryStructureForm,
  TeacherOption,
} from "../types/teacherSalary.types";

export async function getSalaryTeachers(): Promise<TeacherOption[]> {
  const response = await api.get("/teachers");
  return response.data || [];
}

export async function getSalaryStructures(): Promise<SalaryStructure[]> {
  const response = await api.get("/teacher-salary/structures");
  return response.data || [];
}

export async function getSalarySlips(month: string): Promise<SalarySlip[]> {
  const response = await api.get("/teacher-salary/slips", { params: { month: `${month}-01` } });
  return response.data || [];
}

export async function saveSalaryStructure(form: SalaryStructureForm) {
  const response = await api.post("/teacher-salary/structures", form);
  return response.data;
}

export async function generateSalarySlips(month: string) {
  const response = await api.post("/teacher-salary/slips/generate", { month: `${month}-01`, working_days: 30 });
  return response.data;
}

export async function paySalarySlip(draft: SalaryPaymentDraft) {
  const response = await api.patch(`/teacher-salary/slips/${draft.slipId}/pay`, draft);
  return response.data;
}
