import api from "../../../shared/services/api";
import type { LeaveFilters, LeaveFormValues, LeaveRequest, Student, Teacher } from "../types/leave.types";

export async function getLeaveStudents(): Promise<Student[]> {
  const response = await api.get("/students");
  return response.data || [];
}

export async function getLeaveTeachers(): Promise<Teacher[]> {
  const response = await api.get("/teachers");
  return response.data || [];
}

export async function getLeaves(filters: LeaveFilters): Promise<LeaveRequest[]> {
  const response = await api.get("/leaves", {
    params: {
      applicant_type: filters.applicant_type === "all" ? undefined : filters.applicant_type,
      status: filters.status === "all" ? undefined : filters.status,
    },
  });
  return response.data || [];
}

export async function createLeave(payload: LeaveFormValues) {
  const response = await api.post("/leaves", payload);
  return response.data;
}

export async function updateLeaveStatus(leaveId: number, status: string, review_note: string) {
  const response = await api.patch(`/leaves/${leaveId}/status`, { leaveId, status, review_note });
  return response.data;
}

export async function deleteLeave(leaveId: number) {
  const response = await api.delete(`/leaves/${leaveId}`);
  return response.data;
}
