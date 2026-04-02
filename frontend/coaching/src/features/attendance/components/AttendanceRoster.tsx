import type { AttendanceRow } from "../types/attendance.types";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
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

const COLS = "60px 1.6fr 1fr 1fr 1.4fr";
const MIN_WIDTH = 600;

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
  if (!className)
    return <div style={{ color: "#6b7280" ,display:"flex",justifyContent:"center",padding:"10px 20px"}}>Select a class to load the attendance roster.</div>;
  if (isLoading)
    return <div>Loading attendance roster...</div>;
  if (rows.length === 0)
    return <div style={{ color: "#6b7280" }}>No active students found for the selected class and session.</div>;

  return (
    <>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
        flexWrap: "wrap",
        marginBottom: 18,
        padding: "22px 22px 0 22px",
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Attendance Roster</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Mark <code>present</code>, <code>absent</code>, or <code>leave</code> for the selected class and save all rows together.
          </p>
        </div>
        <button
          type="button"
          style={buttonStyle}
          onClick={onSave}
          disabled={isSaving || rows.length === 0}
        >
          {isSaving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      {/* ONE outer card — overflow hidden for border-radius */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>

        {/* ONE scroll wrapper for header + ALL rows together */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: COLS,
            gap: 14,
            padding: "12px 16px",
            minWidth: MIN_WIDTH,
            background: "#f8fafc",
            borderBottom: "1px solid #e5e7eb",
          }}>
            {["#", "Student", "Class", "Status", "Remarks"].map((col) => (
              <div key={col} style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{col}</div>
            ))}
          </div>

          {/* All rows — same minWidth so they align with headers */}
          {rows.map((row, index) => (
            <div
              key={row.student_id}
              style={{
                display: "grid",
                gridTemplateColumns: COLS,
                gap: 14,
                alignItems: "center",
                padding: 16,
                minWidth: MIN_WIDTH,
                borderBottom: index < rows.length - 1 ? "1px solid #e5e7eb" : "none",
                background: index % 2 === 0 ? "#fff" : "#fafafa",
              }}
            >
              <div style={{ fontWeight: 700, color: "#64748b" }}>{index + 1}</div>

              <div>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{row.name}</div>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
                  Admission No: {row.roll_number || "-"}
                </div>
              </div>

              <div style={{ color: "#475569" }}>{row.class}</div>

              <select
                value={row.status}
                onChange={(e) =>
                  setRows((c) =>
                    c.map((item) =>
                      item.student_id === row.student_id
                        ? { ...item, status: e.target.value as AttendanceRow["status"] }
                        : item
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
                onChange={(e) =>
                  setRows((c) =>
                    c.map((item) =>
                      item.student_id === row.student_id
                        ? { ...item, remarks: e.target.value }
                        : item
                    )
                  )
                }
                placeholder="Optional remark"
                style={inputStyle}
              />
            </div>
          ))}

        </div>
      </div>
    </>
  );
}