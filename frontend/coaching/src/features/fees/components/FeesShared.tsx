import type { ReactNode } from "react";
import { currency } from "../services/fees.service";

export const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e5e7eb",
};

export const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  outline: "none",
  marginTop: 6,
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", color: "#374151", fontWeight: 600, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

export function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ ...cardStyle, borderLeft: `6px solid ${tone}` }}>
      <div style={{ color: "#6b7280", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value}</div>
    </div>
  );
}

export function BreakdownCard({
  title,
  billed,
  paid,
  pending,
  accent,
}: {
  title: string;
  billed: string | number | null | undefined;
  paid: string | number | null | undefined;
  pending: string | number | null | undefined;
  accent: string;
}) {
  return (
    <div style={{ border: `1px solid ${accent}22`, borderTop: `4px solid ${accent}`, borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ fontWeight: 700, color: "#111827" }}>{title}</div>
      <div style={{ display: "grid", gap: 6, marginTop: 10, color: "#4b5563" }}>
        <div>
          Billed: <strong style={{ color: "#111827" }}>{currency(billed)}</strong>
        </div>
        <div>
          Paid: <strong style={{ color: "#166534" }}>{currency(paid)}</strong>
        </div>
        <div>
          Pending: <strong style={{ color: "#b45309" }}>{currency(pending)}</strong>
        </div>
      </div>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, { background: string; color: string }> = {
    paid: { background: "#dcfce7", color: "#15803d" },
    partial: { background: "#fef3c7", color: "#b45309" },
    pending: { background: "#dbeafe", color: "#1d4ed8" },
  };

  const current = palette[status] || { background: "#f3f4f6", color: "#4b5563" };

  return (
    <span
      style={{
        background: current.background,
        color: current.color,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "capitalize",
        alignSelf: "flex-start",
      }}
    >
      {status}
    </span>
  );
}
