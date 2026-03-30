import { buttonStyle, cardStyle, inputStyle } from "./teacherStyles";
import { Field } from "./TeacherShared";
import type { SalaryStructureForm as SalaryStructureFormState, TeacherOption } from "../types/teacherSalary.types";

export function SalaryStructureForm({
  form,
  setForm,
  teachers,
  onSubmit,
  isPending,
}: {
  form: SalaryStructureFormState;
  setForm: React.Dispatch<React.SetStateAction<SalaryStructureFormState>>;
  teachers: TeacherOption[];
  onSubmit: () => void;
  isPending: boolean;
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
        <h2 style={{ margin: 0 }}>Salary Structure</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>Set monthly, day-wise, or period-wise salary. Paid leave is capped at 1 per month for now.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        <Field label="Teacher">
          <select value={form.teacher_id} onChange={(event) => setForm((current) => ({ ...current, teacher_id: event.target.value }))} style={inputStyle} required>
            <option value="">Select teacher</option>
            {teachers.filter((teacher) => teacher.status === "active").map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pay Type">
          <select value={form.pay_type} onChange={(event) => setForm((current) => ({ ...current, pay_type: event.target.value as SalaryStructureFormState["pay_type"] }))} style={inputStyle}>
            <option value="monthly">Monthly</option>
            <option value="per_day">Per Day</option>
            <option value="per_period">Per Period</option>
          </select>
        </Field>
        <Field label="Allowed Paid Leave / Month">
          <input type="number" min="0" max="1" value={form.allowed_paid_leaves} onChange={(event) => setForm((current) => ({ ...current, allowed_paid_leaves: event.target.value }))} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14 }}>
        <Field label="Basic">
          <input type="number" min="0" value={form.basic_amount} onChange={(event) => setForm((current) => ({ ...current, basic_amount: event.target.value }))} style={inputStyle} />
        </Field>
        <Field label="TA">
          <input type="number" min="0" value={form.ta_amount} onChange={(event) => setForm((current) => ({ ...current, ta_amount: event.target.value }))} style={inputStyle} />
        </Field>
        <Field label="DA">
          <input type="number" min="0" value={form.da_amount} onChange={(event) => setForm((current) => ({ ...current, da_amount: event.target.value }))} style={inputStyle} />
        </Field>
        <Field label="HRA">
          <input type="number" min="0" value={form.hra_amount} onChange={(event) => setForm((current) => ({ ...current, hra_amount: event.target.value }))} style={inputStyle} />
        </Field>
        <Field label="Other Allowance">
          <input type="number" min="0" value={form.other_allowance} onChange={(event) => setForm((current) => ({ ...current, other_allowance: event.target.value }))} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        <Field label="Per Day Rate">
          <input type="number" min="0" value={form.per_day_rate} onChange={(event) => setForm((current) => ({ ...current, per_day_rate: event.target.value }))} style={inputStyle} />
        </Field>
        <Field label="Per Period Rate">
          <input type="number" min="0" value={form.per_period_rate} onChange={(event) => setForm((current) => ({ ...current, per_period_rate: event.target.value }))} style={inputStyle} />
        </Field>
      </div>

      <div style={{ marginTop: 18 }}>
        <button type="submit" style={buttonStyle} disabled={isPending}>
          {isPending ? "Saving..." : "Save Salary Structure"}
        </button>
      </div>
    </form>
  );
}
