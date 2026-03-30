import type { AttendanceRow } from "../types/attendance.types";

export function AttendanceHistory({
  studentId,
  isLoading,
  rows,
}: {
  studentId: string;
  isLoading: boolean;
  rows: AttendanceRow[];
}) {
  if (!studentId) return <div style={{ color: "#6b7280" }}>Select your profile to see attendance details.</div>;
  if (isLoading) return <div>Loading attendance details...</div>;
  if (rows.length === 0) return <div style={{ color: "#6b7280" }}>No attendance records found for the selected filters yet.</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((row, index) => (
        <div key={`${row.student_id}-${row.attendance_date}-${index}`} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, alignItems: "center" }}>
          <div>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>Date</div>
            <div style={{ marginTop: 4, fontWeight: 800, color: "#0f172a" }}>{row.attendance_date ? new Date(row.attendance_date).toLocaleDateString("en-IN") : "-"}</div>
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>Session</div>
            <div style={{ marginTop: 4, color: "#0f172a" }}>{row.academic_session || row.academic_year || "-"}</div>
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>Status</div>
            <div style={{ marginTop: 4, color: row.status === "present" ? "#166534" : row.status === "absent" ? "#be123c" : "#b45309", fontWeight: 800, textTransform: "capitalize" }}>{row.status}</div>
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>Remark</div>
            <div style={{ marginTop: 4, color: "#0f172a" }}>{row.remarks || "-"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
