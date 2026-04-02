// features/dashboard/services/dashboard.service.ts

import api from "../../../shared/services/api";
import type { DashboardResponse, ParentDashboardResponse, StudentDashboardResponse, TeacherDashboardResponse } from "../types/dashboard.types";


export const getDashboard = async (): Promise<DashboardResponse> => {
  const res = await api.get("/dashboard");
  return res.data;
};

export const getTeacherDashboard = async (): Promise<TeacherDashboardResponse> => {
  const res = await api.get("/dashboard/teacher");
  return res.data;
};

export const getStudentDashboard = async (): Promise<StudentDashboardResponse> => {
  const res = await api.get("/dashboard/student");
  return res.data;
};

export const getParentDashboard = async (): Promise<ParentDashboardResponse> => {
  const res = await api.get("/dashboard/parent");
  return res.data;
};

export const teacherCheckIn = async (payload: { latitude: number; longitude: number }) => {
  const res = await api.post("/dashboard/teacher/check-in", payload);
  return res.data;
};

export const teacherCheckOut = async (payload: { latitude: number; longitude: number }) => {
  const res = await api.post("/dashboard/teacher/check-out", payload);
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
