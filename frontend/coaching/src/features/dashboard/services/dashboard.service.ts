// features/dashboard/services/dashboard.service.ts

import api from "../../../shared/services/api";
import type {
  DashboardResponse,
  ParentDashboardResponse,
  PlatformCentersResponse,
  StudentDashboardResponse,
  TeacherDashboardResponse,
} from "../types/dashboard.types";


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

export const getPlatformCenters = async (): Promise<PlatformCentersResponse> => {
  const res = await api.get("/dashboard/platform/centers");
  return res.data;
};

export const impersonateCenter = async (center_id: number) => {
  const res = await api.post("/dashboard/platform/impersonate", { center_id });
  return res.data;
};

export const createPlatformCenter = async (payload: {
  name: string;
  slug: string;
  city: string;
  plan: string;
  admin_name: string;
  admin_email: string;
  admin_phone?: string;
  admin_password: string;
}) => {
  const res = await api.post("/dashboard/platform/centers", payload);
  return res.data;
};

export const updatePlatformCenter = async (
  centerId: number,
  payload: {
    name: string;
    slug: string;
    city: string;
    plan: string;
  },
) => {
  const res = await api.patch(`/dashboard/platform/centers/${centerId}`, payload);
  return res.data;
};

export const updatePlatformCenterStatus = async (centerId: number, status: "active" | "inactive") => {
  const res = await api.patch(`/dashboard/platform/centers/${centerId}/status`, { status });
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
