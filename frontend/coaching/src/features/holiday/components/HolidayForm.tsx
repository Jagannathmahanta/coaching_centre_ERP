import type { ReactNode } from "react";
import type { HolidayFormValues } from "../types/holiday.types";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  marginTop: 6,
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
  isPending,
}: {
  form: HolidayFormValues;
  onChange: (key: keyof HolidayFormValues, value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Create Holiday</h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>Add one-day or multi-day holidays here.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14 }}>
        <Field label="Holiday Title">
          <input value={form.title} onChange={(event) => onChange("title", event.target.value)} style={inputStyle} required />
        </Field>
        <Field label="Start Date">
          <input type="date" value={form.start_date} onChange={(event) => onChange("start_date", event.target.value)} style={inputStyle} required />
        </Field>
        <Field label="End Date">
          <input type="date" value={form.end_date} onChange={(event) => onChange("end_date", event.target.value)} style={inputStyle} required />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={3}
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
          style={{ ...inputStyle, resize: "vertical" as const }}
        />
      </Field>

      <div style={{ marginTop: 16 }}>
        <button type="submit" style={buttonStyle} disabled={isPending}>
          {isPending ? "Saving..." : "Save Holiday"}
        </button>
      </div>
    </form>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 700, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}
