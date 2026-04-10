// ─────────────────────────────────────────────────────────────
// AdminManageExam.jsx  –  create / edit exam + questions
// ─────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { Btn, Badge, Modal, Field, Icon } from "./ExamUI";

const EMPTY_EXAM = {
  title: "", subject: "", class: "",
  duration: 60, passMark: 0,
  status: "draft",
  startTime: "", endTime: "",
  instructions: "1. All questions are compulsory.\n2. MCQ: 2 marks each, no negative marking.\n3. Show all working for subjective questions.",
  questions: [],
};

const EMPTY_Q = {
  type: "mcq",
  text: "",
  options: ["", "", "", ""],
  correct: 0,
  marks: 2,
  explanation: "",
};

// ─── Question Modal ──────────────────────────────────────────
function QuestionModal({ editQ, onSave, onClose }) {
  const [form, setForm] = useState(
    editQ
      ? { ...editQ, options: editQ.options || ["", "", "", ""] }
      : { ...EMPTY_Q }
  );

  const save = () => {
    if (!form.text.trim()) return alert("Question text is required.");
    if (form.type === "mcq" && form.options.some(o => !o.trim()))
      return alert("All 4 options are required for MCQ.");
    onSave({ ...form, id: editQ?.id || Date.now(), marks: Number(form.marks) });
  };

  return (
    <Modal
      title={editQ ? "Edit Question" : "Add Question"}
      onClose={onClose}
    >
      <Field
        label="Question Type"
        type="select"
        value={form.type}
        onChange={e => setForm({ ...form, type: e.target.value })}
      >
        <option value="mcq">MCQ — Multiple Choice (auto-graded)</option>
        <option value="subjective">Subjective — Written Answer (teacher grades)</option>
      </Field>

      <Field
        label="Question Text"
        type="textarea"
        rows={3}
        value={form.text}
        onChange={e => setForm({ ...form, text: e.target.value })}
        placeholder="Enter your question..."
      />

      <Field
        label="Marks"
        type="number"
        value={form.marks}
        onChange={e => setForm({ ...form, marks: e.target.value })}
      />

      {form.type === "mcq" && (
        <>
          <label style={{
            display: "block", fontSize: 12, fontWeight: 700,
            color: "#666", marginBottom: 8,
            textTransform: "uppercase", letterSpacing: 0.4,
          }}>
            Options — select the correct answer
          </label>
          {form.options.map((opt, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: 10, alignItems: "center", marginBottom: 8,
              }}
            >
              <input
                type="radio"
                name="correct"
                checked={form.correct === i}
                onChange={() => setForm({ ...form, correct: i })}
                style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
              />
              <input
                value={opt}
                onChange={e =>
                  setForm({
                    ...form,
                    options: form.options.map((o, j) => j === i ? e.target.value : o),
                  })
                }
                placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8,
                  border: `1.5px solid ${form.correct === i ? "#10b981" : "#e0e7ff"}`,
                  fontSize: 14, outline: "none",
                  background: form.correct === i ? "#f0fdf4" : "#fafafa",
                }}
              />
            </div>
          ))}
          <p style={{ margin: "2px 0 14px", fontSize: 12, color: "#999" }}>
            Click the radio button next to the correct answer
          </p>

          <Field
            label="Explanation (shown to student after exam)"
            type="textarea"
            rows={2}
            value={form.explanation}
            onChange={e => setForm({ ...form, explanation: e.target.value })}
            placeholder="Why is this the correct answer?"
          />
        </>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn ghost color="#888" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}><Icon name="check" size={16} /> Save Question</Btn>
      </div>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminManageExam({ exam: initExam, classOptions = [], onBack, onSave }) {
  const [exam, setExam] = useState(initExam ? { ...initExam } : { ...EMPTY_EXAM });
  const [tab, setTab]   = useState("settings"); // settings | questions | preview
  const [showQModal, setShowQModal] = useState(false);
  const [editQ, setEditQ]           = useState(null);
  const [isMobile, setIsMobile]     = useState(() => window.innerWidth < 900);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const availableClasses = React.useMemo(() => {
    const activeClasses = classOptions.filter((item) => item.status === "active");
    if (exam.class && !activeClasses.some((item) => item.label === exam.class)) {
      return [...activeClasses, { id: `legacy-${exam.class}`, label: exam.class, status: "inactive" }];
    }
    return activeClasses;
  }, [classOptions, exam.class]);

  React.useEffect(() => {
    if (!exam.class && availableClasses.length) {
      setExam((current) => ({ ...current, class: availableClasses[0].label }));
    }
  }, [availableClasses, exam.class]);

  const totalMarks = exam.questions.reduce((s, q) => s + Number(q.marks), 0);

  const openAddQ  = () => { setEditQ(null); setShowQModal(true); };
  const openEditQ = q  => { setEditQ(q);    setShowQModal(true); };

  const saveQuestion = q => {
    setExam(e => ({
      ...e,
      questions: editQ
        ? e.questions.map(x => x.id === editQ.id ? q : x)
        : [...e.questions, q],
    }));
    setShowQModal(false);
  };

  const deleteQ = id =>
    setExam(e => ({ ...e, questions: e.questions.filter(x => x.id !== id) }));

  const TABS = [
    { id: "settings",  label: "⚙️  Settings" },
    { id: "questions", label: `📝  Questions (${exam.questions.length})` },
    { id: "preview",   label: "👁️  Preview" },
  ];

  return (
    <div>
      {/* Top bar */}
      <div style={{
        display: "flex", gap: 14, alignItems: isMobile ? "stretch" : "center", marginBottom: 28,
        flexDirection: isMobile ? "column" : "row",
      }}>
        <Btn ghost color="#555" onClick={onBack} style={isMobile ? { width: "100%", justifyContent: "center" } : {}}>
          <Icon name="back" size={16} /> Back
        </Btn>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "#1a1a2e" }}>
            {initExam ? "Manage Exam" : "Create New Exam"}
          </h1>
        </div>
        <Btn color="#334155" onClick={() => onSave(exam)} style={isMobile ? { width: "100%", justifyContent: "center" } : {}}>
          <Icon name="check" size={16} /> Save Exam
        </Btn>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 24,
        background: "#f3f4f6", padding: 4, borderRadius: 12,
        width: isMobile ? "100%" : "fit-content",
        flexWrap: "wrap",
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "9px 20px", borderRadius: 9,
              border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13,
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#4f46e5" : "#888",
              boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
              flex: isMobile ? "1 1 calc(50% - 4px)" : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SETTINGS TAB ── */}
      {tab === "settings" && (
        <div style={{
          background: "#fff", borderRadius: 16, padding: isMobile ? 18 : 28,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16,
        }}>
          <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
            <Field
              label="Exam Title"
              value={exam.title}
              onChange={e => setExam({ ...exam, title: e.target.value })}
              placeholder="e.g. Mathematics Unit Test"
            />
          </div>
          <Field
            label="Subject"
            value={exam.subject}
            onChange={e => setExam({ ...exam, subject: e.target.value })}
            placeholder="Mathematics"
          />
          <Field
            label="Class"
            type="select"
            value={exam.class}
            onChange={e => setExam({ ...exam, class: e.target.value })}
          >
            <option value="">Select class</option>
            {availableClasses.map((item) => (
              <option key={item.id} value={item.label}>
                {item.label}
              </option>
            ))}
          </Field>
          <Field
            label="Duration (minutes)"
            type="number"
            value={exam.duration}
            onChange={e => setExam({ ...exam, duration: e.target.value })}
          />
          <Field
            label="Pass Mark"
            type="number"
            value={exam.passMark}
            onChange={e => setExam({ ...exam, passMark: e.target.value })}
          />
          <Field
            label="Start Date & Time"
            type="datetime-local"
            value={exam.startTime}
            onChange={e => setExam({ ...exam, startTime: e.target.value })}
          />
          <Field
            label="End Date & Time"
            type="datetime-local"
            value={exam.endTime}
            onChange={e => setExam({ ...exam, endTime: e.target.value })}
          />
          <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
            <Field
              label="Status"
              type="select"
              value={exam.status}
              onChange={e => setExam({ ...exam, status: e.target.value })}
            >
              <option value="draft">Draft (students cannot see)</option>
              <option value="published">Published (students can take exam)</option>
              <option value="ended">Ended</option>
            </Field>
          </div>
          <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
            <Field
              label="Instructions for Students"
              type="textarea"
              rows={4}
              value={exam.instructions}
              onChange={e => setExam({ ...exam, instructions: e.target.value })}
            />
          </div>
          <div style={{
            gridColumn: isMobile ? "span 1" : "span 2",
            background: "#eff6ff", borderRadius: 10,
            padding: "12px 16px", fontSize: 14, color: "#1d4ed8",
            lineHeight: 1.6,
          }}>
            💡 Total marks from questions added so far:{" "}
            <strong>{totalMarks}</strong> &nbsp;|&nbsp; Questions:{" "}
            <strong>{exam.questions.length}</strong>
          </div>
        </div>
      )}

      {/* ── QUESTIONS TAB ── */}
      {tab === "questions" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <Btn onClick={openAddQ} style={isMobile ? { width: "100%", justifyContent: "center" } : {}}>
              <Icon name="plus" size={16} /> Add Question
            </Btn>
          </div>

          {exam.questions.length === 0 ? (
            <div style={{
              background: "#fff", borderRadius: 16,
              padding: 60, textAlign: "center", color: "#ccc",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                No questions yet — click "Add Question"
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {exam.questions.map((q, i) => (
              <div
                key={q.id}
                style={{
                  background: "#fff", borderRadius: 14,
                  padding: isMobile ? 16 : 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  display: "flex", gap: 16, alignItems: "flex-start",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                  {/* Number pill */}
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    background: q.type === "mcq" ? "#4f46e520" : "#f59e0b20",
                    borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 15,
                    color: q.type === "mcq" ? "#4f46e5" : "#f59e0b",
                  }}>
                    {i + 1}
                  </div>

                  <div style={{ flex: 1, width: "100%" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <Badge color={q.type === "mcq" ? "#4f46e5" : "#f59e0b"}>
                        {q.type === "mcq" ? "MCQ" : "Subjective"}
                      </Badge>
                      <Badge color="#10b981">{q.marks} marks</Badge>
                    </div>
                    <div style={{
                      fontSize: 15, color: "#1a1a2e",
                      fontWeight: 600, marginBottom: q.type === "mcq" ? 10 : 0,
                    }}>
                      {q.text}
                    </div>
                    {q.type === "mcq" && (
                      <div style={{
                        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 6,
                      }}>
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "6px 10px", borderRadius: 8,
                              background: oi === q.correct ? "#dcfce7" : "#f9fafb",
                              fontSize: 13,
                              border: `1px solid ${oi === q.correct ? "#10b981" : "#f0f0f0"}`,
                            }}
                          >
                            {oi === q.correct && (
                              <Icon name="check" size={12} />
                            )}
                            <span style={{ color: oi === q.correct ? "#10b981" : "#555", wordBreak: "break-word" }}>
                              {["A","B","C","D"][oi]}. {opt}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.explanation && (
                      <div style={{
                        marginTop: 8, fontSize: 12,
                        color: "#999", fontStyle: "italic",
                      }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, width: isMobile ? "100%" : undefined, justifyContent: isMobile ? "flex-end" : undefined }}>
                    <button
                      onClick={() => openEditQ(q)}
                      style={{
                        background: "#eff6ff", border: "none",
                        borderRadius: 8, padding: 8,
                        cursor: "pointer", color: "#4f46e5",
                      }}
                    >
                      <Icon name="edit" size={15} />
                    </button>
                    <button
                      onClick={() => deleteQ(q.id)}
                      style={{
                        background: "#fee2e2", border: "none",
                        borderRadius: 8, padding: 8,
                        cursor: "pointer", color: "#ef4444",
                      }}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PREVIEW TAB ── */}
      {tab === "preview" && (
        <div style={{
          background: "#fff", borderRadius: 16,
          padding: isMobile ? 18 : 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          {/* Exam header */}
          <div style={{
            textAlign: "center", marginBottom: 28,
            paddingBottom: 24, borderBottom: "2px solid #f0f0f0",
          }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, color: "#1a1a2e" }}>
              {exam.title || "(Untitled Exam)"}
            </h2>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {[
                ["Subject",    exam.subject],
                ["Class",      exam.class],
                ["Duration",   exam.duration + " min"],
                ["Max Marks",  totalMarks],
                ["Pass Marks", exam.passMark],
              ].map(([k, v]) => (
                <span
                  key={k}
                  style={{
                    fontSize: 13, background: "#f5f3ff", color: "#4f46e5",
                    padding: "5px 12px", borderRadius: 20, fontWeight: 600,
                  }}
                >
                  {k}: {v}
                </span>
              ))}
            </div>
            {exam.instructions && (
              <div style={{
                marginTop: 16, background: "#fffbeb",
                borderRadius: 10, padding: "12px 16px",
                textAlign: "left", fontSize: 13, color: "#92400e",
                whiteSpace: "pre-line",
                lineHeight: 1.6,
              }}>
                <strong>📋 Instructions:</strong>
                <br />{exam.instructions}
              </div>
            )}
          </div>

          {/* Questions */}
          {exam.questions.map((q, i) => (
            <div
              key={q.id}
              style={{
                marginBottom: 28, paddingBottom: 22,
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <span style={{ fontWeight: 800, color: "#4f46e5", fontSize: 15, minWidth: 30 }}>
                  Q{i + 1}.
                </span>
                <span style={{ fontSize: 15, color: "#1a1a2e", fontWeight: 600, flex: 1, minWidth: isMobile ? "100%" : 0 }}>
                  {q.text}
                </span>
                <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap" }}>
                  [{q.marks} marks]
                </span>
              </div>
              {q.type === "mcq" && (
                <div style={{
                  paddingLeft: isMobile ? 0 : 30,
                  display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8,
                }}>
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      style={{
                        display: "flex", gap: 10, alignItems: "center",
                        padding: "9px 12px", borderRadius: 9,
                        background: "#f9fafb", border: "1px solid #eee",
                        fontSize: 14,
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        border: "2px solid #d1d5db", flexShrink: 0,
                      }} />
                      <span style={{ wordBreak: "break-word" }}>
                        {["A","B","C","D"][oi]}. {opt}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {q.type === "subjective" && (
                <div style={{ paddingLeft: isMobile ? 0 : 30 }}>
                  <div style={{
                    background: "#f9fafb", borderRadius: 9,
                    padding: "16px", border: "1px solid #eee",
                    color: "#bbb", fontSize: 13,
                  }}>
                    Write your answer here...
                  </div>
                </div>
              )}
            </div>
          ))}

          {exam.questions.length === 0 && (
            <div style={{ textAlign: "center", color: "#ccc", padding: 40 }}>
              No questions added yet
            </div>
          )}
        </div>
      )}

      {/* Question Modal */}
      {showQModal && (
        <QuestionModal
          editQ={editQ}
          onSave={saveQuestion}
          onClose={() => setShowQModal(false)}
        />
      )}
    </div>
  );
}
