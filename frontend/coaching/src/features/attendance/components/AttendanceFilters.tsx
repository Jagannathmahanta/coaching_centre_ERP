import type { AttendanceFilters as AttendanceFiltersType, StudentOption } from "../types/attendance.types";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
  boxSizing: "border-box" as const,
};

export function AttendanceFilters({
  canEdit,
  linkedStudentId,
  filters,
  setFilters,
  classOptions,
  sessionOptions,
  students,
}: {
  canEdit: boolean;
  linkedStudentId: string;
  filters: AttendanceFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<AttendanceFiltersType>>;
  classOptions: string[];
  sessionOptions: string[];
  students: StudentOption[];
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: canEdit
        ? "repeat(auto-fit, minmax(160px, 1fr))"
        : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 14,
    }}>

      {/* Student selector — non-edit mode only */}
      {!canEdit && (
        <Field label="Student">
          <select
            value={filters.studentId}
            onChange={(e) => setFilters((c) => ({ ...c, studentId: e.target.value, className: "" }))}
            style={inputStyle}
          >
            {!linkedStudentId && <option value="">Select your name</option>}
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} | {student.class} | {student.roll_number || "No admission no"}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Class selector — edit mode only */}
      {canEdit && (
        <Field label="Class">
          <select
            value={filters.className}
            onChange={(e) => setFilters((c) => ({ ...c, className: e.target.value }))}
            style={inputStyle}
          >
            <option value="">Select class</option>
            {classOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </Field>
      )}

      {/* Date */}
      <Field label="Date">
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters((c) => ({ ...c, date: e.target.value }))}
          style={inputStyle}
        />
      </Field>

      {/* Session */}
      <Field label="Session">
        <select
          value={filters.session}
          onChange={(e) => setFilters((c) => ({ ...c, session: e.target.value }))}
          style={inputStyle}
        >
          <option value="">All sessions</option>
          {sessionOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </Field>

      {/* Class display — non-edit mode only */}
      {!canEdit && (
        <Field label="Class">
          <input
            value={
              filters.studentId
                ? (students.find((s) => String(s.id) === filters.studentId)?.class || "-")
                : "Select your profile first"
            }
            style={{ ...inputStyle, background: "#f8fafc" }}
            readOnly
          />
        </Field>
      )}

    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label style={{
      display: "flex",
      flexDirection: "column",
      color: "#374151",
      fontWeight: 700,
      fontSize: 14,
    }}>
      {label}
      {children}
    </label>
  );
}