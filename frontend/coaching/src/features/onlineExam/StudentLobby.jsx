// ─────────────────────────────────────────────────────────────
// StudentLobby.jsx  –  list of available exams after login
// ─────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { getLocalizedText } from "./localization";

export default function StudentLobby({ student, exams = [], submittedExamIds, onStartExam, onViewResult, onLogout, loading = false }) {
  const [confirmExam, setConfirmExam] = useState(null);
  const { t, language } = useI18n();

  // Show only exams matching student's class
  const available = exams.filter(
    e => ["published", "ended"].includes(e.status) && (!student?.class || e.class === student.class)
  );

  const theme = {
    page:    "#f8fafc",
    card:    "#ffffff",
    border:  "#e2e8f0",
    text:    "#0f172a",
    muted:   "#64748b",
    subtle:  "#475569",
    pill:    "#eef2ff",
    pillTxt: "#4f46e5",
    soft:    "#f8fafc",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.page,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "24px 20px",
    }}>
      <div style={{  margin: "0 auto" }}>

        {/* Student header bar */}
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 16, padding: "16px 20px",
          display: "flex", alignItems: "center",
          gap: 14, marginBottom: 28,
          boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
        }}>
          <div style={{
            width: 44, height: 44, background: "#4f46e5",
            borderRadius: 12, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#fff",
            flexShrink: 0,
          }}>
            {student.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: theme.text, fontWeight: 800, fontSize: 16 }}>
              {student.name}
            </div>
            <div style={{ color: theme.muted, fontSize: 13 }}>
              {student.roll}{student.class ? ` · ${student.class}` : ""}
            </div>
          </div>
          {onLogout ? (
            <button
              onClick={onLogout}
              style={{
                background: theme.soft,
                border: `1px solid ${theme.border}`,
                borderRadius: 9, padding: "8px 16px",
                color: theme.muted, fontWeight: 700,
                fontSize: 13, cursor: "pointer",
              }}
            >
              {t("common.logout")}
            </button>
          ) : null}
        </div>

        <h2 style={{ color: theme.text, fontWeight: 900, fontSize: 20, margin: "0 0 18px" }}>
          📋 {t("studentLobby.availableExams")}
        </h2>

        {loading ? (
          <div style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: 16, padding: 48, textAlign: "center",
            color: theme.muted,
            boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
          }}>
            {t("studentLobby.loadingExams")}
          </div>
        ) : available.length === 0 ? (
          <div style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: 16, padding: 48, textAlign: "center",
            color: theme.muted,
            boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
          }}>
            {student.class
              ? t("studentLobby.noExamsForClass", { className: student.class })
              : t("studentLobby.noExamsRightNow")}
          </div>
        ) : (
          available.map(exam => {
            const done    = submittedExamIds.includes(exam.id);
            const mcqCnt  = exam.questions.filter(q => q.type === "mcq").length;
            const subCnt  = exam.questions.filter(q => q.type === "subjective").length;
            const examTitle = getLocalizedText(exam.titleTranslations, language, exam.title);
            const examInstructions = getLocalizedText(exam.instructionsTranslations, language, exam.instructions);
            return (
              <div
                key={exam.id}
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 16, padding: 24, marginBottom: 16,
                  boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: 16, marginBottom: 14,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: theme.text, fontWeight: 800,
                      fontSize: 18, marginBottom: 8,
                    }}>
                      {examTitle}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {[
                        exam.subject,
                        exam.class,
                        t("studentLobby.durationShort", { count: exam.duration }),
                        t("studentLobby.marks", { count: exam.totalMarks }),
                        t("studentLobby.mcqCount", { count: mcqCnt }),
                        subCnt > 0 ? t("studentLobby.subjectiveCount", { count: subCnt }) : null,
                      ].filter(Boolean).map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            background: theme.pill, color: theme.pillTxt,
                            padding: "3px 10px", borderRadius: 20,
                            fontSize: 12, fontWeight: 600,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {done ? (
                    <button
                      onClick={() => onViewResult?.(exam)}
                      style={{
                        background: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        color: "#6ee7b7",
                        padding: "8px 16px", borderRadius: 10,
                        fontWeight: 700, fontSize: 13, whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}
                    >
                      {t("studentLobby.viewResult")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmExam(exam)}
                      style={{
                        background: "#4f46e5", border: "none",
                        borderRadius: 12, padding: "10px 22px",
                        color: "#fff", fontWeight: 800,
                        fontSize: 14, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("studentLobby.startExam")}
                    </button>
                  )}
                </div>

                {/* Instructions */}
                <div style={{
                  background: theme.soft,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10, padding: "10px 14px",
                  fontSize: 13, color: theme.subtle,
                  whiteSpace: "pre-line",
                }}>
                  {t("studentLobby.instructionsPrefix")}: {examInstructions}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Confirm Start Modal ── */}
      {confirmExam && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 4000, padding: 20,
        }}>
          <div style={{
            background: "#ffffff",
            border: `1px solid ${theme.border}`,
            borderRadius: 20, padding: 36,
            maxWidth: 440, width: "100%", textAlign: "center",
            boxShadow: "0 24px 80px rgba(15,23,42,0.18)",
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: theme.text, fontWeight: 900, fontSize: 20, margin: "0 0 8px" }}>
              {t("studentLobby.readyToStart")}
            </h3>
            <p style={{ color: theme.muted, fontSize: 15, margin: "0 0 6px", fontWeight: 700 }}>
              {getLocalizedText(confirmExam.titleTranslations, language, confirmExam.title)}
            </p>
            <p style={{ color: theme.subtle, fontSize: 13, margin: "0 0 24px", lineHeight: 1.7 }}>
              <strong style={{ color: theme.text }}>
                {t("studentLobby.durationLine", { minutes: confirmExam.duration })}
              </strong>
              <br />
              {t("studentLobby.timerCannotPause")}
              <br />
              {t("studentLobby.doNotClose")}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmExam(null)}
                style={{
                  padding: "11px 22px",
                  background: "transparent",
                  border: "2px solid #475569",
                  borderRadius: 10, color: "#94a3b8",
                  fontWeight: 700, cursor: "pointer", fontSize: 14,
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => { onStartExam(confirmExam); setConfirmExam(null); }}
                style={{
                  padding: "11px 26px",
                  background: "#4f46e5", border: "none",
                  borderRadius: 10, color: "#fff",
                  fontWeight: 800, fontSize: 15, cursor: "pointer",
                }}
              >
                {t("studentLobby.startNow")} 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
