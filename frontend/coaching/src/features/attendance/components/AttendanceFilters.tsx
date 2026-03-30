import type { AttendanceFilters as AttendanceFiltersType, StudentOption } from "../types/attendance.types";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
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
    <div style={{ display: "grid", gridTemplateColumns: canEdit ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1.4fr", gap: 14 }}>
      {!canEdit && (
        <Field label="Student">
          <select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value, className: "" }))} style={inputStyle}>
            {!linkedStudentId && <option value="">Select your name</option>}
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} | {student.class} | {student.roll_number || "No admission no"}
              </option>
            ))}
          </select>
        </Field>
      )}
      {canEdit && (
        <Field label="Class">
          <select value={filters.className} onChange={(event) => setFilters((current) => ({ ...current, className: event.target.value }))} style={inputStyle}>
            <option value="">Select class</option>
            {classOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Date">
        <input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} style={inputStyle} />
      </Field>
      <Field label="Session">
        <select value={filters.session} onChange={(event) => setFilters((current) => ({ ...current, session: event.target.value }))} style={inputStyle}>
          <option value="">All sessions</option>
          {sessionOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
      {!canEdit && (
        <Field label="Class">
          <input
            value={filters.studentId ? (students.find((student) => String(student.id) === filters.studentId)?.class || "-") : "Select your profile first"}
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
    <label style={{ display: "block", color: "#374151", fontWeight: 700, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}
