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

export function LeaveReviewModal({
  reviewDraft,
  setReviewDraft,
  onConfirm,
  isPending,
}: {
  reviewDraft: { leaveId: number; status: string; review_note: string };
  setReviewDraft: React.Dispatch<React.SetStateAction<{ leaveId: number; status: string; review_note: string }>>;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  if (reviewDraft.leaveId <= 0) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "grid", placeItems: "center", padding: 20, zIndex: 1000 }}
      onClick={() => setReviewDraft({ leaveId: 0, status: "approved", review_note: "" })}
    >
      <form
        style={{ ...cardStyle, width: "min(560px, 100%)" }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <h2 style={{ margin: 0 }}>{t("leave.reviewTitle")}</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>{t("leave.reviewSub")}</p>
        <label style={{ display: "block", color: "#374151", fontWeight: 700, fontSize: 14 }}>
          {t("leave.status")}
          <select value={reviewDraft.status} onChange={(event) => setReviewDraft((current) => ({ ...current, status: event.target.value }))} style={inputStyle}>
            <option value="approved">{t("leave.approve")}</option>
            <option value="rejected">{t("leave.reject")}</option>
            <option value="pending">{t("leave.moveBackToPending")}</option>
          </select>
        </label>
        <label style={{ display: "block", color: "#374151", fontWeight: 700, fontSize: 14 }}>
          {t("leave.reviewNote")}
          <textarea rows={3} value={reviewDraft.review_note} onChange={(event) => setReviewDraft((current) => ({ ...current, review_note: event.target.value }))} style={{ ...inputStyle, resize: "vertical" as const }} />
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
          <button type="button" style={secondaryButton} onClick={() => setReviewDraft({ leaveId: 0, status: "approved", review_note: "" })}>
            {t("leave.cancel")}
          </button>
          <button type="submit" style={buttonStyle} disabled={isPending}>
            {isPending ? t("leave.saving") : t("leave.confirm")}
          </button>
        </div>
      </form>
    </div>
  );
}
import { useI18n } from "../../../shared/i18n/I18nProvider";
