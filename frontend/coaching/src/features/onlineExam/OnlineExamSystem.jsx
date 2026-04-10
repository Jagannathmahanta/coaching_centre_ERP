// ─────────────────────────────────────────────────────────────
// OnlineExamSystem.jsx  –  ROOT ENTRY POINT
//
// This file wires together every exam component.
// Import this into App.jsx and add a route/nav entry for it.
//
// Structure:
//   OnlineExamSystem
//   ├── Home screen (choose Admin / Student)
//   │
//   ├── ADMIN flow
//   │   ├── AdminExamList     (view all exams + stats)
//   │   ├── AdminManageExam   (create/edit exam + questions)
//   │   └── AdminResults      (leaderboard + answer review)
//   │
//   └── STUDENT flow
//       ├── StudentLogin      (roll number + password)
//       ├── StudentLobby      (available exams)
//       ├── StudentExam       (live exam room with timer)
//       └── StudentResult     (instant result + review)
// ─────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { getUser, isStaffTeacher } from "../../shared/services/auth";
import { useOnlineExamData } from "./hooks/useOnlineExamData";
import { useI18n } from "../../shared/i18n/I18nProvider";

import AdminExamList from "./AdminExamList";
import AdminManageExam from "./AdminManageExam";
import AdminResults from "./AdminResults";
import StudentLobby from "./StudentLobby";
import StudentExam from "./StudentExam";
import StudentResult from "./StudentResult";

