import { TeacherFormPanel } from "../components/TeacherFormPanel";
import { TeacherList } from "../components/TeacherList";
import { TeacherLoginModal } from "../components/TeacherLoginModal";
import { StatCard } from "../components/TeacherShared";
import { buttonStyle, cardStyle } from "../components/teacherStyles";
import { useTeachersData } from "../hooks/useTeachersData";

export default function TeachersPage() {
  const state = useTeachersData();

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Teacher Module</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>
            Create teachers, assign real classes, and use a controlled subject list so leave and attendance modules stay clean later.
          </p>
        </div>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            state.setEditingTeacherId(null);
            state.setForm({
              name: "",
              phone: "",
              email: "",
              gender: "male",
              qualification: "",
              assigned_subjects: [],
              assigned_classes: [],
              join_date: new Date().toISOString().slice(0, 10),
              status: "active",
              notes: "",
              create_login: false,
              login_email: "",
              login_phone: "",
              login_password: "",
            });
            state.setShowForm((current) => !current);
          }}
        >
          {state.showForm ? "Close Form" : "Add Teacher"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <StatCard label="Total Teachers" value={state.teacherStats.total} accent="#2563eb" />
        <StatCard label="Active Teachers" value={state.teacherStats.active} accent="#059669" />
        <StatCard label="Assigned Classes" value={state.teacherStats.classes} accent="#d97706" />
        <StatCard label="Assigned Subjects" value={state.teacherStats.subjects} accent="#7c3aed" />
      </div>

      {state.message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{state.message}</div>}
      {state.error && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{state.error}</div>}

      <TeacherLoginModal
        draft={state.accountDraft}
        setDraft={state.setAccountDraft}
        onSubmit={() => state.createAccountMutation.mutate()}
        isPending={state.createAccountMutation.isPending}
      />

      {state.showForm && (
        <TeacherFormPanel
          classOptions={state.classOptions}
          editingTeacherId={state.editingTeacherId}
          form={state.form}
          setForm={state.setForm}
          onSubmit={() => {
            state.setMessage("");
            state.setError("");
            state.saveTeacherMutation.mutate();
          }}
          onCancel={state.resetForm}
          isPending={state.saveTeacherMutation.isPending}
          subjectOptions={state.subjectOptions}
        />
      )}

      <TeacherList
        teachers={state.teachersQuery.data || []}
        loading={state.teachersQuery.isLoading}
        onCreateLogin={state.openTeacherLogin}
        onEdit={state.startEditTeacher}
        onDelete={(teacherId) => {
          if (!window.confirm("Delete this teacher?")) return;
          state.deleteTeacherMutation.mutate(teacherId);
        }}
      />
    </div>
  );
}
