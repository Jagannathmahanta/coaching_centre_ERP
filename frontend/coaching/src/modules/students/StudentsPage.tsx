import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

type StudentRecord = {
  id: number;
  name: string;
  class: string;
  phone?: string | null;
  roll_number?: string | null;
  join_date?: string | null;
  board?: string | null;
  academic_year?: string | null;
  billing_cycle?: string | null;
  include_hostel?: boolean;
  include_transport?: boolean;
  overdue_count?: number | string;
  current_due_count?: number | string;
  has_login_account?: boolean;
  login_email?: string | null;
  login_phone?: string | null;
};

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
};

const tableCellStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left" as const,
  verticalAlign: "top" as const,
};

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [accountDraft, setAccountDraft] = useState({
    open: false,
    studentId: 0,
    studentName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [filters, setFilters] = useState({
    className: "",
    board: "",
    academicYear: "",
  });

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get("/students", {
        params: {
          class: filters.className || undefined,
          board: filters.board || undefined,
          academic_year: filters.academicYear || undefined,
        },
      });
      setStudents(response.data || []);
    } catch (loadError) {
      console.error("Error fetching students:", loadError);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [filters.className, filters.board, filters.academicYear]);

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.class).filter(Boolean))),
    [students]
  );
  const boardOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.board).filter(Boolean))),
    [students]
  );
  const yearOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.academic_year).filter(Boolean))),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) =>
      [student.name, student.class, student.roll_number || "", student.phone || "", student.board || "", student.academic_year || ""]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, students]);

  const deleteStudent = async (studentId: number) => {
    if (!window.confirm("Delete this student admission?")) return;
    setMessage("");
    setError("");

    try {
      await api.delete(`/students/${studentId}`);
      setMessage("Student deleted.");
      await loadStudents();
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.error || "Failed to delete student.");
    }
  };

  const createStudentLogin = async () => {
    try {
      await api.post("/auth/accounts", {
        role: "student",
        student_id: accountDraft.studentId,
        email: accountDraft.email || undefined,
        phone: accountDraft.phone || undefined,
        password: accountDraft.password,
      });
      setMessage(`Login account created for ${accountDraft.studentName}.`);
      setError("");
      setAccountDraft({ open: false, studentId: 0, studentName: "", email: "", phone: "", password: "" });
      await loadStudents();
    } catch (createError: any) {
      setError(createError.response?.data?.error || "Failed to create student login.");
      setMessage("");
    }
  };

  const renderFeeStatus = (student: StudentRecord) => {
    const overdue = Number(student.overdue_count || 0);
    const current = Number(student.current_due_count || 0);

    if (overdue > 0) {
      return <StatusPill label={`Overdue (${overdue})`} background="#fee2e2" color="#b91c1c" />;
    }
    if (current > 0) {
      return <StatusPill label={`Due This Month (${current})`} background="#fef3c7" color="#b45309" />;
    }
    return <StatusPill label="Fees Clear" background="#dcfce7" color="#15803d" />;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Student Admissions</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Admissions table with class, board, session, plan, hostel, transport, and clear fee status.
          </p>
        </div>

        <button
          onClick={() => navigate("/students/new")}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          New Admission
        </button>
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, admission no, class, or phone"
            style={inputStyle}
          />
          <select value={filters.className} onChange={(event) => setFilters((current) => ({ ...current, className: event.target.value }))} style={inputStyle}>
            <option value="">All classes</option>
            {classOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={filters.board} onChange={(event) => setFilters((current) => ({ ...current, board: event.target.value }))} style={inputStyle}>
            <option value="">All boards</option>
            {boardOptions.map((item) => (
              <option key={item} value={item as string}>{item}</option>
            ))}
          </select>
          <select value={filters.academicYear} onChange={(event) => setFilters((current) => ({ ...current, academicYear: event.target.value }))} style={inputStyle}>
            <option value="">All years</option>
            {yearOptions.map((item) => (
              <option key={item} value={item as string}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      {message && <div style={{ ...cardStyle, marginBottom: 16, color: "#166534", background: "#f0fdf4" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, marginBottom: 16, color: "#b91c1c", background: "#fef2f2" }}>{error}</div>}

      {accountDraft.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={() => setAccountDraft({ open: false, studentId: 0, studentName: "", email: "", phone: "", password: "" })}
        >
          <div style={{ ...cardStyle, width: 560 }} onClick={(event) => event.stopPropagation()}>
            <h2 style={{ margin: 0 }}>Create Student Login</h2>
            <p style={{ color: "#6b7280", marginTop: 8 }}>Create a linked login account for {accountDraft.studentName}.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <label style={{ color: "#374151", fontWeight: 700 }}>
                Email
                <input value={accountDraft.email} onChange={(event) => setAccountDraft((current) => ({ ...current, email: event.target.value }))} style={{ ...inputStyle, marginTop: 6 }} />
              </label>
              <label style={{ color: "#374151", fontWeight: 700 }}>
                Mobile
                <input value={accountDraft.phone} onChange={(event) => setAccountDraft((current) => ({ ...current, phone: event.target.value }))} style={{ ...inputStyle, marginTop: 6 }} />
              </label>
            </div>
            <label style={{ color: "#374151", fontWeight: 700, display: "block", marginTop: 14 }}>
              Password
              <input type="password" value={accountDraft.password} onChange={(event) => setAccountDraft((current) => ({ ...current, password: event.target.value }))} style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" onClick={() => setAccountDraft({ open: false, studentId: 0, studentName: "", email: "", phone: "", password: "" })} style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={createStudentLogin} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 700, cursor: "pointer" }}>
                Create Login
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={cardStyle}>Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div style={cardStyle}>No students found yet.</div>
      ) : (
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
              {filteredStudents.map((student, index) => (
                <tr
                  key={student.id}
                  style={{
                    background: Number(student.overdue_count || 0) > 0
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
                        onClick={() =>
                          setAccountDraft({
                            open: true,
                            studentId: student.id,
                            studentName: student.name,
                            email: "",
                            phone: student.phone || "",
                            password: "",
                          })
                        }
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
                        onClick={() => navigate(`/students/${student.id}/edit`)}
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
                        onClick={() => deleteStudent(student.id)}
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
      )}
    </div>
  );
}

function StatusPill({ label, background, color }: { label: string; background: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background,
        color,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}
