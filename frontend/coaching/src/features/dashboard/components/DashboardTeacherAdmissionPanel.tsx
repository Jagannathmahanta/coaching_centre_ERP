import { TeacherFormPanel } from "../../teacher/components/TeacherFormPanel";
import { useTeachersData } from "../../teacher/hooks/useTeachersData";

type Props = {
  onClose: () => void;
};

export function DashboardTeacherAdmissionPanel({ onClose }: Props) {
  const state = useTeachersData();

  return (
    <section className="dashboard-inlinePanel">
      <div className="dashboard-inlinePanelHeader">
        <div>
          <h2>Add Teacher</h2>
          <p>Create a new teacher directly from the dashboard.</p>
        </div>
        <button type="button" className="dashboard-inlinePanelClose" onClick={onClose}>
          Close
        </button>
      </div>

      {state.message ? <div className="dashboard-inlineMessage success">{state.message}</div> : null}
      {state.error ? <div className="dashboard-inlineMessage error">{state.error}</div> : null}

      <TeacherFormPanel
        classOptions={state.classOptions}
        editingTeacherId={null}
        form={state.form}
        setForm={state.setForm}
        onSubmit={() => {
          state.setMessage("");
          state.setError("");
          state.saveTeacherMutation.mutate();
        }}
        onCancel={onClose}
        isPending={state.saveTeacherMutation.isPending}
        subjectOptions={state.subjectOptions}
      />
    </section>
  );
}
