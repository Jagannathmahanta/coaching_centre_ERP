// ─────────────────────────────────────────────────────────────
// AdminResults.jsx  –  leaderboard + per-student answer review
// ─────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { Btn, Badge, Modal, Icon, StatCard } from "./ExamUI";
import { GRADE_COLOR } from "./examData";

export default function AdminResults({ exam, submissions = [], onBack }) {
  const [selected, setSelected] = useState(null); // submission being reviewed

  const subs    = submissions;
  const sorted  = [...subs].sort((a, b) => b.totalScore - a.totalScore || a.timeTaken - b.timeTaken);
  const avg     = subs.length
    ? (subs.reduce((s, r) => s + r.totalScore, 0) / subs.length).toFixed(1)
    : "—";
  const highest    = subs.length ? Math.max(...subs.map(r => r.totalScore)) : "—";
  const passCount  = subs.filter(s => s.totalScore >= exam.passMark).length;

  const RANK_ICON = ["🥇", "🥈", "🥉"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 28 }}>
        <Btn ghost color="#555" onClick={onBack}>
          <Icon name="back" size={16} /> Back
        </Btn>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "#1a1a2e" }}>
            Results — {exam.title}
          </h1>
          <p style={{ color: "#888", margin: "3px 0 0", fontSize: 13 }}>
            {exam.class} &bull; {exam.subject} &bull; Pass mark: {exam.passMark}/{exam.totalMarks}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
        gap: 16, marginBottom: 28,
      }}>
        <StatCard label="Appeared"      value={subs.length}           color="#4f46e5" icon="user"   />
        <StatCard label="Passed"        value={passCount}              color="#10b981" icon="check"  />
        <StatCard label="Average Score" value={avg}                    color="#f59e0b" icon="list"   />
        <StatCard label="Highest Score" value={`${highest}/${exam.totalMarks}`} color="#6366f1" icon="trophy" />
      </div>

      {/* Leaderboard table */}
      <div style={{
        background: "#fff", borderRadius: 16,
        padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        marginBottom: 24,
      }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>
          🏆 Leaderboard
        </h3>

        {subs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#ccc", fontSize: 15 }}>
            No submissions yet
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9ff" }}>
                  {["Rank","Student","Roll No","MCQ","Subjective","Total","Grade","Time","Action"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 14px",
                      fontSize: 11, color: "#aaa",
                      fontWeight: 700, textTransform: "uppercase",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: "1px solid #f5f5f5",
                        background: i === 0 ? "#fffbeb" : "transparent",
                      }}
                    >
                      <td style={{ padding: "14px", fontWeight: 900, fontSize: 18,
                        color: i < 3 ? ["#f59e0b","#9ca3af","#cd7c2f"][i] : "#bbb" }}>
                        {i < 3 ? RANK_ICON[i] : `#${i + 1}`}
                      </td>
                      <td style={{ padding: "14px", fontWeight: 700, color: "#1a1a2e" }}>
                        {s.studentName}
                      </td>
                      <td style={{ padding: "14px", color: "#666", fontSize: 13 }}>
                        {s.roll}
                      </td>
                      <td style={{ padding: "14px", color: "#4f46e5", fontWeight: 700 }}>
                        {s.mcqScore}
                      </td>
                      <td style={{ padding: "14px", color: "#f59e0b", fontWeight: 700 }}>
                        {s.subScore}
                      </td>
                      <td style={{ padding: "14px", fontWeight: 900, fontSize: 16, color: "#1a1a2e" }}>
                        {s.totalScore}
                      </td>
                      <td style={{ padding: "14px" }}>
                        <Badge color={GRADE_COLOR[s.grade] || "#888"}>{s.grade || s.status}</Badge>
                      </td>
                      <td style={{ padding: "14px", color: "#999", fontSize: 13 }}>
                        {s.timeTaken} min
                      </td>
                      <td style={{ padding: "14px" }}>
                        <Btn sm ghost onClick={() => setSelected(s)}>
                          <Icon name="eye" size={13} /> View
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Per-student Answer Sheet Modal ── */}
      {selected && (
        <Modal
          title={`Answer Sheet — ${selected.studentName}`}
          onClose={() => setSelected(null)}
          wide
        >
          {/* Score summary */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              ["Total",    `${selected.totalScore}/${exam.totalMarks}`],
              ["MCQ",      selected.mcqScore],
              ["Subj.",    selected.subScore],
              ["Grade",    selected.grade],
              ["Time",     `${selected.timeTaken} min`],
            ].map(([k, v]) => (
              <div key={k} style={{
                background: "#f8f9ff", borderRadius: 10,
                padding: "10px 18px", textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#4f46e5" }}>{v}</div>
                <div style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>{k}</div>
              </div>
            ))}
          </div>

          {/* Per-question review */}
            {exam.questions.map((q, i) => {
            const review = selected.detailedResults?.[q.id] || selected.detailedResults?.[String(q.id)] || {};
            const stuAns = q.type === "mcq"
              ? (review.given ?? selected.answers?.[q.id])
              : (selected.subAnswers?.[q.id] ?? review.answer_text);
            const isCorrect = q.type === "mcq" && Boolean(review.is_correct);
            const isWrong   = q.type === "mcq" && stuAns !== undefined && !isCorrect;

            return (
              <div
                key={q.id}
                style={{
                  marginBottom: 16, padding: 16, borderRadius: 12,
                  background: q.type === "mcq"
                    ? isCorrect ? "#f0fdf4" : isWrong ? "#fff1f2" : "#fafafa"
                    : "#fffbeb",
                  border: `1px solid ${
                    q.type === "mcq"
                      ? isCorrect ? "#10b981" : isWrong ? "#fecdd3" : "#e5e7eb"
                      : "#fde68a"
                  }`,
                }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, color: "#555" }}>Q{i + 1}.</span>
                  <span style={{ fontWeight: 600, color: "#1a1a2e", flex: 1 }}>
                    {q.text}
                  </span>
                  {q.type === "mcq" && (
                    isCorrect
                      ? <span style={{ color: "#10b981", fontWeight: 800, whiteSpace: "nowrap" }}>✓ +{q.marks}</span>
                      : isWrong
                        ? <span style={{ color: "#ef4444", fontWeight: 800, whiteSpace: "nowrap" }}>✗ 0</span>
                        : <span style={{ color: "#aaa" }}>—</span>
                  )}
                </div>

                {q.type === "mcq" && stuAns !== undefined && (
                  <div style={{ fontSize: 13, paddingLeft: 22 }}>
                    <span style={{ color: "#888" }}>Answered: </span>
                    <span style={{ fontWeight: 700, color: isCorrect ? "#10b981" : "#ef4444" }}>
                      {q.options[stuAns]}
                    </span>
                    {!isCorrect && (
                      <>
                        <span style={{ color: "#888" }}> &nbsp;|&nbsp; Correct: </span>
                        <span style={{ fontWeight: 700, color: "#10b981" }}>
                          {q.options[review.correct]}
                        </span>
                      </>
                    )}
                  </div>
                )}
                {q.type === "mcq" && stuAns === undefined && (
                  <div style={{ fontSize: 13, paddingLeft: 22, color: "#bbb" }}>
                    Not attempted
                  </div>
                )}

                {q.type === "subjective" && (
                  <div style={{ paddingLeft: 22, fontSize: 13 }}>
                    <div style={{ color: "#888", marginBottom: 4 }}>Student answer:</div>
                    <div style={{
                      background: "#fff", padding: "10px 14px",
                      borderRadius: 8, border: "1px solid #e5e7eb",
                      color: "#333", whiteSpace: "pre-wrap", lineHeight: 1.6,
                    }}>
                      {stuAns || <em style={{ color: "#ccc" }}>No answer provided</em>}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#aaa" }}>
                      {review.marks_awarded === null || review.marks_awarded === undefined
                        ? `Max marks: ${q.marks} — awaiting teacher grade`
                        : `Awarded marks: ${review.marks_awarded}/${q.marks}`}
                    </div>
                  </div>
                )}

                {q.type === "mcq" && q.explanation && (
                  <div style={{
                    paddingLeft: 22, marginTop: 6,
                    fontSize: 12, color: "#888", fontStyle: "italic",
                  }}>
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </Modal>
      )}
    </div>
  );
}
