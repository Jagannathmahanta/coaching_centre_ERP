import type { LeaveRequest } from "../types/leave.types";
import { useI18n } from "../../../shared/i18n/I18nProvider";

const secondaryButton = {
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const successButton = {
  background: "#ecfdf5",
  color: "#166534",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButton = {
  background: "#fff1f2",
  color: "#be123c",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export function LeaveRequestList({
  isManager,
  leaves,
  onReview,
  onApprove,
  onReject,
  onDelete,
}: {
  isManager: boolean;
  leaves: LeaveRequest[];
  onReview: (leave: LeaveRequest) => void;
  onApprove: (leave: LeaveRequest) => void;
  onReject: (leave: LeaveRequest) => void;
  onDelete: (leaveId: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {leaves.map((leave) => (
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
                {leave.status === "approved" ? t("leave.approved") : leave.status === "rejected" ? t("leave.rejected") : t("leave.pending")}
              </span>
              <span style={{ color: "#64748b", textTransform: "capitalize" }}>{leave.applicant_type === "teacher" ? t("leave.teacher") : t("leave.student")}</span>
            </div>
            <div style={{ color: "#334155" }}>
              {leave.leave_type} | {new Date(leave.from_date).toLocaleDateString("en-IN")} {t("holiday.to")} {new Date(leave.to_date).toLocaleDateString("en-IN")} | {leave.total_days > 1 ? t("leave.days", { count: leave.total_days }) : t("leave.day", { count: leave.total_days })}
            </div>
            {(leave.student_class || leave.roll_number) && (
              <div style={{ color: "#64748b" }}>
                {leave.student_class ? `${t("leave.classLabel")}: ${leave.student_class}` : ""}{leave.student_class && leave.roll_number ? " | " : ""}{leave.roll_number ? `${t("leave.admissionNo")}: ${leave.roll_number}` : ""}
              </div>
            )}
            {leave.reason && <div style={{ color: "#475569" }}>{leave.reason}</div>}
            {(leave.reviewed_by_name || leave.review_note) && (
              <div style={{ color: "#64748b" }}>
                {t("leave.reviewedBy", { name: leave.reviewed_by_name || "admin" })}{leave.reviewed_at ? ` ${t("leave.reviewedOn", { date: new Date(leave.reviewed_at).toLocaleDateString("en-IN") })}` : ""}{leave.review_note ? ` | ${leave.review_note}` : ""}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {isManager && (
              <>
                <button type="button" style={secondaryButton} onClick={() => onReview(leave)}>{t("leave.review")}</button>
                {leave.status === "pending" && (
                  <>
                    <button type="button" style={successButton} onClick={() => onApprove(leave)}>{t("leave.approve")}</button>
                    <button type="button" style={dangerButton} onClick={() => onReject(leave)}>{t("leave.reject")}</button>
                    <button type="button" style={dangerButton} onClick={() => onDelete(leave.id)}>{t("leave.delete")}</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      ))}
      {leaves.length === 0 && <div style={{ color: "#6b7280" }}>{t("leave.noRequests")}</div>}
    </div>
  );
}
