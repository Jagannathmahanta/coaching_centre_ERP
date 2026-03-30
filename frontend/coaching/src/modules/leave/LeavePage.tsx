import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { getUser } from "../auth/auth";

type Student = {
  id: number;
  name: string;
  class: string;
  roll_number?: string | null;
  status?: string | null;
};

type Teacher = {
  id: number;
  name: string;
  status: string;
};

type LeaveRequest = {
  id: number;
  applicant_type: "student" | "teacher";
  student_id?: number | null;
  teacher_id?: number | null;
  applicant_name: string;
  student_class?: string | null;
  roll_number?: string | null;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason?: string | null;
  status: "pending" | "approved" | "rejected";
  review_note?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
};

const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Emergency Leave",
  "Personal Leave",
  "Family Function",
  "Exam Leave",
];

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
};

const buttonStyle = {
  background: "#1d4ed8",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  ...buttonStyle,
  background: "#eff6ff",
  color: "#1d4ed8",
};

const successButton = {
  ...buttonStyle,
  background: "#ecfdf5",
  color: "#166534",
};

const dangerButton = {
  ...buttonStyle,
  background: "#fff1f2",
  color: "#be123c",
};

const initialForm = {
  applicant_type: "student",
  student_id: "",
  teacher_id: "",
  leave_type: LEAVE_TYPES[0],
  from_date: new Date().toISOString().slice(0, 10),
  to_date: new Date().toISOString().slice(0, 10),
  reason: "",
};

