import { useEffect, useState } from "react";
import { SalaryPaymentModal } from "../components/SalaryPaymentModal";
import { SalarySlipList } from "../components/SalarySlipList";
import { SalaryStructureForm } from "../components/SalaryStructureForm";
import { StatCard } from "../components/TeacherShared";
import { cardStyle, inputStyle, secondaryButton } from "../components/teacherStyles";
import { useTeacherSalaryData } from "../hooks/useTeacherSalaryData";
import type { SalarySlip } from "../types/teacherSalary.types";

function printSalarySlip(slip: SalarySlip, currency: (value: number | string | null | undefined) => string, setError: (value: string) => void) {
  const printWindow = window.open("", "_blank", "width=980,height=760");
  if (!printWindow) {
    setError("Popup blocked. Please allow popups to print salary slip.");
    return;
  }

  const html = `
    <html>
      <head>
        <title>${slip.teacher_name} Salary Slip</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 28px; color: #0f172a; }
          .sheet { max-width: 860px; margin: 0 auto; }
          .header { border-bottom: 2px solid #dbeafe; padding-bottom: 16px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; font-size: 28px; }
          .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; font-size: 14px; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
          th { background: #eff6ff; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <h1>Teacher Salary Slip</h1>
            <div class="meta">
              <div><strong>Teacher:</strong> ${slip.teacher_name}</div>
              <div><strong>Month:</strong> ${new Date(slip.salary_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
              <div><strong>Pay Type:</strong> ${slip.pay_type}</div>
              <div><strong>Status:</strong> ${slip.status}</div>
              <div><strong>Paid Date:</strong> ${slip.paid_date ? new Date(slip.paid_date).toLocaleDateString("en-IN") : "-"}</div>
              <div><strong>Payment Mode:</strong> ${slip.payment_mode || "cash"}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Particular</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>Gross Salary</td><td>${currency(slip.gross_salary)}</td></tr>
              <tr><td>Leave Deduction</td><td>${currency(slip.leave_deduction)}</td></tr>
              <tr><td>Other Deduction</td><td>${currency(slip.other_deduction)}</td></tr>
              <tr><td><strong>Net Salary</strong></td><td><strong>${currency(slip.net_salary)}</strong></td></tr>
              <tr><td>Paid Amount</td><td>${currency(slip.paid_amount || slip.net_salary)}</td></tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function TeacherSalaryPage() {
  const state = useTeacherSalaryData();
  const [showStructureForm, setShowStructureForm] = useState(false);

  useEffect(() => {
    if (state.message === "Salary structure saved.") {
      setShowStructureForm(false);
    }
  }, [state.message]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Staff Salary Module</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Phase 1 includes salary structures, one paid leave allowed per month, monthly slip generation, and paid or pending tracking.
          </p>
        </div>
        {!showStructureForm ? (
          <button type="button" style={secondaryButton} onClick={() => setShowStructureForm(true)}>
            Add Salary
          </button>
        ) : null}
      </div>

      {!showStructureForm ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          <StatCard label="Salary Structures" value={state.structureStats.total} accent="#2563eb" />
          <StatCard label="Monthly Pay" value={state.structureStats.monthly} accent="#059669" />
          <StatCard label="Per Day" value={state.structureStats.perDay} accent="#d97706" />
          <StatCard label="Per Period" value={state.structureStats.perPeriod} accent="#7c3aed" />
        </div>
      ) : null}

      {state.message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{state.message}</div>}
      {state.error && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{state.error}</div>}

      <SalaryPaymentModal
        draft={state.paymentDraft}
        setDraft={state.setPaymentDraft}
        onClose={state.closePaymentModal}
        onSubmit={() => {
          state.setMessage("");
          state.setError("");
          state.paySlipMutation.mutate();
        }}
        isPending={state.paySlipMutation.isPending}
      />

      {showStructureForm ? (
        <SalaryStructureForm
          form={state.structureForm}
          setForm={state.setStructureForm}
          teachers={state.teachersQuery.data || []}
          onSubmit={() => {
            state.setMessage("");
            state.setError("");
            state.saveStructureMutation.mutate();
          }}
          onCancel={() => setShowStructureForm(false)}
          isPending={state.saveStructureMutation.isPending}
        />
      ) : (
      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>Monthly Salary Slips</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>Generate slips month-wise, then mark them paid from the same list.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input type="month" value={state.month} onChange={(event) => state.setMonth(event.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
            <button
              type="button"
              style={secondaryButton}
              onClick={() => state.generateSlipsMutation.mutate()}
              disabled={state.generateSlipsMutation.isPending}
            >
              {state.generateSlipsMutation.isPending ? "Generating..." : "Generate Slips"}
            </button>
          </div>
        </div>

        <SalarySlipList
          slips={state.slipsQuery.data || []}
          loading={state.slipsQuery.isLoading}
          currency={state.currency}
          onPay={state.openPaymentModal}
          onPrint={(slip) => printSalarySlip(slip, state.currency, state.setError)}
        />
      </section>
      )}
    </div>
  );
}
