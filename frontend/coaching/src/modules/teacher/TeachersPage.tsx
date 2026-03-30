import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";

type Teacher = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  qualification?: string | null;
  assigned_subjects?: string[] | null;
  assigned_classes?: string[] | null;
  join_date?: string | null;
  status: string;
  notes?: string | null;
  has_login_account?: boolean;
  login_email?: string | null;
  login_phone?: string | null;
};

type FeeStructureOption = {
  id: number;
  name: string;
  class_name?: string | null;
  course_name?: string | null;
};

type ExamOption = {
  id: number;
  class: string;
};

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Science",
  "English",
  "Social Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Computer",
  "Hindi",
  "Odia",
  "Sanskrit",
];

const cardStyle = {
  background: "#fff",
  borderRadius: 18,
  padding: 22,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
};

const buttonStyle = {
  background: "#1d4ed8",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  ...buttonStyle,
  background: "#eff6ff",
  color: "#1d4ed8",
};

const dangerButton = {
  ...buttonStyle,
  background: "#fff1f2",
  color: "#be123c",
};

const pickerStyle = {
  marginTop: 6,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: 14,
  display: "grid",
  gap: 10,
  background: "#fff",
};

const pickerGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const initialForm = {
  name: "",
  phone: "",
  email: "",
  gender: "male",
  qualification: "",
  assigned_subjects: [] as string[],
  assigned_classes: [] as string[],
  join_date: new Date().toISOString().slice(0, 10),
  status: "active",
  notes: "",
  create_login: false,
  login_email: "",
  login_phone: "",
  login_password: "",
};

