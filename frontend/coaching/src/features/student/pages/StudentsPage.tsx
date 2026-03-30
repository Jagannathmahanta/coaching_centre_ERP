import { useNavigate } from "react-router-dom";
import CreateLoginModal from "../components/CreateLoginModal";
import { StudentFilters } from "../components/StudentFilters";
import { StudentTable } from "../components/StudentTable";
import { useCreateStudentLogin } from "../hooks/useCreateStudentLogin";
import { useStudentsQuery } from "../hooks/useStudentsQuery";
import { deleteStudent as deleteStudentRequest } from "../services/students.service";
import { initialStudentLoginDraft } from "../types/students.types";

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

export default function StudentsPage() {
  const navigate = useNavigate();
  const state = useStudentsQuery();
  const createLoginMutation = useCreateStudentLogin();

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm("Delete this student admission?")) return;
    state.setMessage("");
    state.setError("");

    try {
      await deleteStudentRequest(studentId);
      state.setMessage("Student deleted.");
      await state.loadStudents();
    } catch (deleteError: any) {
      state.setError(deleteError.response?.data?.error || "Failed to delete student.");
    }
  };

  const handleCreateStudentLogin = async () => {
    try {
      await createLoginMutation.mutateAsync({
        role: "student",
        student_id: state.accountDraft.studentId,
        email: state.accountDraft.email || undefined,
        phone: state.accountDraft.phone || undefined,
        password: state.accountDraft.password,
      });
      state.setMessage(`Login account created for ${state.accountDraft.studentName}.`);
      state.setError("");
      state.setAccountDraft(initialStudentLoginDraft);
      await state.loadStudents();
    } catch (createError: any) {
      state.setError(createError.response?.data?.error || "Failed to create student login.");
      state.setMessage("");
    }
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

      <StudentFilters
        search={state.search}
        setSearch={state.setSearch}
        filters={state.filters}
        setFilters={state.setFilters}
        classOptions={state.classOptions}
        boardOptions={state.boardOptions}
        yearOptions={state.yearOptions}
      />

      {state.message && <div style={{ ...cardStyle, marginBottom: 16, color: "#166534", background: "#f0fdf4" }}>{state.message}</div>}
      {state.error && <div style={{ ...cardStyle, marginBottom: 16, color: "#b91c1c", background: "#fef2f2" }}>{state.error}</div>}

      <CreateLoginModal draft={state.accountDraft} setDraft={state.setAccountDraft} onSubmit={handleCreateStudentLogin} />

      {state.loading ? (
        <div style={cardStyle}>Loading students...</div>
      ) : (
        <StudentTable
          students={state.filteredStudents}
          onEdit={(studentId) => navigate(`/students/${studentId}/edit`)}
          onDelete={handleDeleteStudent}
          onCreateLogin={(student) =>
            state.setAccountDraft({
              open: true,
              studentId: student.id,
              studentName: student.name,
              email: "",
              phone: student.phone || "",
              password: "",
            })
          }
        />
      )}
    </div>
  );
}
