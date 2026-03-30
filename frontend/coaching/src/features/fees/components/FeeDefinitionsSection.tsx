import { currency } from "../services/fees.service";
import type { DefinitionFormState, FeeDefinition } from "../types/fees.types";
import { boardOptions } from "../types/fees.types";
import { cardStyle, Field, inputStyle } from "./FeesShared";

export function FeeDefinitionsSection({
  editingStructureId,
  definitionForm,
  setDefinitionForm,
  definitions,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
}: {
  editingStructureId: number | null;
  definitionForm: DefinitionFormState;
  setDefinitionForm: React.Dispatch<React.SetStateAction<DefinitionFormState>>;
  definitions: FeeDefinition[];
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onEdit: (definition: FeeDefinition) => void;
  onDelete: (definitionId: number) => void;
  onCancelEdit: () => void;
}) {
  return (
    <>
      <form onSubmit={onSubmit} style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>{editingStructureId ? "Edit Fee Definition" : "Create Fee Definition"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Field label="Program Type">
            <select value={definitionForm.program_type} onChange={(e) => setDefinitionForm((current) => ({ ...current, program_type: e.target.value }))} style={inputStyle}>
              <option value="academic">Academic</option>
              <option value="course">Course</option>
            </select>
          </Field>
          <Field label="Fee Name">
            <input value={definitionForm.name} onChange={(e) => setDefinitionForm((current) => ({ ...current, name: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Duration (months)">
            <input type="number" min="1" max="24" value={definitionForm.duration_months} onChange={(e) => setDefinitionForm((current) => ({ ...current, duration_months: e.target.value }))} style={inputStyle} />
          </Field>
        </div>

        {definitionForm.program_type === "academic" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <Field label="Board">
              <select value={definitionForm.board} onChange={(e) => setDefinitionForm((current) => ({ ...current, board: e.target.value }))} style={inputStyle}>
                {boardOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Class">
              <input value={definitionForm.class_name} onChange={(e) => setDefinitionForm((current) => ({ ...current, class_name: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Academic Year">
              <input value={definitionForm.academic_year} onChange={(e) => setDefinitionForm((current) => ({ ...current, academic_year: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Session Start Month">
              <input type="number" min="1" max="12" value={definitionForm.session_start_month} onChange={(e) => setDefinitionForm((current) => ({ ...current, session_start_month: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Session End Month">
              <input type="number" min="1" max="12" value={definitionForm.session_end_month} onChange={(e) => setDefinitionForm((current) => ({ ...current, session_end_month: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
        ) : (
          <Field label="Course Name">
            <input value={definitionForm.course_name} onChange={(e) => setDefinitionForm((current) => ({ ...current, course_name: e.target.value }))} style={inputStyle} />
          </Field>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Field label="Tuition Total">
            <input type="number" min="0" value={definitionForm.tuition_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, tuition_total: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Hostel Total">
            <input type="number" min="0" value={definitionForm.hostel_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, hostel_total: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Transport Total">
            <input type="number" min="0" value={definitionForm.transport_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, transport_total: e.target.value }))} style={inputStyle} />
          </Field>
        </div>

        <Field label="Description">
          <input value={definitionForm.description} onChange={(e) => setDefinitionForm((current) => ({ ...current, description: e.target.value }))} style={inputStyle} />
        </Field>

        <button type="submit" style={primaryButton}>
          {editingStructureId ? "Update Fee Definition" : "Save Fee Definition"}
        </button>
        {editingStructureId && (
          <button type="button" onClick={onCancelEdit} style={secondaryButton}>
            Cancel Edit
          </button>
        )}
      </form>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Saved Fee Definitions</h2>
        {definitions.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No fee definitions found.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {definitions.map((definition) => (
              <div key={definition.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <strong>{definition.name}</strong>
                <div style={{ marginTop: 6, color: "#4b5563" }}>
                  {definition.program_type === "academic"
                    ? `${definition.board || "Academic"} • ${definition.class_name} • ${definition.academic_year}`
                    : `Course • ${definition.course_name} • ${definition.duration_months} months`}
                </div>
                <div style={{ marginTop: 8, color: "#1f2937" }}>
                  Tuition {currency(definition.tuition_total)} | Hostel {currency(definition.hostel_total)} | Transport {currency(definition.transport_total)}
                </div>
                <div style={{ marginTop: 6, color: "#6b7280" }}>
                  Monthly view: {currency(definition.monthly_tuition_fee)} tuition + {currency(definition.monthly_hostel_fee)} hostel + {currency(definition.monthly_transport_fee)} transport
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => onEdit(definition)} style={secondaryActionButton}>Edit</button>
                  <button type="button" onClick={() => onDelete(definition.id)} style={dangerActionButton}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const primaryButton = {
  marginTop: 18,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  marginTop: 18,
  marginLeft: 12,
  background: "#fff",
  color: "#1f2937",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryActionButton = {
  background: "#fff",
  color: "#1f2937",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerActionButton = {
  background: "#fff",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};
