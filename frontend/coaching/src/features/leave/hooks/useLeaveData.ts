import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/hooks/AuthContext";
import { createLeave, deleteLeave, getLeaves, getLeaveStudents, getLeaveTeachers, updateLeaveStatus } from "../services/leave.service";
import type { LeaveFormValues, LeaveRequest } from "../types/leave.types";

export const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Emergency Leave",
  "Personal Leave",
  "Family Function",
  "Exam Leave",
];

const initialForm = (selfApplicantType: string, linkedStudentId: string, linkedTeacherId: string): LeaveFormValues => ({
  applicant_type: selfApplicantType,
  student_id: selfApplicantType === "student" ? linkedStudentId : "",
  teacher_id: selfApplicantType === "teacher" ? linkedTeacherId : "",
  leave_type: LEAVE_TYPES[0],
  from_date: new Date().toISOString().slice(0, 10),
  to_date: new Date().toISOString().slice(0, 10),
  reason: "",
});

export function useLeaveData() {
  const { profile } = useAuth();
  const role = String(profile?.role || "admin").toLowerCase();
  const isManager = role === "admin" || role === "staff";
  const selfApplicantType = role === "teacher" ? "teacher" : "student";
  const linkedStudentId = profile?.student_id ? String(profile.student_id) : "";
  const linkedTeacherId = profile?.teacher_id ? String(profile.teacher_id) : "";
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LeaveFormValues>(initialForm(selfApplicantType, linkedStudentId, linkedTeacherId));
  const [filters, setFilters] = useState({ applicant_type: "all", status: "all" });
  const [reviewDraft, setReviewDraft] = useState({ leaveId: 0, status: "approved", review_note: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const studentsQuery = useQuery({ queryKey: ["leave-students"], queryFn: getLeaveStudents });
  const teachersQuery = useQuery({ queryKey: ["leave-teachers"], queryFn: getLeaveTeachers });
  const leavesQuery = useQuery({ queryKey: ["leaves", filters], queryFn: () => getLeaves(filters) });

  const createLeaveMutation = useMutation({
    mutationFn: () => createLeave(form),
    onSuccess: async () => {
      setMessage("Leave request created.");
      setError("");
      setForm(initialForm(selfApplicantType, linkedStudentId || form.student_id, linkedTeacherId || form.teacher_id));
      await queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to create leave request.");
      setMessage("");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: () => updateLeaveStatus(reviewDraft.leaveId, reviewDraft.status, reviewDraft.review_note),
    onSuccess: async () => {
      setMessage(`Leave request ${reviewDraft.status}.`);
      setError("");
      setReviewDraft({ leaveId: 0, status: "approved", review_note: "" });
      await queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to update leave request.");
      setMessage("");
    },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: deleteLeave,
    onSuccess: async () => {
      setMessage("Leave request deleted.");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to delete leave request.");
      setMessage("");
    },
  });

  const activeStudents = useMemo(
    () => (studentsQuery.data || []).filter((student) => (student.status || "active") === "active"),
    [studentsQuery.data]
  );
  const activeTeachers = useMemo(
    () => (teachersQuery.data || []).filter((teacher) => teacher.status === "active"),
    [teachersQuery.data]
  );

  const visibleLeaves = useMemo(
    () => getVisibleLeaves(leavesQuery.data || [], isManager, selfApplicantType, form.student_id, form.teacher_id),
    [form.student_id, form.teacher_id, isManager, leavesQuery.data, selfApplicantType]
  );

  const leaveStats = useMemo(() => ({
    total: visibleLeaves.length,
    pending: visibleLeaves.filter((item) => item.status === "pending").length,
    approved: visibleLeaves.filter((item) => item.status === "approved").length,
    rejected: visibleLeaves.filter((item) => item.status === "rejected").length,
  }), [visibleLeaves]);

  return {
    isManager,
    selfApplicantType,
    linkedStudentId,
    linkedTeacherId,
    form,
    setForm,
    filters,
    setFilters,
    reviewDraft,
    setReviewDraft,
    message,
    error,
    setMessage,
    setError,
    activeStudents,
    activeTeachers,
    leavesQuery,
    visibleLeaves,
    leaveStats,
    createLeaveMutation,
    updateStatusMutation,
    deleteLeaveMutation,
  };
}

function getVisibleLeaves(
  leaves: LeaveRequest[],
  isManager: boolean,
  selfApplicantType: "student" | "teacher",
  studentId: string,
  teacherId: string
) {
  if (isManager) return leaves;
  if (selfApplicantType === "student") {
    if (!studentId) return [];
    return leaves.filter((leave) => leave.applicant_type === "student" && String(leave.student_id || "") === studentId);
  }
  if (!teacherId) return [];
  return leaves.filter((leave) => leave.applicant_type === "teacher" && String(leave.teacher_id || "") === teacherId);
}
