import { cardStyle, inputStyle } from "./teacherStyles";
import { Button } from "../../../shared/components/Button";
import { Field } from "./TeacherShared";
import type { SalaryPaymentDraft } from "../types/teacherSalary.types";

export function SalaryPaymentModal({
  draft,
  setDraft,
  onClose,
  onSubmit,
  isPending,
}: {
  draft: SalaryPaymentDraft;
  setDraft: React.Dispatch<React.SetStateAction<SalaryPaymentDraft>>;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  if (draft.slipId <= 0) return null;

  return (
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
      onClick={onClose}
    >
      <form
        style={{ ...cardStyle, width: "min(680px, 100%)", maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>Pay Salary</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              Record payment details for {draft.teacherName} and keep the slip ready for printing or sharing later.
            </p>
          </div>
          <Button type="button" variant="secondary" style={{ padding: "10px 14px" }} onClick={onClose}>
            Close
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Teacher</div>
            <div style={{ marginTop: 6, color: "#0f172a", fontSize: 18, fontWeight: 700 }}>{draft.teacherName}</div>
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Salary Month</div>
            <div style={{ marginTop: 6, color: "#0f172a", fontSize: 18, fontWeight: 700 }}>{draft.salaryMonth}</div>
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#f8fafc", gridColumn: "1 / -1" }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Net Salary</div>
            <div style={{ marginTop: 6, color: "#0f172a", fontSize: 24, fontWeight: 800 }}>{draft.netSalary}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          <Field label="Paid Amount">
            <input type="number" min="0" value={draft.paid_amount} onChange={(event) => setDraft((current) => ({ ...current, paid_amount: event.target.value }))} style={inputStyle} required />
          </Field>
          <Field label="Payment Date">
            <input type="date" value={draft.paid_date} onChange={(event) => setDraft((current) => ({ ...current, paid_date: event.target.value }))} style={inputStyle} required />
          </Field>
          <Field label="Payment Mode">
            <select value={draft.payment_mode} onChange={(event) => setDraft((current) => ({ ...current, payment_mode: event.target.value }))} style={inputStyle}>
              <option value="cash">Cash</option>
            </select>
          </Field>
        </div>

        <Field label="Remarks">
          <textarea rows={3} value={draft.remarks} onChange={(event) => setDraft((current) => ({ ...current, remarks: event.target.value }))} style={{ ...inputStyle, resize: "vertical" as const }} />
        </Field>

        <div style={{ display: "flex", gap: 12, marginTop: 18, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Confirm Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
