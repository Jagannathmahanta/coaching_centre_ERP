
import { FeeDefinitionSection } from "../components/FeeDefinitionSection";
import { FeePreview } from "../components/FeePreview";
import { GuardianSection } from "../components/GuardianSection";
import { HostelSection } from "../components/HostelSection";
import { ProgramSelectionSection } from "../components/ProgramSelectionSection";
import { StudentDetailsSection } from "../components/StudentDetailsSection";
import { Field, FormSection, StudentForm, inputStyle, sectionStyle } from "../components/StudentForm";
import { useStudentAdmission } from "../hooks/useStudentAdmission";
import { Button } from "../../../shared/components/Button";

type Props = {
  embedded?: boolean;
  onClose?: () => void;
};

export default function NewStudentPage({ embedded = false, onClose }: Props) {
  const state = useStudentAdmission();

  if (state.bootLoading) {
    return <div style={sectionStyle}>Loading admission form...</div>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div
  style={{
    ...sectionStyle,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
  }}
>
  {/* LEFT */}
  <div style={{ maxWidth: "80%" }}>
    <h1 style={{ margin: 0, fontSize: 28 }}>
      {state.isEditMode ? "Edit Admission" : "New Admission"}
    </h1>
    <p style={{ color: "#6b7280", marginTop: 8 }}>
      {state.isEditMode
        ? "Update admission details here. Fee-plan updates are allowed only when no payment history exists for that plan."
        : "Enter student and guardian details, then select the program, fee definition, and batch. The system will generate the admission number automatically."}
    </p>
  </div>

  {/* RIGHT TOP */}
  <Button
    type="button"
    onClick={() => state.navigate("/students")}
    style={{ height: 40 }}
  >
    Back
  </Button>
</div>

      <StudentForm onSubmit={state.handleSubmit}>
        <StudentDetailsSection form={state.form} isEditMode={state.isEditMode} onChange={state.handleChange} />

        <GuardianSection form={state.form} onChange={state.handleChange} />

        <ProgramSelectionSection
          form={state.form}
          classes={state.availableClasses}
          courses={state.availableCourses}
          batches={state.availableBatches}
          onChange={state.handleChange}
        />

        <FeeDefinitionSection
          form={state.form}
          definitions={state.filteredDefinitions}
          selectedDefinition={state.selectedDefinition}
          onChange={state.handleChange}
        />

        <HostelSection
          form={state.form}
          selectedDefinition={state.selectedDefinition}
          filteredHostels={state.filteredHostels}
          availableRooms={state.availableRooms}
          onChange={state.handleChange}
        />

        <FeePreview
          preview={state.feePreview}
          cycleLabel={state.cycleLabels[state.form.billing_cycle]}
          formatCurrency={state.currency}
        />

        <FormSection title="Admission Notes">
          <Field label="Admission Notes">
            <textarea
              value={state.form.notes}
              onChange={(e) => state.handleChange("notes", e.target.value)}
              style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            />
          </Field>

          {state.error && (
            <div style={{ marginTop: 16, color: "#b91c1c", background: "#fef2f2", padding: 12, borderRadius: 10 }}>
              {state.error}
            </div>
          )}
          {state.success && (
            <div style={{ marginTop: 16, color: "#166534", background: "#f0fdf4", padding: 12, borderRadius: 10 }}>
              {state.success}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              type="submit"
              disabled={state.loading || !state.selectedDefinition}
              style={{
                background: state.loading || !state.selectedDefinition ? "#93c5fd" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 18px",
                fontWeight: 700,
                cursor: state.loading || !state.selectedDefinition ? "not-allowed" : "pointer",
              }}
            >
              {state.loading
                ? state.isEditMode
                  ? "Updating admission..."
                  : "Creating admission..."
                : state.isEditMode
                  ? "Update Admission"
                  : "Create Admission And Fee Plan"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (embedded && onClose) {
                  onClose();
                  return;
                }
                state.navigate("/students");
              }}
              style={{
                background: "#f3f4f6",
                color: "#111827",
                border: "none",
                borderRadius: 10,
                padding: "12px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </FormSection>
      </StudentForm>
    </div>
  );
}
