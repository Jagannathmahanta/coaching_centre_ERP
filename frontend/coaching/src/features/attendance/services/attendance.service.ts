import api from "../../../shared/services/api";
import type { AttendanceFilters, AttendanceRow, FeeStructureOption, StudentOption } from "../types/attendance.types";

export async function getAttendanceStudents(): Promise<StudentOption[]> {
  const response = await api.get("/students");
  return response.data || [];
}

export async function getAttendanceStructures(): Promise<FeeStructureOption[]> {
  const response = await api.get("/fees/structures");
  return response.data || [];
}

export async function getAttendanceRoster(filters: AttendanceFilters, isStudent: boolean): Promise<AttendanceRow[]> {
  const response = await api.get("/attendance/roster", {
    params: {
      class: isStudent ? undefined : filters.className,
      session: filters.session || undefined,
      date: filters.date,
      student_id: isStudent ? filters.studentId || undefined : undefined,
    },
  });
  return response.data || [];
}

export async function getAttendanceHistory(filters: AttendanceFilters): Promise<AttendanceRow[]> {
  const response = await api.get("/attendance/history", {
    params: {
      class: filters.className || undefined,
      session: filters.session || undefined,
      student_id: filters.studentId || undefined,
      from_date: filters.session ? `${filters.session.slice(0, 4)}-04-01` : undefined,
      to_date: filters.date,
    },
  });
  return response.data || [];
}

export async function saveAttendance(filters: AttendanceFilters, rows: AttendanceRow[]) {
  const response = await api.post("/attendance/save", {
    date: filters.date,
    session: filters.session || "",
    records: rows.map((row) => ({
      student_id: row.student_id,
      status: row.status,
      remarks: row.remarks || "",
    })),
  });
  return response.data;
}
