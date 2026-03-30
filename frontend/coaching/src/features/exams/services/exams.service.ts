import api from "../../../shared/services/api";
import type { Exam, ExamFormState, FeeStructureOption, RosterResponse } from "../types/exams.types";

export async function getExams(): Promise<Exam[]> {
  const response = await api.get("/exams");
  return response.data || [];
}

export async function getFeeStructures(): Promise<FeeStructureOption[]> {
  const response = await api.get("/fees/structures");
  return response.data || [];
}

export async function getExamRoster(examId: number): Promise<RosterResponse> {
  const response = await api.get(`/exams/${examId}/roster`);
  return response.data || { exam: null, students: [] };
}

export async function saveExam(editingExamId: number | null, payload: ExamFormState) {
  if (editingExamId) {
    const response = await api.patch(`/exams/${editingExamId}`, payload);
    return response.data;
  }
  const response = await api.post("/exams", payload);
  return response.data;
}

export async function deleteExam(examId: number) {
  const response = await api.delete(`/exams/${examId}`);
  return response.data;
}

export async function saveExamResults(examId: number, results: Array<Record<string, unknown>>) {
  const response = await api.post(`/exams/${examId}/results/bulk`, { results });
  return response.data;
}
