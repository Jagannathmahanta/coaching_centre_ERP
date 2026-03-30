import { AttendanceFilters } from "../components/AttendanceFilters";
import { AttendanceHistory } from "../components/AttendanceHistory";
import { AttendanceRoster } from "../components/AttendanceRoster";
import { useAttendanceData } from "../hooks/useAttendanceData";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
};

const defaultDate = new Date().toISOString().slice(0, 10);

function StatCard({ accent, label, value }: { accent: string; label: string; value: number }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${accent}` }}>
      <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, color: "#0f172a", fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export default function AttendancePage() {
  const {
    canEdit,
    linkedStudentId,
    filters,
    setFilters,
    rows,
    setRows,
    message,
    error,
    setMessage,
    setError,
    classOptions,
    sessionOptions,
    filteredStudents,
    rosterQuery,
    historyQuery,
    saveAttendanceMutation,
    stats,
  } = useAttendanceData(defaultDate);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Attendance Module</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          {canEdit
            ? "Mark daily student attendance by class, date, and session. Admin and teachers can edit the roster and update the same day anytime."
            : "View your attendance details using the same date and session filters in a read-only format."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <StatCard label="Total" value={stats.total} accent="#2563eb" />
        <StatCard label="Present" value={stats.present} accent="#059669" />
        <StatCard label="Absent" value={stats.absent} accent="#be123c" />
        <StatCard label="Leave" value={stats.leave} accent="#d97706" />
      </div>

      {message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}

      <section style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Filters</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            {canEdit
              ? "Choose class, date, and session to load the student list for attendance."
              : "Select your profile and filters to see your attendance details."}
          </p>
        </div>

        <AttendanceFilters
          canEdit={canEdit}
          linkedStudentId={linkedStudentId}
          filters={filters}
          setFilters={setFilters}
          classOptions={classOptions}
          sessionOptions={sessionOptions}
          students={filteredStudents}
        />
      </section>

      <section style={cardStyle}>
        {canEdit ? (
          <AttendanceRoster
            className={filters.className}
            isLoading={rosterQuery.isLoading}
            rows={rows}
            setRows={setRows}
            onSave={() => {
              setMessage("");
              setError("");
              saveAttendanceMutation.mutate();
            }}
            isSaving={saveAttendanceMutation.isPending}
          />
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ margin: 0 }}>My Attendance Details</h2>
              <p style={{ color: "#6b7280", marginTop: 8 }}>
                Your attendance record is shown here based on the selected filters.
              </p>
            </div>
            <AttendanceHistory
              studentId={filters.studentId}
              isLoading={historyQuery.isLoading}
              rows={historyQuery.data || []}
            />
          </>
        )}
      </section>
    </div>
  );
}
