import type { ReactNode } from "react";

export const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  marginTop: 6,
};

export const sectionStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

export function StudentForm({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return <form onSubmit={onSubmit} style={{ display: "grid", gap: 20 }}>{children}</form>;
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={sectionStyle}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 4, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

export function CheckboxCard({
  label,
  checked,
  onChange,
  helper,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helper: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 18,
        borderRadius: 14,
        border: checked ? "1px solid #2563eb" : "1px solid #d1d5db",
        background: checked ? "#eff6ff" : "#fff",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ width: 18, height: 18, marginTop: 2, accentColor: "#2563eb" }}
      />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <strong>{label}</strong>
          <span style={{ color: checked ? "#2563eb" : "#94a3b8", fontWeight: 700 }}>
            {checked ? "Selected" : "Not selected"}
          </span>
        </div>
        <div style={{ color: "#64748b", marginTop: 10, fontSize: 14 }}>{helper}</div>
      </div>
    </label>
  );
}
