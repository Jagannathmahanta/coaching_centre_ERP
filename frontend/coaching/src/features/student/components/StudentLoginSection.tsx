import { CheckboxCard, Field, FormSection, inputStyle } from "./StudentForm";
import type { StudentAdmissionForm } from "../types/students.types";

export function StudentLoginSection({
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
    <FormSection title="Student Login">
      <CheckboxCard
        label="Create Student Login Now"
        checked={form.create_student_login}
        onChange={(checked) => onChange("create_student_login", checked)}
        helper="Student can use the portal for leave, attendance, and result access."
      />

      {form.create_student_login && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <Field label="Student Login Email">
            <input
              value={form.student_login_email}
              onChange={(e) => onChange("student_login_email", e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Student Login Mobile">
            <input
              value={form.student_login_phone}
              onChange={(e) => onChange("student_login_phone", e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Student Login Password">
            <input
              type="password"
              value={form.student_login_password}
              onChange={(e) => onChange("student_login_password", e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>
      )}
    </FormSection>
  );
}
