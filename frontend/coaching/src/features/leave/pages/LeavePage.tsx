import { LeaveRequestList } from "../components/LeaveRequestList";
import { LeaveReviewModal } from "../components/LeaveReviewModal";
import { LEAVE_TYPES, useLeaveData } from "../hooks/useLeaveData";

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
  boxSizing: "border-box" as const,
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

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  color: "#374151",
  fontWeight: 700,
  fontSize: 14,
};

function StatCard({ accent, label, value }: { accent: string; label: string; value: number }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${accent}` }}>
      <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, color: "#0f172a", fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export default function LeavePage() {
  const {
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
  } = useLeaveData();

  return (
    <div style={{ display: "grid", gap: 20 }}>

      {/* Page title */}
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Leave Module</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          {isManager
            ? "Review recent leave activity, focus on pending approvals, and manage both teacher and student requests from one place."
            : "Apply for leave, track your request status, and keep your leave history in one place."}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
        <StatCard label="Total Requests" value={leaveStats.total}    accent="#2563eb" />
        <StatCard label="Pending"        value={leaveStats.pending}  accent="#d97706" />
        <StatCard label="Approved"       value={leaveStats.approved} accent="#059669" />
        <StatCard label="Rejected"       value={leaveStats.rejected} accent="#be123c" />
      </div>

      {message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div>}
      {error   && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}

      <LeaveReviewModal
        reviewDraft={reviewDraft}
        setReviewDraft={setReviewDraft}
        onConfirm={() => {
          setMessage("");
          setError("");
          updateStatusMutation.mutate();
        }}
        isPending={updateStatusMutation.isPending}
      />

      {/* Apply form + Summary/Filters — stacks on mobile */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isManager ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
        alignItems: "start",
      }}>

        {/* Apply Leave form — non-manager only */}
        {!isManager && (
          <form
            style={cardStyle}
            onSubmit={(e) => {
              e.preventDefault();
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

            {/* Applicant Type + Student/Teacher */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <label style={fieldStyle}>
                Applicant Type
                <input
                  value={selfApplicantType === "teacher" ? "Teacher" : "Student"}
                  style={{ ...inputStyle, background: "#f8fafc" }}
                  readOnly
                />
              </label>

              {selfApplicantType === "student" ? (
                <label style={fieldStyle}>
                  Student
                  {linkedStudentId ? (
                    <input
                      value={
                        activeStudents.find((s) => String(s.id) === linkedStudentId)
                          ? `${activeStudents.find((s) => String(s.id) === linkedStudentId)?.name} | ${activeStudents.find((s) => String(s.id) === linkedStudentId)?.class}`
                          : "Linked student account"
                      }
                      style={{ ...inputStyle, background: "#f8fafc" }}
                      readOnly
                    />
                  ) : (
                    <select
                      value={form.student_id}
                      onChange={(e) => setForm((c) => ({ ...c, student_id: e.target.value }))}
                      style={inputStyle}
                      required
                    >
                      <option value="">Select your name</option>
                      {activeStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} | {s.class} | {s.roll_number || "No admission no"}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              ) : (
                <label style={fieldStyle}>
                  Teacher
                  {linkedTeacherId ? (
                    <input
                      value={activeTeachers.find((t) => String(t.id) === linkedTeacherId)?.name || "Linked teacher account"}
                      style={{ ...inputStyle, background: "#f8fafc" }}
                      readOnly
                    />
                  ) : (
                    <select
                      value={form.teacher_id}
                      onChange={(e) => setForm((c) => ({ ...c, teacher_id: e.target.value }))}
                      style={inputStyle}
                      required
                    >
                      <option value="">Select your name</option>
                      {activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </label>
              )}
            </div>

            {/* Leave Type + From + To */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginTop: 14 }}>
              <label style={fieldStyle}>
                Leave Type
                <select
                  value={form.leave_type}
                  onChange={(e) => setForm((c) => ({ ...c, leave_type: e.target.value }))}
                  style={inputStyle}
                >
                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label style={fieldStyle}>
                From Date
                <input
                  type="date"
                  value={form.from_date}
                  onChange={(e) => setForm((c) => ({ ...c, from_date: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </label>
              <label style={fieldStyle}>
                To Date
                <input
                  type="date"
                  value={form.to_date}
                  onChange={(e) => setForm((c) => ({ ...c, to_date: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </label>
            </div>

            {/* Reason */}
            <div style={{ marginTop: 14 }}>
              <label style={fieldStyle}>
                Reason
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={(e) => setForm((c) => ({ ...c, reason: e.target.value }))}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                  placeholder="Add the leave reason here"
                />
              </label>
            </div>

            <div style={{ marginTop: 18 }}>
              <button type="submit" style={buttonStyle} disabled={createLeaveMutation.isPending}>
                {createLeaveMutation.isPending ? "Saving..." : "Save Leave Request"}
              </button>
            </div>
          </form>
        )}

        {/* Summary / Filters card */}
        <section style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0 }}>{isManager ? "Leave Filters" : "My Leave Summary"}</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              {isManager
                ? "Narrow the admin queue by applicant type or approval status."
                : "Choose your profile first so the page shows only your leave requests."}
            </p>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {isManager ? (
              <>
                <label style={fieldStyle}>
                  Applicant Type
                  <select
                    value={filters.applicant_type}
                    onChange={(e) => setFilters((c) => ({ ...c, applicant_type: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="all">All</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </label>
                <label style={fieldStyle}>
                  Status
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label style={fieldStyle}>
                  Request Status
                  <input
                    value={
                      !form.student_id && !form.teacher_id
                        ? "Select your profile to see your leave history"
                        : `${leaveStats.pending} pending | ${leaveStats.approved} approved | ${leaveStats.rejected} rejected`
                    }
                    style={{ ...inputStyle, background: "#f8fafc" }}
                    readOnly
                  />
                </label>
                <label style={fieldStyle}>
                  Current Role
                  <input
                    value={selfApplicantType === "teacher" ? "Teacher Login" : "Student Login"}
                    style={{ ...inputStyle, background: "#f8fafc" }}
                    readOnly
                  />
                </label>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Leave Requests table */}
      <section style={{ ...cardStyle, minWidth: 0, overflow: "hidden" }}>
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
          <LeaveRequestList
            isManager={isManager}
            leaves={visibleLeaves}
            onReview={(leave) => setReviewDraft({ leaveId: leave.id, status: leave.status, review_note: leave.review_note || "" })}
            onApprove={(leave) => setReviewDraft({ leaveId: leave.id, status: "approved", review_note: leave.review_note || "" })}
            onReject={(leave) => setReviewDraft({ leaveId: leave.id, status: "rejected", review_note: leave.review_note || "" })}
            onDelete={(leaveId) => {
              if (!window.confirm("Delete this pending leave request?")) return;
              deleteLeaveMutation.mutate(leaveId);
            }}
          />
        )}
      </section>
    </div>
  );
}