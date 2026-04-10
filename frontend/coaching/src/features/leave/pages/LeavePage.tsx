import { LeaveRequestList } from "../components/LeaveRequestList";
import { LeaveReviewModal } from "../components/LeaveReviewModal";
import { LEAVE_TYPES, useLeaveData } from "../hooks/useLeaveData";
import { useI18n } from "../../../shared/i18n/I18nProvider";

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
   background: "#334155",
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
  const { t } = useI18n();
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
        <h1 style={{ margin: 0, fontSize: 28 }}>{t("leave.moduleTitle")}</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          {isManager
            ? t("leave.managerSub")
            : t("leave.selfSub")}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
        <StatCard label={t("leave.totalRequests")} value={leaveStats.total} accent="#2563eb" />
        <StatCard label={t("leave.pending")} value={leaveStats.pending} accent="#d97706" />
        <StatCard label={t("leave.approved")} value={leaveStats.approved} accent="#059669" />
        <StatCard label={t("leave.rejected")} value={leaveStats.rejected} accent="#be123c" />
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
              <h2 style={{ margin: 0 }}>{t("leave.applyLeave")}</h2>
              <p style={{ color: "#6b7280", marginTop: 8 }}>
                {t("leave.applySub")}
              </p>
            </div>

            {/* Applicant Type + Student/Teacher */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <label style={fieldStyle}>
                {t("leave.applicantType")}
                <input
                  value={selfApplicantType === "teacher" ? t("leave.teacher") : t("leave.student")}
                  style={{ ...inputStyle, background: "#f8fafc" }}
                  readOnly
                />
              </label>

              {selfApplicantType === "student" ? (
                <label style={fieldStyle}>
                  {t("leave.student")}
                  {linkedStudentId ? (
                    <input
                      value={
                        activeStudents.find((s) => String(s.id) === linkedStudentId)
                          ? `${activeStudents.find((s) => String(s.id) === linkedStudentId)?.name} | ${activeStudents.find((s) => String(s.id) === linkedStudentId)?.class}`
                          : t("leave.linkedStudentAccount")
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
                      <option value="">{t("leave.selectYourName")}</option>
                      {activeStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} | {s.class} | {s.roll_number || t("leave.noAdmissionNo")}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              ) : (
                <label style={fieldStyle}>
                  {t("leave.teacher")}
                  {linkedTeacherId ? (
                    <input
                      value={activeTeachers.find((t) => String(t.id) === linkedTeacherId)?.name || t("leave.linkedTeacherAccount")}
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
                      <option value="">{t("leave.selectYourName")}</option>
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
                {t("leave.leaveType")}
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
                {t("leave.fromDate")}
                <input
                  type="date"
                  value={form.from_date}
                  onChange={(e) => setForm((c) => ({ ...c, from_date: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </label>
              <label style={fieldStyle}>
                {t("leave.toDate")}
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
                {t("leave.reason")}
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={(e) => setForm((c) => ({ ...c, reason: e.target.value }))}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                  placeholder={t("leave.reasonPlaceholder")}
                />
              </label>
            </div>

            <div style={{ marginTop: 18 }}>
              <button type="submit" style={buttonStyle} disabled={createLeaveMutation.isPending}>
                {createLeaveMutation.isPending ? t("leave.saving") : t("leave.saveRequest")}
              </button>
            </div>
          </form>
        )}

        {/* Summary / Filters card */}
        <section style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0 }}>{isManager ? t("leave.filtersTitle") : t("leave.summaryTitle")}</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              {isManager
                ? t("leave.filtersSub")
                : t("leave.summarySub")}
            </p>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {isManager ? (
              <>
                <label style={fieldStyle}>
                  {t("leave.applicantType")}
                  <select
                    value={filters.applicant_type}
                    onChange={(e) => setFilters((c) => ({ ...c, applicant_type: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="all">{t("notice.all")}</option>
                    <option value="student">{t("leave.student")}</option>
                    <option value="teacher">{t("leave.teacher")}</option>
                  </select>
                </label>
                <label style={fieldStyle}>
                  {t("leave.status")}
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="all">{t("notice.all")}</option>
                    <option value="pending">{t("leave.pending")}</option>
                    <option value="approved">{t("leave.approved")}</option>
                    <option value="rejected">{t("leave.rejected")}</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label style={fieldStyle}>
                  {t("leave.requestStatus")}
                  <input
                    value={
                      !form.student_id && !form.teacher_id
                        ? t("leave.selectProfileHistory")
                        : t("leave.requestStatusSummary", { pending: leaveStats.pending, approved: leaveStats.approved, rejected: leaveStats.rejected })
                    }
                    style={{ ...inputStyle, background: "#f8fafc" }}
                    readOnly
                  />
                </label>
                <label style={fieldStyle}>
                  {t("leave.currentRole")}
                  <input
                    value={selfApplicantType === "teacher" ? t("leave.teacherLogin") : t("leave.studentLogin")}
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
          <h2 style={{ margin: 0 }}>{isManager ? t("leave.requestsTitle") : t("leave.myRequestsTitle")}</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            {isManager
              ? t("leave.requestsSub")
              : t("leave.myRequestsSub")}
          </p>
        </div>

        {leavesQuery.isLoading ? (
          <div>{t("leave.loadingRequests")}</div>
        ) : (
          <LeaveRequestList
            isManager={isManager}
            leaves={visibleLeaves}
            onReview={(leave) => setReviewDraft({ leaveId: leave.id, status: leave.status, review_note: leave.review_note || "" })}
            onApprove={(leave) => setReviewDraft({ leaveId: leave.id, status: "approved", review_note: leave.review_note || "" })}
            onReject={(leave) => setReviewDraft({ leaveId: leave.id, status: "rejected", review_note: leave.review_note || "" })}
            onDelete={(leaveId) => {
              if (!window.confirm(t("leave.deleteConfirm"))) return;
              deleteLeaveMutation.mutate(leaveId);
            }}
          />
        )}
      </section>
    </div>
  );
}
