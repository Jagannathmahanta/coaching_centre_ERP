// features/dashboard/services/dashboard.service.ts

import api from "../../../shared/services/api";
import type { DashboardResponse } from "../types/dashboard.types";


export const getDashboard = async (): Promise<DashboardResponse> => {
  const res = await api.get("/dashboard");
  return res.data;
};

export const downloadResultData = async (examId: number) => {
  const [examRes, resultRes] = await Promise.all([
    api.get(`/exams/${examId}/roster`),
    api.get(`/exams/${examId}/results`),
  ]);

  return {
    exam: examRes.data?.exam,
    roster: examRes.data?.students || [],
    results: resultRes.data || [],
  };
};