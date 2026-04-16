import { useState } from "react";
import { TeacherFormPanel } from "../components/TeacherFormPanel";
import { TeacherDetailsModal } from "../components/TeacherDetailsModal";
import { TeacherList } from "../components/TeacherList";
import { StatCard } from "../components/TeacherShared";
import { cardStyle } from "../components/teacherStyles";
import { initialTeacherForm, type Teacher } from "../types/teacher.types";
import { useTeachersData } from "../hooks/useTeachersData";
import "../styles/teachersPage.css";
import { Button } from "../../../shared/components/Button";

export default function TeachersPage() {
  const state = useTeachersData();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  return (
    <div className="teachersPage">

      {/* Header */}
      <div className="teachersPage__header">
        <div className="teachersPage__hero">
          <h1 className="teachersPage__title">Staff Module</h1>
          <p className="teachersPage__subtitle">
            Create staffs, assign real classes, and use a controlled subject list so leave and attendance modules stay clean later.
          </p>
        </div>
        <Button
          type="button"
          className="teachersPage__primaryAction"
          onClick={() => {
            state.setEditingTeacherId(null);
            state.setForm({ ...initialTeacherForm });
            state.setShowForm((current) => !current);
          }}
        >
          {state.showForm ? "Back" : "+ Add Staff"}
        </Button>
      </div>

      {!state.showForm ? (
        <div className="teachersPage__stats">
          <StatCard label="Total Staff"    value={state.teacherStats.total}    accent="#2563eb" />
          <StatCard label="Active Staff"   value={state.teacherStats.active}   accent="#059669" />
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