function toggleSelection(values: string[], item: string) {
  return values.includes(item) ? values.filter((value) => value !== item) : [...values, item];
}

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [accountDraft, setAccountDraft] = useState({
    open: false,
    teacherId: 0,
    teacherName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const response = await api.get("/teachers");
      return (response.data || []) as Teacher[];
    },
  });

  const feeStructuresQuery = useQuery({
    queryKey: ["teacher-class-structures"],
    queryFn: async () => {
      const response = await api.get("/fees/structures");
      return (response.data || []) as FeeStructureOption[];
    },
  });

  const examsQuery = useQuery({
    queryKey: ["teacher-class-exams"],
    queryFn: async () => {
      const response = await api.get("/exams");
      return (response.data || []) as ExamOption[];
    },
  });

  const classOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of feeStructuresQuery.data || []) {
      const value = item.class_name || item.course_name || item.name;
      if (value) values.add(value);
    }
    for (const exam of examsQuery.data || []) {
      if (exam.class) values.add(exam.class);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [examsQuery.data, feeStructuresQuery.data]);

  const teacherStats = useMemo(() => {
    const teachers = teachersQuery.data || [];
    return {
      total: teachers.length,
      active: teachers.filter((item) => item.status === "active").length,
      classes: new Set(teachers.flatMap((item) => item.assigned_classes || [])).size,
      subjects: new Set(teachers.flatMap((item) => item.assigned_subjects || [])).size,
    };
  }, [teachersQuery.data]);

  const resetForm = () => {
    setEditingTeacherId(null);
    setForm(initialForm);
    setShowForm(false);
  };

  const saveTeacherMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        assigned_subjects: form.assigned_subjects,
        assigned_classes: form.assigned_classes,
      };

      if (editingTeacherId) {
        return api.patch(`/teachers/${editingTeacherId}`, payload);
      }
      return api.post("/teachers", payload);
    },
    onSuccess: async () => {
      setMessage(editingTeacherId ? "Teacher updated." : "Teacher created.");
      setError("");
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to save teacher.");
      setMessage("");
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: number) => api.delete(`/teachers/${teacherId}`),
    onSuccess: async () => {
      setMessage("Teacher deleted.");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to delete teacher.");
      setMessage("");
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async () =>
      api.post("/auth/accounts", {
        role: "teacher",
        teacher_id: accountDraft.teacherId,
        email: accountDraft.email || undefined,
        phone: accountDraft.phone || undefined,
        password: accountDraft.password,
      }),
    onSuccess: async () => {
      setMessage(`Login account created for ${accountDraft.teacherName}.`);
      setError("");
      setAccountDraft({ open: false, teacherId: 0, teacherName: "", email: "", phone: "", password: "" });
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to create teacher login.");
      setMessage("");
    },
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Teacher Module</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Create teachers, assign real classes, and use a controlled subject list so leave and attendance modules stay clean later.
          </p>
        </div>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setEditingTeacherId(null);
            setForm(initialForm);
            setShowForm((current) => !current);
          }}
        >
          {showForm ? "Close Form" : "Add Teacher"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <StatCard label="Total Teachers" value={teacherStats.total} accent="#2563eb" />
        <StatCard label="Active Teachers" value={teacherStats.active} accent="#059669" />
        <StatCard label="Assigned Classes" value={teacherStats.classes} accent="#d97706" />
        <StatCard label="Assigned Subjects" value={teacherStats.subjects} accent="#7c3aed" />
      </div>

      {message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}

      {accountDraft.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() => setAccountDraft({ open: false, teacherId: 0, teacherName: "", email: "", phone: "", password: "" })}
        >
          <div style={{ ...cardStyle, width: "min(560px, 100%)" }} onClick={(event) => event.stopPropagation()}>
            <h2 style={{ margin: 0 }}>Create Teacher Login</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>Create a linked login account for {accountDraft.teacherName}.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <Field label="Email">
                <input value={accountDraft.email} onChange={(event) => setAccountDraft((current) => ({ ...current, email: event.target.value }))} style={inputStyle} />
              </Field>
              <Field label="Mobile">
                <input value={accountDraft.phone} onChange={(event) => setAccountDraft((current) => ({ ...current, phone: event.target.value }))} style={inputStyle} />
              </Field>
            </div>
            <Field label="Password">
              <input type="password" value={accountDraft.password} onChange={(event) => setAccountDraft((current) => ({ ...current, password: event.target.value }))} style={inputStyle} />
            </Field>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" style={secondaryButton} onClick={() => setAccountDraft({ open: false, teacherId: 0, teacherName: "", email: "", phone: "", password: "" })}>
                Cancel
              </button>
              <button type="button" style={buttonStyle} onClick={() => createAccountMutation.mutate()} disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending ? "Saving..." : "Create Login"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form
          style={cardStyle}
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("");
            setError("");
            saveTeacherMutation.mutate();
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0 }}>{editingTeacherId ? "Edit Teacher" : "Create Teacher"}</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>Classes come from your actual center data. Subjects use a controlled list for now.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            <Field label="Teacher Name">
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} style={inputStyle} required />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            <Field label="Gender">
              <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} style={inputStyle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Qualification">
              <input value={form.qualification} onChange={(event) => setForm((current) => ({ ...current, qualification: event.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Joining Date">
              <input type="date" value={form.join_date} onChange={(event) => setForm((current) => ({ ...current, join_date: event.target.value }))} style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <Field label="Assigned Subjects">
              <div style={pickerStyle}>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  {form.assigned_subjects.length ? `${form.assigned_subjects.length} selected` : "Select one or more subjects"}
                </div>
                <div style={pickerGridStyle}>
                  {SUBJECT_OPTIONS.map((subject) => (
                    <label key={subject} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={form.assigned_subjects.includes(subject)}
                        onChange={() => setForm((current) => ({ ...current, assigned_subjects: toggleSelection(current.assigned_subjects, subject) }))}
                      />
                      <span>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Field>

            <Field label="Assigned Classes">
              <div style={pickerStyle}>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  {form.assigned_classes.length ? `${form.assigned_classes.length} selected` : "Select one or more classes"}
                </div>
                <div style={pickerGridStyle}>
                  {classOptions.map((item) => (
                    <label key={item} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={form.assigned_classes.includes(item)}
                        onChange={() => setForm((current) => ({ ...current, assigned_classes: toggleSelection(current.assigned_classes, item) }))}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
                {classOptions.length === 0 && (
                  <div style={{ color: "#b45309", fontSize: 13 }}>
                    No class data found yet. Create students, fee structures, or exams first.
                  </div>
                )}
              </div>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            <Field label="Status">
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div />
            <div />
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
          </Field>

          {!editingTeacherId && (
            <>
              <div style={{ marginTop: 18 }}>
                <label style={{ display: "flex", gap: 10, alignItems: "center", color: "#374151", fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={form.create_login}
                    onChange={(event) => setForm((current) => ({ ...current, create_login: event.target.checked }))}
                  />
                  Create Teacher Login Now
                </label>
              </div>

              {form.create_login && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 16 }}>
                  <Field label="Login Email">
                    <input value={form.login_email} onChange={(event) => setForm((current) => ({ ...current, login_email: event.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Login Mobile">
                    <input value={form.login_phone} onChange={(event) => setForm((current) => ({ ...current, login_phone: event.target.value }))} style={inputStyle} />
                  </Field>
                  <Field label="Login Password">
                    <input type="password" value={form.login_password} onChange={(event) => setForm((current) => ({ ...current, login_password: event.target.value }))} style={inputStyle} />
                  </Field>
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <button type="submit" style={buttonStyle} disabled={saveTeacherMutation.isPending}>
              {saveTeacherMutation.isPending ? "Saving..." : editingTeacherId ? "Update Teacher" : "Save Teacher"}
            </button>
            <button type="button" style={secondaryButton} onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <section style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Teacher List</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>Teachers now use controlled class and subject assignments instead of manual text.</p>
        </div>

        {teachersQuery.isLoading ? (
          <div>Loading teachers...</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {(teachersQuery.data || []).map((teacher) => (
              <div key={teacher.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ color: "#0f172a", fontSize: 18 }}>{teacher.name}</strong>
                    <span style={{
                      display: "inline-flex",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: teacher.status === "active" ? "#ecfdf5" : "#fef2f2",
                      color: teacher.status === "active" ? "#166534" : "#b91c1c",
                      fontWeight: 700,
                      fontSize: 12,
                    }}>
                      {teacher.status}
                    </span>
                  </div>
                  <div style={{ color: "#64748b" }}>
                    {[teacher.phone, teacher.email, teacher.qualification].filter(Boolean).join(" | ") || "No contact details"}
                  </div>
                  <div style={{ color: teacher.has_login_account ? "#166534" : "#b45309", fontWeight: 700 }}>
                    {teacher.has_login_account ? `Login ready: ${teacher.login_email || teacher.login_phone || "-"}` : "Login not created yet"}
                  </div>
                  <div style={{ color: "#334155" }}>
                    <strong>Subjects:</strong> {(teacher.assigned_subjects || []).join(", ") || "Not assigned"}
                  </div>
                  <div style={{ color: "#334155" }}>
                    <strong>Classes:</strong> {(teacher.assigned_classes || []).join(", ") || "Not assigned"}
                  </div>
                  <div style={{ color: "#64748b" }}>
                    Join Date: {teacher.join_date ? new Date(teacher.join_date).toLocaleDateString() : "-"}
                  </div>
                  {teacher.notes && <div style={{ color: "#475569" }}>{teacher.notes}</div>}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={secondaryButton}
                    onClick={() =>
                      setAccountDraft({
                        open: true,
                        teacherId: teacher.id,
                        teacherName: teacher.name,
                        email: teacher.login_email || teacher.email || "",
                        phone: teacher.login_phone || teacher.phone || "",
                        password: "",
                      })
                    }
                    disabled={Boolean(teacher.has_login_account)}
                  >
                    {teacher.has_login_account ? "Login Ready" : "Create Login"}
                  </button>
                  <button
                    type="button"
                    style={secondaryButton}
                    onClick={() => {
                      setEditingTeacherId(teacher.id);
                      setForm({
                        name: teacher.name || "",
                        phone: teacher.phone || "",
                        email: teacher.email || "",
                        gender: teacher.gender || "male",
                        qualification: teacher.qualification || "",
                        assigned_subjects: teacher.assigned_subjects || [],
                        assigned_classes: teacher.assigned_classes || [],
                        join_date: teacher.join_date ? String(teacher.join_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
                        status: teacher.status || "active",
                        notes: teacher.notes || "",
                        create_login: false,
                        login_email: "",
                        login_phone: "",
                        login_password: "",
                      });
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    style={dangerButton}
                    onClick={() => {
                      if (!window.confirm("Delete this teacher?")) return;
                      deleteTeacherMutation.mutate(teacher.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {(teachersQuery.data || []).length === 0 && (
              <div style={{ color: "#6b7280" }}>No teachers created yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 700, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

function StatCard({ accent, label, value }: { accent: string; label: string; value: number }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${accent}` }}>
      <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, color: "#0f172a", fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
