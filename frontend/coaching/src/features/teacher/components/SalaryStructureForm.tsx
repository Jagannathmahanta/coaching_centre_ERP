import { buttonStyle, cardStyle, inputStyle } from "./teacherStyles";
import { Field } from "./TeacherShared";
import type { SalaryStructureForm as SalaryStructureFormState, TeacherOption } from "../types/teacherSalary.types";

export function SalaryStructureForm({
  form,
  setForm,
  teachers,
  onSubmit,
  onCancel,
  isPending,
}: {
  form: SalaryStructureFormState;
  setForm: React.Dispatch<React.SetStateAction<SalaryStructureFormState>>;
  teachers: TeacherOption[];
  onSubmit: () => void;
  onCancel: () => void;
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Salary Structure</h2>
          <button type="button" style={{ ...buttonStyle, background: "#fff", color: "#1d4ed8", border: "1px solid #bfdbfe" }} onClick={onCancel}>
            Close
          </button>
        </div>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Set monthly, day-wise, or period-wise salary. Paid leave is capped at 1 per month for now.
        </p>
      </div>

      {/* Row 1: Teacher, Pay Type, Allowed Paid Leave — 3 cols on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Field label="Teacher">
          <select
            value={form.teacher_id}
            onChange={(e) => setForm((c) => ({ ...c, teacher_id: e.target.value }))}
            style={inputStyle}
            required
          >
            <option value="">Select teacher</option>
            {teachers
              .filter((t) => t.status === "active")
              .map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
          </select>
        </Field>
        <Field label="Pay Type">
          <select
            value={form.pay_type}
            onChange={(e) => setForm((c) => ({ ...c, pay_type: e.target.value as SalaryStructureFormState["pay_type"] }))}
            style={inputStyle}
          >
            <option value="monthly">Monthly</option>
            <option value="per_day">Per Day</option>
            <option value="per_period">Per Period</option>
          </select>
        </Field>
        <Field label="Allowed Paid Leave / Month">
          <input
            type="number" min="0" max="1"
            value={form.allowed_paid_leaves}
            onChange={(e) => setForm((c) => ({ ...c, allowed_paid_leaves: e.target.value }))}
            style={inputStyle}
          />
        </Field>
      </div>

      {/* Row 2: Basic, TA, DA, HRA, Other — 3 cols on desktop, wraps naturally */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 14 }}>
        <Field label="Basic">
          <input
            type="number" min="0"
            value={form.basic_amount}
            onChange={(e) => setForm((c) => ({ ...c, basic_amount: e.target.value }))}
            style={inputStyle}
          />
        </Field>
        <Field label="TA">
          <input
            type="number" min="0"
            value={form.ta_amount}
            onChange={(e) => setForm((c) => ({ ...c, ta_amount: e.target.value }))}
            style={inputStyle}
          />
        </Field>
        <Field label="DA">
          <input
            type="number" min="0"
            value={form.da_amount}
            onChange={(e) => setForm((c) => ({ ...c, da_amount: e.target.value }))}
            style={inputStyle}
          />
        </Field>
        <Field label="HRA">
          <input
            type="number" min="0"
            value={form.hra_amount}
            onChange={(e) => setForm((c) => ({ ...c, hra_amount: e.target.value }))}
            style={inputStyle}
          />
        </Field>
        <Field label="Other Allowance">
          <input
            type="number" min="0"
            value={form.other_allowance}
            onChange={(e) => setForm((c) => ({ ...c, other_allowance: e.target.value }))}
            style={inputStyle}
          />
        </Field>
      </div>

      {/* Row 3: Per Day Rate, Per Period Rate */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 14 }}>
        <Field label="Per Day Rate">
          <input
            type="number" min="0"
            value={form.per_day_rate}
            onChange={(e) => setForm((c) => ({ ...c, per_day_rate: e.target.value }))}
            style={inputStyle}
          />
        </Field>
        <Field label="Per Period Rate">
          <input
            type="number" min="0"
            value={form.per_period_rate}
            onChange={(e) => setForm((c) => ({ ...c, per_period_rate: e.target.value }))}
            style={inputStyle}
          />
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
