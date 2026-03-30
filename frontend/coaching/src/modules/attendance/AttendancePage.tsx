import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { getUser } from "../auth/auth";

type StudentOption = {
  id: number;
  name: string;
  class: string;
  roll_number?: string | null;
  academic_year?: string | null;
  status?: string | null;
};

type FeeStructureOption = {
  id: number;
  name: string;
  class_name?: string | null;
  academic_year?: string | null;
};

type AttendanceRow = {
  attendance_id?: number | null;
  student_id: number;
  name: string;
  class: string;
  roll_number?: string | null;
  academic_year?: string | null;
  status: "present" | "absent" | "leave";
  remarks?: string | null;
  attendance_date?: string | null;
  academic_session?: string | null;
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
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

const defaultDate = new Date().toISOString().slice(0, 10);

export default function AttendancePage() {
  const user = getUser();
  const role = String(user?.role || "admin").toLowerCase();
  const canEdit = ["admin", "staff", "teacher"].includes(role);
  const isStudent = role === "student";
  const linkedStudentId = user?.student_id ? String(user.student_id) : "";
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    className: "",
    session: "",
    date: defaultDate,
    studentId: linkedStudentId,
  });
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["attendance-students"],
    queryFn: async () => {
      const response = await api.get("/students");
      return (response.data || []) as StudentOption[];
    },
  });

  const structuresQuery = useQuery({
    queryKey: ["attendance-structures"],
    queryFn: async () => {
      const response = await api.get("/fees/structures");
      return (response.data || []) as FeeStructureOption[];
    },
  });

  const classOptions = useMemo(() => {
    const values = new Set<string>();
    for (const student of studentsQuery.data || []) {
      if (student.class) values.add(student.class);
    }
    for (const structure of structuresQuery.data || []) {
      if (structure.class_name) values.add(structure.class_name);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [studentsQuery.data, structuresQuery.data]);

  const sessionOptions = useMemo(() => {
    const values = new Set<string>();
    for (const student of studentsQuery.data || []) {
      if (student.academic_year) values.add(student.academic_year);
    }
    for (const structure of structuresQuery.data || []) {
      if (structure.academic_year) values.add(structure.academic_year);
    }
    return Array.from(values).sort((left, right) => right.localeCompare(left));
  }, [studentsQuery.data, structuresQuery.data]);

  const filteredStudents = useMemo(() => {
    const activeStudents = (studentsQuery.data || []).filter((student) => (student.status || "active") === "active");
    if (isStudent) {
      return activeStudents;
    }
    return activeStudents.filter((student) => {
      const classOk = !filters.className || student.class === filters.className;
      const sessionOk = !filters.session || !student.academic_year || student.academic_year === filters.session;
      return classOk && sessionOk;
    });
  }, [filters.className, filters.session, isStudent, studentsQuery.data]);

  const rosterQuery = useQuery({
    queryKey: ["attendance-roster", filters.className, filters.session, filters.date, filters.studentId, isStudent],
    enabled: isStudent ? Boolean(filters.studentId) : Boolean(filters.className),
    queryFn: async () => {
      const response = await api.get("/attendance/roster", {
        params: {
          class: isStudent ? undefined : filters.className,
          session: filters.session || undefined,
          date: filters.date,
          student_id: isStudent ? filters.studentId || undefined : undefined,
        },
      });
      return (response.data || []) as AttendanceRow[];
    },
  });

  const historyQuery = useQuery({
    queryKey: ["attendance-history", filters.className, filters.session, filters.studentId, isStudent],
    enabled: isStudent ? Boolean(filters.studentId) : false,
    queryFn: async () => {
      const response = await api.get("/attendance/history", {
        params: {
          class: filters.className || undefined,
          session: filters.session || undefined,
          student_id: filters.studentId || undefined,
          from_date: filters.session ? `${filters.session.slice(0, 4)}-04-01` : undefined,
          to_date: filters.date,
        },
      });
      return (response.data || []) as AttendanceRow[];
    },
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async () =>
      api.post("/attendance/save", {
        date: filters.date,
        session: filters.session || "",
        records: rows.map((row) => ({
          student_id: row.student_id,
          status: row.status,
          remarks: row.remarks || "",
        })),
      }),
    onSuccess: async (response) => {
      setMessage(`Attendance saved for ${response.data?.saved_count || rows.length} students.`);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["attendance-roster"] });
      await queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to save attendance.");
      setMessage("");
    },
  });

  useEffect(() => {
    setRows((rosterQuery.data || []).map((row) => ({ ...row })));
  }, [rosterQuery.data]);

  const stats = useMemo(() => {
    const source = isStudent ? (historyQuery.data || rosterQuery.data || []) : rows;
    return {
      total: source.length,
      present: source.filter((item) => item.status === "present").length,
      absent: source.filter((item) => item.status === "absent").length,
      leave: source.filter((item) => item.status === "leave").length,
    };
  }, [historyQuery.data, isStudent, rosterQuery.data, rows]);

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

        <div style={{ display: "grid", gridTemplateColumns: canEdit ? "1fr 1fr 1fr" : "1fr 1fr 1fr 1.4fr", gap: 14 }}>
          {!canEdit && (
            <Field label="Student">
              <select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value, className: "" }))} style={inputStyle}>
                {!linkedStudentId && <option value="">Select your name</option>}
                {filteredStudents.map((student) => (
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
                value={filters.studentId ? (filteredStudents.find((student) => String(student.id) === filters.studentId)?.class || "-") : "Select your profile first"}
                style={{ ...inputStyle, background: "#f8fafc" }}
                readOnly
              />
            </Field>
          )}
        </div>
      </section>

      {canEdit ? (
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0 }}>Student Attendance Roster</h2>
              <p style={{ color: "#6b7280", marginTop: 8 }}>
                Mark `present`, `absent`, or `leave` for the selected class and save all rows together.
              </p>
            </div>
            <button type="button" style={buttonStyle} onClick={() => saveAttendanceMutation.mutate()} disabled={saveAttendanceMutation.isPending || rows.length === 0}>
              {saveAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
            </button>
          </div>

          {!filters.className ? (
            <div style={{ color: "#6b7280" }}>Select a class to load the attendance roster.</div>
          ) : rosterQuery.isLoading ? (
            <div>Loading attendance roster...</div>
          ) : rows.length === 0 ? (
            <div style={{ color: "#6b7280" }}>No active students found for the selected class and session.</div>
          ) : (
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
                    style={{ ...inputStyle, marginTop: 0 }}
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
                    style={{ ...inputStyle, marginTop: 0 }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section style={cardStyle}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0 }}>My Attendance Details</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              Your attendance record is shown here based on the selected filters.
            </p>
          </div>

          {!filters.studentId ? (
            <div style={{ color: "#6b7280" }}>Select your profile to see attendance details.</div>
          ) : historyQuery.isLoading ? (
            <div>Loading attendance details...</div>
          ) : (historyQuery.data || []).length === 0 ? (
            <div style={{ color: "#6b7280" }}>No attendance records found for the selected filters yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {(historyQuery.data || []).map((row, index) => (
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
          )}
        </section>
      )}
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 700, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

function StatCard({ accent, label, value }: { accent: string; label: string; value: number }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${accent}` }}>
      <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, color: "#0f172a", fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
