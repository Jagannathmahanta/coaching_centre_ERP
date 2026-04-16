import { Button } from "../../../shared/components/Button";
import type { SalarySlip } from "../types/teacherSalary.types";

export function SalarySlipList({
  slips,
  loading,
  currency,
  onPay,
  onPrint,
}: {
  slips: SalarySlip[];
  loading: boolean;
  currency: (value: number | string | null | undefined) => string;
  onPay: (slip: SalarySlip) => void;
  onPrint: (slip: SalarySlip) => void;
}) {
  if (loading) return <div>Loading salary slips...</div>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {slips.map((slip) => (
        <div key={slip.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <strong style={{ color: "#0f172a", fontSize: 18 }}>{slip.teacher_name}</strong>
              <span
                style={{
                  display: "inline-flex",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: slip.status === "paid" ? "#ecfdf5" : "#fffbeb",
                  color: slip.status === "paid" ? "#166534" : "#b45309",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {slip.status}
              </span>
            </div>
            <div style={{ color: "#64748b" }}>{slip.pay_type} | {new Date(slip.salary_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
            <div style={{ color: "#334155" }}>
              Gross: {currency(slip.gross_salary)} | Leave Deduction: {currency(slip.leave_deduction)} | Net: {currency(slip.net_salary)}
            </div>
            <div style={{ color: "#64748b" }}>
              Working Days: {slip.working_days} | Attended: {slip.attended_days} | Periods: {slip.periods_taken} | Paid Leaves Used: {slip.paid_leaves_taken}
            </div>
            {slip.status === "paid" && (
              <div style={{ color: "#64748b" }}>
                Paid {currency(slip.paid_amount || slip.net_salary)} on {slip.paid_date ? new Date(slip.paid_date).toLocaleDateString("en-IN") : "-"} by {slip.payment_mode || "cash"}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {slip.status !== "paid" && (
              <Button type="button" onClick={() => onPay(slip)}>
                Pay
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => onPrint(slip)}>
              Print Slip
            </Button>
          </div>
        </div>
      ))}
      {slips.length === 0 && <div style={{ color: "#6b7280" }}>No salary slips generated for this month yet.</div>}
    </div>
  );
}