// ─── Root Component ───────────────────────────────────────────
export default function OnlineExamSystem() {
  const { t } = useI18n();
  const user = getUser();
  const role = user?.role;
  const [adminView, setAdminView] = useState("list");
  const [activeExam, setActiveExam] = useState(null);
  const [adminResults, setAdminResults] = useState([]);
  const [student] = useState(
    role === "student"
      ? {
          id: user?.student_id || user?.id,
          name: user?.name || t("dashboard.studentDefaultName"),
          roll: user?.email || `${t("dashboard.student")} #${user?.student_id || user?.id || ""}`,
          class: user?.class || "",
        }
      : null
  );
  const [studentView, setStudentView] = useState(role === "student" ? "lobby" : "login");
  const [currentExam, setCurrentExam] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [examLanguage, setExamLanguage] = useState("en");
  const [screenError, setScreenError] = useState("");
  const [busy, setBusy] = useState(false);
  const {
    exams,
    classOptions,
    examsQuery,
    saveExamMutation,
    deleteExamMutation,
    submitExamMutation,
    fetchExam,
    fetchSubmissions,
    fetchMySubmission,
  } = useOnlineExamData();

  const submittedIds = exams.filter((exam) => exam.submissionId).map((exam) => exam.id);

  const handleSaveExam = async (exam) => {
    setScreenError("");
    try {
      await saveExamMutation.mutateAsync(exam);
      setAdminView("list");
      setActiveExam(null);
    } catch (error) {
      setScreenError(error.response?.data?.error || t("onlineExam.failedSave"));
    }
  };

  const handleManageExam = async (exam) => {
    setBusy(true);
    setScreenError("");
    try {
      const detail = await fetchExam(exam.id);
      setActiveExam(detail);
      setAdminView("manage");
    } catch (error) {
      setScreenError(error.response?.data?.error || t("onlineExam.failedLoadDetails"));
    } finally {
      setBusy(false);
    }
  };

  const handleViewAdminResults = async (exam) => {
    setBusy(true);
    setScreenError("");
    try {
      const [detail, submissions] = await Promise.all([
        fetchExam(exam.id),
        fetchSubmissions(exam.id),
      ]);
      setActiveExam(detail);
      setAdminResults(submissions);
      setAdminView("results");
    } catch (error) {
      setScreenError(error.response?.data?.error || t("onlineExam.failedLoadResults"));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteExam = async (exam) => {
    const label = exam?.title ? `"${exam.title}"` : "this exam";
    if (!window.confirm(`Delete ${label}? This action cannot be undone.`)) {
      return;
    }

    setScreenError("");
    try {
      await deleteExamMutation.mutateAsync(exam.id);
      if (activeExam?.id === exam.id) {
        setActiveExam(null);
      }
      if (adminView !== "list") {
        setAdminView("list");
      }
    } catch (error) {
      setScreenError(error.response?.data?.error || "Failed to delete exam.");
    }
  };

  const handleStartExam = async (exam) => {
    setBusy(true);
    setScreenError("");
    try {
      const detail = await fetchExam(exam.id);
      setCurrentExam(detail);
      setExamLanguage("en");
      setStudentView("exam");
    } catch (error) {
      setScreenError(error.response?.data?.error || t("onlineExam.failedOpen"));
    } finally {
      setBusy(false);
    }
  };

  const handleViewStudentResult = async (exam) => {
    setBusy(true);
    setScreenError("");
    try {
      const [detail, submission] = await Promise.all([
        fetchExam(exam.id),
        fetchMySubmission(exam.id),
      ]);
      setCurrentExam(detail);
      setExamResult(submission);
      setExamLanguage("en");
      setStudentView("result");
    } catch (error) {
      setScreenError(error.response?.data?.error || t("onlineExam.failedLoadYourResult"));
    } finally {
      setBusy(false);
    }
  };

  const handleExamSubmit = async (payload) => {
    setScreenError("");
    try {
      const result = await submitExamMutation.mutateAsync({
        examId: currentExam.id,
        payload,
      });
      setExamResult(result.submission);
      setStudentView("result");
    } catch (error) {
      const message = error.response?.data?.error || t("onlineExam.failedSubmit");
      setScreenError(message);
      throw error;
    }
  };
  const handleBackToLobby = () => { setExamResult(null); setCurrentExam(null); setExamLanguage("en"); setStudentView("lobby"); };

  if (role === "admin" || (role === "teacher" && !isStaffTeacher(user))) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 28 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {screenError ? (
            <div style={{ marginBottom: 16, background: "#fee2e2", color: "#991b1b", borderRadius: 12, padding: "12px 16px" }}>
              {screenError}
            </div>
          ) : null}
          {adminView === "list" && (
            <AdminExamList
              exams={exams}
              onCreateNew={() => { setActiveExam(null); setAdminView("manage"); }}
              onManage={handleManageExam}
              onViewResults={handleViewAdminResults}
              onDelete={handleDeleteExam}
              deletingExamId={deleteExamMutation.variables ?? null}
            />
          )}
          {adminView === "manage" && (
            <AdminManageExam exam={activeExam} classOptions={classOptions} onBack={() => setAdminView("list")} onSave={handleSaveExam} />
          )}
          {adminView === "results" && (
            <AdminResults exam={activeExam} submissions={adminResults} onBack={() => setAdminView("list")} />
          )}
          {busy || examsQuery.isLoading || saveExamMutation.isPending || deleteExamMutation.isPending ? (
            <div style={{ marginTop: 16, color: "#64748b", fontSize: 14 }}>{t("onlineExam.loadingData")}</div>
          ) : null}
        </div>
      </div>
    );
  }

  if (role === "student") {
    if (studentView === "lobby") {
      return (
        <>
          {screenError ? (
            <div style={{ position: "fixed", top: 16, right: 16, zIndex: 30, background: "#7f1d1d", color: "#fff", borderRadius: 12, padding: "12px 16px" }}>
              {screenError}
            </div>
          ) : null}
          <StudentLobby
            student={student}
            exams={exams}
            loading={examsQuery.isLoading || busy}
            submittedExamIds={submittedIds}
            onStartExam={handleStartExam}
            onViewResult={handleViewStudentResult}
          />
        </>
      );
    }
    if (studentView === "exam")   return <StudentExam exam={currentExam} student={student} onSubmit={handleExamSubmit} language={examLanguage} onLanguageChange={setExamLanguage} error={screenError} isSubmitting={submitExamMutation.isPending} />;
    if (studentView === "result") return <StudentResult result={examResult} exam={currentExam} onBack={handleBackToLobby} language={examLanguage} onLanguageChange={setExamLanguage} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "#f8fafc",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 28,
        maxWidth: 520,
        boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
      }}>
        <h1 style={{ margin: "0 0 10px", fontSize: 24, color: "#0f172a" }}>{t("onlineExam.sectionTitle")}</h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          {t("onlineExam.sectionAccess")}
        </p>
      </div>
    </div>
  );
}
