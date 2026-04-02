import { Field, FormSection, inputStyle } from "./StudentForm";
import type { StudentAdmissionForm } from "../types/students.types";

export function StudentDetailsSection({
  form,
  isEditMode,
  onChange,
}: {
  form: StudentAdmissionForm;
  isEditMode: boolean;
  onChange: (key: keyof StudentAdmissionForm, value: string | boolean) => void;
}) {
  return (
    <FormSection title="Student Details">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Field label="Student Name">
          <input value={form.name} onChange={(e) => onChange("name", e.target.value)} required style={inputStyle} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Email">
          <input value={form.email} onChange={(e) => onChange("email", e.target.value)} type="email" style={inputStyle} />
        </Field>
        <Field label="Gender">
          <select value={form.gender} onChange={(e) => onChange("gender", e.target.value)} style={inputStyle}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Join Date">
          <input type="date" value={form.join_date} onChange={(e) => onChange("join_date", e.target.value)} style={inputStyle} />
        </Field>
        {isEditMode ? (
          <Field label="Status">
            <select value={form.status} onChange={(e) => onChange("status", e.target.value)} style={inputStyle}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="left">Left</option>
            </select>
          </Field>
        ) : null}
      </div>

      {isEditMode && form.status !== "active" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <Field label="Inactive / Left Date">
            <input type="date" value={form.left_date} onChange={(e) => onChange("left_date", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Reason">
            <input value={form.left_reason} onChange={(e) => onChange("left_reason", e.target.value)} style={inputStyle} />
          </Field>
        </div>
      ) : null}

      <div style={{ marginTop: 18, background: "#f8fafc", borderRadius: 12, padding: 16, color: "#334155", border: "1px solid #e2e8f0" }}>
        {isEditMode ? "Admission number remains unchanged during edit." : "Admission number is generated automatically as `YYYYMM###`."}
      </div>
    </FormSection>
  );
}
