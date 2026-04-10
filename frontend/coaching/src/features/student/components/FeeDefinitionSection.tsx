import { Field, FormSection, inputStyle } from "./StudentForm";
import type { FeeDefinition, StudentAdmissionForm } from "../types/students.types";

export function FeeDefinitionSection({
  form,
  definitions,
  selectedDefinition,
  onChange,
}: {
  form: StudentAdmissionForm;
  definitions: FeeDefinition[];
  selectedDefinition?: FeeDefinition;
  onChange: (key: keyof StudentAdmissionForm, value: string | boolean) => void;
}) {
  return (
    <FormSection title="Fee Definition">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Field label="Program">
          <select value={form.fee_structure_id} onChange={(e) => onChange("fee_structure_id", e.target.value)} required style={inputStyle}>
            <option value="">Select fee definition</option>
            {definitions.map((definition) => (
              <option key={definition.id} value={definition.id}>
                {definition.name} {definition.board ? `• ${definition.board}` : ""}{" "}
                {definition.class_label || definition.course_label ? `• ${definition.class_label || definition.course_label}` : ""}
                {" "}
                {definition.batch_name ? `• ${definition.batch_name}` : ""}{" "}
                {definition.academic_year ? `• ${definition.academic_year}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Billing Cycle">
          <select
            value={form.billing_cycle}
            onChange={(e) => onChange("billing_cycle", e.target.value)}
            style={inputStyle}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="half_yearly">Half Yearly</option>
            <option value="yearly">Yearly</option>
            <option value="full_package">Full Package</option>
          </select>
        </Field>
        <Field label="Due Day">
          <input type="number" min="1" max="28" value={form.due_day} onChange={(e) => onChange("due_day", e.target.value)} style={inputStyle} />
        </Field>
      </div>

      {selectedDefinition && (
        <div style={{ marginTop: 18, background: "#eff6ff", borderRadius: 12, padding: 16, color: "#1e3a8a" }}>
          <strong>{selectedDefinition.name}</strong>
          <div style={{ marginTop: 6 }}>
            Type: {selectedDefinition.program_type} • Duration: {selectedDefinition.duration_months} months
            {selectedDefinition.board ? ` • Board: ${selectedDefinition.board}` : ""}
            {selectedDefinition.class_label || selectedDefinition.course_label
              ? ` • ${selectedDefinition.class_label || selectedDefinition.course_label}`
              : ""}
            {selectedDefinition.batch_name ? ` • ${selectedDefinition.batch_name}` : ""}
          </div>
          <div style={{ marginTop: 6 }}>
            Admission: ₹{Number(selectedDefinition.admission_total || 0).toFixed(2)} • Tuition: ₹{Number(selectedDefinition.tuition_total || 0).toFixed(2)}
          </div>
        </div>
      )}
    </FormSection>
  );
}
