import type { StudentRecord } from "../types/students.types";
import { FeeStatusPill } from "./FeeStatusPill";

function renderFeeStatus(student: StudentRecord) {
  const overdue = Number(student.overdue_count || 0);
  const current = Number(student.current_due_count || 0);

  if (overdue > 0) {
    return <FeeStatusPill label={`Overdue (${overdue})`} background="#fee2e2" color="#b91c1c" />;
  }

  if (current > 0) {
    return <FeeStatusPill label={`Due (${current})`} background="#fef3c7" color="#b45309" />;
  }

  return <FeeStatusPill label="Clear" background="#dcfce7" color="#15803d" />;
}

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

export function StudentDetailsModal({
  student,
  onClose,
}: {
  student: StudentRecord | null;
  onClose: () => void;
}) {
  if (!student) return null;

  const classCourseLabel = student.board ? `${student.class} • ${student.board}` : student.class;
  const status = student.status || "active";

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
        <div
          style={{
            padding: 24,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* LEFT SIDE (Photo + Name) */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Student Photo */}
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt="student"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #e5e7eb",
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
                {student.name?.[0] || "?"}
              </div>
            )}

            {/* Name + Admission */}
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>{student.name}</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Admission No: {student.roll_number || "-"}
              </p>
            </div>
          </div>

          {/* CLOSE BUTTON */}
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
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 24, display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Class / Course</div>
              <div style={{ marginTop: 6, fontWeight: 700, color: "#0f172a" }}>{classCourseLabel || "-"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Admission Date</div>
              <div style={{ marginTop: 6, fontWeight: 700, color: "#0f172a" }}>{student.join_date ? new Date(student.join_date).toLocaleDateString() : "-"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Status</div>
              <div style={{ marginTop: 6, fontWeight: 700, color: status === "active" ? "#166534" : "#b45309" }}>{status}</div>
              {student.left_date ? <div style={{ marginTop: 4, color: "#64748b" }}>Left on {new Date(student.left_date).toLocaleDateString()}</div> : null}
              {student.left_reason ? <div style={{ marginTop: 4, color: "#64748b" }}>{student.left_reason}</div> : null}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Fee Status</div>
              <div style={{ marginTop: 8 }}>{renderFeeStatus(student)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Contact</div>
              <div style={{ marginTop: 6, color: "#0f172a", fontWeight: 700 }}>{student.phone || "-"}</div>
              <div style={{ marginTop: 4, color: "#64748b" }}>{student.email || "-"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Fee Plan</div>
              <div style={{ marginTop: 6, color: "#0f172a", fontWeight: 700 }}>{student.billing_cycle ? student.billing_cycle.replace("_", " ") : "-"}</div>
              <div style={{ marginTop: 4, color: "#64748b" }}>{student.academic_year || "-"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Facilities</div>
              <div style={{ marginTop: 6, color: "#0f172a" }}>Hostel: {student.include_hostel ? "Yes" : "No"}</div>
              <div style={{ marginTop: 4, color: "#0f172a" }}>Transport: {student.include_transport ? "Yes" : "No"}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Login</div>
              {student.has_login_account ? (
                <>
                  <div style={{ marginTop: 6, fontWeight: 700, color: "#166534" }}>Ready</div>
                  <div style={{ marginTop: 4, color: "#64748b" }}>{student.login_email || student.login_phone || "-"}</div>
                </>
              ) : (
                <div style={{ marginTop: 6, fontWeight: 700, color: "#b45309" }}>Not created</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
