import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInitialExamForm } from "../components/exams.constants";
import {
  escapeHtml,
  getPassFail,
  getResultFeedback,
  getResultPercentage,
  mapExamToForm,
  parseCsvText,
  toDraft,
  toLocaleDate,
} from "../utils/exams.utils";
import { deleteExam, getExamRoster, getExams, getFeeStructures, saveExam, saveExamResults } from "../services/exams.service";
import type { Exam, ExamFormState, ResultDraft } from "../types/exams.types";

export function useExamsData() {
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState<ExamFormState>(createInitialExamForm);
  const [drafts, setDrafts] = useState<Record<number, ResultDraft>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resultsTab, setResultsTab] = useState<"manual" | "csv">("manual");
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [selectedAcademicYearFilter, setSelectedAcademicYearFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const examsQuery = useQuery({ queryKey: ["exams"], queryFn: getExams });
  const feeStructuresQuery = useQuery({ queryKey: ["fee-structures"], queryFn: getFeeStructures });
  const rosterQuery = useQuery({
    queryKey: ["exam-roster", selectedExamId],
    enabled: Boolean(selectedExamId),
    queryFn: () => getExamRoster(Number(selectedExamId)),
  });

  useEffect(() => {
    if (!rosterQuery.data) {
      if (!selectedExamId) {
        setSelectedExam(null);
        setDrafts({});
      }
      return;
    }

    setSelectedExam(rosterQuery.data.exam || null);
    setDrafts(
      rosterQuery.data.students.reduce<Record<number, ResultDraft>>((acc, row) => {
        acc[row.student_id] = toDraft(row);
        return acc;
      }, {})
    );
  }, [rosterQuery.data, selectedExamId]);

  const exams = examsQuery.data || [];
  const roster = rosterQuery.data?.students || [];

  const classOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of feeStructuresQuery.data || []) {
      const name = item.class_name || item.course_name || item.name;
      if (name) values.add(name);
    }
    for (const exam of exams) {
      if (exam.class) values.add(exam.class);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [exams, feeStructuresQuery.data]);

  const academicYearOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of feeStructuresQuery.data || []) {
      if (item.academic_year) values.add(item.academic_year);
    }
    for (const exam of exams) {
      if (exam.academic_year) values.add(exam.academic_year);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [exams, feeStructuresQuery.data]);

  const filteredExamOptions = useMemo(
    () =>
      exams.filter((exam) => {
        const classMatch = !selectedClassFilter || exam.class === selectedClassFilter;
        const yearMatch = !selectedAcademicYearFilter || exam.academic_year === selectedAcademicYearFilter;
        return classMatch && yearMatch;
      }),
    [exams, selectedAcademicYearFilter, selectedClassFilter]
  );

  const filteredRoster = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return roster;
    return roster.filter((row) => row.student_name.toLowerCase().includes(term) || String(row.roll_number || "").toLowerCase().includes(term));
  }, [roster, studentSearch]);

  const selectedExamSummary = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) || selectedExam,
    [exams, selectedExamId, selectedExam]
  );

  useEffect(() => {
    if (!selectedExamId && exams.length > 0) setSelectedExamId(exams[0].id);
  }, [exams, selectedExamId]);

  useEffect(() => {
    if (!selectedExamSummary) return;
    setSelectedClassFilter(selectedExamSummary.class || "");
    setSelectedAcademicYearFilter(selectedExamSummary.academic_year || "");
  }, [selectedExamSummary]);

  useEffect(() => {
    if (!filteredExamOptions.length) return;
    if (!selectedExamId || !filteredExamOptions.some((exam) => exam.id === selectedExamId)) {
      setSelectedExamId(filteredExamOptions[0].id);
    }
  }, [filteredExamOptions, selectedExamId]);

  const resetExamForm = () => {
    setEditingExamId(null);
    setExamForm(createInitialExamForm());
    setOpenForm(false);
  };

  const invalidateExamData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["exams"] }),
      queryClient.invalidateQueries({ queryKey: ["exam-roster", selectedExamId] }),
    ]);
  };

  const saveExamMutation = useMutation({
    mutationFn: (payload: ExamFormState) => saveExam(editingExamId, payload),
    onSuccess: async (response: any) => {
      setMessage(editingExamId ? "Exam updated." : "Exam created.");
      setError("");
      const examId = response?.id;
      resetExamForm();
      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      if (!editingExamId && examId) setSelectedExamId(examId);
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to save exam.");
      setMessage("");
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: async (_, examId) => {
      if (selectedExamId === examId) setSelectedExamId(null);
      setMessage("Exam deleted.");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to delete exam.");
      setMessage("");
    },
  });

  const saveResultsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExamId) return null;
      const results = roster.map((row) => ({ student_id: row.student_id, ...drafts[row.student_id] }));
      return saveExamResults(selectedExamId, results);
    },
    onSuccess: async (response: any) => {
      setMessage(`Results saved for ${response?.saved_count || 0} students.`);
      setError("");
      await invalidateExamData();
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to save results.");
      setMessage("");
    },
  });

  const csvUploadMutation = useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      if (!selectedExamId) return null;
      return saveExamResults(selectedExamId, rows);
    },
    onSuccess: async () => {
      setMessage("CSV results imported.");
      setError("");
      await invalidateExamData();
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to import CSV results.");
      setMessage("");
    },
  });

  const handleDraftChange = (studentId: number, field: keyof ResultDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || { status: "present", marks_obtained: "", grade: "", rank: "", remarks: "" }),
        [field]: value,
      },
    }));
  };

  const handleGenerateResult = () => {
    if (!selectedExamSummary) return;
    const reportRows = filteredRoster.map((row, index) => {
      const draft = drafts[row.student_id];
      const securedMark = draft?.marks_obtained || "-";
      const percentage = getResultPercentage(draft?.marks_obtained, selectedExamSummary.max_marks);
      const passFail = getPassFail(draft?.status, draft?.marks_obtained, selectedExamSummary.max_marks, selectedExamSummary.pass_marks);
      const feedback = getResultFeedback(draft?.status, draft?.marks_obtained, selectedExamSummary.max_marks);
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.student_name)}</td>
          <td>${escapeHtml(selectedExamSummary.class)}</td>
          <td>${escapeHtml(String(selectedExamSummary.max_marks || 100))}</td>
          <td>${escapeHtml(String(securedMark))}</td>
          <td>${escapeHtml(String(percentage))}</td>
          <td>${escapeHtml(String(passFail))}</td>
          <td>${escapeHtml(String(feedback))}</td>
        </tr>
      `;
    }).join("");

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      setError("Popup blocked. Please allow popups to generate the result sheet.");
      return;
    }

    const html = `
      <html>
        <head><title>${escapeHtml(selectedExamSummary.exam_name)} Result Sheet</title></head>
        <body>
          <div style="font-family: Arial, sans-serif; color: #0f172a; padding: 32px; max-width: 960px; margin: 0 auto;">
            <div style="margin-bottom: 24px; border-bottom: 2px solid #dbeafe; padding-bottom: 16px;">
              <h1 style="margin: 0 0 10px; font-size: 28px;">${escapeHtml(selectedExamSummary.exam_name)}</h1>
              <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 24px;font-size:14px;color:#334155;">
                <div><strong>Date:</strong> ${escapeHtml(toLocaleDate(selectedExamSummary.exam_date))}</div>
                <div><strong>Class:</strong> ${escapeHtml(selectedExamSummary.class)}</div>
                <div><strong>Session:</strong> ${escapeHtml(selectedExamSummary.academic_year || "No year")}</div>
                <div><strong>Subject:</strong> ${escapeHtml(selectedExamSummary.subject)}</div>
                <div><strong>Pass Mark:</strong> ${escapeHtml(String(selectedExamSummary.pass_marks || 35))}</div>
              </div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr>
                  <th style="border:1px solid #cbd5e1;padding:10px 12px;text-align:left;background:#eff6ff;">SL No</th>
                  <th style="border:1px solid #cbd5e1;padding:10px 12px;text-align:left;background:#eff6ff;">Name</th>
                  <th style="border:1px solid #cbd5e1;padding:10px 12px;text-align:left;background:#eff6ff;">Class</th>
                  <th style="border:1px solid #cbd5e1;padding:10px 12px;text-align:left;background:#eff6ff;">Full Mark</th>
                  <th style="border:1px solid #cbd5e1;padding:10px 12px;text-align:left;background:#eff6ff;">Secured Mark</th>
                  <th style="border:1px solid #cbd5e1;padding:10px 12px;text-align:left;background:#eff6ff;">%</th>
                  <th style="border:1px solid #cbd5e1;padding:10px 12px;text-align:left;background:#eff6ff;">Pass / Fail</th>
                  <th style="border:1px solid #cbd5e1;padding:10px 12px;text-align:left;background:#eff6ff;">Feedback</th>
                </tr>
              </thead>
              <tbody>${reportRows || '<tr><td colspan="8">No students found.</td></tr>'}</tbody>
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

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedExamId) return;
    try {
      setMessage("");
      setError("");
      const text = await file.text();
      const rows = parseCsvText(text);
      await csvUploadMutation.mutateAsync(rows);
    } finally {
      event.target.value = "";
    }
  };

  return {
    openForm,
    setOpenForm,
    editingExamId,
    setEditingExamId,
    selectedExamId,
    setSelectedExamId,
    examForm,
    setExamForm,
    message,
    error,
    setMessage,
    setError,
    resultsTab,
    setResultsTab,
    selectedClassFilter,
    setSelectedClassFilter,
    selectedAcademicYearFilter,
    setSelectedAcademicYearFilter,
    studentSearch,
    setStudentSearch,
    exams,
    classOptions,
    academicYearOptions,
    filteredExamOptions,
    filteredRoster,
    selectedExamSummary,
    drafts,
    examsQuery,
    rosterQuery,
    saveExamMutation,
    deleteExamMutation,
    saveResultsMutation,
    resetExamForm,
    handleDraftChange,
    handleGenerateResult,
    handleCsvUpload,
    handleEditExam: (exam: Exam) => {
      setEditingExamId(exam.id);
      setExamForm(mapExamToForm(exam));
      setOpenForm(true);
    },
    handleDeleteExam: (examId: number) => {
      if (!window.confirm("Delete this exam and its results?")) return;
      setMessage("");
      setError("");
      deleteExamMutation.mutate(examId);
    },
    handleSaveExam: async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage("");
      setError("");
      await saveExamMutation.mutateAsync(examForm);
    },
  };
}
