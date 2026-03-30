import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api from "../../services/api";

type FeeDefinition = {
  id: number;
  name: string;
  program_type: "academic" | "course";
  description?: string | null;
  board?: string | null;
  class_name?: string | null;
  course_name?: string | null;
  academic_year?: string | null;
  duration_months: number;
  session_start_month?: number | null;
  session_end_month?: number | null;
  tuition_total: string | number;
  hostel_total: string | number;
  transport_total: string | number;
  monthly_tuition_fee: string | number;
  monthly_hostel_fee: string | number;
  monthly_transport_fee: string | number;
};

type Student = {
  id: number;
  name: string;
  class: string;
  roll_number?: string | null;
  board?: string | null;
  academic_year?: string | null;
  fee_definition_name?: string | null;
};

type Installment = {
  id: number;
  installment_label: string;
  total_amount: string | number;
  late_fee_amount?: string | number;
  discount_amount?: string | number;
  waived_amount?: string | number;
  tuition_amount: string | number;
  hostel_amount: string | number;
  transport_amount: string | number;
  paid_amount: string | number;
  paid_tuition_amount?: string | number;
  paid_hostel_amount?: string | number;
  paid_transport_amount?: string | number;
  paid_adjustment_amount?: string | number;
  balance: string | number;
  status: string;
  due_date: string;
  last_payment_date?: string | null;
  months_covered: number;
};

type StudentFeeResponse = {
  profile: any;
  summary: FeeSummary;
  installments: Installment[];
};

type FeePaymentRecord = {
  id: number;
  fee_id?: number | null;
  amount: string | number;
  advance_amount?: string | number;
  tuition_amount?: string | number;
  hostel_amount?: string | number;
  transport_amount?: string | number;
  adjustment_amount?: string | number;
  payment_date: string;
  payment_mode?: string | null;
  notes?: string | null;
  installment_label?: string | null;
  billing_cycle?: string | null;
};

type CollectionBoard = {
  month: string;
  stats: {
    overdue_count: string | number;
    current_month_count: string | number;
    reminded_count: string | number;
    overdue_amount: string | number;
    current_month_amount: string | number;
  };
  pending_installments: Array<{
    id: number;
    student_id: number;
    installment_label: string;
    due_date: string;
    balance: string | number;
    status: string;
    student_name: string;
    class: string;
    fee_definition_name?: string | null;
  }>;
};

type FeeSummary = {
  label?: string;
  total_billed: string | number;
  total_collected?: string | number;
  total_paid?: string | number;
  total_pending: string | number;
  tuition_billed: string | number;
  tuition_collected?: string | number;
  tuition_paid?: string | number;
  tuition_pending: string | number;
  hostel_billed: string | number;
  hostel_collected?: string | number;
  hostel_paid?: string | number;
  hostel_pending: string | number;
  transport_billed: string | number;
  transport_collected?: string | number;
  transport_paid?: string | number;
  transport_pending: string | number;
};

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  marginTop: 6,
};

const currency = (value: string | number | null | undefined) => `₹${Number(value || 0).toFixed(2)}`;
const boardOptions = ["CBSE", "State Board", "ICSE", "Other"];
const defaultMonth = new Date().toISOString().slice(0, 7);
const emptyFeeSummary: FeeSummary = {
  total_billed: 0,
  total_collected: 0,
  total_paid: 0,
  total_pending: 0,
  tuition_billed: 0,
  tuition_collected: 0,
  tuition_paid: 0,
  tuition_pending: 0,
  hostel_billed: 0,
  hostel_collected: 0,
  hostel_paid: 0,
  hostel_pending: 0,
  transport_billed: 0,
  transport_collected: 0,
  transport_paid: 0,
  transport_pending: 0,
};

