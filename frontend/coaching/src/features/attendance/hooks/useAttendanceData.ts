import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/hooks/AuthContext";
import {
  getAttendanceHistory,
  getAttendanceRoster,
  getAttendanceStudents,
  getAttendanceStructures,
  saveAttendance,
} from "../services/attendance.service";
import type { AttendanceFilters, AttendanceRow } from "../types/attendance.types";

export function useAttendanceData(defaultDate: string) {
  const { profile } = useAuth();
  const role = String(profile?.role || "admin").toLowerCase();
  const canEdit = ["admin", "staff", "teacher"].includes(role);
  const isStudent = role === "student";
  const linkedStudentId = profile?.student_id ? String(profile.student_id) : "";
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AttendanceFilters>({
    className: "",
    session: "",
    date: defaultDate,
    studentId: linkedStudentId,
  });
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["attendance-students"],
    queryFn: getAttendanceStudents,
  });

  const structuresQuery = useQuery({
    queryKey: ["attendance-structures"],
    queryFn: getAttendanceStructures,
  });

  const rosterQuery = useQuery({
    queryKey: ["attendance-roster", filters.className, filters.session, filters.date, filters.studentId, isStudent],
    enabled: isStudent ? Boolean(filters.studentId) : Boolean(filters.className),
    queryFn: () => getAttendanceRoster(filters, isStudent),
  });

  const historyQuery = useQuery({
    queryKey: ["attendance-history", filters.className, filters.session, filters.studentId, isStudent],
    enabled: isStudent ? Boolean(filters.studentId) : false,
    queryFn: () => getAttendanceHistory(filters),
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: () => saveAttendance(filters, rows),
    onSuccess: async (response) => {
      setMessage(`Attendance saved for ${response?.saved_count || rows.length} students.`);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["attendance-roster"] });
      await queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to save attendance.");
      setMessage("");
    },
  });

  useEffect(() => {
    setRows((rosterQuery.data || []).map((row) => ({ ...row })));
  }, [rosterQuery.data]);

  const classOptions = useMemo(() => {
    const values = new Set<string>();
    for (const student of studentsQuery.data || []) {
      if (student.class) values.add(student.class);
    }
    for (const structure of structuresQuery.data || []) {
      if (structure.class_name) values.add(structure.class_name);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [studentsQuery.data, structuresQuery.data]);

  const sessionOptions = useMemo(() => {
    const values = new Set<string>();
    for (const student of studentsQuery.data || []) {
      if (student.academic_year) values.add(student.academic_year);
    }
    for (const structure of structuresQuery.data || []) {
      if (structure.academic_year) values.add(structure.academic_year);
    }
    return Array.from(values).sort((left, right) => right.localeCompare(left));
  }, [studentsQuery.data, structuresQuery.data]);

  const filteredStudents = useMemo(() => {
    const activeStudents = (studentsQuery.data || []).filter((student) => (student.status || "active") === "active");
    if (isStudent) return activeStudents;
    return activeStudents.filter((student) => {
      const classOk = !filters.className || student.class === filters.className;
      const sessionOk = !filters.session || !student.academic_year || student.academic_year === filters.session;
      return classOk && sessionOk;
    });
  }, [filters.className, filters.session, isStudent, studentsQuery.data]);

  const stats = useMemo(() => {
    const source = isStudent ? (historyQuery.data || rosterQuery.data || []) : rows;
    return {
      total: source.length,
      present: source.filter((item) => item.status === "present").length,
      absent: source.filter((item) => item.status === "absent").length,
      leave: source.filter((item) => item.status === "leave").length,
    };
  }, [historyQuery.data, isStudent, rosterQuery.data, rows]);

  return {
    canEdit,
    isStudent,
    linkedStudentId,
    filters,
    setFilters,
    rows,
    setRows,
    message,
    error,
    setMessage,
    setError,
    classOptions,
    sessionOptions,
    filteredStudents,
    rosterQuery,
    historyQuery,
    saveAttendanceMutation,
    stats,
  };
}
