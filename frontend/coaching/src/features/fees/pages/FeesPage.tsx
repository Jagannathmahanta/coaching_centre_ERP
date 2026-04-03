import { useState } from "react";
import { FeeDefinitionsSection } from "../components/FeeDefinitionsSection";
import { FeeSummarySection } from "../components/FeeSummarySection";
import { StudentFeeReview } from "../components/StudentFeeReview";
import { useFeesData } from "../hooks/useFeesData";
import { currency } from "../services/fees.service";
import type { FeePaymentRecord, Installment } from "../types/fees.types";

function openPrintWindow(title: string, body: string) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return null;
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
          h1 { margin-bottom: 4px; }
          .muted { color: #6b7280; margin-bottom: 24px; }
          .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; }
          .total { font-size: 20px; font-weight: bold; border-top: 1px solid #d1d5db; padding-top: 12px; margin-top: 12px; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return printWindow;
}

export default function FeesPage() {
  const state = useFeesData();
  const [showDefinitionForm, setShowDefinitionForm] = useState(false);

  const handleGenerateBill = async (installment: Installment) => {
    if (!state.selectedStudent) return;
    state.setMessage("");
    state.setError("");

    try {
      await state.persistAdjustmentIfNeeded(installment);
    } catch (printError: any) {
      state.setError(printError.response?.data?.error || "Failed to apply adjustment before printing.");
      return;
    }

    const draft = state.getPaymentDraft(installment);
    const adjustmentPreview = state.getAdjustmentPreview(installment);
    const tuitionAmount = Number(draft.tuition || 0);
    const hostelAmount = Number(draft.hostel || 0);
    const transportAmount = Number(draft.transport || 0);
    const adjustmentAmount = Number(draft.adjustment || 0);
    const total = tuitionAmount + hostelAmount + transportAmount + adjustmentAmount;
    const totalBill = Number(adjustmentPreview.adjustedTotal || 0);
    const dueAmount = Number(adjustmentPreview.balance || 0);

    openPrintWindow(
      `${state.selectedStudent.name} - ${installment.installment_label} Bill`,
      `
        <h1>Fee Bill</h1>
        <div class="muted">Generated on ${new Date().toLocaleDateString()}</div>
        <div class="card">
          <div class="row"><span>Student</span><strong>${state.selectedStudent.name}</strong></div>
          <div class="row"><span>Class</span><strong>${state.selectedStudent.class}</strong></div>
          <div class="row"><span>Installment</span><strong>${installment.installment_label}</strong></div>
          <div class="row"><span>Due Date</span><strong>${new Date(installment.due_date).toLocaleDateString()}</strong></div>
        </div>
        <div class="card">
          <div class="row"><span>Tuition</span><strong>${currency(tuitionAmount)}</strong></div>
          <div class="row"><span>Hostel</span><strong>${currency(hostelAmount)}</strong></div>
          <div class="row"><span>Transport</span><strong>${currency(transportAmount)}</strong></div>
          <div class="row"><span>Late Fee</span><strong>${currency(adjustmentPreview.lateFee)}</strong></div>
          <div class="row"><span>Discount</span><strong>${currency(adjustmentPreview.discount)}</strong></div>
          <div class="row"><span>Waived</span><strong>${currency(adjustmentPreview.waived)}</strong></div>
          <div class="row"><span>Adjustment Due</span><strong>${currency(adjustmentAmount)}</strong></div>
          <div class="row"><span>Installment Bill Amount</span><strong>${currency(totalBill)}</strong></div>
          <div class="row"><span>Current Due Amount</span><strong>${currency(dueAmount)}</strong></div>
          <div class="row total"><span>Bill For This Print</span><strong>${currency(total)}</strong></div>
        </div>
      `
    );
  };

  const handleGenerateReceipt = (installment: Installment) => {
    if (!state.selectedStudent) return;
    state.setError("");

    const tuitionPaid = Number(installment.paid_tuition_amount || 0);
    const hostelPaid = Number(installment.paid_hostel_amount || 0);
    const transportPaid = Number(installment.paid_transport_amount || 0);
    const adjustmentPaid = Number(installment.paid_adjustment_amount || 0);
    const totalPaid = Number(installment.paid_amount || 0);
    const totalBill = Number(installment.total_amount || 0);
    const dueAmount = Number(installment.balance || 0);
    const paymentDate = installment.last_payment_date ? new Date(installment.last_payment_date).toLocaleDateString() : new Date().toLocaleDateString();

    if (!totalPaid) {
      state.setError("No paid amount is available yet for this installment receipt.");
      return;
    }

    openPrintWindow(
      `${state.selectedStudent.name} - ${installment.installment_label} Receipt`,
      `
        <h1>Fee Receipt</h1>
        <div class="muted">Generated on ${new Date().toLocaleDateString()}</div>
        <div class="card">
          <div class="row"><span>Student</span><strong>${state.selectedStudent.name}</strong></div>
          <div class="row"><span>Admission No</span><strong>${state.selectedStudent.roll_number || state.studentFees?.profile?.roll_number || "-"}</strong></div>
          <div class="row"><span>Class</span><strong>${state.selectedStudent.class}</strong></div>
          <div class="row"><span>Board</span><strong>${state.selectedStudent.board || state.studentFees?.profile?.board || "-"}</strong></div>
          <div class="row"><span>Session</span><strong>${state.selectedStudent.academic_year || state.studentFees?.profile?.academic_year || "-"}</strong></div>
          <div class="row"><span>Plan</span><strong>${state.studentFees?.profile?.billing_cycle || "-"}</strong></div>
          <div class="row"><span>Installment</span><strong>${installment.installment_label}</strong></div>
          <div class="row"><span>Status</span><strong>${installment.status}</strong></div>
          <div class="row"><span>Due Date</span><strong>${new Date(installment.due_date).toLocaleDateString()}</strong></div>
          <div class="row"><span>Receipt Date</span><strong>${paymentDate}</strong></div>
        </div>
        <div class="card">
          <div class="row"><span>Installment Bill Amount</span><strong>${currency(totalBill)}</strong></div>
          <div class="row"><span>Late Fee</span><strong>${currency(installment.late_fee_amount)}</strong></div>
          <div class="row"><span>Discount</span><strong>${currency(installment.discount_amount)}</strong></div>
          <div class="row"><span>Waived</span><strong>${currency(installment.waived_amount)}</strong></div>
          <div class="row"><span>Tuition Paid</span><strong>${currency(tuitionPaid)}</strong></div>
          <div class="row"><span>Hostel Paid</span><strong>${currency(hostelPaid)}</strong></div>
          <div class="row"><span>Transport Paid</span><strong>${currency(transportPaid)}</strong></div>
          <div class="row"><span>Adjustment Paid</span><strong>${currency(adjustmentPaid)}</strong></div>
          <div class="row total"><span>Total Paid</span><strong>${currency(totalPaid)}</strong></div>
        </div>
        <div class="card"><div class="row"><span>Due Amount Pending</span><strong>${currency(dueAmount)}</strong></div></div>
      `
    );
  };

  const handleGenerateHistoryReceipt = (payment: FeePaymentRecord) => {
    if (!state.selectedStudent) return;
    const isAdvance = Number(payment.advance_amount || 0) > 0 && !payment.fee_id;
    const relatedInstallment = !isAdvance ? state.studentFees?.installments.find((installment: Installment) => installment.id === payment.fee_id) : null;

    openPrintWindow(
      `${state.selectedStudent.name} Receipt`,
      `
        <h1>${isAdvance ? "Advance Deposit Receipt" : "Fee Payment Receipt"}</h1>
        <div class="muted">Generated on ${new Date(payment.payment_date).toLocaleDateString()}</div>
        <div class="card">
          <div class="row"><span>Student</span><strong>${state.selectedStudent.name}</strong></div>
          <div class="row"><span>Admission No</span><strong>${state.selectedStudent.roll_number || state.studentFees?.profile?.roll_number || "-"}</strong></div>
          <div class="row"><span>Class</span><strong>${state.selectedStudent.class}</strong></div>
          <div class="row"><span>Board</span><strong>${state.selectedStudent.board || state.studentFees?.profile?.board || "-"}</strong></div>
          <div class="row"><span>Session</span><strong>${state.selectedStudent.academic_year || state.studentFees?.profile?.academic_year || "-"}</strong></div>
          <div class="row"><span>Plan</span><strong>${state.studentFees?.profile?.billing_cycle || "-"}</strong></div>
          <div class="row"><span>Status</span><strong>${relatedInstallment?.status || (isAdvance ? "advance" : "-")}</strong></div>
          <div class="row"><span>Date</span><strong>${new Date(payment.payment_date).toLocaleDateString()}</strong></div>
          <div class="row"><span>Installment</span><strong>${payment.installment_label || "Advance Deposit"}</strong></div>
          <div class="row"><span>Due Date</span><strong>${relatedInstallment?.due_date ? new Date(relatedInstallment.due_date).toLocaleDateString() : "-"}</strong></div>
          <div class="row"><span>Mode</span><strong>${payment.payment_mode || "-"}</strong></div>
        </div>
        <div class="card">
          <div class="row"><span>Installment Bill Amount</span><strong>${currency(relatedInstallment?.total_amount || payment.amount)}</strong></div>
          <div class="row"><span>Late Fee</span><strong>${currency(relatedInstallment?.late_fee_amount)}</strong></div>
          <div class="row"><span>Discount</span><strong>${currency(relatedInstallment?.discount_amount)}</strong></div>
          <div class="row"><span>Waived</span><strong>${currency(relatedInstallment?.waived_amount)}</strong></div>
          <div class="row"><span>Advance Amount</span><strong>${currency(payment.advance_amount)}</strong></div>
          <div class="row"><span>Tuition Paid</span><strong>${currency(payment.tuition_amount)}</strong></div>
          <div class="row"><span>Hostel Paid</span><strong>${currency(payment.hostel_amount)}</strong></div>
          <div class="row"><span>Transport Paid</span><strong>${currency(payment.transport_amount)}</strong></div>
          <div class="row"><span>Adjustment Paid</span><strong>${currency(payment.adjustment_amount)}</strong></div>
          <div class="row total"><span>Total Paid</span><strong>${currency(payment.amount)}</strong></div>
        </div>
        <div class="card"><div class="row"><span>Due Amount Pending</span><strong>${currency(relatedInstallment?.balance)}</strong></div></div>
      `
    );
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Fees And Fee Definitions</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Create academic or course fee definitions with tuition, hostel, and transport together. Admission applies only the selected parts for each student.
        </p>
      </div>

      <FeeDefinitionsSection
        showForm={showDefinitionForm}
        editingStructureId={state.editingStructureId}
        definitionForm={state.definitionForm}
        setDefinitionForm={state.setDefinitionForm}
        definitions={state.definitions}
        catalog={state.catalog}
        onSubmit={async (event) => {
          const saved = await state.handleCreateDefinition(event);
          if (saved) setShowDefinitionForm(false);
        }}
        onStartCreate={() => setShowDefinitionForm(true)}
        onEdit={(definition) => {
          state.handleEditDefinition(definition);
          setShowDefinitionForm(true);
        }}
        onDelete={state.handleDeleteDefinition}
        onCancel={() => {
          state.setEditingStructureId(null);
          setShowDefinitionForm(false);
        }}
      />

      {!showDefinitionForm && state.editingStructureId === null ? (
        <>
          <FeeSummarySection
            summary={state.summary}
            summaryScope={state.summaryScope}
            setSummaryScope={state.setSummaryScope}
            summaryMonth={state.summaryMonth}
            setSummaryMonth={state.setSummaryMonth}
            board={state.board}
          />
     
          <StudentFeeReview
            students={state.students}
            selectedStudentId={state.selectedStudentId}
            onStudentChange={state.handleStudentChange}
            message={state.message}
            error={state.error}
            loading={state.loading}
            selectedStudent={state.selectedStudent}
            studentFees={state.studentFees}
            definitions={state.definitions}
            planForm={state.planForm}
            setPlanForm={state.setPlanForm}
            onUpdatePlan={state.handleUpdateStudentPlan}
            studentPaymentMode={state.studentPaymentMode}
            setStudentPaymentMode={state.setStudentPaymentMode}
            studentPaymentAmount={state.studentPaymentAmount}
            setStudentPaymentAmount={state.setStudentPaymentAmount}
            onApplyStudentPayment={state.handleApplyStudentPayment}
            selectedStudentSummary={state.selectedStudentSummary}
            studentInstallmentView={state.studentInstallmentView}
            setStudentInstallmentView={state.setStudentInstallmentView}
            filteredInstallments={state.filteredInstallments}
            paymentHistory={state.paymentHistory}
            getRemainingByHead={state.getRemainingByHead}
            getAdjustmentPreview={state.getAdjustmentPreview}
            getAdjustmentDraft={state.getAdjustmentDraft}
            updateAdjustmentDraft={state.updateAdjustmentDraft}
            getPaymentDraft={state.getPaymentDraft}
            updatePaymentDraft={state.updatePaymentDraft}
            resetPaymentDraftToDue={state.resetPaymentDraftToDue}
            getDraftTotal={state.getDraftTotal}
            onPayInstallment={state.handlePayInstallment}
            onUseAdvance={state.handleUseAdvance}
            onGenerateBill={handleGenerateBill}
            onGenerateReceipt={handleGenerateReceipt}
            onGenerateHistoryReceipt={handleGenerateHistoryReceipt}
          />
        </>
      ) : null}
    </div>
  );
}
