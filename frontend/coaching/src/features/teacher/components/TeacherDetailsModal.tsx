import type { Teacher } from "../types/teacher.types";

const panelStyle = {
  background: "#ffffff",
  borderRadius: 20,
  width: "min(760px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 48px)",
  overflowY: "auto" as const,
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
  border: "1px solid rgba(15, 23, 42, 0.08)",
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};

export function TeacherDetailsModal({
  teacher,
  onClose,
}: {
  teacher: Teacher | null;
  onClose: () => void;
}) {
  if (!teacher) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 120,
      }}
      onClick={onClose}
    >
      <div style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <div style={{ padding: 24, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {teacher.photo_url ? (
              <img
                src={teacher.photo_url}
                alt={teacher.name}
                style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 18, border: "1px solid #e5e7eb" }}
              />
            ) : null}
            <div>
            <h2 style={{ margin: 0, fontSize: 28 }}>{teacher.name}</h2>
            <p style={{ margin: "8px 0 0", color: "#64748b" }}>
              {[teacher.qualification, teacher.experience].filter(Boolean).join(" | ") || "No qualification added"}
            </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "#f1f5f9",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
              height: "fit-content",
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 24, display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Status</div>
              <div style={{ marginTop: 6, fontWeight: 700, color: teacher.status === "active" ? "#166534" : "#b45309" }}>{teacher.status}</div>
              <div style={{ marginTop: 4, color: "#64748b" }}>{teacher.is_staff ? "Non-teaching staff" : "Teaching staff"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Join Date</div>
              <div style={{ marginTop: 6, fontWeight: 700, color: "#0f172a" }}>{teacher.join_date ? new Date(teacher.join_date).toLocaleDateString() : "-"}</div>
              <div style={{ marginTop: 4, color: "#64748b" }}>{teacher.experience || "-"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Login</div>
              <div style={{ marginTop: 6, fontWeight: 700, color: teacher.has_login_account ? "#166534" : "#b45309" }}>
                {teacher.has_login_account ? "Ready" : "Not created"}
              </div>
              <div style={{ marginTop: 4, color: "#64748b" }}>{teacher.login_email || teacher.login_phone || "-"}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Contact</div>
              <div style={{ marginTop: 6, color: "#0f172a", fontWeight: 700 }}>{teacher.phone || "-"}</div>
              <div style={{ marginTop: 4, color: "#64748b" }}>{teacher.email || "-"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Assigned Classes</div>
              <div style={{ marginTop: 6, color: "#0f172a" }}>{(teacher.assigned_classes || []).join(", ") || "-"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Assigned Subjects</div>
              <div style={{ marginTop: 6, color: "#0f172a" }}>{(teacher.assigned_subjects || []).join(", ") || "-"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Notes</div>
              <div style={{ marginTop: 6, color: "#0f172a" }}>{teacher.notes || "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
