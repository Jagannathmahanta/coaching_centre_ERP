// ─────────────────────────────────────────────────────────────
// StudentResult.jsx  –  instant result after exam submission
// ─────────────────────────────────────────────────────────────
import React from "react";
import { GRADE_COLOR } from "./examData";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { EXAM_LANGUAGE_OPTIONS, getLocalizedText } from "./localization";

export default function StudentResult({ result, exam, onBack, language = "en", onLanguageChange }) {
  const { t } = useI18n();
  const pct    = exam.totalMarks ? Math.round((result.totalScore / exam.totalMarks) * 100) : 0;
  const passed = result.totalScore >= exam.passMark;
  const gColor = GRADE_COLOR[result.grade] || "#38bdf8";
  const subTotal = exam.questions
    .filter(q => q.type === "subjective")
    .reduce((s, q) => s + q.marks, 0);
  const examTitle = getLocalizedText(exam.titleTranslations, language, exam.title);
  const getQuestionText = (question) => getLocalizedText(question.textTranslations, language, question.text);
  const getOptionLabel = (question, optionIndex) =>
    getLocalizedText(question.optionTranslations?.[optionIndex], language, question.options?.[optionIndex] || "");
  const getExplanation = (question) => getLocalizedText(question.explanationTranslations, language, question.explanation);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "28px 20px",
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            <span>{t("topbar.languageLabel")}</span>
            <select
              value={language}
              onChange={(event) => onLanguageChange?.(event.target.value)}
              style={{
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 700,
            }}
          >
            {EXAM_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        </div>

        {/* ── Result hero card ── */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 24, padding: 36,
          textAlign: "center", marginBottom: 20,
          boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
        }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>
            {passed ? "🎉" : "📚"}
          </div>
          <h1 style={{
            color: "#0f172a", fontWeight: 900,
            fontSize: 26, margin: "0 0 6px",
          }}>
            {passed ? t("onlineExam.congratulations") : t("onlineExam.keepPracticing")}
          </h1>
          <p style={{ color: "#64748b", margin: "0 0 28px", fontSize: 14 }}>
            {examTitle}
          </p>

          {/* Score circle */}
          <div style={{
            width: 148, height: 148, borderRadius: "50%",
            background: `conic-gradient(${gColor} ${pct * 3.6}deg, #334155 0deg)`,
            margin: "0 auto 22px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 112, height: 112, borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: gColor }}>
                {pct}%
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {result.totalScore} / {exam.totalMarks}
              </div>
            </div>
          </div>

          {/* Grade badge */}
          <div style={{
            display: "inline-block",
            background: gColor + "20",
            border: `2px solid ${gColor}`,
            color: gColor, padding: "8px 28px",
            borderRadius: 30, fontWeight: 900,
            fontSize: 22, marginBottom: 28,
          }}>
            {result.grade ? t("onlineExam.grade", { grade: result.grade }) : result.status === "graded" ? t("onlineExam.graded") : t("onlineExam.pendingReview")}
          </div>

          {/* Stats row */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12,
          }}>
            {[
              [t("onlineExam.mcqScore"), result.mcqScore, "#6366f1"],
              [t("onlineExam.subjective"), subTotal > 0 ? result.subScore : t("onlineExam.na"), "#f59e0b"],
              [t("onlineExam.timeTaken"), t("onlineExam.minutes", { count: result.timeTaken }), "#10b981"],
            ].map(([label, val, color]) => (
              <div key={label} style={{
                background: "#f8fafc",
                borderRadius: 12, padding: "14px 10px",
                border: "1px solid #e2e8f0",
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color }}>
                  {val}
                </div>
                <div style={{
                  fontSize: 11, color: "#64748b",
                  fontWeight: 600, marginTop: 3,
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {result.autoSubmitted && (
            <div style={{
              marginTop: 16,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: "#fca5a5",
            }}>
              ⏰ {t("onlineExam.autoSubmitted")}
            </div>
          )}

          {subTotal > 0 && (
            <div style={{
              marginTop: 12,
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 12, color: "#fcd34d",
            }}>
              {t("onlineExam.subjectiveInfo")}
            </div>
          )}
        </div>

        {/* ── MCQ Review ── */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 20, padding: 24,
          marginBottom: 20,
          boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
        }}>
          <h3 style={{ color: "#0f172a", fontWeight: 800, margin: "0 0 16px", fontSize: 16 }}>
            {t("onlineExam.mcqReview")}
          </h3>
          {exam.questions.filter(q => q.type === "mcq").map((q, i) => {
            const review  = result.detailedResults?.[q.id] || result.detailedResults?.[String(q.id)] || {};
            const stuAns  = review.given ?? result.answers?.[q.id];
            const correct = Boolean(review.is_correct);
            return (
              <div
                key={q.id}
                style={{
                  marginBottom: 14, padding: 14,
                  borderRadius: 10,
                  background: correct
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(239,68,68,0.08)",
                  border: `1px solid ${correct
                    ? "rgba(16,185,129,0.3)"
                    : "rgba(239,68,68,0.25)"}`,
                }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 15 }}>{correct ? "✅" : "❌"}</span>
                  <span style={{
                    color: "#0f172a", fontSize: 14,
                    fontWeight: 600, flex: 1, lineHeight: 1.5,
                  }}>
                    {getQuestionText(q)}
                  </span>
                </div>
                <div style={{
                  paddingLeft: 24, fontSize: 13, color: "#94a3b8",
                }}>
                  {t("onlineExam.yourAnswer")}:{" "}
                  <span style={{
                    color: correct ? "#4ade80" : "#f87171",
                    fontWeight: 700,
                  }}>
                    {stuAns !== undefined ? getOptionLabel(q, stuAns) : t("onlineExam.notAnswered")}
                  </span>
                  {!correct && stuAns !== undefined && (
                    <>
                      {" "}&nbsp;|&nbsp; {t("onlineExam.correctAnswer")}:{" "}
                      <span style={{ color: "#4ade80", fontWeight: 700 }}>
                        {getOptionLabel(q, review.correct)}
                      </span>
                    </>
                  )}
                </div>
                {getExplanation(q) && (
                  <div style={{
                    paddingLeft: 24, marginTop: 5,
                    fontSize: 12, color: "#64748b", fontStyle: "italic",
                  }}>
                    💡 {getExplanation(q)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Subjective Answers ── */}
        {exam.questions.some(q => q.type === "subjective") && (
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 20, padding: 24,
            marginBottom: 24,
            boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
          }}>
            <h3 style={{ color: "#0f172a", fontWeight: 800, margin: "0 0 16px", fontSize: 16 }}>
              {t("onlineExam.subjectiveAnswers")}
            </h3>
            {exam.questions.filter(q => q.type === "subjective").map((q, i) => (
              <div key={q.id} style={{ marginBottom: 16 }}>
                <div style={{
                  color: "#0f172a", fontWeight: 600,
                  fontSize: 14, marginBottom: 8, lineHeight: 1.5,
                }}>
                  Q. {getQuestionText(q)}
                </div>
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10, padding: "12px 14px",
                  fontSize: 13, color: "#475569",
                  whiteSpace: "pre-wrap", lineHeight: 1.7,
                  minHeight: 48,
                }}>
                  {result.subAnswers?.[q.id]
                    ? result.subAnswers[q.id]
                    : <em style={{ color: "#475569" }}>{t("onlineExam.noAnswer")}</em>
                  }
                </div>
                <div style={{
                  marginTop: 5, fontSize: 11,
                  color: "#475569",
                }}>
                  {(() => {
                    const review = result.detailedResults?.[q.id] || result.detailedResults?.[String(q.id)] || {};
                    if (review.marks_awarded === null || review.marks_awarded === undefined) {
                      return t("onlineExam.maxMarksPending", { marks: q.marks });
                    }
                    return t("onlineExam.awardedMarks", { awarded: review.marks_awarded, marks: q.marks });
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            width: "100%", padding: "14px",
            background: "#4f46e5", border: "none",
            borderRadius: 14, color: "#fff",
            fontWeight: 800, fontSize: 16,
            cursor: "pointer",
          }}
        >
          {t("onlineExam.backToList")}
        </button>
      </div>
    </div>
  );
}
