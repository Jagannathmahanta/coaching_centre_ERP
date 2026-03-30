import { useEffect, useMemo, useState } from "react";
import {
  applyStudentPayment,
  currency,
  deleteFeeDefinition,
  getCollectionBoard,
  getFeeStructures,
  getFeeSummary,
  getRemainingByHead,
  getStudentFeeDetails,
  getStudentPaymentHistory,
  getStudents,
  payInstallment,
  saveFeeDefinition,
  updateInstallmentAdjustments,
  updateStudentPlan,
  useAdvanceOnInstallment,
} from "../services/fees.service";
import type {
  AdjustmentDraftState,
  DefinitionFormState,
  Installment,
  PaymentDraftState,
} from "../types/fees.types";
import {
  boardOptions,
  defaultMonth,
  emptyFeeSummary,
  initialDefinitionForm,
  initialPlanForm,
} from "../types/fees.types";

export function useFeesData() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentFees, setStudentFees] = useState<any | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [board, setBoard] = useState<any | null>(null);
  const [summaryScope, setSummaryScope] = useState<"current_month" | "all">("current_month");
  const [summaryMonth, setSummaryMonth] = useState(defaultMonth);
  const [studentInstallmentView, setStudentInstallmentView] = useState<"due_now" | "all">("due_now");
  const [loading, setLoading] = useState(true);
  const [paymentStates, setPaymentStates] = useState<PaymentDraftState>({});
  const [studentPaymentAmount, setStudentPaymentAmount] = useState("");
  const [studentPaymentMode, setStudentPaymentMode] = useState<"adjust_pending" | "store_as_advance">("adjust_pending");
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [adjustmentStates, setAdjustmentStates] = useState<AdjustmentDraftState>({});
  const [editingStructureId, setEditingStructureId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [definitionForm, setDefinitionForm] = useState<DefinitionFormState>(initialDefinitionForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPage = async (studentId?: string, scope?: "current_month" | "all") => {
    setLoading(true);
    setError("");

    try {
      const activeScope = scope || summaryScope;
      const [definitionsData, studentsData, summaryData, boardData] = await Promise.all([
        getFeeStructures(),
        getStudents(),
        getFeeSummary(activeScope, summaryMonth),
        getCollectionBoard(summaryMonth),
      ]);

      setDefinitions(definitionsData);
      setStudents(studentsData);
      setSummary(summaryData);
      setBoard(boardData);

      const targetStudentId = studentId || selectedStudentId;
      if (targetStudentId) {
        const [feesData, historyData] = await Promise.all([
          getStudentFeeDetails(targetStudentId),
          getStudentPaymentHistory(targetStudentId),
        ]);
        setStudentFees(feesData);
        setPaymentHistory(historyData);
        if (feesData && feesData.profile) {
          setPlanForm({
            fee_structure_id: String(feesData.profile.fee_structure_id || ""),
            billing_cycle: feesData.profile.billing_cycle || "monthly",
            due_day: String(feesData.profile.due_day || 5),
            include_hostel: Boolean(feesData.profile.include_hostel),
            include_transport: Boolean(feesData.profile.include_transport),
          });
        }
      }
    } catch (loadError: any) {
      setError(loadError.response?.data?.error || "Failed to load fee data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(undefined, summaryScope);
  }, [summaryScope, summaryMonth]);

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === selectedStudentId),
    [students, selectedStudentId]
  );

  const selectedStudentSummary = studentFees?.summary || emptyFeeSummary;

  const filteredInstallments = useMemo(() => {
    if (!studentFees) return [];
    if (studentInstallmentView === "all") return studentFees.installments;
    const today = new Date();
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return studentFees.installments.filter((installment: Installment) => new Date(installment.due_date) <= currentMonthEnd);
  }, [studentFees, studentInstallmentView]);

  const getAdjustmentDraft = (installment: Installment) =>
    adjustmentStates[installment.id] || {
      late_fee_amount: String(Number(installment.late_fee_amount || 0)),
      discount_amount: String(Number(installment.discount_amount || 0)),
      waived_amount: String(Number(installment.waived_amount || 0)),
    };

  const getAdjustmentPreview = (installment: Installment) => {
    const draft = getAdjustmentDraft(installment);
    const lateFee = Number(draft.late_fee_amount || 0);
    const discount = Number(draft.discount_amount || 0);
    const waived = Number(draft.waived_amount || 0);
    const baseAmount =
      Number(installment.tuition_amount || 0) +
      Number(installment.hostel_amount || 0) +
      Number(installment.transport_amount || 0);
    const adjustedTotal = Math.max(0, baseAmount + lateFee - discount - waived);
    const balance = Math.max(0, adjustedTotal - Number(installment.paid_amount || 0));
    return { lateFee, discount, waived, adjustedTotal, balance };
  };

  const getRemaining = (installment: Installment) => getRemainingByHead(installment, getAdjustmentPreview);

  const getPaymentDraft = (installment: Installment) => {
    const remaining = getRemaining(installment);
    return paymentStates[installment.id] || {
      tuition: remaining.tuition ? String(remaining.tuition) : "",
      hostel: remaining.hostel ? String(remaining.hostel) : "",
      transport: remaining.transport ? String(remaining.transport) : "",
      adjustment: remaining.adjustment ? String(remaining.adjustment) : "",
    };
  };

  const clampDraftValue = (rawValue: string, maxValue: number) => {
    if (rawValue === "") return "";
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return "0";
    return String(Math.min(parsed, maxValue));
  };

  const updatePaymentDraft = (installment: Installment, field: "tuition" | "hostel" | "transport" | "adjustment", value: string) => {
    const remaining = getRemaining(installment);
    const current = getPaymentDraft(installment);
    setPaymentStates((state) => ({
      ...state,
      [installment.id]: {
        ...current,
        [field]: clampDraftValue(value, remaining[field]),
      },
    }));
  };

  const resetPaymentDraftToDue = (installment: Installment) => {
    const remaining = getRemaining(installment);
    setPaymentStates((state) => ({
      ...state,
      [installment.id]: {
        tuition: remaining.tuition ? String(remaining.tuition) : "",
        hostel: remaining.hostel ? String(remaining.hostel) : "",
        transport: remaining.transport ? String(remaining.transport) : "",
        adjustment: remaining.adjustment ? String(remaining.adjustment) : "",
      },
    }));
  };

  const updateAdjustmentDraft = (installment: Installment, field: "late_fee_amount" | "discount_amount" | "waived_amount", value: string) => {
    const current = getAdjustmentDraft(installment);
    const nextDraft = { ...current, [field]: value };
    setAdjustmentStates((state) => ({ ...state, [installment.id]: nextDraft }));

    const lateFee = Number(nextDraft.late_fee_amount || 0);
    const discount = Number(nextDraft.discount_amount || 0);
    const waived = Number(nextDraft.waived_amount || 0);
    let tuition = Math.max(0, Number(installment.tuition_amount) - Number(installment.paid_tuition_amount || 0));
    let hostel = Math.max(0, Number(installment.hostel_amount) - Number(installment.paid_hostel_amount || 0));
    let transport = Math.max(0, Number(installment.transport_amount) - Number(installment.paid_transport_amount || 0));
    let concessionLeft = Math.max(0, discount + waived);
    if (concessionLeft > 0) {
      const reduction = Math.min(concessionLeft, tuition);
      tuition -= reduction;
      concessionLeft -= reduction;
    }
    if (concessionLeft > 0) {
      const reduction = Math.min(concessionLeft, hostel);
      hostel -= reduction;
      concessionLeft -= reduction;
    }
    if (concessionLeft > 0) {
      const reduction = Math.min(concessionLeft, transport);
      transport -= reduction;
    }
    const adjustment = Math.max(0, lateFee - Number(installment.paid_adjustment_amount || 0));
    setPaymentStates((state) => ({
      ...state,
      [installment.id]: {
        tuition: tuition ? String(tuition) : "",
        hostel: hostel ? String(hostel) : "",
        transport: transport ? String(transport) : "",
        adjustment: adjustment ? String(adjustment) : "",
      },
    }));
  };

  const hasUnsavedAdjustmentChanges = (installment: Installment) => {
    const draft = getAdjustmentDraft(installment);
    return (
      Number(draft.late_fee_amount || 0) !== Number(installment.late_fee_amount || 0) ||
      Number(draft.discount_amount || 0) !== Number(installment.discount_amount || 0) ||
      Number(draft.waived_amount || 0) !== Number(installment.waived_amount || 0)
    );
  };

  const persistAdjustmentIfNeeded = async (installment: Installment) => {
    if (!hasUnsavedAdjustmentChanges(installment)) return;
    await updateInstallmentAdjustments(installment.id, getAdjustmentDraft(installment));
  };

  const getDraftTotal = (installment: Installment) => {
    const draft = getPaymentDraft(installment);
    return Number(draft.tuition || 0) + Number(draft.hostel || 0) + Number(draft.transport || 0) + Number(draft.adjustment || 0);
  };

  const handleCreateDefinition = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await saveFeeDefinition(editingStructureId, definitionForm);
      setMessage(editingStructureId ? "Fee definition updated." : "Fee definition saved.");
      setEditingStructureId(null);
      await loadPage(undefined, summaryScope);
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || "Failed to save fee definition.");
    }
  };

  const handleEditDefinition = (definition: any) => {
    setEditingStructureId(definition.id);
    setDefinitionForm({
      name: definition.name,
      program_type: definition.program_type,
      board: definition.board || "CBSE",
      class_name: definition.class_name || "",
      course_name: definition.course_name || "",
      academic_year: definition.academic_year || "",
      duration_months: String(definition.duration_months || 12),
      session_start_month: String(definition.session_start_month || 3),
      session_end_month: String(definition.session_end_month || 2),
      tuition_total: String(definition.tuition_total || 0),
      hostel_total: String(definition.hostel_total || 0),
      transport_total: String(definition.transport_total || 0),
      description: definition.description || "",
    });
  };

  const handleDeleteDefinition = async (definitionId: number) => {
    if (!window.confirm("Delete this fee definition?")) return;
    setMessage("");
    setError("");
    try {
      await deleteFeeDefinition(definitionId);
      setMessage("Fee definition deleted.");
      if (editingStructureId === definitionId) setEditingStructureId(null);
      await loadPage(undefined, summaryScope);
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.error || "Failed to delete fee definition.");
    }
  };

  const handleUpdateStudentPlan = async () => {
    if (!selectedStudentId) return;
    setMessage("");
    setError("");
    try {
      await updateStudentPlan(selectedStudentId, planForm);
      setMessage("Student fee plan updated.");
      await loadPage(selectedStudentId, summaryScope);
    } catch (planError: any) {
      setError(planError.response?.data?.error || "Failed to update student fee plan.");
    }
  };

  const handleStudentChange = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setMessage("");
    setError("");
    setStudentPaymentAmount("");
    setStudentPaymentMode("adjust_pending");
    setStudentInstallmentView("due_now");
    if (!studentId) {
      setStudentFees(null);
      return;
    }
    await loadPage(studentId, summaryScope);
  };

  const handleApplyStudentPayment = async () => {
    if (!selectedStudentId) return;
    const amount = Number(studentPaymentAmount);
    if (!amount) return;
    setMessage("");
    setError("");
    try {
      const response = await applyStudentPayment(selectedStudentId, amount, studentPaymentMode);
      const advanceAdded = Number(response?.advance_added || 0);
      const advanceBalance = Number(response?.available_advance_balance || 0);
      if (studentPaymentMode === "store_as_advance") {
        setMessage(`Advance deposit recorded. Available advance balance: ₹${advanceBalance.toFixed(2)}.`);
      } else if (advanceAdded > 0) {
        setMessage(`Payment recorded. ₹${advanceAdded.toFixed(2)} stored as advance. Available advance balance: ₹${advanceBalance.toFixed(2)}.`);
      } else {
        setMessage("Student payment recorded and applied to pending installments.");
      }
      setStudentPaymentAmount("");
      await loadPage(selectedStudentId, summaryScope);
    } catch (paymentError: any) {
      setError(paymentError.response?.data?.error || "Failed to apply student payment.");
    }
  };

  const handlePayInstallment = async (installmentId: number) => {
    const installment = studentFees?.installments.find((item: Installment) => item.id === installmentId);
    if (!installment) return;
    const draft = getPaymentDraft(installment);
    const tuitionAmount = Number(draft.tuition || 0);
    const hostelAmount = Number(draft.hostel || 0);
    const transportAmount = Number(draft.transport || 0);
    const adjustmentAmount = Number(draft.adjustment || 0);
    const amount = tuitionAmount + hostelAmount + transportAmount + adjustmentAmount;
    if (!amount) return;
    setMessage("");
    setError("");
    try {
      await persistAdjustmentIfNeeded(installment);
      await payInstallment(installmentId, {
        amount,
        tuition_amount: tuitionAmount,
        hostel_amount: hostelAmount,
        transport_amount: transportAmount,
        adjustment_amount: adjustmentAmount,
      });
      setPaymentStates((current) => {
        const next = { ...current };
        delete next[installmentId];
        return next;
      });
      setMessage("Payment recorded successfully.");
      await loadPage(selectedStudentId, summaryScope);
    } catch (paymentError: any) {
      setError(paymentError.response?.data?.error || "Failed to record payment.");
    }
  };

  const handleUseAdvance = async (installmentId: number) => {
    if (!selectedStudentId) return;
    setMessage("");
    setError("");
    try {
      const response = await useAdvanceOnInstallment(installmentId);
      const appliedAmount = Number(response?.amount_applied || 0);
      const remainingAdvance = Number(response?.available_advance_balance || 0);
      setMessage(`Advance applied successfully. ₹${appliedAmount.toFixed(2)} used. Remaining advance balance: ₹${remainingAdvance.toFixed(2)}.`);
      await loadPage(selectedStudentId, summaryScope);
    } catch (advanceError: any) {
      setError(advanceError.response?.data?.error || "Failed to apply advance.");
    }
  };

  return {
    definitions,
    students,
    selectedStudentId,
    setSelectedStudentId,
    studentFees,
    summary,
    board,
    summaryScope,
    setSummaryScope,
    summaryMonth,
    setSummaryMonth,
    studentInstallmentView,
    setStudentInstallmentView,
    loading,
    studentPaymentAmount,
    setStudentPaymentAmount,
    studentPaymentMode,
    setStudentPaymentMode,
    paymentHistory,
    editingStructureId,
    setEditingStructureId,
    planForm,
    setPlanForm,
    definitionForm,
    setDefinitionForm,
    message,
    setMessage,
    error,
    setError,
    selectedStudent,
    selectedStudentSummary,
    filteredInstallments,
    getAdjustmentDraft,
    getAdjustmentPreview,
    getRemainingByHead: getRemaining,
    getPaymentDraft,
    updatePaymentDraft,
    resetPaymentDraftToDue,
    updateAdjustmentDraft,
    getDraftTotal,
    handleCreateDefinition,
    handleEditDefinition,
    handleDeleteDefinition,
    handleUpdateStudentPlan,
    handleStudentChange,
    handleApplyStudentPayment,
    handlePayInstallment,
    handleUseAdvance,
    persistAdjustmentIfNeeded,
    loadPage,
    boardOptions,
    currency,
  };
}
