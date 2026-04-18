import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, TrendingUp, UserPlus, Users } from "lucide-react";
import CreateLoginModal from "../components/CreateLoginModal";
import { StudentDetailsModal } from "../components/StudentDetailsModal";
import { StudentFilters } from "../components/StudentFilters";
import { StudentTable } from "../components/StudentTable";
import { useCreateStudentLogin } from "../hooks/useCreateStudentLogin";
import { useStudentsQuery } from "../hooks/useStudentsQuery";
import { deleteStudent as deleteStudentRequest } from "../services/students.service";
import { initialStudentLoginDraft, type StudentRecord } from "../types/students.types";
import { validateOptionalEmail, validateOptionalPhone } from "../../../shared/utils/contact";
import { Button } from "../../../shared/components/Button";

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
  const allStudents = state.students;
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const startOfThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter((student) => (student.status || "active") === "active").length;
  const activeClasses = new Set(allStudents.map((student) => student.class).filter(Boolean)).size;
  const newThisMonth = allStudents.filter((student) => {
    if (!student.join_date) return false;
    return new Date(student.join_date) >= startOfThisMonth;
  }).length;
  const newLastMonth = allStudents.filter((student) => {
    if (!student.join_date) return false;
    const joinedAt = new Date(student.join_date);
    return joinedAt >= startOfLastMonth && joinedAt < startOfThisMonth;
  }).length;
  const monthlyChange =
    newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : newThisMonth > 0 ? 100 : 0;

  const summaryCards = [
    {
      label: "Total Students",
      value: totalStudents.toLocaleString("en-IN"),
      helper: "All admissions",
      accent: "#fee2e2",
      chip: `${totalStudents} total`,
      icon: Users,
    },
    {
      label: "Active Enrollments",
      value: activeStudents.toLocaleString("en-IN"),
      helper: "Currently active",
      accent: "#e0e7ff",
      chip: `${activeStudents} active`,
      icon: TrendingUp,
    },
    {
      label: "Active Classes",
      value: activeClasses.toLocaleString("en-IN"),
      helper: "Classes covered",
      accent: "#fef3c7",
      chip: `${activeClasses} running`,
      icon: BookOpen,
    },
    {
      label: "New This Month",
      value: newThisMonth.toLocaleString("en-IN"),
      helper: "Recent admissions",
      accent: "#dcfce7",
      chip: `${monthlyChange >= 0 ? "+" : ""}${monthlyChange}%`,
      icon: UserPlus,
    },
  ];

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm("Permanently delete this student from the database? This should be used only for wrong or test records.")) return;
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
      const contactError =
        validateOptionalEmail(state.accountDraft.email, "Login email")
        || validateOptionalPhone(state.accountDraft.phone, "Login mobile");
      if (contactError) {
        throw new Error(contactError);
      }

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
      state.setError(createError.response?.data?.error || createError.message || "Failed to create student login.");
      state.setMessage("");
    }
  };
  

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 ,flexWrap: "wrap"}}>
        
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Student Admissions</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Compact admissions list with click-to-view student details.
          </p>
        </div>

        <Button
          onClick={() => navigate("/students/new")}
        >
          + New Admission
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          marginBottom: 24,
        }}
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: `linear-gradient(135deg, ${card.accent}, #ffffff)`,
                borderRadius: 24,
                padding: 22,
                border: "1px solid rgba(229, 231, 235, 0.9)",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.58)",
                    color: "#111827",
                  }}
                >
                  <Icon size={18} />
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.66)",
                    color: card.label === "New This Month" && monthlyChange < 0 ? "#dc2626" : "#374151",
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {card.chip}
                </span>
              </div>

              <div style={{ marginTop: 22, fontSize: "2.3rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ marginTop: 8, fontWeight: 700, color: "#1f2937" }}>{card.label}</div>
              <div style={{ marginTop: 4, color: "#475569", fontSize: 14 }}>{card.helper}</div>
            </div>
          );
        })}
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
      <StudentDetailsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />

      {state.loading ? (
        <div style={cardStyle}>Loading students...</div>
      ) : (
        <StudentTable
          students={state.filteredStudents}
          onView={setSelectedStudent}
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
