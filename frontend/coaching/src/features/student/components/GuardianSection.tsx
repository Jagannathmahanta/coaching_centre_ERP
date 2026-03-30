import { CheckboxCard, Field, FormSection, inputStyle } from "./StudentForm";
import type { StudentAdmissionForm } from "../types/students.types";

export function GuardianSection({
  form,
  isEditMode,
  onChange,
}: {
  form: StudentAdmissionForm;
  isEditMode: boolean;
  onChange: (key: keyof StudentAdmissionForm, value: string | boolean) => void;
}) {
  if (isEditMode) return null;

  return (
    <FormSection title="Guardian Details">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Field label="Father / Guardian Name">
          <input value={form.parent_name} onChange={(e) => onChange("parent_name", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Guardian Mobile">
          <input value={form.parent_phone} onChange={(e) => onChange("parent_phone", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Guardian Email">
          <input value={form.parent_email} onChange={(e) => onChange("parent_email", e.target.value)} style={inputStyle} />
        </Field>
      </div>

      <div style={{ marginTop: 18 }}>
        <CheckboxCard
          label="Create Parent Login Now"
          checked={form.create_parent_login}
          onChange={(checked) => onChange("create_parent_login", checked)}
          helper="Guardian can log in with email or mobile and see student-related modules."
        />
      </div>

      {form.create_parent_login && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <Field label="Parent Login Password">
            <input
              type="password"
              value={form.parent_login_password}
              onChange={(e) => onChange("parent_login_password", e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>
      )}
    </FormSection>
  );
}
