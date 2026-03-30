import { dangerButton, secondaryButton } from "./teacherStyles";
import type { Teacher } from "../types/teacher.types";

export function TeacherList({
  teachers,
  loading,
  onCreateLogin,
  onEdit,
  onDelete,
}: {
  teachers: Teacher[];
  loading: boolean;
  onCreateLogin: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacherId: number) => void;
}) {
  return (
    <section style={{ background: "#fff", borderRadius: 18, padding: 22, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)" }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Teacher List</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>Teachers now use controlled class and subject assignments instead of manual text.</p>
      </div>

      {loading ? (
        <div>Loading teachers...</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {teachers.map((teacher) => (
            <div key={teacher.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <strong style={{ color: "#0f172a", fontSize: 18 }}>{teacher.name}</strong>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: teacher.status === "active" ? "#ecfdf5" : "#fef2f2",
                      color: teacher.status === "active" ? "#166534" : "#b91c1c",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {teacher.status}
                  </span>
                </div>
                <div style={{ color: "#64748b" }}>{[teacher.phone, teacher.email, teacher.qualification].filter(Boolean).join(" | ") || "No contact details"}</div>
                <div style={{ color: teacher.has_login_account ? "#166534" : "#b45309", fontWeight: 700 }}>
                  {teacher.has_login_account ? `Login ready: ${teacher.login_email || teacher.login_phone || "-"}` : "Login not created yet"}
                </div>
                <div style={{ color: "#334155" }}>
                  <strong>Subjects:</strong> {(teacher.assigned_subjects || []).join(", ") || "Not assigned"}
                </div>
                <div style={{ color: "#334155" }}>
                  <strong>Classes:</strong> {(teacher.assigned_classes || []).join(", ") || "Not assigned"}
                </div>
                <div style={{ color: "#64748b" }}>Join Date: {teacher.join_date ? new Date(teacher.join_date).toLocaleDateString() : "-"}</div>
                {teacher.notes && <div style={{ color: "#475569" }}>{teacher.notes}</div>}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" style={secondaryButton} onClick={() => onCreateLogin(teacher)} disabled={Boolean(teacher.has_login_account)}>
                  {teacher.has_login_account ? "Login Ready" : "Create Login"}
                </button>
                <button type="button" style={secondaryButton} onClick={() => onEdit(teacher)}>
                  Edit
                </button>
                <button type="button" style={dangerButton} onClick={() => onDelete(teacher.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {teachers.length === 0 && <div style={{ color: "#6b7280" }}>No teachers created yet.</div>}
        </div>
      )}
    </section>
  );
}
