import type { ReactNode } from "react";
import type { HolidayFormValues } from "../types/holiday.types";
import { useI18n } from "../../../shared/i18n/I18nProvider";

const inputStyle = {
  width: "100%",                // ← was 90%
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  background: "#1d4ed8",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export function HolidayForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isPending,
}: {
  form: HolidayFormValues;
  onChange: (key: keyof HolidayFormValues, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>{t("holiday.createTitle")}</h2>
          <button type="button" onClick={onCancel} style={{ ...buttonStyle, background: "#fff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
            {t("holiday.close")}
          </button>
        </div>
        <p style={{ color: "#6b7280", marginTop: 8 }}>{t("holiday.createSub")}</p>
      </div>

      {/* Responsive 3-col → stacks on mobile */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <Field label={t("holiday.holidayTitle")}>
          <input
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            style={inputStyle}
            required
          />
        </Field>
        <Field label={t("holiday.startDate")}>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
            style={inputStyle}
            required
          />
        </Field>
        <Field label={t("holiday.endDate")}>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => onChange("end_date", e.target.value)}
            style={inputStyle}
            required
          />
        </Field>
      </div>

      {/* Description — full width, below grid */}
      <div style={{ marginTop: 14 }}>
        <Field label={t("holiday.description")}>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <button type="submit" style={buttonStyle} disabled={isPending}>
          {isPending ? t("holiday.saving") : t("holiday.saveHoliday")}
        </button>
      </div>
    </form>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label style={{
      display: "flex",           // ← was block
      flexDirection: "column",   // ← label on top, input below
      color: "#374151",
      fontWeight: 700,
      fontSize: 14,
    }}>
      {label}
      {children}
    </label>
  );
}
