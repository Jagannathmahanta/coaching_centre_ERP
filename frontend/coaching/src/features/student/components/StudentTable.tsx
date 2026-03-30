import { FeeStatusPill } from "./FeeStatusPill";
import type { StudentRecord } from "../types/students.types";

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

const tableCellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left" as const,
  verticalAlign: "top" as const,
};

function renderFeeStatus(student: StudentRecord) {
  const overdue = Number(student.overdue_count || 0);
  const current = Number(student.current_due_count || 0);

  if (overdue > 0) {
    return <FeeStatusPill label={`Overdue (${overdue})`} background="#fee2e2" color="#b91c1c" />;
  }

  if (current > 0) {
    return <FeeStatusPill label={`Due This Month (${current})`} background="#fef3c7" color="#b45309" />;
  }

  return <FeeStatusPill label="Fees Clear" background="#dcfce7" color="#15803d" />;
}

export function StudentTable({
  students,
  onEdit,
  onDelete,
  onCreateLogin,
}: {
  students: StudentRecord[];
  onEdit: (studentId: number) => void;
  onDelete: (studentId: number) => void;
  onCreateLogin: (student: StudentRecord) => void;
}) {
  if (students.length === 0) {
    return <div style={cardStyle}>No students found yet.</div>;
  }

  return (
    <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1320 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={tableCellStyle}>Sl No</th>
            <th style={tableCellStyle}>Name</th>
            <th style={tableCellStyle}>Class</th>
            <th style={tableCellStyle}>Board</th>
            <th style={tableCellStyle}>Admission Date</th>
            <th style={tableCellStyle}>Plan</th>
            <th style={tableCellStyle}>Session</th>
            <th style={tableCellStyle}>Hostel</th>
            <th style={tableCellStyle}>Transport</th>
            <th style={tableCellStyle}>Fee Status</th>
            <th style={tableCellStyle}>Login</th>
            <th style={tableCellStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr
              key={student.id}
              style={{
                background:
                  Number(student.overdue_count || 0) > 0
                    ? "#fff7f7"
                    : Number(student.current_due_count || 0) > 0
                      ? "#fffdf5"
                      : "#fff",
              }}
            >
              <td style={tableCellStyle}>{index + 1}</td>
              <td style={tableCellStyle}>
                <div style={{ fontWeight: 700 }}>{student.name}</div>
                <div style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>Admission No: {student.roll_number || "-"}</div>
                <div style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>{student.phone || "-"}</div>
              </td>
              <td style={tableCellStyle}>{student.class}</td>
              <td style={tableCellStyle}>{student.board || "-"}</td>
              <td style={tableCellStyle}>{student.join_date ? new Date(student.join_date).toLocaleDateString() : "-"}</td>
              <td style={tableCellStyle}>{student.billing_cycle ? student.billing_cycle.replace("_", " ") : "-"}</td>
              <td style={tableCellStyle}>{student.academic_year || "-"}</td>
              <td style={tableCellStyle}>{student.include_hostel ? "Yes" : "No"}</td>
              <td style={tableCellStyle}>{student.include_transport ? "Yes" : "No"}</td>
              <td style={tableCellStyle}>{renderFeeStatus(student)}</td>
              <td style={tableCellStyle}>
                {student.has_login_account ? (
                  <div>
                    <div style={{ fontWeight: 700, color: "#166534" }}>Ready</div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>{student.login_email || student.login_phone || "-"}</div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onCreateLogin(student)}
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Create Login
                  </button>
                )}
              </td>
              <td style={tableCellStyle}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => onEdit(student.id)}
                    style={{
                      background: "#fff",
                      color: "#1f2937",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(student.id)}
                    style={{
                      background: "#fff",
                      color: "#b91c1c",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
