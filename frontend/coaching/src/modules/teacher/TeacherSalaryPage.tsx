import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../shared/services/api";
import { Button } from "../../shared/components/Button";


type Teacher = {
  id: number;
  name: string;
  status: string;
};

type SalaryStructure = {
  id: number;
  teacher_id: number;
  teacher_name: string;
  pay_type: "monthly" | "per_day" | "per_period";
  basic_amount: number | string;
  ta_amount: number | string;
  da_amount: number | string;
  hra_amount: number | string;
  other_allowance: number | string;
  per_day_rate: number | string;
  per_period_rate: number | string;
  allowed_paid_leaves: number | string;
  status: string;
};

type SalarySlip = {
  id: number;
  teacher_id: number;
  teacher_name: string;
  salary_month: string;
  pay_type: string;
  working_days: number | string;
  attended_days: number | string;
  periods_taken: number | string;
  paid_leaves_taken: number | string;
  gross_salary: number | string;
  leave_deduction: number | string;
  other_deduction: number | string;
  net_salary: number | string;
  paid_amount?: number | string;
  status: string;
  paid_date?: string | null;
  payment_mode?: string | null;
  remarks?: string | null;
};

const cardStyle = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
};

function currency(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const initialStructureForm = {
  teacher_id: "",
  pay_type: "monthly",
  basic_amount: "10000",
  ta_amount: "0",
  da_amount: "0",
  hra_amount: "0",
  other_allowance: "0",
  per_day_rate: "0",
  per_period_rate: "0",
  allowed_paid_leaves: "1",
  status: "active",
};

export default function TeacherSalaryPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [structureForm, setStructureForm] = useState(initialStructureForm);
  const [paymentDraft, setPaymentDraft] = useState({
    slipId: 0,
    teacherName: "",
    salaryMonth: "",
    netSalary: "",
    paid_amount: "",
    paid_date: new Date().toISOString().slice(0, 10),
    payment_mode: "cash",
    remarks: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const teachersQuery = useQuery({
    queryKey: ["salary-teachers"],
    queryFn: async () => {
      const response = await api.get("/teachers");
      return (response.data || []) as Teacher[];
    },
  });

  const structuresQuery = useQuery({
    queryKey: ["teacher-salary-structures"],
    queryFn: async () => {
      const response = await api.get("/teacher-salary/structures");
      return (response.data || []) as SalaryStructure[];
    },
  });

  const slipsQuery = useQuery({
    queryKey: ["teacher-salary-slips", month],
    queryFn: async () => {
      const response = await api.get("/teacher-salary/slips", { params: { month: `${month}-01` } });
      return (response.data || []) as SalarySlip[];
    },
  });

  const saveStructureMutation = useMutation({
    mutationFn: async () => api.post("/teacher-salary/structures", structureForm),
    onSuccess: async () => {
      setMessage("Salary structure saved.");
      setError("");
      setStructureForm(initialStructureForm);
      await queryClient.invalidateQueries({ queryKey: ["teacher-salary-structures"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to save salary structure.");
      setMessage("");
    },
  });

  const generateSlipsMutation = useMutation({
    mutationFn: async () => api.post("/teacher-salary/slips/generate", { month: `${month}-01`, working_days: 30 }),
    onSuccess: async (response) => {
      setMessage(`Generated ${response.data?.generated_count || 0} salary slips.`);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["teacher-salary-slips", month] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to generate salary slips.");
      setMessage("");
    },
  });

  const paySlipMutation = useMutation({
    mutationFn: async () => api.patch(`/teacher-salary/slips/${paymentDraft.slipId}/pay`, paymentDraft),
    onSuccess: async () => {
      setMessage("Salary marked as paid.");
      setError("");
      setPaymentDraft({
        slipId: 0,
        teacherName: "",
        salaryMonth: "",
        netSalary: "",
        paid_amount: "",
        paid_date: new Date().toISOString().slice(0, 10),
        payment_mode: "cash",
        remarks: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["teacher-salary-slips", month] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to update salary payment.");
      setMessage("");
    },
  });

  const structureStats = useMemo(() => {
    const structures = structuresQuery.data || [];
    return {
      total: structures.length,
      monthly: structures.filter((item) => item.pay_type === "monthly").length,
      perDay: structures.filter((item) => item.pay_type === "per_day").length,
      perPeriod: structures.filter((item) => item.pay_type === "per_period").length,
    };
  }, [structuresQuery.data]);

  const closePaymentModal = () => {
    setPaymentDraft({
      slipId: 0,
      teacherName: "",
      salaryMonth: "",
      netSalary: "",
      paid_amount: "",
      paid_date: new Date().toISOString().slice(0, 10),
      payment_mode: "cash",
      remarks: "",
    });
  };

  const printSalarySlip = (slip: SalarySlip) => {
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
                <tr>
                  <th>Particular</th>
                  <th>Amount</th>
                </tr>
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
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Teacher Salary Module</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Phase 1 includes salary structures, one paid leave allowed per month, monthly slip generation, and paid or pending tracking.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <StatCard label="Salary Structures" value={structureStats.total} accent="#2563eb" />
        <StatCard label="Monthly Pay" value={structureStats.monthly} accent="#059669" />
        <StatCard label="Per Day" value={structureStats.perDay} accent="#d97706" />
        <StatCard label="Per Period" value={structureStats.perPeriod} accent="#7c3aed" />
      </div>

      {message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}

      {paymentDraft.slipId > 0 && (
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
          onClick={closePaymentModal}
        >
          <form
            style={{
              ...cardStyle,
              width: "min(680px, 100%)",
              maxHeight: "calc(100vh - 40px)",
              overflowY: "auto",
            }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              setMessage("");
              setError("");
              paySlipMutation.mutate();
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0 }}>Pay Salary</h2>
                <p style={{ color: "#6b7280", marginTop: 8 }}>
                  Record payment details for {paymentDraft.teacherName} and keep the slip ready for printing or sharing later.
                </p>
              </div>
              <Button type="button" variant="secondary" style={{ padding: "10px 14px" }} onClick={closePaymentModal}>
                Close
              </Button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
                <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Teacher</div>
                <div style={{ marginTop: 6, color: "#0f172a", fontSize: 18, fontWeight: 700 }}>{paymentDraft.teacherName}</div>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#f8fafc" }}>
                <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Salary Month</div>
                <div style={{ marginTop: 6, color: "#0f172a", fontSize: 18, fontWeight: 700 }}>{paymentDraft.salaryMonth}</div>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, background: "#f8fafc", gridColumn: "1 / -1" }}>
                <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Net Salary</div>
                <div style={{ marginTop: 6, color: "#0f172a", fontSize: 24, fontWeight: 800 }}>{paymentDraft.netSalary}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
              <Field label="Paid Amount">
                <input type="number" min="0" value={paymentDraft.paid_amount} onChange={(event) => setPaymentDraft((current) => ({ ...current, paid_amount: event.target.value }))} style={inputStyle} required />
              </Field>
              <Field label="Payment Date">
                <input type="date" value={paymentDraft.paid_date} onChange={(event) => setPaymentDraft((current) => ({ ...current, paid_date: event.target.value }))} style={inputStyle} required />
              </Field>
              <Field label="Payment Mode">
                <select value={paymentDraft.payment_mode} onChange={(event) => setPaymentDraft((current) => ({ ...current, payment_mode: event.target.value }))} style={inputStyle}>
                  <option value="cash">Cash</option>
                </select>
              </Field>
            </div>

            <Field label="Remarks">
              <textarea rows={3} value={paymentDraft.remarks} onChange={(event) => setPaymentDraft((current) => ({ ...current, remarks: event.target.value }))} style={{ ...inputStyle, resize: "vertical" as const }} />
            </Field>

            <div style={{ display: "flex", gap: 12, marginTop: 18, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Button type="button" variant="secondary" onClick={closePaymentModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={paySlipMutation.isPending}>
                {paySlipMutation.isPending ? "Saving..." : "Confirm Payment"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <form
        style={cardStyle}
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          setError("");
          saveStructureMutation.mutate();
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Salary Structure</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>Set monthly, day-wise, or period-wise salary. Paid leave is capped at 1 per month for now.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          <Field label="Teacher">
            <select value={structureForm.teacher_id} onChange={(event) => setStructureForm((current) => ({ ...current, teacher_id: event.target.value }))} style={inputStyle} required>
              <option value="">Select teacher</option>
              {(teachersQuery.data || []).filter((teacher) => teacher.status === "active").map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pay Type">
            <select value={structureForm.pay_type} onChange={(event) => setStructureForm((current) => ({ ...current, pay_type: event.target.value }))} style={inputStyle}>
              <option value="monthly">Monthly</option>
              <option value="per_day">Per Day</option>
              <option value="per_period">Per Period</option>
            </select>
          </Field>
          <Field label="Allowed Paid Leave / Month">
            <input type="number" min="0" max="1" value={structureForm.allowed_paid_leaves} onChange={(event) => setStructureForm((current) => ({ ...current, allowed_paid_leaves: event.target.value }))} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14 }}>
          <Field label="Basic">
            <input type="number" min="0" value={structureForm.basic_amount} onChange={(event) => setStructureForm((current) => ({ ...current, basic_amount: event.target.value }))} style={inputStyle} />
          </Field>
          <Field label="TA">
            <input type="number" min="0" value={structureForm.ta_amount} onChange={(event) => setStructureForm((current) => ({ ...current, ta_amount: event.target.value }))} style={inputStyle} />
          </Field>
          <Field label="DA">
            <input type="number" min="0" value={structureForm.da_amount} onChange={(event) => setStructureForm((current) => ({ ...current, da_amount: event.target.value }))} style={inputStyle} />
          </Field>
          <Field label="HRA">
            <input type="number" min="0" value={structureForm.hra_amount} onChange={(event) => setStructureForm((current) => ({ ...current, hra_amount: event.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Other Allowance">
            <input type="number" min="0" value={structureForm.other_allowance} onChange={(event) => setStructureForm((current) => ({ ...current, other_allowance: event.target.value }))} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          <Field label="Per Day Rate">
            <input type="number" min="0" value={structureForm.per_day_rate} onChange={(event) => setStructureForm((current) => ({ ...current, per_day_rate: event.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Per Period Rate">
            <input type="number" min="0" value={structureForm.per_period_rate} onChange={(event) => setStructureForm((current) => ({ ...current, per_period_rate: event.target.value }))} style={inputStyle} />
          </Field>
        </div>

        <div style={{ marginTop: 18 }}>
          <Button type="submit" variant="primary" disabled={saveStructureMutation.isPending}>
            {saveStructureMutation.isPending ? "Saving..." : "Save Salary Structure"}
          </Button>
        </div>
      </form>

      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>Monthly Salary Slips</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>Generate slips month-wise, then mark them paid from the same list.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
            <Button type="button" variant="secondary" onClick={() => generateSlipsMutation.mutate()} disabled={generateSlipsMutation.isPending}>
              {generateSlipsMutation.isPending ? "Generating..." : "Generate Slips"}
            </Button>
          </div>
        </div>

        {slipsQuery.isLoading ? (
          <div>Loading salary slips...</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {(slipsQuery.data || []).map((slip) => (
              <div key={slip.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ color: "#0f172a", fontSize: 18 }}>{slip.teacher_name}</strong>
                    <span style={{
                      display: "inline-flex",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: slip.status === "paid" ? "#ecfdf5" : "#fffbeb",
                      color: slip.status === "paid" ? "#166534" : "#b45309",
                      fontWeight: 700,
                      fontSize: 12,
                    }}>
                      {slip.status}
                    </span>
                  </div>
                  <div style={{ color: "#64748b" }}>
                    {slip.pay_type} | {new Date(slip.salary_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </div>
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
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setPaymentDraft({
                        slipId: slip.id,
                        teacherName: slip.teacher_name,
                        salaryMonth: new Date(slip.salary_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
                        netSalary: currency(slip.net_salary),
                        paid_amount: String(slip.net_salary || ""),
                        paid_date: new Date().toISOString().slice(0, 10),
                        payment_mode: "cash",
                        remarks: "",
                      })}
                    >
                      Pay
                    </Button>
                  )}
                  <Button type="button" variant="secondary" onClick={() => printSalarySlip(slip)}>
                    Print Slip
                  </Button>
                </div>
              </div>
            ))}
            {(slipsQuery.data || []).length === 0 && (
              <div style={{ color: "#6b7280" }}>No salary slips generated for this month yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
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