export default function LeavePage() {
  const user = getUser();
  const role = String(user?.role || "admin").toLowerCase();
  const isManager = role === "admin" || role === "staff";
  const selfApplicantType = role === "teacher" ? "teacher" : "student";
  const linkedStudentId = user?.student_id ? String(user.student_id) : "";
  const linkedTeacherId = user?.teacher_id ? String(user.teacher_id) : "";
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    ...initialForm,
    applicant_type: selfApplicantType,
    student_id: selfApplicantType === "student" ? linkedStudentId : "",
    teacher_id: selfApplicantType === "teacher" ? linkedTeacherId : "",
  });
  const [filters, setFilters] = useState({
    applicant_type: "all",
    status: "all",
  });
  const [reviewDraft, setReviewDraft] = useState({
    leaveId: 0,
    status: "approved",
    review_note: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["leave-students"],
    queryFn: async () => {
      const response = await api.get("/students");
      return (response.data || []) as Student[];
    },
  });

  const teachersQuery = useQuery({
    queryKey: ["leave-teachers"],
    queryFn: async () => {
      const response = await api.get("/teachers");
      return (response.data || []) as Teacher[];
    },
  });

  const leavesQuery = useQuery({
    queryKey: ["leaves", filters],
    queryFn: async () => {
      const response = await api.get("/leaves", {
        params: {
          applicant_type: filters.applicant_type === "all" ? undefined : filters.applicant_type,
          status: filters.status === "all" ? undefined : filters.status,
        },
      });
      return (response.data || []) as LeaveRequest[];
    },
  });

  const leaveStats = useMemo(() => {
    const leaves = getVisibleLeaves(leavesQuery.data || [], isManager, selfApplicantType, form.student_id, form.teacher_id);
    return {
      total: leaves.length,
      pending: leaves.filter((item) => item.status === "pending").length,
      approved: leaves.filter((item) => item.status === "approved").length,
      rejected: leaves.filter((item) => item.status === "rejected").length,
    };
  }, [leavesQuery.data]);

  const createLeaveMutation = useMutation({
    mutationFn: async () => api.post("/leaves", form),
    onSuccess: async () => {
      setMessage("Leave request created.");
      setError("");
      setForm((current) => ({
        ...initialForm,
        applicant_type: selfApplicantType,
        student_id: selfApplicantType === "student" ? (linkedStudentId || current.student_id) : "",
        teacher_id: selfApplicantType === "teacher" ? (linkedTeacherId || current.teacher_id) : "",
      }));
      await queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to create leave request.");
      setMessage("");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => api.patch(`/leaves/${reviewDraft.leaveId}/status`, reviewDraft),
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
    mutationFn: async (leaveId: number) => api.delete(`/leaves/${leaveId}`),
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

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Leave Module</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          {isManager
            ? "Review recent leave activity, focus on pending approvals, and manage both teacher and student requests from one place."
            : "Apply for leave, track your request status, and keep your leave history in one place."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <StatCard label="Total Requests" value={leaveStats.total} accent="#2563eb" />
        <StatCard label="Pending" value={leaveStats.pending} accent="#d97706" />
        <StatCard label="Approved" value={leaveStats.approved} accent="#059669" />
        <StatCard label="Rejected" value={leaveStats.rejected} accent="#be123c" />
      </div>

      {message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}

      {reviewDraft.leaveId > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() => setReviewDraft({ leaveId: 0, status: "approved", review_note: "" })}
        >
          <form
            style={{ ...cardStyle, width: "min(560px, 100%)" }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              setMessage("");
              setError("");
              updateStatusMutation.mutate();
            }}
          >
            <h2 style={{ margin: 0 }}>Review Leave</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              Confirm the leave action and keep an internal note if needed.
            </p>

            <Field label="Status">
              <select
                value={reviewDraft.status}
                onChange={(event) => setReviewDraft((current) => ({ ...current, status: event.target.value }))}
                style={inputStyle}
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="pending">Move Back To Pending</option>
              </select>
            </Field>

            <Field label="Review Note">
              <textarea
                rows={3}
                value={reviewDraft.review_note}
                onChange={(event) => setReviewDraft((current) => ({ ...current, review_note: event.target.value }))}
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
              <button type="button" style={secondaryButton} onClick={() => setReviewDraft({ leaveId: 0, status: "approved", review_note: "" })}>
                Cancel
              </button>
              <button type="submit" style={buttonStyle} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? "Saving..." : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isManager ? "1fr" : "1.1fr 0.9fr", gap: 20, alignItems: "start" }}>
        {!isManager && (
          <form
            style={cardStyle}
            onSubmit={(event) => {
              event.preventDefault();
              setMessage("");
              setError("");
              createLeaveMutation.mutate();
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ margin: 0 }}>Apply Leave</h2>
              <p style={{ color: "#6b7280", marginTop: 8 }}>
                Submit your leave request here and track approval from the same page.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              <Field label="Applicant Type">
                <input value={selfApplicantType === "teacher" ? "Teacher" : "Student"} style={{ ...inputStyle, background: "#f8fafc" }} readOnly />
              </Field>

              {selfApplicantType === "student" ? (
                <Field label="Student">
                  {linkedStudentId ? (
                    <input
                      value={
                        activeStudents.find((student) => String(student.id) === linkedStudentId)
                          ? `${activeStudents.find((student) => String(student.id) === linkedStudentId)?.name} | ${activeStudents.find((student) => String(student.id) === linkedStudentId)?.class}`
                          : "Linked student account"
                      }
                      style={{ ...inputStyle, background: "#f8fafc" }}
                      readOnly
                    />
                  ) : (
                    <select value={form.student_id} onChange={(event) => setForm((current) => ({ ...current, student_id: event.target.value }))} style={inputStyle} required>
                      <option value="">Select your name</option>
                      {activeStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} | {student.class} | {student.roll_number || "No admission no"}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : (
                <Field label="Teacher">
                  {linkedTeacherId ? (
                    <input
                      value={activeTeachers.find((teacher) => String(teacher.id) === linkedTeacherId)?.name || "Linked teacher account"}
                      style={{ ...inputStyle, background: "#f8fafc" }}
                      readOnly
                    />
                  ) : (
                    <select value={form.teacher_id} onChange={(event) => setForm((current) => ({ ...current, teacher_id: event.target.value }))} style={inputStyle} required>
                      <option value="">Select your name</option>
                      {activeTeachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Field label="Leave Type">
                <select value={form.leave_type} onChange={(event) => setForm((current) => ({ ...current, leave_type: event.target.value }))} style={inputStyle}>
                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="From Date">
                <input type="date" value={form.from_date} onChange={(event) => setForm((current) => ({ ...current, from_date: event.target.value }))} style={inputStyle} required />
              </Field>
              <Field label="To Date">
                <input type="date" value={form.to_date} onChange={(event) => setForm((current) => ({ ...current, to_date: event.target.value }))} style={inputStyle} required />
              </Field>
            </div>

            <Field label="Reason">
              <textarea
                rows={4}
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                style={{ ...inputStyle, resize: "vertical" as const }}
                placeholder="Add the leave reason here"
              />
            </Field>

            <div style={{ marginTop: 18 }}>
              <button type="submit" style={buttonStyle} disabled={createLeaveMutation.isPending}>
                {createLeaveMutation.isPending ? "Saving..." : "Save Leave Request"}
              </button>
            </div>
          </form>
        )}

        <section style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0 }}>{isManager ? "Leave Filters" : "My Leave Summary"}</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              {isManager
                ? "Narrow the admin queue by applicant type or approval status."
                : "Choose your profile first so the page shows only your leave requests."}
            </p>
          </div>

          {isManager ? (
            <>
              <Field label="Applicant Type">
                <select value={filters.applicant_type} onChange={(event) => setFilters((current) => ({ ...current, applicant_type: event.target.value }))} style={inputStyle}>
                  <option value="all">All</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </Field>

              <Field label="Status">
                <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} style={inputStyle}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>
            </>
          ) : (
            <>
              <Field label="Request Status">
                <input
                  value={
                    !form.student_id && !form.teacher_id
                      ? "Select your profile to see your leave history"
                      : `${leaveStats.pending} pending | ${leaveStats.approved} approved | ${leaveStats.rejected} rejected`
                  }
                  style={{ ...inputStyle, background: "#f8fafc" }}
                  readOnly
                />
              </Field>
              <Field label="Current Role">
                <input value={selfApplicantType === "teacher" ? "Teacher Login" : "Student Login"} style={{ ...inputStyle, background: "#f8fafc" }} readOnly />
              </Field>
            </>
          )}
        </section>
      </div>

      <section style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>{isManager ? "Leave Requests" : "My Leave Requests"}</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            {isManager
              ? "Review recent requests, focus on pending items, and take approval action from one list."
              : "Track your submitted leave requests and see the latest review status here."}
          </p>
        </div>

        {leavesQuery.isLoading ? (
          <div>Loading leave requests...</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {visibleLeaves.map((leave) => (
              <div key={leave.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ color: "#0f172a", fontSize: 18 }}>{leave.applicant_name}</strong>
                    <span style={{
                      display: "inline-flex",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: leave.status === "approved" ? "#ecfdf5" : leave.status === "rejected" ? "#fff1f2" : "#fffbeb",
                      color: leave.status === "approved" ? "#166534" : leave.status === "rejected" ? "#be123c" : "#b45309",
                      fontWeight: 700,
                      fontSize: 12,
                      textTransform: "capitalize",
                    }}>
                      {leave.status}
                    </span>
                    <span style={{ color: "#64748b", textTransform: "capitalize" }}>{leave.applicant_type}</span>
                  </div>
                  <div style={{ color: "#334155" }}>
                    {leave.leave_type} | {new Date(leave.from_date).toLocaleDateString("en-IN")} to {new Date(leave.to_date).toLocaleDateString("en-IN")} | {leave.total_days} day{leave.total_days > 1 ? "s" : ""}
                  </div>
                  {(leave.student_class || leave.roll_number) && (
                    <div style={{ color: "#64748b" }}>
                      {leave.student_class ? `Class: ${leave.student_class}` : ""}{leave.student_class && leave.roll_number ? " | " : ""}{leave.roll_number ? `Admission No: ${leave.roll_number}` : ""}
                    </div>
                  )}
                  {leave.reason && <div style={{ color: "#475569" }}>{leave.reason}</div>}
                  {(leave.reviewed_by_name || leave.review_note) && (
                    <div style={{ color: "#64748b" }}>
                      Reviewed by {leave.reviewed_by_name || "admin"}{leave.reviewed_at ? ` on ${new Date(leave.reviewed_at).toLocaleDateString("en-IN")}` : ""}{leave.review_note ? ` | ${leave.review_note}` : ""}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {isManager && (
                    <>
                      <button
                        type="button"
                        style={secondaryButton}
                        onClick={() => setReviewDraft({ leaveId: leave.id, status: leave.status, review_note: leave.review_note || "" })}
                      >
                        Review
                      </button>
                  {leave.status === "pending" && (
                    <>
                      <button
                        type="button"
                        style={successButton}
                        onClick={() => setReviewDraft({ leaveId: leave.id, status: "approved", review_note: leave.review_note || "" })}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        style={dangerButton}
                        onClick={() => setReviewDraft({ leaveId: leave.id, status: "rejected", review_note: leave.review_note || "" })}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        style={dangerButton}
                        onClick={() => {
                          if (!window.confirm("Delete this pending leave request?")) return;
                          deleteLeaveMutation.mutate(leave.id);
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {visibleLeaves.length === 0 && (
              <div style={{ color: "#6b7280" }}>
                {isManager ? "No leave requests found for the selected filters." : "No leave requests found for the selected profile yet."}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 700, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

function StatCard({ accent, label, value }: { accent: string; label: string; value: number }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${accent}` }}>
      <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, color: "#0f172a", fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
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
