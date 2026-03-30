import type { AttendanceRow } from "../types/attendance.types";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 0,
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

export function AttendanceRoster({
  className,
  isLoading,
  rows,
  setRows,
  onSave,
  isSaving,
}: {
  className: string;
  isLoading: boolean;
  rows: AttendanceRow[];
  setRows: React.Dispatch<React.SetStateAction<AttendanceRow[]>>;
  onSave: () => void;
  isSaving: boolean;
}) {
  if (!className) return <div style={{ color: "#6b7280" }}>Select a class to load the attendance roster.</div>;
  if (isLoading) return <div>Loading attendance roster...</div>;
  if (rows.length === 0) return <div style={{ color: "#6b7280" }}>No active students found for the selected class and session.</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Attendance Roster</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Mark `present`, `absent`, or `leave` for the selected class and save all rows together.
          </p>
        </div>
        <button type="button" style={buttonStyle} onClick={onSave} disabled={isSaving || rows.length === 0}>
          {isSaving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((row, index) => (
          <div key={row.student_id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "grid", gridTemplateColumns: "60px 1.6fr 1fr 1fr 1.4fr", gap: 14, alignItems: "center" }}>
            <div style={{ fontWeight: 700, color: "#64748b" }}>{index + 1}</div>
            <div>
              <div style={{ fontWeight: 800, color: "#0f172a" }}>{row.name}</div>
              <div style={{ color: "#64748b", marginTop: 4 }}>Admission No: {row.roll_number || "-"}</div>
            </div>
            <div style={{ color: "#475569" }}>{row.class}</div>
            <select
              value={row.status}
              onChange={(event) =>
                setRows((current) =>
                  current.map((item) =>
                    item.student_id === row.student_id ? { ...item, status: event.target.value as AttendanceRow["status"] } : item
                  )
                )
              }
              style={inputStyle}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
            <input
              value={row.remarks || ""}
              onChange={(event) =>
                setRows((current) =>
                  current.map((item) =>
                    item.student_id === row.student_id ? { ...item, remarks: event.target.value } : item
                  )
                )
              }
              placeholder="Optional remark"
              style={inputStyle}
            />
          </div>
        ))}
      </div>
    </>
  );
}
