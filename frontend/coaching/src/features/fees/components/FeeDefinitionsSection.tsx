import { currency } from "../services/fees.service";
import type { DefinitionFormState, FeeDefinition } from "../types/fees.types";
import { boardOptions } from "../types/fees.types";
import { cardStyle, Field, inputStyle } from "./FeesShared";
import "../styles/fees.css";
export function FeeDefinitionsSection({
  showForm,
  editingStructureId,
  definitionForm,
  setDefinitionForm,
  definitions,
  catalog,
  onSubmit,
  onStartCreate,
  onEdit,
  onDelete,
  onCancel,
}: {
  showForm: boolean;
  editingStructureId: number | null;
  definitionForm: DefinitionFormState;
  setDefinitionForm: React.Dispatch<React.SetStateAction<DefinitionFormState>>;
  definitions: FeeDefinition[];
  catalog: { classes: Array<{ id: number; class_name: string; status: string }>; courses: Array<{ id: number; course_name: string; status: string }>; batches: Array<{ id: number; program_type: string; class_id?: number | null; course_id?: number | null; board?: string | null; batch_name: string; shift: string; start_time: string; end_time: string; status: string }> };
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onStartCreate: () => void;
  onEdit: (definition: FeeDefinition) => void;
  onDelete: (definitionId: number) => void;
  onCancel: () => void;
}) {
  const isEditing = editingStructureId !== null;
  const filteredBatches = catalog.batches.filter((batch) => {
    if (!(batch.status === "active" || String(batch.id) === definitionForm.batch_id)) return false;
    if (batch.program_type !== definitionForm.program_type) return false;
    if (definitionForm.program_type === "academic") {
      return String(batch.class_id || "") === definitionForm.class_id && (!definitionForm.board || !batch.board || batch.board === definitionForm.board);
    }
    return String(batch.course_id || "") === definitionForm.course_id;
  });

  if (!showForm && !isEditing) {
    return (
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Saved Fee Definitions</h2>
            <p style={{ color: "#6b7280", margin: 0 }}>Manage existing fee definitions or open the create form when you need a new one.</p>
          </div>
          {/* <button type="button" onClick={onStartCreate} style={primaryButton}>Create Fee Definition</button> */}
        </div>
        {definitions.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No fee definitions found.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {definitions.map((definition) => (
              <div key={definition.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <strong>{definition.name}</strong>
                <div style={{ marginTop: 6, color: "#4b5563" }}>
                  {definition.program_type === "academic"
                    ? `${definition.board || "Academic"} • ${definition.class_label || definition.class_name} • ${definition.batch_name || "No batch"} • ${definition.academic_year}`
                    : `Course • ${definition.course_label || definition.course_name} • ${definition.batch_name || "No batch"} • ${definition.duration_months} months`}
                </div>
                <div style={{ marginTop: 8, color: "#1f2937" }}>
                  Admission {currency(definition.admission_total)} | Tuition {currency(definition.tuition_total)} | Hostel {currency(definition.hostel_total)} | Transport {currency(definition.transport_total)}
                </div>
                <div style={{ marginTop: 6, color: "#6b7280" }}>
                  Monthly view: one-time {currency(definition.admission_total)} admission + {currency(definition.monthly_tuition_fee)} tuition + {currency(definition.monthly_hostel_fee)} hostel + {currency(definition.monthly_transport_fee)} transport
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
    );
  }

  return (
    <form onSubmit={onSubmit} style={cardStyle}>
      {/* <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>{editingStructureId ? "Edit Fee Definition" : "Create Fee Definition"}</h2>
        <button type="button" onClick={onCancel} style={secondaryButton}>
          Back
        </button>
      </div> */}

      <div className="formGrid">
          <Field label="Program Type">
            <select value={definitionForm.program_type} onChange={(e) => setDefinitionForm((current) => ({ ...current, program_type: e.target.value as DefinitionFormState["program_type"], class_id: "", course_id: "", batch_id: "" }))} style={inputStyle}>
              <option value="academic">Academic</option>
              <option value="non_academic">Course</option>
            </select>
          </Field>
          {/* <Field label="Fee Name">
            <input value={definitionForm.name} onChange={(e) => setDefinitionForm((current) => ({ ...current, name: e.target.value }))} style={inputStyle} />
          </Field> */}
          <Field label="Duration (months)">
            <input type="number" min="1" max="24" value={definitionForm.duration_months} onChange={(e) => setDefinitionForm((current) => ({ ...current, duration_months: e.target.value }))} style={inputStyle} />
          </Field>
        </div>

        {definitionForm.program_type === "academic" ? (
          <div className="formGrid">
            <Field label="Board">
              <select value={definitionForm.board} onChange={(e) => setDefinitionForm((current) => ({ ...current, board: e.target.value }))} style={inputStyle}>
                {boardOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Class">
              <select value={definitionForm.class_id} onChange={(e) => setDefinitionForm((current) => ({ ...current, class_id: e.target.value, batch_id: "" }))} style={{...inputStyle,display:"grid"}}>
                <option value="">Select class</option>
                {catalog.classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class_name}
                  </option>
                ))}
              </select>
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
            <Field label="Batch">
              <select value={definitionForm.batch_id} onChange={(e) => setDefinitionForm((current) => ({ ...current, batch_id: e.target.value }))} style={inputStyle}>
                <option value="">Select batch</option>
                {filteredBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_name} • {batch.shift} • {batch.start_time.slice(0, 5)} - {batch.end_time.slice(0, 5)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <div className="formGrid">
            <Field label="Course">
              <select value={definitionForm.course_id} onChange={(e) => setDefinitionForm((current) => ({ ...current, course_id: e.target.value, batch_id: "" }))} style={inputStyle}>
                <option value="">Select course</option>
                {catalog.courses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.course_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Batch">
              <select value={definitionForm.batch_id} onChange={(e) => setDefinitionForm((current) => ({ ...current, batch_id: e.target.value }))} style={inputStyle}>
                <option value="">Select batch</option>
                {filteredBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_name} • {batch.shift} • {batch.start_time.slice(0, 5)} - {batch.end_time.slice(0, 5)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <div className="formGrid">
          <Field label="Admission Fee">
            <input type="number" min="0" value={definitionForm.admission_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, admission_total: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Tuition Total">
            <input type="number" min="0" value={definitionForm.tuition_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, tuition_total: e.target.value }))} style={inputStyle} />
          </Field>
          
        </div>
        <div className="formGrid">
          
          <Field label="Hostel Total">
            <input type="number" min="0" value={definitionForm.hostel_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, hostel_total: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Transport Total">
            <input type="number" min="0" value={definitionForm.transport_total} onChange={(e) => setDefinitionForm((current) => ({ ...current, transport_total: e.target.value }))} style={inputStyle} />
          </Field>
        </div>

        {/* <Field label="Description">
          <input value={definitionForm.description} onChange={(e) => setDefinitionForm((current) => ({ ...current, description: e.target.value }))} style={{ ...inputStyle,display:"grid",width:"97%" }} />
        </Field> */}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="submit" style={primaryButton}>
          {editingStructureId ? "Update Fee Definition" : "Save Fee Definition"}
        </button>
      </div>
    </form>
  );
}

const primaryButton = {
  marginTop: 18,
  background: "#334155",
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
  padding: "10px 18px",
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
