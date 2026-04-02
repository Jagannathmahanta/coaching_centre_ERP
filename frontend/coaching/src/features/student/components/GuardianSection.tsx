import { Field, FormSection, inputStyle } from "./StudentForm";
import type { StudentAdmissionForm } from "../types/students.types";

export function GuardianSection({
  form,
  onChange,
}: {
  form: StudentAdmissionForm;
  onChange: (key: keyof StudentAdmissionForm, value: string | boolean) => void;
}) {
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

      <div style={{ marginTop: 18, background: "#eff6ff", borderRadius: 12, padding: 16, color: "#1e3a8a" }}>
        Parent login is created automatically only when guardian mobile or email is different from the student's contact.
        Default password pattern: first four letters of student name in capital + admission year.
      </div>
    </FormSection>
  );
}
