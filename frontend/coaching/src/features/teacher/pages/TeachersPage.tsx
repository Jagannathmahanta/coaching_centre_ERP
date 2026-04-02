import { useState } from "react";
import { TeacherFormPanel } from "../components/TeacherFormPanel";
import { TeacherDetailsModal } from "../components/TeacherDetailsModal";
import { TeacherList } from "../components/TeacherList";
import { StatCard } from "../components/TeacherShared";
import { buttonStyle, cardStyle } from "../components/teacherStyles";
import type { Teacher } from "../types/teacher.types";
import { useTeachersData } from "../hooks/useTeachersData";

export default function TeachersPage() {
  const state = useTeachersData();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  return (
    <div style={{ display: "grid", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
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
            });
            state.setShowForm((current) => !current);
          }}
        >
          {state.showForm ? "Close Form" : "Add Teacher"}
        </button>
      </div>

      {!state.showForm ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          <StatCard label="Total Teachers"    value={state.teacherStats.total}    accent="#2563eb" />
          <StatCard label="Active Teachers"   value={state.teacherStats.active}   accent="#059669" />
          <StatCard label="Absent Today"      value={state.teacherStats.absentToday} accent="#be123c" />
        </div>
      ) : null}

      {state.message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{state.message}</div>}
      {state.error   && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{state.error}</div>}

      <TeacherDetailsModal teacher={selectedTeacher} onClose={() => setSelectedTeacher(null)} />

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

      {!state.showForm ? (
        <TeacherList
          teachers={state.teachersQuery.data || []}
          loading={state.teachersQuery.isLoading}
          onView={setSelectedTeacher}
          onEdit={state.startEditTeacher}
          onDelete={(teacherId) => {
            if (!window.confirm("Delete this teacher?")) return;
            state.deleteTeacherMutation.mutate(teacherId);
          }}
        />
      ) : null}
    </div>
  );
}
