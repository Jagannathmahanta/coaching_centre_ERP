import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateSalarySlips,
  getSalarySlips,
  getSalaryStructures,
  getSalaryTeachers,
  paySalarySlip,
  saveSalaryStructure,
} from "../services/teacherSalary.service";
import {
  initialSalaryPaymentDraft,
  initialSalaryStructureForm,
  type SalarySlip,
} from "../types/teacherSalary.types";

export function currency(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function useTeacherSalaryData() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [structureForm, setStructureForm] = useState(initialSalaryStructureForm);
  const [paymentDraft, setPaymentDraft] = useState(initialSalaryPaymentDraft);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const teachersQuery = useQuery({ queryKey: ["salary-teachers"], queryFn: getSalaryTeachers });
  const structuresQuery = useQuery({ queryKey: ["teacher-salary-structures"], queryFn: getSalaryStructures });
  const slipsQuery = useQuery({ queryKey: ["teacher-salary-slips", month], queryFn: () => getSalarySlips(month) });

  const saveStructureMutation = useMutation({
    mutationFn: () => saveSalaryStructure(structureForm),
    onSuccess: async () => {
      setMessage("Salary structure saved.");
      setError("");
      setStructureForm(initialSalaryStructureForm);
      await queryClient.invalidateQueries({ queryKey: ["teacher-salary-structures"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to save salary structure.");
      setMessage("");
    },
  });

  const generateSlipsMutation = useMutation({
    mutationFn: () => generateSalarySlips(month),
    onSuccess: async (response: any) => {
      setMessage(`Generated ${response?.generated_count || 0} salary slips.`);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["teacher-salary-slips", month] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to generate salary slips.");
      setMessage("");
    },
  });

  const paySlipMutation = useMutation({
    mutationFn: () => paySalarySlip(paymentDraft),
    onSuccess: async () => {
      setMessage("Salary marked as paid.");
      setError("");
      setPaymentDraft(initialSalaryPaymentDraft);
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

  const closePaymentModal = () => setPaymentDraft(initialSalaryPaymentDraft);

  const openPaymentModal = (slip: SalarySlip) => {
    setPaymentDraft({
      slipId: slip.id,
      teacherName: slip.teacher_name,
      salaryMonth: new Date(slip.salary_month).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      netSalary: currency(slip.net_salary),
      paid_amount: String(slip.net_salary || ""),
      paid_date: new Date().toISOString().slice(0, 10),
      payment_mode: "cash",
      remarks: "",
    });
  };

  return {
    month,
    setMonth,
    structureForm,
    setStructureForm,
    paymentDraft,
    setPaymentDraft,
    message,
    setMessage,
    error,
    setError,
    teachersQuery,
    structuresQuery,
    slipsQuery,
    saveStructureMutation,
    generateSlipsMutation,
    paySlipMutation,
    structureStats,
    closePaymentModal,
    openPaymentModal,
    currency,
  };
}
