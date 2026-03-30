import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import "./ExamsPage.css";
import ExamFormPanel from "./components/ExamFormPanel";
import ExamScheduleTable from "./components/ExamScheduleTable";
import ResultsPanel from "./components/ResultsPanel";
import { createInitialExamForm } from "./exams.constants";
import type { Exam, ExamFormState, FeeStructureOption, ResultDraft, RosterRow } from "./exams.types";
import { escapeHtml, getPassFail, getResultFeedback, getResultPercentage, mapExamToForm, parseCsvText, toDraft, toLocaleDate } from "./exams.utils";

type RosterResponse = {
  exam: Exam | null;
  students: RosterRow[];
};

export default function ExamsPage() {
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

  const examsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const response = await api.get("/exams");
      return (response.data || []) as Exam[];
    },
  });

  const feeStructuresQuery = useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => {
      const response = await api.get("/fees/structures");
      return (response.data || []) as FeeStructureOption[];
    },
  });

  const rosterQuery = useQuery({
    queryKey: ["exam-roster", selectedExamId],
    enabled: Boolean(selectedExamId),
    queryFn: async () => {
      const response = await api.get(`/exams/${selectedExamId}/roster`);
      return (response.data || { exam: null, students: [] }) as RosterResponse;
    },
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

    return roster.filter((row) => {
      const nameMatch = row.student_name.toLowerCase().includes(term);
      const admissionMatch = String(row.roll_number || "").toLowerCase().includes(term);
      return nameMatch || admissionMatch;
    });
  }, [roster, studentSearch]);

  const selectedExamSummary = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) || selectedExam,
    [exams, selectedExamId, selectedExam]
  );

  useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0].id);
    }
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
    mutationFn: async (payload: ExamFormState) => {
      if (editingExamId) {
        return api.patch(`/exams/${editingExamId}`, payload);
      }
      return api.post("/exams", payload);
    },
    onSuccess: async (response) => {
      setMessage(editingExamId ? "Exam updated." : "Exam created.");
      setError("");
      const examId = response.data?.id;
      resetExamForm();
      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      if (!editingExamId && examId) {
        setSelectedExamId(examId);
      }
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to save exam.");
      setMessage("");
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: number) => api.delete(`/exams/${examId}`),
    onSuccess: async (_, examId) => {
      if (selectedExamId === examId) {
        setSelectedExamId(null);
      }
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
      const results = roster.map((row) => ({
        student_id: row.student_id,
        ...drafts[row.student_id],
      }));
      return api.post(`/exams/${selectedExamId}/results/bulk`, { results });
    },
    onSuccess: async (response) => {
      setMessage(`Results saved for ${response?.data?.saved_count || 0} students.`);
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
      return api.post(`/exams/${selectedExamId}/results/bulk`, { results: rows });
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

  const handleSaveExam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    await saveExamMutation.mutateAsync(examForm);
  };

  const handleDeleteExam = (examId: number) => {
    if (!window.confirm("Delete this exam and its results?")) return;
    setMessage("");
    setError("");
    deleteExamMutation.mutate(examId);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExamId(exam.id);
    setExamForm(mapExamToForm(exam));
    setOpenForm(true);
  };

  const handleDraftChange = (studentId: number, field: keyof ResultDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || { status: "present", marks_obtained: "", grade: "", rank: "", remarks: "" }),
        [field]: value,
      },
    }));
  };

  const handleCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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

  const handleGenerateResult = () => {
    if (!selectedExamSummary) return;

    const reportRows = filteredRoster.map((row, index) => {
      const draft = drafts[row.student_id];
      const securedMark = draft?.marks_obtained || "-";
      const percentage = getResultPercentage(draft?.marks_obtained, selectedExamSummary.max_marks);
      const passFail = getPassFail(
        draft?.status,
        draft?.marks_obtained,
        selectedExamSummary.max_marks,
        selectedExamSummary.pass_marks
      );
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
        <head>
          <title>${escapeHtml(selectedExamSummary.exam_name)} Result Sheet</title>
          <style>
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
            }
            .sheet {
              max-width: 960px;
              margin: 0 auto;
            }
            .header {
              margin-bottom: 24px;
              border-bottom: 2px solid #dbeafe;
              padding-bottom: 16px;
            }
            .header h1 {
              margin: 0 0 10px;
              font-size: 28px;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px 24px;
              font-size: 14px;
              color: #334155;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              text-align: left;
            }
            th {
              background: #eff6ff;
            }
            tbody tr:nth-child(even) {
              background: #f8fafc;
            }
            @media print {
              body {
                padding: 12mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <h1>${escapeHtml(selectedExamSummary.exam_name)}</h1>
              <div class="meta">
                <div><strong>Date:</strong> ${escapeHtml(toLocaleDate(selectedExamSummary.exam_date))}</div>
                <div><strong>Class:</strong> ${escapeHtml(selectedExamSummary.class)}</div>
                <div><strong>Session:</strong> ${escapeHtml(selectedExamSummary.academic_year || "No year")}</div>
                <div><strong>Subject:</strong> ${escapeHtml(selectedExamSummary.subject)}</div>
                <div><strong>Pass Mark:</strong> ${escapeHtml(String(selectedExamSummary.pass_marks || 35))}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>SL No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Full Mark</th>
                  <th>Secured Mark</th>
                  <th>%</th>
                  <th>Pass / Fail</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows || '<tr><td colspan="8">No students found.</td></tr>'}
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
    <div className="exams-page">
      <div className="exams-header">
        <div>
          <h1>Exams</h1>
          <p>Create exams, schedule them by class and subject, and enter results student-wise by manual form or CSV upload.</p>
        </div>
        <button
          className="exams-button exams-buttonPrimary"
          type="button"
          onClick={() => {
            setEditingExamId(null);
            setExamForm(createInitialExamForm());
            setOpenForm((current) => !current);
          }}
        >
          {openForm ? "Close Form" : "Create Exam"}
        </button>
      </div>

      {message && <div className="exams-message exams-messageSuccess">{message}</div>}
      {error && <div className="exams-message exams-messageError">{error}</div>}

      {openForm && (
        <ExamFormPanel
          classOptions={classOptions}
          editingExamId={editingExamId}
          examForm={examForm}
          onCancel={resetExamForm}
          onSubmit={handleSaveExam}
          setExamForm={setExamForm}
        />
      )}

      <ExamScheduleTable
        exams={exams}
        loading={examsQuery.isLoading}
        onDelete={handleDeleteExam}
        onEdit={handleEditExam}
        selectedExamId={selectedExamId}
      />

      {selectedExamSummary && (
        <ResultsPanel
          activeTab={resultsTab}
          academicYearOptions={academicYearOptions}
          classOptions={classOptions}
          drafts={drafts}
          examOptions={filteredExamOptions}
          examValue={selectedExamId ? String(selectedExamId) : ""}
          loading={rosterQuery.isLoading}
          onCsvUpload={handleCsvUpload}
          onDraftChange={handleDraftChange}
          onExamChange={(examId) => {
            setSelectedExamId(examId ? Number(examId) : null);
            setStudentSearch("");
          }}
          onGenerateResult={handleGenerateResult}
          onSaveResults={() => saveResultsMutation.mutate()}
          roster={filteredRoster}
          saving={saveResultsMutation.isPending}
          searchValue={studentSearch}
          selectedExam={selectedExamSummary}
          selectedAcademicYear={selectedAcademicYearFilter}
          selectedClass={selectedClassFilter}
          setSearchValue={setStudentSearch}
          setSelectedAcademicYear={setSelectedAcademicYearFilter}
          setSelectedClass={setSelectedClassFilter}
          setActiveTab={setResultsTab}
        />
      )}
    </div>
  );
}
