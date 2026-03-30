import { BreakdownCard, cardStyle, Metric, SummaryCard } from "./FeesShared";
import { currency } from "../services/fees.service";
import type { CollectionBoard, FeeSummary } from "../types/fees.types";

export function FeeSummarySection({
  summary,
  summaryScope,
  setSummaryScope,
  summaryMonth,
  setSummaryMonth,
  board,
}: {
  summary: FeeSummary | null;
  summaryScope: "current_month" | "all";
  setSummaryScope: (value: "current_month" | "all") => void;
  summaryMonth: string;
  setSummaryMonth: (value: string) => void;
  board: CollectionBoard | null;
}) {
  if (!summary) return null;

  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setSummaryScope("current_month")} style={pillStyle(summaryScope === "current_month")}>
          Current Month
        </button>
        <button type="button" onClick={() => setSummaryScope("all")} style={pillStyle(summaryScope === "all")}>
          Overall
        </button>
        {summaryScope === "current_month" && (
          <div style={{ minWidth: 180 }}>
            <input type="month" value={summaryMonth} onChange={(e) => setSummaryMonth(e.target.value)} style={monthInputStyle} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <SummaryCard label={`${summary.label} Billed`} value={currency(summary.total_billed)} tone="#1d4ed8" />
        <SummaryCard label={`${summary.label} Collected`} value={currency(summary.total_collected)} tone="#15803d" />
        <SummaryCard label={`${summary.label} Pending`} value={currency(summary.total_pending)} tone="#b45309" />
      </div>

      <div style={{ ...cardStyle, paddingTop: 16, paddingBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Fee Head Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <BreakdownCard title="Tuition" billed={summary.tuition_billed} paid={summary.tuition_paid} pending={summary.tuition_pending} accent="#1d4ed8" />
          <BreakdownCard title="Hostel" billed={summary.hostel_billed} paid={summary.hostel_paid} pending={summary.hostel_pending} accent="#7c3aed" />
          <BreakdownCard title="Transport" billed={summary.transport_billed} paid={summary.transport_paid} pending={summary.transport_pending} accent="#0f766e" />
        </div>
      </div>

      {board && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Month-End Collection Board</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <Metric label="Overdue Count" value={String(board.stats.overdue_count || 0)} />
            <Metric label="Current Month Count" value={String(board.stats.current_month_count || 0)} />
            <Metric label="Overdue Amount" value={currency(board.stats.overdue_amount)} />
            <Metric label="Current Month Amount" value={currency(board.stats.current_month_amount)} />
          </div>
          <div style={{ marginTop: 14, color: "#64748b", fontWeight: 600 }}>Reminder marked this month: {board.stats.reminded_count || 0}</div>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {board.pending_installments.length === 0 ? (
              <div style={{ color: "#6b7280" }}>No current or overdue pending installments for this month.</div>
            ) : (
              board.pending_installments.map((item) => (
                <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                  <strong>{item.student_name}</strong> • {item.class} • {item.installment_label}
                  <div style={{ color: "#64748b", marginTop: 4 }}>
                    Due {new Date(item.due_date).toLocaleDateString()} • Pending {currency(item.balance)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

function pillStyle(active: boolean) {
  return {
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#1f2937",
    border: "1px solid #cbd5e1",
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 700,
    cursor: "pointer",
  };
}

const monthInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  marginTop: 6,
};
