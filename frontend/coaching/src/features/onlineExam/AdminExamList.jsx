// ─────────────────────────────────────────────────────────────
// AdminExamList.jsx  –  shows all exams, stats, action buttons
// ─────────────────────────────────────────────────────────────
import React from "react";
import { Btn, Badge, StatCard, Icon } from "./ExamUI";
import "./exam.css"

const STATUS_COLOR = {
  published: "#10b981",
  draft:     "#f59e0b",
  ended:     "#6366f1",
  cancelled: "#ef4444",
};

export default function AdminExamList({ exams, onCreateNew, onManage, onViewResults, onDelete, deletingExamId = null }) {
  const totalQuestions = exams.reduce((s, e) => s + (e.questionCount ?? e.questions?.length ?? 0), 0);
  const totalSubs      = exams.reduce((s, e) => s + (e.submissionCount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 ,flexWrap: "wrap", gap: 16}}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a1a2e", margin: 0 }}>
            Online Exam System
          </h1>
          <p style={{ color: "#888", margin: "4px 0 0", fontSize: 14 }}>
            Create, manage and evaluate online exams
          </p>
        </div>
        <Btn onClick={onCreateNew}>
          <Icon name="plus" size={16} /> Create New Exam
        </Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Exams"     value={exams.length}                                         color="#4f46e5" icon="list"   />
        <StatCard label="Published"       value={exams.filter(e => e.status === "published").length}   color="#10b981" icon="flag"   />
        <StatCard label="Total Questions" value={totalQuestions}                                        color="#f59e0b" icon="edit"   />
        <StatCard label="Submissions"     value={totalSubs}                                             color="#6366f1" icon="user"   />
      </div>

      {/* Exam Cards */}
      <div style={{ display: "grid", gap: 16 }}>
        {exams.map(exam => {
          const mcqCnt  = (exam.questions || []).filter(q => q.type === "mcq").length;
          const subCnt  = (exam.questions || []).filter(q => q.type === "subjective").length;
          const color   = STATUS_COLOR[exam.status] || "#888";
          return (
            <div
              key={exam.id}
              className="exam-card"
              style={{
                borderLeft: `5px solid ${color}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>
                    {exam.title}
                  </span>
                  <Badge color={color}>{exam.status.toUpperCase()}</Badge>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[
                    ["Subject",     exam.subject],
                    ["Class",       exam.class],
                    ["Duration",    exam.duration + " min"],
                    ["Total Marks", exam.totalMarks || 0],
                    ["MCQ",         mcqCnt + " Qs"],
                    ["Subjective",  subCnt + " Qs"],
                    ["Submissions", exam.submissionCount || 0],
                  ].map(([k, v]) => (
                    <div key={k} style={{ fontSize: 13 }}>
                      <span style={{ color: "#aaa" }}>{k}: </span>
                      <span style={{ color: "#444", fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <Btn sm ghost onClick={() => onManage(exam)}>
                  <Icon name="edit" size={14} /> Manage
                </Btn>
                <Btn sm color="#6366f1" onClick={() => onViewResults(exam)}>
                  <Icon name="eye" size={14} /> Results
                </Btn>
                <Btn
                  sm
                  color="#dc2626"
                  onClick={() => onDelete(exam)}
                  disabled={deletingExamId === exam.id}
                >
                  <Icon name="trash" size={14} /> {deletingExamId === exam.id ? "Deleting..." : "Delete"}
                </Btn>
              </div>
            </div>
          );
        })}

        {exams.length === 0 && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: 60,
            textAlign: "center", color: "#ccc",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              No exams yet. Click "Create New Exam" to get started.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
