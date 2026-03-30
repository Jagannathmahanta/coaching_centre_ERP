import { currency } from "../services/fees.service";
import type { FeePaymentRecord, Installment } from "../types/fees.types";
import { BreakdownCard, cardStyle, Field, inputStyle, Metric, StatusBadge } from "./FeesShared";

export function StudentFeeReview({
  students,
  selectedStudentId,
  onStudentChange,
  message,
  error,
  loading,
  selectedStudent,
  studentFees,
  definitions,
  planForm,
  setPlanForm,
  onUpdatePlan,
  studentPaymentMode,
  setStudentPaymentMode,
  studentPaymentAmount,
  setStudentPaymentAmount,
  onApplyStudentPayment,
  selectedStudentSummary,
  studentInstallmentView,
  setStudentInstallmentView,
  filteredInstallments,
  paymentHistory,
  getRemainingByHead,
  getAdjustmentPreview,
  getAdjustmentDraft,
  updateAdjustmentDraft,
  getPaymentDraft,
  updatePaymentDraft,
  resetPaymentDraftToDue,
  getDraftTotal,
  onPayInstallment,
  onUseAdvance,
  onGenerateBill,
  onGenerateReceipt,
  onGenerateHistoryReceipt,
}: any) {
  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0 }}>Student Fee Review</h2>
      <Field label="Select Student">
        <select value={selectedStudentId} onChange={(e) => onStudentChange(e.target.value)} style={inputStyle}>
          <option value="">Choose a student</option>
          {students.map((student: any) => (
            <option key={student.id} value={student.id}>
              {student.name} • {student.class} {student.fee_definition_name ? `• ${student.fee_definition_name}` : ""}
            </option>
          ))}
        </select>
      </Field>

      {message && <div style={{ marginTop: 16, color: "#166534", background: "#f0fdf4", padding: 12, borderRadius: 10 }}>{message}</div>}
      {error && <div style={{ marginTop: 16, color: "#b91c1c", background: "#fef2f2", padding: 12, borderRadius: 10 }}>{error}</div>}

      {loading ? (
        <p style={{ color: "#6b7280", marginTop: 16 }}>Loading fee data...</p>
      ) : selectedStudent && studentFees ? (
        <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700 }}>{selectedStudent.name}</div>
            <div style={{ color: "#1e3a8a", marginTop: 6 }}>
              Definition: {studentFees.profile?.fee_definition_name || "Not assigned"} | Plan: {studentFees.profile?.billing_cycle?.replace("_", " ") || "Not assigned"} | Applicable months: {studentFees.profile?.applicable_months || 0}
            </div>
            <div style={{ color: "#334155", marginTop: 8, fontWeight: 600 }}>Advance balance: {currency(studentFees.profile?.advance_fee_balance)}</div>
          </div>

          <div style={{ ...cardStyle, padding: 16, background: "#f8fafc" }}>
            <div style={{ fontWeight: 700 }}>Edit Student Fee Plan</div>
            <div style={{ color: "#64748b", marginTop: 6 }}>This can update the active plan only when no installment payment has been recorded yet.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
              <Field label="Fee Definition">
                <select value={planForm.fee_structure_id} onChange={(e) => setPlanForm((current: any) => ({ ...current, fee_structure_id: e.target.value }))} style={{ ...inputStyle, marginTop: 0 }}>
                  <option value="">Choose fee definition</option>
                  {definitions.map((definition: any) => (
                    <option key={definition.id} value={definition.id}>{definition.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Billing Cycle">
                <select value={planForm.billing_cycle} onChange={(e) => setPlanForm((current: any) => ({ ...current, billing_cycle: e.target.value }))} style={{ ...inputStyle, marginTop: 0 }}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="yearly">Yearly</option>
                  <option value="full_package">Full Package</option>
                </select>
              </Field>
              <Field label="Due Day">
                <input type="number" min="1" max="28" value={planForm.due_day} onChange={(e) => setPlanForm((current: any) => ({ ...current, due_day: e.target.value }))} style={{ ...inputStyle, marginTop: 0 }} />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 12, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={planForm.include_hostel} onChange={(e) => setPlanForm((current: any) => ({ ...current, include_hostel: e.target.checked }))} />
                Include Hostel
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={planForm.include_transport} onChange={(e) => setPlanForm((current: any) => ({ ...current, include_transport: e.target.checked }))} />
                Include Transport
              </label>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="button" onClick={onUpdatePlan} style={buttonSecondary}>Update Fee Plan</button>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 16, background: "#f8fafc" }}>
            <div style={{ fontWeight: 700 }}>Student Payment And Advance</div>
            <div style={{ color: "#64748b", marginTop: 6 }}>
              Choose whether the amount should clear the oldest pending installments first or be stored fully as advance credit for future dues.
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
              <Field label="Mode">
                <select value={studentPaymentMode} onChange={(e) => setStudentPaymentMode(e.target.value)} style={{ ...inputStyle, marginTop: 0, minWidth: 240 }}>
                  <option value="adjust_pending">Adjust Against Pending</option>
                  <option value="store_as_advance">Store As Advance</option>
                </select>
              </Field>
              <Field label="Amount">
                <input type="number" min="1" value={studentPaymentAmount} onChange={(e) => setStudentPaymentAmount(e.target.value)} style={{ ...inputStyle, marginTop: 0, minWidth: 220 }} />
              </Field>
              <button type="button" onClick={onApplyStudentPayment} style={buttonAccent}>Apply Student Payment</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <BreakdownCard title="Tuition" billed={selectedStudentSummary.tuition_billed} paid={selectedStudentSummary.tuition_paid} pending={selectedStudentSummary.tuition_pending} accent="#1d4ed8" />
            <BreakdownCard title="Hostel" billed={selectedStudentSummary.hostel_billed} paid={selectedStudentSummary.hostel_paid} pending={selectedStudentSummary.hostel_pending} accent="#7c3aed" />
            <BreakdownCard title="Transport" billed={selectedStudentSummary.transport_billed} paid={selectedStudentSummary.transport_paid} pending={selectedStudentSummary.transport_pending} accent="#0f766e" />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setStudentInstallmentView("due_now")} style={pillStyle(studentInstallmentView === "due_now")}>Current And Overdue</button>
            <button type="button" onClick={() => setStudentInstallmentView("all")} style={pillStyle(studentInstallmentView === "all")}>All Installments</button>
          </div>

          {filteredInstallments.length === 0 ? (
            <div>No installments found for this student.</div>
          ) : (
            filteredInstallments.map((installment: Installment) => {
              const adjustmentPreview = getAdjustmentPreview(installment);
              const remaining = getRemainingByHead(installment);
              const paymentDraft = getPaymentDraft(installment);
              return (
                <div key={installment.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <strong>{installment.installment_label}</strong>
                      <div style={{ color: "#6b7280", marginTop: 6 }}>Due {new Date(installment.due_date).toLocaleDateString()} • Covers {installment.months_covered} month(s)</div>
                    </div>
                    <StatusBadge status={installment.status} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 14 }}>
                    <Metric label="Tuition" value={currency(installment.tuition_amount)} />
                    <Metric label="Hostel" value={currency(installment.hostel_amount)} />
                    <Metric label="Transport" value={currency(installment.transport_amount)} />
                    <Metric label="Original Total" value={currency(installment.total_amount)} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 12 }}>
                    <Metric label="Due Tuition" value={currency(remaining.tuition)} />
                    <Metric label="Due Hostel" value={currency(remaining.hostel)} />
                    <Metric label="Due Transport" value={currency(remaining.transport)} />
                    <Metric label="Due Adjustment" value={currency(remaining.adjustment)} />
                    <Metric label="Adjusted Total" value={currency(adjustmentPreview.adjustedTotal)} />
                    <Metric label="Due Now" value={currency(adjustmentPreview.balance)} />
                  </div>

                  <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb", display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", color: "#334155", fontWeight: 600 }}>
                      <span>Paid: {currency(installment.paid_amount)}</span>
                      <span>Pending: {currency(adjustmentPreview.balance)}</span>
                      <span>Advance Available: {currency(studentFees.profile?.advance_fee_balance)}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {Number(installment.paid_amount || 0) > 0 && <button type="button" onClick={() => onGenerateReceipt(installment)} style={buttonSecondary}>Generate Receipt</button>}
                      {installment.status !== "paid" && Number(studentFees.profile?.advance_fee_balance || 0) > 0 && <button type="button" onClick={() => onUseAdvance(installment.id)} style={advanceButton}>Use Advance</button>}
                      {installment.status !== "paid" && <button type="button" onClick={() => onGenerateBill(installment)} style={buttonSecondary}>Print Bill</button>}
                    </div>

                    {installment.status !== "paid" && (
                      <>
                        <div style={{ fontWeight: 700 }}>Fine / Discount / Waive</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                          <Field label="Late Fee">
                            <input type="number" min="0" value={getAdjustmentDraft(installment).late_fee_amount} onChange={(e) => updateAdjustmentDraft(installment, "late_fee_amount", e.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
                          </Field>
                          <Field label="Discount">
                            <input type="number" min="0" value={getAdjustmentDraft(installment).discount_amount} onChange={(e) => updateAdjustmentDraft(installment, "discount_amount", e.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
                          </Field>
                          <Field label="Waive Amount">
                            <input type="number" min="0" value={getAdjustmentDraft(installment).waived_amount} onChange={(e) => updateAdjustmentDraft(installment, "waived_amount", e.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
                          </Field>
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => resetPaymentDraftToDue(installment)} style={buttonSecondary}>Use Due Amounts</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                          <Field label="Tuition Payment">
                            <input type="number" min="0" max={remaining.tuition} value={paymentDraft.tuition} onChange={(e) => updatePaymentDraft(installment, "tuition", e.target.value)} style={{ ...inputStyle, marginTop: 0, background: remaining.tuition === 0 ? "#f3f4f6" : "#fff" }} disabled={remaining.tuition === 0} />
                          </Field>
                          <Field label="Hostel Payment">
                            <input type="number" min="0" max={remaining.hostel} value={paymentDraft.hostel} onChange={(e) => updatePaymentDraft(installment, "hostel", e.target.value)} style={{ ...inputStyle, marginTop: 0, background: remaining.hostel === 0 ? "#f3f4f6" : "#fff" }} disabled={remaining.hostel === 0} />
                          </Field>
                          <Field label="Transport Payment">
                            <input type="number" min="0" max={remaining.transport} value={paymentDraft.transport} onChange={(e) => updatePaymentDraft(installment, "transport", e.target.value)} style={{ ...inputStyle, marginTop: 0, background: remaining.transport === 0 ? "#f3f4f6" : "#fff" }} disabled={remaining.transport === 0} />
                          </Field>
                          <Field label="Adjustment Payment">
                            <input type="number" min="0" max={remaining.adjustment} value={paymentDraft.adjustment} onChange={(e) => updatePaymentDraft(installment, "adjustment", e.target.value)} style={{ ...inputStyle, marginTop: 0, background: remaining.adjustment === 0 ? "#f3f4f6" : "#fff" }} disabled={remaining.adjustment === 0} />
                          </Field>
                          <Metric label="Payment Total" value={currency(getDraftTotal(installment))} />
                        </div>

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => onPayInstallment(installment.id)} style={buttonPrimary}>Record Payment</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Payment And Receipt History</h3>
            {paymentHistory.length === 0 ? (
              <div style={{ color: "#6b7280" }}>No payment history found for this student.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {paymentHistory.map((payment: FeePaymentRecord) => (
                  <div key={payment.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <strong>{payment.installment_label || "Advance Deposit"}</strong>
                        <div style={{ color: "#64748b", marginTop: 4 }}>{new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_mode || "-"}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{currency(payment.amount)}</div>
                    </div>
                    <div style={{ marginTop: 8, color: "#64748b" }}>
                      Tuition {currency(payment.tuition_amount)} | Hostel {currency(payment.hostel_amount)} | Transport {currency(payment.transport_amount)} | Advance {currency(payment.advance_amount)}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <button type="button" onClick={() => onGenerateHistoryReceipt(payment)} style={buttonSecondary}>Print Receipt</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p style={{ color: "#6b7280", marginTop: 16 }}>Choose a student to inspect the generated fee schedule.</p>
      )}
    </div>
  );
}

const buttonSecondary = {
  background: "#fff",
  color: "#1f2937",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const advanceButton = {
  background: "#fff7ed",
  color: "#9a3412",
  border: "1px solid #fdba74",
  borderRadius: 10,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const buttonAccent = {
  background: "#0f766e",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const buttonPrimary = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

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
