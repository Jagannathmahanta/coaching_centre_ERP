import { buttonStyle, cardStyle, inputStyle, pickerGridStyle, pickerStyle, secondaryButton } from "./teacherStyles";
import { Field } from "./TeacherShared";
import { toggleSelection } from "../hooks/useTeachersData";
import type { TeacherFormState } from "../types/teacher.types";
import { sanitizeEmailInput, sanitizePhoneInput } from "../../../shared/utils/contact";

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
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Classes come from your actual center data. Subjects use a controlled list for now. New teachers get a linked login automatically when mobile or email is available.
        </p>
      </div>

      {/* Row 1: Name, Phone, Email */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <Field label="Teacher Name">
          <input
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            style={inputStyle}
            required
          />
        </Field>
        <Field label="Phone">
          <input
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: sanitizePhoneInput(e.target.value) }))}
            inputMode="numeric"
            maxLength={10}
            placeholder="10 digit mobile"
            style={inputStyle}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: sanitizeEmailInput(e.target.value) }))}
            placeholder="name@example.com"
            style={inputStyle}
          />
        </Field>
      </div>

      {/* Row 2: Gender, Qualification, Joining Date */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 14 }}>
        <Field label="Profile Type">
          <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 46 }}>
            <input
              type="checkbox"
              checked={form.is_staff}
              onChange={(e) => setForm((c) => ({ ...c, is_staff: e.target.checked }))}
            />
            <span>Non-teaching staff</span>
          </label>
        </Field>
        <Field label="Gender">
          <select
            value={form.gender}
            onChange={(e) => setForm((c) => ({ ...c, gender: e.target.value }))}
            style={inputStyle}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Qualification">
          <input
            value={form.qualification}
            onChange={(e) => setForm((c) => ({ ...c, qualification: e.target.value }))}
            style={inputStyle}
          />
        </Field>
        <Field label="Joining Date">
          <input
            type="date"
            value={form.join_date}
            onChange={(e) => setForm((c) => ({ ...c, join_date: e.target.value }))}
            style={inputStyle}
          />
        </Field>
      </div>

      {/* Row 3: Subjects + Classes pickers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 14 }}>
        <Field label="Assigned Subjects">
          <div style={pickerStyle}>
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {form.assigned_subjects.length
                ? `${form.assigned_subjects.length} selected`
                : "Select one or more subjects"}
            </div>
            <div style={pickerGridStyle}>
              {subjectOptions.map((subject) => (
                <label key={subject} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.assigned_subjects.includes(subject)}
                    onChange={() =>
                      setForm((c) => ({
                        ...c,
                        assigned_subjects: toggleSelection(c.assigned_subjects, subject),
                      }))
                    }
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
              {form.assigned_classes.length
                ? `${form.assigned_classes.length} selected`
                : "Select one or more classes"}
            </div>
            <div style={pickerGridStyle}>
              {classOptions.map((item) => (
                <label key={item} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.assigned_classes.includes(item)}
                    onChange={() =>
                      setForm((c) => ({
                        ...c,
                        assigned_classes: toggleSelection(c.assigned_classes, item),
                      }))
                    }
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            {classOptions.length === 0 && (
              <div style={{ color: "#b45309", fontSize: 13 }}>
                No class data found yet. Create students, fee structures, or exams first.
              </div>
            )}
          </div>
        </Field>
      </div>

      {/* Row 4: Status (single col, no phantom divs) */}
      <div style={{ marginTop: 14, maxWidth: 240 }}>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
            style={inputStyle}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      </div>

      {/* Notes */}
      {/* <div style={{ marginTop: 14 ,display:"flex",flexDirection:"column",gap:8}}>
        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />
        </Field>
      </div> */}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <button type="submit" style={buttonStyle} disabled={isPending}>
          {isPending ? "Saving..." : editingTeacherId ? "Update Staff" : "Save Staff"}
        </button>
        <button type="button" style={secondaryButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
