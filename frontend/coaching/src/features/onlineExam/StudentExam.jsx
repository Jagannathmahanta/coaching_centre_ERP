// ─────────────────────────────────────────────────────────────
// StudentExam.jsx  –  live exam room with timer + anti-cheat
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from "react";
import { fmtTime } from "./examData";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { EXAM_LANGUAGE_OPTIONS, getLocalizedText } from "./localization";

export default function StudentExam({ exam, student, onSubmit, language = "en", onLanguageChange, error = "", isSubmitting = false }) {
  const { t } = useI18n();
  const questions = Array.isArray(exam?.questions) ? exam.questions : [];
  const totalQuestions = questions.length;
  const totalSec   = Number(exam?.duration || 0) * 60;
  const [timeLeft, setTimeLeft]   = useState(totalSec);
  const [answers,  setAnswers]    = useState({});   // { qId: optionIndex }
  const [subAns,   setSubAns]     = useState({});   // { qId: "text" }
  const [curQ,     setCurQ]       = useState(0);
  const [confirm,  setConfirm]    = useState(false);
  const [warnings, setWarnings]   = useState(0);
  const [isMobile, setIsMobile]   = useState(() => window.innerWidth < 900);
  const timerRef  = useRef(null);
  const textareaRef = useRef(null);

  // ── Timer ────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); doSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Anti-cheat: detect tab switch ────────────────────────
  useEffect(() => {
    const handler = () => { if (document.hidden) setWarnings(w => w + 1); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setTimeLeft(totalSec);
  }, [totalSec]);

  useEffect(() => {
    if (curQ > Math.max(totalQuestions - 1, 0)) {
      setCurQ(0);
    }
  }, [curQ, totalQuestions]);

  const stopTimer = () => clearInterval(timerRef.current);
  const urgent    = timeLeft < 300; // < 5 min

  const doSubmit = useCallback(async (auto = false, latestSubAnswers = subAns) => {
    if (isSubmitting) return;
    stopTimer();
    const timeTaken = Math.round((totalSec - timeLeft) / 60) || 1;
    setConfirm(false);

    await onSubmit({
      answers,
      sub_answers: latestSubAnswers,
      time_taken: timeTaken,
      auto_submitted: auto,
    });
  }, [answers, isSubmitting, onSubmit, subAns, timeLeft, totalSec]);

  // ── Save subjective answer before navigating ─────────────
  const saveCurrentSub = () => {
    const q = questions[curQ];
    if (!q) {
      return subAns;
    }
    if (q.type === "subjective") {
      const el = textareaRef.current;
      if (el) setSubAns(prev => ({ ...prev, [q.id]: el.value }));
      return {
        ...subAns,
        [q.id]: el?.value || "",
      };
    }
    return subAns;
  };

  const goTo = i => { saveCurrentSub(); setCurQ(i); };

  // ── Count answered questions ─────────────────────────────
  const answeredCount =
    Object.keys(answers).length +
    Object.keys(subAns).filter(k => subAns[k]?.trim().length > 0).length;

  const q = questions[curQ] || null;
  const examTitle = getLocalizedText(exam?.titleTranslations, language, exam?.title || "");
  const questionText = q ? getLocalizedText(q.textTranslations, language, q.text) : "";
  const getOptionLabel = (question, optionIndex) =>
    getLocalizedText(question.optionTranslations?.[optionIndex], language, question.options?.[optionIndex] || "");

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── Topbar ── */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: isMobile ? "14px 16px" : "10px 20px",
        display: "flex", alignItems: "center", gap: 16,
        flexWrap: "wrap",
        position: "sticky", top: 0, zIndex: 20,
        boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
      }}>
        <div style={{ flex: 1, minWidth: isMobile ? "100%" : 200 }}>
          <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 15 }}>
            {examTitle}
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {student.name} &nbsp;·&nbsp; {student.roll}
          </div>
        </div>

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

        <div style={{
          background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 9,
          padding: "7px 14px", fontSize: 13, color: "#1d4ed8",
          width: isMobile ? "calc(50% - 8px)" : undefined,
          minWidth: isMobile ? 0 : undefined,
          justifyContent: "center",
          display: "flex",
        }}>
          ✅ {t("onlineExam.answeredCount", { answered: answeredCount, total: totalQuestions })}
        </div>

        {warnings > 0 && (
          <div style={{
            background: "#7f1d1d20",
            border: "1px solid #ef4444",
            borderRadius: 9, padding: "7px 14px",
            fontSize: 13, color: "#fca5a5", fontWeight: 700,
            width: isMobile ? "100%" : undefined,
          }}>
            ⚠️ {warnings > 1 ? t("onlineExam.tabSwitchWarnings", { count: warnings }) : t("onlineExam.tabSwitchWarning", { count: warnings })}
          </div>
        )}

        {/* Timer */}
        <div style={{
          background: urgent ? "#7f1d1d20" : "#1e3a5f20",
          border: `2px solid ${urgent ? "#ef4444" : "#3b82f6"}`,
          borderRadius: 12, padding: "9px 18px",
          display: "flex", alignItems: "center", gap: 8,
          width: isMobile ? "calc(50% - 8px)" : undefined,
          justifyContent: "center",
          minWidth: isMobile ? 0 : undefined,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
            stroke={urgent ? "#ef4444" : "#93c5fd"} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{
            fontSize: 22, fontWeight: 900,
            color: urgent ? "#fca5a5" : "#93c5fd",
            fontVariantNumeric: "tabular-nums",
          }}>
            {fmtTime(timeLeft)}
          </span>
        </div>

        <button
          onClick={() => { saveCurrentSub(); setConfirm(true); }}
          disabled={isSubmitting || !q}
          style={{
            background: isSubmitting || !q ? "#4338ca80" : "#4f46e5", border: "none",
            borderRadius: 10, padding: "10px 20px",
            color: "#fff", fontWeight: 800,
            fontSize: 14, cursor: isSubmitting || !q ? "not-allowed" : "pointer",
            opacity: isSubmitting || !q ? 0.75 : 1,
            width: isMobile ? "100%" : undefined,
          }}
        >
          {isSubmitting ? t("onlineExam.submitting") : t("onlineExam.submitExam")}
        </button>
      </div>

      {error ? (
        <div style={{
          maxWidth: 960,
          width: "100%",
          margin: "16px auto 0",
          background: "#7f1d1d",
          border: "1px solid #ef4444",
          borderRadius: 12,
          padding: "12px 16px",
          color: "#fee2e2",
          boxSizing: "border-box",
        }}>
          {error}
        </div>
      ) : null}

      {/* ── Body ── */}
      <div style={{
        display: "flex", flex: 1,
        maxWidth: 960, margin: "0 auto",
        width: "100%", padding: isMobile ? "16px 12px 24px" : "24px 16px",
        gap: 24, alignItems: "flex-start",
        flexDirection: isMobile ? "column" : "row",
      }}>

        {/* Question panel */}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16, padding: isMobile ? 18 : 28,
            boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
          }}>
            {q ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <span style={{
                    background: q.type === "mcq" ? "#eef2ff" : "#fff7ed",
                    color: q.type === "mcq" ? "#4f46e5" : "#c2410c",
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {q.type === "mcq" ? t("onlineExam.mcq") : t("onlineExam.subjective")}
                  </span>
                  <span style={{
                    background: "#ecfdf5", color: "#15803d",
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {q.marks > 1 ? t("onlineExam.marks", { count: q.marks }) : t("onlineExam.mark", { count: q.marks })}
                  </span>
                  <span style={{ marginLeft: isMobile ? 0 : "auto", color: "#64748b", fontSize: 13, width: isMobile ? "100%" : undefined }}>
                    {t("onlineExam.questionProgress", { current: curQ + 1, total: totalQuestions })}
                  </span>
                </div>

                <p style={{
                  fontSize: isMobile ? 15 : 17, color: "#0f172a",
                  fontWeight: 700, lineHeight: 1.65,
                  margin: "0 0 22px",
                  wordBreak: "break-word",
                }}>
                  {questionText}
                </p>

                {q.type === "mcq" && (
                  <div style={{ display: "grid", gap: 11 }}>
                    {q.options.map((opt, i) => {
                      const sel = answers[q.id] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
                          style={{
                            display: "flex", gap: 14, alignItems: "center",
                            padding: "13px 16px", borderRadius: 12,
                            border: `2px solid ${sel ? "#4f46e5" : "#cbd5e1"}`,
                            background: sel ? "#eef2ff" : "#ffffff",
                            cursor: "pointer", textAlign: "left",
                            transition: "all 0.12s", width: "100%",
                          }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            border: `2px solid ${sel ? "#6366f1" : "#94a3b8"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: 13,
                            color: sel ? "#6366f1" : "#64748b",
                            flexShrink: 0,
                          }}>
                            {["A","B","C","D"][i]}
                          </div>
                          <span style={{
                            fontSize: isMobile ? 14 : 15,
                            color: sel ? "#312e81" : "#334155",
                            fontWeight: sel ? 700 : 400,
                            wordBreak: "break-word",
                          }}>
                            {getOptionLabel(q, i)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === "subjective" && (
                  <textarea
                    key={q.id}
                    ref={textareaRef}
                    defaultValue={subAns[q.id] || ""}
                    onBlur={e => setSubAns(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={t("onlineExam.subjectivePlaceholder")}
                    rows={8}
                    style={{
                      width: "100%",
                      background: "#ffffff",
                      border: "2px solid #cbd5e1",
                      borderRadius: 12, padding: "14px 16px",
                      color: "#0f172a", fontSize: 15,
                      resize: "vertical", outline: "none",
                      fontFamily: "inherit", lineHeight: 1.7,
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7 }}>
                {t("onlineExam.noQuestions")}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              onClick={() => goTo(curQ - 1)}
              disabled={!q || curQ === 0}
              style={{
                flex: 1, padding: "12px",
                background: !q || curQ === 0 ? "#1e293b" : "#334155",
                border: "none", borderRadius: 10,
                color: !q || curQ === 0 ? "#475569" : "#cbd5e1",
                fontWeight: 700, fontSize: 14,
                cursor: !q || curQ === 0 ? "not-allowed" : "pointer",
              }}
            >
              {t("onlineExam.previous")}
            </button>
            <button
              onClick={() => goTo(curQ + 1)}
              disabled={!q || curQ === totalQuestions - 1}
              style={{
                flex: 1, padding: "12px",
                background: !q || curQ === totalQuestions - 1 ? "#1e293b" : "#4f46e5",
                border: "none", borderRadius: 10,
                color: !q || curQ === totalQuestions - 1 ? "#475569" : "#fff",
                fontWeight: 700, fontSize: 14,
                cursor: !q || curQ === totalQuestions - 1 ? "not-allowed" : "pointer",
              }}
            >
              {t("onlineExam.next")}
            </button>
          </div>
        </div>

        {/* ── Question Map (sidebar) ── */}
        <div style={{
          width: isMobile ? "100%" : 190, flexShrink: 0,
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 14, padding: 18,
        }}>
          <div style={{
            fontSize: 11, color: "#64748b", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: 0.5,
            marginBottom: 12,
          }}>
            {t("onlineExam.questionMap")}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(auto-fit,minmax(38px,1fr))" : "repeat(5,1fr)",
            gap: 5, marginBottom: 16,
          }}>
            {questions.map((q2, i) => {
              const done = q2.type === "mcq"
                ? answers[q2.id] !== undefined
                : (subAns[q2.id] || "").trim().length > 0;
              const curr = i === curQ;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    aspectRatio: "1", borderRadius: 6,
                    border: curr
                      ? "2px solid #4f46e5"
                      : done
                        ? "1px solid #1D9E75"
                        : "0.5px solid #334155",
                    background: curr ? "#4f46e5" : done ? "#052e16" : "#0f172a",
                    color: curr ? "#fff" : done ? "#4ade80" : "#64748b",
                    fontWeight: 700, fontSize: 12, cursor: "pointer",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "grid", gap: 6 }}>
            {[
              [t("onlineExam.current"),   "#4f46e5"],
              [t("onlineExam.answered"),  "#1D9E75"],
              [t("onlineExam.skipped"),   "#334155"],
            ].map(([label, color]) => (
              <div key={label} style={{
                display: "flex", gap: 7, alignItems: "center",
                fontSize: 11, color: "#64748b",
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: color,
                }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Confirm Submit Overlay ── */}
      {confirm && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 5000, padding: 20,
        }}>
          <div style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 20, padding: 36,
            maxWidth: 400, width: "100%", textAlign: "center",
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🚀</div>
            <h3 style={{ color: "#fff", fontWeight: 900, margin: "0 0 10px" }}>
              {t("onlineExam.submitPrompt")}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>
              Answered{" "}
              <strong style={{ color: "#fff" }}>{answeredCount}</strong>
              {" "}of{" "}
              <strong style={{ color: "#fff" }}>{totalQuestions}</strong>{" "}
              questions.
              {totalQuestions - answeredCount > 0 && (
                <span style={{ color: "#fca5a5" }}>
                  {" "}{t("onlineExam.unanswered", { count: totalQuestions - answeredCount })}
                </span>
              )}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  padding: "11px 22px",
                  background: "transparent",
                  border: "2px solid #475569",
                  borderRadius: 10, color: "#94a3b8",
                  fontWeight: 700, cursor: "pointer",
                }}
              >
                {t("onlineExam.review")}
              </button>
              <button
                onClick={() => doSubmit(false, saveCurrentSub())}
                disabled={isSubmitting || !q}
                style={{
                  padding: "11px 26px",
                  background: isSubmitting || !q ? "#4338ca80" : "#4f46e5", border: "none",
                  borderRadius: 10, color: "#fff",
                  fontWeight: 800, cursor: isSubmitting || !q ? "not-allowed" : "pointer",
                  opacity: isSubmitting || !q ? 0.75 : 1,
                }}
              >
                {isSubmitting ? t("onlineExam.submitting") : t("onlineExam.submitFinal")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
