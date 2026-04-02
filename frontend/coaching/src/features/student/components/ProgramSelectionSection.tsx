import { Field, FormSection, inputStyle } from "./StudentForm";
import type {
  CatalogBatch,
  CatalogClass,
  CatalogCourse,
  StudentAdmissionForm,
} from "../types/students.types";

function formatTime(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

export function ProgramSelectionSection({
  form,
  classes,
  courses,
  batches,
  onChange,
}: {
  form: StudentAdmissionForm;
  classes: CatalogClass[];
  courses: CatalogCourse[];
  batches: CatalogBatch[];
  onChange: (key: keyof StudentAdmissionForm, value: string | boolean) => void;
}) {
  return (
    <FormSection title="Program And Batch">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Field label="Program Type">
          <select value={form.program_type} onChange={(e) => onChange("program_type", e.target.value)} style={inputStyle}>
            <option value="academic">Academic</option>
            <option value="non_academic">Non-Academic Course</option>
          </select>
        </Field>

        {form.program_type === "academic" ? (
          <>
            <Field label="Board">
              <select value={form.board} onChange={(e) => onChange("board", e.target.value)} style={inputStyle}>
                <option value="CBSE">CBSE</option>
                <option value="State Board">State Board</option>
                <option value="ICSE">ICSE</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Class">
              <select value={form.class_id} onChange={(e) => onChange("class_id", e.target.value)} style={inputStyle} required>
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class_name}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <Field label="Course">
            <select value={form.course_id} onChange={(e) => onChange("course_id", e.target.value)} style={inputStyle} required>
              <option value="">Select course</option>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.course_name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Batch">
          <select value={form.batch_id} onChange={(e) => onChange("batch_id", e.target.value)} style={inputStyle} required>
            <option value="">Select batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batch_name} • {batch.shift} • {formatTime(batch.start_time)} - {formatTime(batch.end_time)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Admission Year">
          <input value={form.admission_year} readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#475569" }} />
        </Field>
      </div>
    </FormSection>
  );
}