export default function FeesPage() {
  const [definitions, setDefinitions] = useState<FeeDefinition[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentFees, setStudentFees] = useState<StudentFeeResponse | null>(null);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [board, setBoard] = useState<CollectionBoard | null>(null);
  const [summaryScope, setSummaryScope] = useState<"current_month" | "all">("current_month");
  const [summaryMonth, setSummaryMonth] = useState(defaultMonth);
  const [studentInstallmentView, setStudentInstallmentView] = useState<"due_now" | "all">("due_now");
  const [loading, setLoading] = useState(true);
  const [paymentStates, setPaymentStates] = useState<Record<number, { tuition: string; hostel: string; transport: string; adjustment: string }>>({});
  const [studentPaymentAmount, setStudentPaymentAmount] = useState("");
  const [studentPaymentMode, setStudentPaymentMode] = useState<"adjust_pending" | "store_as_advance">("adjust_pending");
  const [paymentHistory, setPaymentHistory] = useState<FeePaymentRecord[]>([]);
  const [adjustmentStates, setAdjustmentStates] = useState<Record<number, { late_fee_amount: string; discount_amount: string; waived_amount: string }>>({});
  const [editingStructureId, setEditingStructureId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState({
    fee_structure_id: "",
    billing_cycle: "monthly",
    due_day: "5",
    include_hostel: false,
    include_transport: false,
  });
  const [definitionForm, setDefinitionForm] = useState({
    name: "Class X CBSE",
    program_type: "academic",
    board: "CBSE",
    class_name: "Class X",
    course_name: "",
    academic_year: "2026-2027",
    duration_months: "12",
    session_start_month: "3",
    session_end_month: "2",
    tuition_total: "24000",
    hostel_total: "18000",
    transport_total: "18000",
    description: "Academic session fee definition",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPage = async (studentId?: string, scope?: "current_month" | "all") => {
    setLoading(true);
    setError("");

    try {
      const activeScope = scope || summaryScope;
      const [definitionsRes, studentsRes, summaryRes, boardRes] = await Promise.all([
        api.get("/fees/structures"),
        api.get("/students"),
        api.get("/fees/summary", { params: { scope: activeScope, month: summaryMonth } }),
        api.get("/fees/board", { params: { month: summaryMonth } }),
      ]);

      setDefinitions(definitionsRes.data || []);
      setStudents(studentsRes.data || []);
      setSummary(summaryRes.data || null);
      setBoard(boardRes.data || null);

      const targetStudentId = studentId || selectedStudentId;
      if (targetStudentId) {
        const [feesRes, historyRes] = await Promise.all([
          api.get(`/fees/student/${targetStudentId}`),
          api.get(`/fees/student/${targetStudentId}/payments`),
        ]);
        setStudentFees(feesRes.data || null);
        setPaymentHistory(historyRes.data || []);
        if (feesRes.data && feesRes.data.profile) {
          setPlanForm({
            fee_structure_id: String(feesRes.data.profile.fee_structure_id || ""),
            billing_cycle: feesRes.data.profile.billing_cycle || "monthly",
            due_day: String(feesRes.data.profile.due_day || 5),
            include_hostel: Boolean(feesRes.data.profile.include_hostel),
            include_transport: Boolean(feesRes.data.profile.include_transport),
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

    return studentFees.installments.filter((installment) => new Date(installment.due_date) <= currentMonthEnd);
  }, [studentFees, studentInstallmentView]);

  const getRemainingByHead = (installment: Installment) => {
    let tuition = Math.max(0, Number(installment.tuition_amount) - Number(installment.paid_tuition_amount || 0));
    let hostel = Math.max(0, Number(installment.hostel_amount) - Number(installment.paid_hostel_amount || 0));
    let transport = Math.max(0, Number(installment.transport_amount) - Number(installment.paid_transport_amount || 0));

    const adjustmentPreview = getAdjustmentPreview(installment);
    let concessionLeft = Math.max(0, adjustmentPreview.discount + adjustmentPreview.waived);

    if (concessionLeft > 0) {
      const tuitionReduction = Math.min(concessionLeft, tuition);
      tuition -= tuitionReduction;
      concessionLeft -= tuitionReduction;
    }

    if (concessionLeft > 0) {
      const hostelReduction = Math.min(concessionLeft, hostel);
      hostel -= hostelReduction;
      concessionLeft -= hostelReduction;
    }

    if (concessionLeft > 0) {
      const transportReduction = Math.min(concessionLeft, transport);
      transport -= transportReduction;
      concessionLeft -= transportReduction;
    }

    const adjustment = Math.max(0, adjustmentPreview.lateFee - Number(installment.paid_adjustment_amount || 0));

    return { tuition, hostel, transport, adjustment };
  };

  const getPaymentDraft = (installment: Installment) => {
    const remaining = getRemainingByHead(installment);
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
    const remaining = getRemainingByHead(installment);
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
    const remaining = getRemainingByHead(installment);
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

  const getAdjustmentDraft = (installment: Installment) => adjustmentStates[installment.id] || {
    late_fee_amount: String(Number(installment.late_fee_amount || 0)),
    discount_amount: String(Number(installment.discount_amount || 0)),
    waived_amount: String(Number(installment.waived_amount || 0)),
  };

  const updateAdjustmentDraft = (
    installment: Installment,
    field: "late_fee_amount" | "discount_amount" | "waived_amount",
    value: string
  ) => {
    const current = getAdjustmentDraft(installment);
    const nextDraft = { ...current, [field]: value };
    setAdjustmentStates((state) => ({
      ...state,
      [installment.id]: nextDraft,
    }));
    const lateFee = Number(nextDraft.late_fee_amount || 0);
    const discount = Number(nextDraft.discount_amount || 0);
    const waived = Number(nextDraft.waived_amount || 0);

    let tuition = Math.max(0, Number(installment.tuition_amount) - Number(installment.paid_tuition_amount || 0));
    let hostel = Math.max(0, Number(installment.hostel_amount) - Number(installment.paid_hostel_amount || 0));
    let transport = Math.max(0, Number(installment.transport_amount) - Number(installment.paid_transport_amount || 0));
    let concessionLeft = Math.max(0, discount + waived);

    if (concessionLeft > 0) {
      const tuitionReduction = Math.min(concessionLeft, tuition);
      tuition -= tuitionReduction;
      concessionLeft -= tuitionReduction;
    }
    if (concessionLeft > 0) {
      const hostelReduction = Math.min(concessionLeft, hostel);
      hostel -= hostelReduction;
      concessionLeft -= hostelReduction;
    }
    if (concessionLeft > 0) {
      const transportReduction = Math.min(concessionLeft, transport);
      transport -= transportReduction;
      concessionLeft -= transportReduction;
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

    const draft = getAdjustmentDraft(installment);
    await api.patch(`/fees/${installment.id}/adjust`, {
      late_fee_amount: Number(draft.late_fee_amount || 0),
      discount_amount: Number(draft.discount_amount || 0),
      waived_amount: Number(draft.waived_amount || 0),
    });
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
      const payload = {
        name: definitionForm.name,
        program_type: definitionForm.program_type,
        board: definitionForm.program_type === "academic" ? definitionForm.board : undefined,
        class_name: definitionForm.program_type === "academic" ? definitionForm.class_name : undefined,
        course_name: definitionForm.program_type === "course" ? definitionForm.course_name : undefined,
        academic_year: definitionForm.program_type === "academic" ? definitionForm.academic_year : undefined,
        duration_months: Number(definitionForm.duration_months),
        session_start_month: definitionForm.program_type === "academic" ? Number(definitionForm.session_start_month) : undefined,
        session_end_month: definitionForm.program_type === "academic" ? Number(definitionForm.session_end_month) : undefined,
        tuition_total: Number(definitionForm.tuition_total),
        hostel_total: Number(definitionForm.hostel_total || 0),
        transport_total: Number(definitionForm.transport_total || 0),
        description: definitionForm.description,
      };
      if (editingStructureId) {
        await api.patch(`/fees/structures/${editingStructureId}`, payload);
      } else {
        await api.post("/fees/structures", payload);
      }

      setMessage(editingStructureId ? "Fee definition updated." : "Fee definition saved.");
      setEditingStructureId(null);
      await loadPage(undefined, summaryScope);
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || "Failed to save fee definition.");
    }
  };

  const handleEditDefinition = (definition: FeeDefinition) => {
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
      await api.delete(`/fees/structures/${definitionId}`);
      setMessage("Fee definition deleted.");
      if (editingStructureId === definitionId) {
        setEditingStructureId(null);
      }
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
      await api.patch(`/fees/student/${selectedStudentId}/plan`, {
        fee_structure_id: Number(planForm.fee_structure_id),
        billing_cycle: planForm.billing_cycle,
        due_day: Number(planForm.due_day),
        include_hostel: planForm.include_hostel,
        include_transport: planForm.include_transport,
      });
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
      const response = await api.post(`/fees/students/${selectedStudentId}/pay`, {
        amount,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_mode: "cash",
        student_payment_mode: studentPaymentMode,
      });

      const advanceAdded = Number(response.data?.advance_added || 0);
      const advanceBalance = Number(response.data?.available_advance_balance || 0);
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
    const installment = studentFees?.installments.find((item) => item.id === installmentId);
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
      await api.patch(`/fees/${installmentId}/pay`, {
        amount,
        tuition_amount: tuitionAmount,
        hostel_amount: hostelAmount,
        transport_amount: transportAmount,
        adjustment_amount: adjustmentAmount,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_mode: "cash",
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
      const response = await api.post(`/fees/${installmentId}/use-advance`);
      const appliedAmount = Number(response.data?.amount_applied || 0);
      const remainingAdvance = Number(response.data?.available_advance_balance || 0);
      setMessage(`Advance applied successfully. ₹${appliedAmount.toFixed(2)} used. Remaining advance balance: ₹${remainingAdvance.toFixed(2)}.`);
      await loadPage(selectedStudentId, summaryScope);
    } catch (advanceError: any) {
      setError(advanceError.response?.data?.error || "Failed to apply advance.");
    }
  };

  const handleGenerateBill = async (installment: Installment) => {
    if (!selectedStudent) return;

    setMessage("");
    setError("");

    try {
      await persistAdjustmentIfNeeded(installment);
    } catch (printError: any) {
      setError(printError.response?.data?.error || "Failed to apply adjustment before printing.");
      return;
    }

    const draft = getPaymentDraft(installment);
    const adjustmentPreview = getAdjustmentPreview(installment);
    const tuitionAmount = Number(draft.tuition || 0);
    const hostelAmount = Number(draft.hostel || 0);
    const transportAmount = Number(draft.transport || 0);
    const adjustmentAmount = Number(draft.adjustment || 0);
    const total = tuitionAmount + hostelAmount + transportAmount + adjustmentAmount;
    const totalBill = Number(adjustmentPreview.adjustedTotal || 0);
    const dueAmount = Number(adjustmentPreview.balance || 0);

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const title = `${selectedStudent.name} - ${installment.installment_label} Bill`;
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
        <body>
          <h1>Fee Bill</h1>
          <div class="muted">Generated on ${new Date().toLocaleDateString()}</div>
          <div class="card">
            <div class="row"><span>Student</span><strong>${selectedStudent.name}</strong></div>
            <div class="row"><span>Class</span><strong>${selectedStudent.class}</strong></div>
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
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleGenerateReceipt = (installment: Installment) => {
    if (!selectedStudent) return;

    setError("");

    const tuitionPaid = Number(installment.paid_tuition_amount || 0);
    const hostelPaid = Number(installment.paid_hostel_amount || 0);
    const transportPaid = Number(installment.paid_transport_amount || 0);
    const adjustmentPaid = Number(installment.paid_adjustment_amount || 0);
    const totalPaid = Number(installment.paid_amount || 0);
    const totalBill = Number(installment.total_amount || 0);
    const dueAmount = Number(installment.balance || 0);
    const paymentDate = installment.last_payment_date
      ? new Date(installment.last_payment_date).toLocaleDateString()
      : new Date().toLocaleDateString();

    if (!totalPaid) {
      setError("No paid amount is available yet for this installment receipt.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const title = `${selectedStudent.name} - ${installment.installment_label} Receipt`;
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
        <body>
          <h1>Fee Receipt</h1>
          <div class="muted">Generated on ${new Date().toLocaleDateString()}</div>
          <div class="card">
            <div class="row"><span>Student</span><strong>${selectedStudent.name}</strong></div>
            <div class="row"><span>Admission No</span><strong>${selectedStudent.roll_number || studentFees?.profile?.roll_number || "-"}</strong></div>
            <div class="row"><span>Class</span><strong>${selectedStudent.class}</strong></div>
            <div class="row"><span>Board</span><strong>${selectedStudent.board || studentFees?.profile?.board || "-"}</strong></div>
            <div class="row"><span>Session</span><strong>${selectedStudent.academic_year || studentFees?.profile?.academic_year || "-"}</strong></div>
            <div class="row"><span>Plan</span><strong>${studentFees?.profile?.billing_cycle || "-"}</strong></div>
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
          <div class="card">
            <div class="row"><span>Due Amount Pending</span><strong>${currency(dueAmount)}</strong></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleGenerateHistoryReceipt = (payment: FeePaymentRecord) => {
    if (!selectedStudent) return;

    const isAdvance = Number(payment.advance_amount || 0) > 0 && !payment.fee_id;
    const relatedInstallment = !isAdvance
      ? studentFees?.installments.find((installment) => installment.id === payment.fee_id)
      : null;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedStudent.name} Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { margin-bottom: 4px; }
            .muted { color: #6b7280; margin-bottom: 24px; }
            .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .total { font-size: 20px; font-weight: bold; border-top: 1px solid #d1d5db; padding-top: 12px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <h1>${isAdvance ? "Advance Deposit Receipt" : "Fee Payment Receipt"}</h1>
          <div class="muted">Generated on ${new Date(payment.payment_date).toLocaleDateString()}</div>
          <div class="card">
            <div class="row"><span>Student</span><strong>${selectedStudent.name}</strong></div>
            <div class="row"><span>Admission No</span><strong>${selectedStudent.roll_number || studentFees?.profile?.roll_number || "-"}</strong></div>
            <div class="row"><span>Class</span><strong>${selectedStudent.class}</strong></div>
            <div class="row"><span>Board</span><strong>${selectedStudent.board || studentFees?.profile?.board || "-"}</strong></div>
            <div class="row"><span>Session</span><strong>${selectedStudent.academic_year || studentFees?.profile?.academic_year || "-"}</strong></div>
            <div class="row"><span>Plan</span><strong>${studentFees?.profile?.billing_cycle || "-"}</strong></div>
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
          <div class="card">
            <div class="row"><span>Due Amount Pending</span><strong>${currency(relatedInstallment?.balance)}</strong></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Fees And Fee Definitions</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Create academic or course fee definitions with tuition, hostel, and transport together. Admission applies only the selected parts for each student.
        </p>
      </div>

      {summary && (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSummaryScope("current_month")}
              style={{
                background: summaryScope === "current_month" ? "#2563eb" : "#fff",
                color: summaryScope === "current_month" ? "#fff" : "#1f2937",
                border: "1px solid #cbd5e1",
                borderRadius: 999,
                padding: "8px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={() => setSummaryScope("all")}
              style={{
                background: summaryScope === "all" ? "#2563eb" : "#fff",
                color: summaryScope === "all" ? "#fff" : "#1f2937",
                border: "1px solid #cbd5e1",
                borderRadius: 999,
                padding: "8px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Overall
            </button>
            {summaryScope === "current_month" && (
              <div style={{ minWidth: 180 }}>
                  <input
                    type="month"
                    value={summaryMonth}
                    onChange={(e) => setSummaryMonth(e.target.value)}
                    style={inputStyle}
                  />
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
              <BreakdownCard
                title="Tuition"
                billed={summary.tuition_billed}
                paid={summary.tuition_paid}
                pending={summary.tuition_pending}
                accent="#1d4ed8"
              />
              <BreakdownCard
                title="Hostel"
                billed={summary.hostel_billed}
                paid={summary.hostel_paid}
                pending={summary.hostel_pending}
                accent="#7c3aed"
              />
              <BreakdownCard
                title="Transport"
                billed={summary.transport_billed}
                paid={summary.transport_paid}
                pending={summary.transport_pending}
                accent="#0f766e"
              />
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
              <div style={{ marginTop: 14, color: "#64748b", fontWeight: 600 }}>
                Reminder marked this month: {board.stats.reminded_count || 0}
              </div>
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
      )}

      <form onSubmit={handleCreateDefinition} style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>{editingStructureId ? "Edit Fee Definition" : "Create Fee Definition"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Field label="Program Type">
            <select value={definitionForm.program_type} onChange={(e) => setDefinitionForm((current) => ({ ...current, program_type: e.target.value }))} style={inputStyle}>
              <option value="academic">Academic</option>
              <option value="course">Course</option>
            </select>
          </Field>
          <Field label="Fee Name">
            <input value={definitionForm.name} onChange={(e) => setDefinitionForm((current) => ({ ...current, name: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Duration (months)">
            <input type="number" min="1" max="24" value={definitionForm.duration_months} onChange={(e) => setDefinitionForm((current) => ({ ...current, duration_months: e.target.value }))} style={inputStyle} />
          </Field>
        </div>

        {definitionForm.program_type === "academic" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <Field label="Board">
              <select value={definitionForm.board} onChange={(e) => setDefinitionForm((current) => ({ ...current, board: e.target.value }))} style={inputStyle}>
                {boardOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Class">
              <input value={definitionForm.class_name} onChange={(e) => setDefinitionForm((current) => ({ ...current, class_name: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Academic Year">
              <input value={definitionForm.academic_year} onChange={(e) => setDefinitionForm((current) => ({ ...current, academic_year: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Session Start Month">
              <input type="number" min="1" max="12" value={definitionForm.session_start_month} onChange={(e) => setDefinitionForm((current) => ({ ...current, session_start_month: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Session End Month">
              <input type="number" min="1" max="12" value={definitionForm.session_end_month} onChange={(e) => setDefinitionForm((current) => ({ ...current, session_end_month: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
        ) : (
          <Field label="Course Name">
            <input value={definitionForm.course_name} onChange={(e) => setDefinitionForm((current) => ({ ...current, course_name: e.target.value }))} style={inputStyle} />
          </Field>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Field label="Tuition Total">
            <input type="number" min="0" value={definitionForm.tuition_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, tuition_total: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Hostel Total">
            <input type="number" min="0" value={definitionForm.hostel_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, hostel_total: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Transport Total">
            <input type="number" min="0" value={definitionForm.transport_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, transport_total: e.target.value }))} style={inputStyle} />
          </Field>
        </div>

        <Field label="Description">
          <input value={definitionForm.description} onChange={(e) => setDefinitionForm((current) => ({ ...current, description: e.target.value }))} style={inputStyle} />
        </Field>

        <button
          type="submit"
          style={{
            marginTop: 18,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {editingStructureId ? "Update Fee Definition" : "Save Fee Definition"}
        </button>
        {editingStructureId && (
          <button
            type="button"
            onClick={() => setEditingStructureId(null)}
            style={{
              marginTop: 18,
              marginLeft: 12,
              background: "#fff",
              color: "#1f2937",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "12px 18px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel Edit
          </button>
        )}
      </form>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Saved Fee Definitions</h2>
        {definitions.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No fee definitions found.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {definitions.map((definition) => (
              <div key={definition.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <strong>{definition.name}</strong>
                <div style={{ marginTop: 6, color: "#4b5563" }}>
                  {definition.program_type === "academic"
                    ? `${definition.board || "Academic"} • ${definition.class_name} • ${definition.academic_year}`
                    : `Course • ${definition.course_name} • ${definition.duration_months} months`}
                </div>
                <div style={{ marginTop: 8, color: "#1f2937" }}>
                  Tuition {currency(definition.tuition_total)} | Hostel {currency(definition.hostel_total)} | Transport {currency(definition.transport_total)}
                </div>
                <div style={{ marginTop: 6, color: "#6b7280" }}>
                  Monthly view: {currency(definition.monthly_tuition_fee)} tuition + {currency(definition.monthly_hostel_fee)} hostel + {currency(definition.monthly_transport_fee)} transport
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleEditDefinition(definition)}
                    style={{
                      background: "#fff",
                      color: "#1f2937",
                      border: "1px solid #cbd5e1",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDefinition(definition.id)}
                    style={{
                      background: "#fff",
                      color: "#b91c1c",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Student Fee Review</h2>
        <Field label="Select Student">
          <select value={selectedStudentId} onChange={(e) => handleStudentChange(e.target.value)} style={inputStyle}>
            <option value="">Choose a student</option>
            {students.map((student) => (
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
              <div style={{ color: "#334155", marginTop: 8, fontWeight: 600 }}>
                Advance balance: {currency(studentFees.profile?.advance_fee_balance)}
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 16, background: "#f8fafc" }}>
              <div style={{ fontWeight: 700 }}>Edit Student Fee Plan</div>
              <div style={{ color: "#64748b", marginTop: 6 }}>
                This can update the active plan only when no installment payment has been recorded yet.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
                <Field label="Fee Definition">
                  <select
                    value={planForm.fee_structure_id}
                    onChange={(e) => setPlanForm((current) => ({ ...current, fee_structure_id: e.target.value }))}
                    style={{ ...inputStyle, marginTop: 0 }}
                  >
                    <option value="">Choose fee definition</option>
                    {definitions.map((definition) => (
                      <option key={definition.id} value={definition.id}>
                        {definition.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Billing Cycle">
                  <select
                    value={planForm.billing_cycle}
                    onChange={(e) => setPlanForm((current) => ({ ...current, billing_cycle: e.target.value }))}
                    style={{ ...inputStyle, marginTop: 0 }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="yearly">Yearly</option>
                    <option value="full_package">Full Package</option>
                  </select>
                </Field>
                <Field label="Due Day">
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={planForm.due_day}
                    onChange={(e) => setPlanForm((current) => ({ ...current, due_day: e.target.value }))}
                    style={{ ...inputStyle, marginTop: 0 }}
                  />
                </Field>
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 12, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={planForm.include_hostel}
                    onChange={(e) => setPlanForm((current) => ({ ...current, include_hostel: e.target.checked }))}
                  />
                  Include Hostel
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={planForm.include_transport}
                    onChange={(e) => setPlanForm((current) => ({ ...current, include_transport: e.target.checked }))}
                  />
                  Include Transport
                </label>
              </div>
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={handleUpdateStudentPlan}
                  style={{
                    background: "#fff",
                    color: "#1f2937",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Update Fee Plan
                </button>
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 16, background: "#f8fafc" }}>
              <div style={{ fontWeight: 700 }}>Student Payment And Advance</div>
              <div style={{ color: "#64748b", marginTop: 6 }}>
                Choose whether the amount should clear the oldest pending installments first or be stored fully as advance credit for future dues.
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                <Field label="Mode">
                  <select
                    value={studentPaymentMode}
                    onChange={(e) => setStudentPaymentMode(e.target.value as "adjust_pending" | "store_as_advance")}
                    style={{ ...inputStyle, marginTop: 0, minWidth: 240 }}
                  >
                    <option value="adjust_pending">Adjust Against Pending</option>
                    <option value="store_as_advance">Store As Advance</option>
                  </select>
                </Field>
                <Field label="Amount">
                  <input
                    type="number"
                    min="1"
                    value={studentPaymentAmount}
                    onChange={(e) => setStudentPaymentAmount(e.target.value)}
                    style={{ ...inputStyle, marginTop: 0, minWidth: 220 }}
                  />
                </Field>
                <button
                  type="button"
                  onClick={handleApplyStudentPayment}
                  style={{
                    background: "#0f766e",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Apply Student Payment
                </button>
              </div>
              <div style={{ color: "#64748b", marginTop: 10, fontSize: 14 }}>
                {studentPaymentMode === "adjust_pending"
                  ? "This will clear the oldest pending installments first. Any extra amount left after all dues are cleared will be stored as advance."
                  : "This will not touch current pending installments. The full amount will be stored directly in advance balance."}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <BreakdownCard
                title="Tuition"
                billed={selectedStudentSummary.tuition_billed}
                paid={selectedStudentSummary.tuition_paid}
                pending={selectedStudentSummary.tuition_pending}
                accent="#1d4ed8"
              />
              <BreakdownCard
                title="Hostel"
                billed={selectedStudentSummary.hostel_billed}
                paid={selectedStudentSummary.hostel_paid}
                pending={selectedStudentSummary.hostel_pending}
                accent="#7c3aed"
              />
              <BreakdownCard
                title="Transport"
                billed={selectedStudentSummary.transport_billed}
                paid={selectedStudentSummary.transport_paid}
                pending={selectedStudentSummary.transport_pending}
                accent="#0f766e"
              />
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setStudentInstallmentView("due_now")}
                style={{
                  background: studentInstallmentView === "due_now" ? "#2563eb" : "#fff",
                  color: studentInstallmentView === "due_now" ? "#fff" : "#1f2937",
                  border: "1px solid #cbd5e1",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Current And Overdue
              </button>
              <button
                type="button"
                onClick={() => setStudentInstallmentView("all")}
                style={{
                  background: studentInstallmentView === "all" ? "#2563eb" : "#fff",
                  color: studentInstallmentView === "all" ? "#fff" : "#1f2937",
                  border: "1px solid #cbd5e1",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                All Installments
              </button>
            </div>

            {filteredInstallments.length === 0 ? (
              <div>No installments found for this student.</div>
            ) : (
              filteredInstallments.map((installment) => (
                <div key={installment.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                  {(() => {
                    const adjustmentPreview = getAdjustmentPreview(installment);
                    return (
                      <>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <strong>{installment.installment_label}</strong>
                      <div style={{ color: "#6b7280", marginTop: 6 }}>
                        Due {new Date(installment.due_date).toLocaleDateString()} • Covers {installment.months_covered} month(s)
                      </div>
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
                    <Metric label="Due Tuition" value={currency(getRemainingByHead(installment).tuition)} />
                    <Metric label="Due Hostel" value={currency(getRemainingByHead(installment).hostel)} />
                    <Metric label="Due Transport" value={currency(getRemainingByHead(installment).transport)} />
                    <Metric label="Due Adjustment" value={currency(getRemainingByHead(installment).adjustment)} />
                    <Metric label="Adjusted Total" value={currency(adjustmentPreview.adjustedTotal)} />
                    <Metric label="Due Now" value={currency(adjustmentPreview.balance)} />
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 12,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", color: "#334155", fontWeight: 600 }}>
                      <span>Paid: {currency(installment.paid_amount)}</span>
                      <span>Pending: {currency(adjustmentPreview.balance)}</span>
                      <span>Advance Available: {currency(studentFees.profile?.advance_fee_balance)}</span>
                    </div>
                    <div style={{ color: "#64748b" }}>
                      Pending heads: Tuition {currency(getRemainingByHead(installment).tuition)}, Hostel {currency(getRemainingByHead(installment).hostel)}, Transport {currency(getRemainingByHead(installment).transport)}, Adjustment {currency(getRemainingByHead(installment).adjustment)}
                    </div>
                    <div style={{ color: "#64748b" }}>
                      Adjustments: Late fee {currency(adjustmentPreview.lateFee)}, Discount {currency(adjustmentPreview.discount)}, Waived {currency(adjustmentPreview.waived)}
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {Number(installment.paid_amount || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleGenerateReceipt(installment)}
                          style={{
                            background: "#fff",
                            color: "#1f2937",
                            border: "1px solid #cbd5e1",
                            borderRadius: 10,
                            padding: "12px 18px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Generate Receipt
                        </button>
                      )}
                      {installment.status !== "paid" && Number(studentFees.profile?.advance_fee_balance || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUseAdvance(installment.id)}
                          style={{
                            background: "#fff7ed",
                            color: "#9a3412",
                            border: "1px solid #fdba74",
                            borderRadius: 10,
                            padding: "12px 18px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Use Advance
                        </button>
                      )}
                      {installment.status !== "paid" && (
                        <button
                          type="button"
                          onClick={() => handleGenerateBill(installment)}
                          style={{
                            background: "#fff",
                            color: "#1f2937",
                            border: "1px solid #cbd5e1",
                            borderRadius: 10,
                            padding: "12px 18px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Print Bill
                        </button>
                      )}
                    </div>

                    {installment.status !== "paid" && (
                      <>
                      <div style={{ fontWeight: 700 }}>Fine / Discount / Waive</div>
                      <div style={{ color: "#64748b", fontSize: 14 }}>
                        These values update the due and payment suggestion immediately. They will be applied automatically when you print the bill or record payment.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                        <Field label="Late Fee">
                          <input
                            type="number"
                            min="0"
                            value={getAdjustmentDraft(installment).late_fee_amount}
                            onChange={(e) => updateAdjustmentDraft(installment, "late_fee_amount", e.target.value)}
                            style={{ ...inputStyle, marginTop: 0 }}
                          />
                        </Field>
                        <Field label="Discount">
                          <input
                            type="number"
                            min="0"
                            value={getAdjustmentDraft(installment).discount_amount}
                            onChange={(e) => updateAdjustmentDraft(installment, "discount_amount", e.target.value)}
                            style={{ ...inputStyle, marginTop: 0 }}
                          />
                        </Field>
                        <Field label="Waive Amount">
                          <input
                            type="number"
                            min="0"
                            value={getAdjustmentDraft(installment).waived_amount}
                            onChange={(e) => updateAdjustmentDraft(installment, "waived_amount", e.target.value)}
                            style={{ ...inputStyle, marginTop: 0 }}
                          />
                        </Field>
                      </div>
                      <div style={{ fontWeight: 700 }}>Payment Entry</div>
                      <div style={{ color: "#64748b", fontSize: 14 }}>
                        Use this section only for this installment. Partial pending can be paid later from the same card when it shows in Current And Overdue, or you can switch to All Installments to pay any future/older month directly. If the parent is paying extra for future months too, use the Student Payment And Advance box above.
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => resetPaymentDraftToDue(installment)}
                          style={{
                            background: "#fff",
                            color: "#1f2937",
                            border: "1px solid #cbd5e1",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Use Due Amounts
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                        <Field label="Tuition Payment">
                          <input
                            type="number"
                            min="0"
                            max={getRemainingByHead(installment).tuition}
                            value={getPaymentDraft(installment).tuition}
                            onChange={(e) => updatePaymentDraft(installment, "tuition", e.target.value)}
                            style={{ ...inputStyle, marginTop: 0, background: getRemainingByHead(installment).tuition === 0 ? "#f3f4f6" : "#fff" }}
                            disabled={getRemainingByHead(installment).tuition === 0}
                          />
                        </Field>
                        <Field label="Hostel Payment">
                          <input
                            type="number"
                            min="0"
                            max={getRemainingByHead(installment).hostel}
                            value={getPaymentDraft(installment).hostel}
                            onChange={(e) => updatePaymentDraft(installment, "hostel", e.target.value)}
                            style={{ ...inputStyle, marginTop: 0, background: getRemainingByHead(installment).hostel === 0 ? "#f3f4f6" : "#fff" }}
                            disabled={getRemainingByHead(installment).hostel === 0}
                          />
                        </Field>
                        <Field label="Transport Payment">
                          <input
                            type="number"
                            min="0"
                            max={getRemainingByHead(installment).transport}
                            value={getPaymentDraft(installment).transport}
                            onChange={(e) => updatePaymentDraft(installment, "transport", e.target.value)}
                            style={{ ...inputStyle, marginTop: 0, background: getRemainingByHead(installment).transport === 0 ? "#f3f4f6" : "#fff" }}
                            disabled={getRemainingByHead(installment).transport === 0}
                          />
                        </Field>
                        <Field label="Adjustment Payment">
                          <input
                            type="number"
                            min="0"
                            max={getRemainingByHead(installment).adjustment}
                            value={getPaymentDraft(installment).adjustment}
                            onChange={(e) => updatePaymentDraft(installment, "adjustment", e.target.value)}
                            style={{ ...inputStyle, marginTop: 0, background: getRemainingByHead(installment).adjustment === 0 ? "#f3f4f6" : "#fff" }}
                            disabled={getRemainingByHead(installment).adjustment === 0}
                          />
                        </Field>
                        <Metric label="Payment Total" value={currency(getDraftTotal(installment))} />
                      </div>

                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handlePayInstallment(installment.id)}
                        style={{
                          background: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: 10,
                          padding: "12px 18px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        >
                          Record Payment
                        </button>
                      </div>
                      </>
                    )}
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))
            )}

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Payment And Receipt History</h3>
              {paymentHistory.length === 0 ? (
                <div style={{ color: "#6b7280" }}>No payment history found for this student.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <strong>{payment.installment_label || "Advance Deposit"}</strong>
                          <div style={{ color: "#64748b", marginTop: 4 }}>
                            {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_mode || "-"}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700 }}>{currency(payment.amount)}</div>
                      </div>
                      <div style={{ marginTop: 8, color: "#64748b" }}>
                        Tuition {currency(payment.tuition_amount)} | Hostel {currency(payment.hostel_amount)} | Transport {currency(payment.transport_amount)} | Advance {currency(payment.advance_amount)}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleGenerateHistoryReceipt(payment)}
                          style={{
                            background: "#fff",
                            color: "#1f2937",
                            border: "1px solid #cbd5e1",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Print Receipt
                        </button>
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
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `6px solid ${tone}` }}>
      <div style={{ color: "#6b7280", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value}</div>
    </div>
  );
}

function BreakdownCard({
  title,
  billed,
  paid,
  pending,
  accent,
}: {
  title: string;
  billed: string | number | null | undefined;
  paid: string | number | null | undefined;
  pending: string | number | null | undefined;
  accent: string;
}) {
  return (
    <div style={{ border: `1px solid ${accent}22`, borderTop: `4px solid ${accent}`, borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ fontWeight: 700, color: "#111827" }}>{title}</div>
      <div style={{ display: "grid", gap: 6, marginTop: 10, color: "#4b5563" }}>
        <div>Billed: <strong style={{ color: "#111827" }}>{currency(billed)}</strong></div>
        <div>Paid: <strong style={{ color: "#166534" }}>{currency(paid)}</strong></div>
        <div>Pending: <strong style={{ color: "#b45309" }}>{currency(pending)}</strong></div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, { background: string; color: string }> = {
    paid: { background: "#dcfce7", color: "#15803d" },
    partial: { background: "#fef3c7", color: "#b45309" },
    pending: { background: "#dbeafe", color: "#1d4ed8" },
  };

  const current = palette[status] || { background: "#f3f4f6", color: "#4b5563" };

  return (
    <span
      style={{
        background: current.background,
        color: current.color,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "capitalize",
        alignSelf: "flex-start",
      }}
    >
      {status}
    </span>
  );
}
