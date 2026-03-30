import { buttonStyle, cardStyle, inputStyle, pickerGridStyle, pickerStyle, secondaryButton } from "./teacherStyles";
import { Field } from "./TeacherShared";
import { toggleSelection } from "../hooks/useTeachersData";
import type { TeacherFormState } from "../types/teacher.types";

export function TeacherFormPanel({
  classOptions,
  editingTeacherId,
  form,
  setForm,
  onSubmit,
  onCancel,
  isPending,
  subjectOptions,
}: {
  classOptions: string[];
  editingTeacherId: number | null;
  form: TeacherFormState;
  setForm: React.Dispatch<React.SetStateAction<TeacherFormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  subjectOptions: string[];
}) {
  return (
    <form
      style={cardStyle}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>{editingTeacherId ? "Edit Teacher" : "Create Teacher"}</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>Classes come from your actual center data. Subjects use a controlled list for now.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        <Field label="Teacher Name">
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} style={inputStyle} required />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} style={inputStyle} />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        <Field label="Gender">
          <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} style={inputStyle}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Qualification">
          <input value={form.qualification} onChange={(event) => setForm((current) => ({ ...current, qualification: event.target.value }))} style={inputStyle} />
        </Field>
        <Field label="Joining Date">
          <input type="date" value={form.join_date} onChange={(event) => setForm((current) => ({ ...current, join_date: event.target.value }))} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        <Field label="Assigned Subjects">
          <div style={pickerStyle}>
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {form.assigned_subjects.length ? `${form.assigned_subjects.length} selected` : "Select one or more subjects"}
            </div>
            <div style={pickerGridStyle}>
              {subjectOptions.map((subject) => (
                <label key={subject} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.assigned_subjects.includes(subject)}
                    onChange={() => setForm((current) => ({ ...current, assigned_subjects: toggleSelection(current.assigned_subjects, subject) }))}
                  />
                  <span>{subject}</span>
                </label>
              ))}
            </div>
          </div>
        </Field>

        <Field label="Assigned Classes">
          <div style={pickerStyle}>
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {form.assigned_classes.length ? `${form.assigned_classes.length} selected` : "Select one or more classes"}
            </div>
            <div style={pickerGridStyle}>
              {classOptions.map((item) => (
                <label key={item} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.assigned_classes.includes(item)}
                    onChange={() => setForm((current) => ({ ...current, assigned_classes: toggleSelection(current.assigned_classes, item) }))}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            {classOptions.length === 0 && <div style={{ color: "#b45309", fontSize: 13 }}>No class data found yet. Create students, fee structures, or exams first.</div>}
          </div>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} style={inputStyle}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <div />
        <div />
      </div>

      <Field label="Notes">
        <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
      </Field>

      {!editingTeacherId && (
        <>
          <div style={{ marginTop: 18 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center", color: "#374151", fontWeight: 700 }}>
              <input type="checkbox" checked={form.create_login} onChange={(event) => setForm((current) => ({ ...current, create_login: event.target.checked }))} />
              Create Teacher Login Now
            </label>
          </div>

          {form.create_login && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 16 }}>
              <Field label="Login Email">
                <input value={form.login_email} onChange={(event) => setForm((current) => ({ ...current, login_email: event.target.value }))} style={inputStyle} />
              </Field>
              <Field label="Login Mobile">
                <input value={form.login_phone} onChange={(event) => setForm((current) => ({ ...current, login_phone: event.target.value }))} style={inputStyle} />
              </Field>
              <Field label="Login Password">
                <input type="password" value={form.login_password} onChange={(event) => setForm((current) => ({ ...current, login_password: event.target.value }))} style={inputStyle} />
              </Field>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <button type="submit" style={buttonStyle} disabled={isPending}>
          {isPending ? "Saving..." : editingTeacherId ? "Update Teacher" : "Save Teacher"}
        </button>
        <button type="button" style={secondaryButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
