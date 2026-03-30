import { FormSection, Metric } from "./StudentForm";
import type { FeeDefinition, FeePreview as FeePreviewType } from "../types/students.types";

export function FeePreview({
  preview,
  cycleLabel,
  formatCurrency,
}: {
  preview: FeePreviewType | null;
  cycleLabel: string;
  formatCurrency: (value: number) => string;
  selectedDefinition?: FeeDefinition;
}) {
  if (!preview) return null;

  return (
    <FormSection title="Live Fee Preview">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Metric label="Applicable Months" value={String(preview.applicableMonths)} />
        <Metric label="Tuition Total" value={formatCurrency(preview.tuitionTotal)} />
        <Metric label="Hostel Total" value={formatCurrency(preview.hostelTotal)} />
        <Metric label="Transport Total" value={formatCurrency(preview.transportTotal)} />
        <Metric label="Grand Total" value={formatCurrency(preview.grandTotal)} />
        <Metric label={`${cycleLabel} Installments`} value={String(preview.installmentCount)} />
        <Metric label="First Installment" value={formatCurrency(preview.firstInstallmentTotal)} />
      </div>
    </FormSection>
  );
}
