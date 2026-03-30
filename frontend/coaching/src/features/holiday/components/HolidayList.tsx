import type { Holiday } from "../types/holiday.types";

const dangerButton = {
  background: "#fff1f2",
  color: "#be123c",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export function HolidayList({
  holidays,
  isLoading,
  onDelete,
}: {
  holidays: Holiday[];
  isLoading: boolean;
  onDelete: (holidayId: number) => void;
}) {
  if (isLoading) return <div>Loading holidays...</div>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {holidays.map((holiday) => (
        <div key={holiday.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#0f172a" }}>{holiday.title}</div>
            <div style={{ color: "#64748b", marginTop: 6 }}>
              {new Date(holiday.start_date).toLocaleDateString()} to {new Date(holiday.end_date).toLocaleDateString()}
            </div>
            {holiday.description && <div style={{ color: "#475569", marginTop: 8 }}>{holiday.description}</div>}
          </div>
          <button type="button" style={dangerButton} onClick={() => onDelete(holiday.id)}>
            Delete
          </button>
        </div>
      ))}
      {holidays.length === 0 && <div style={{ color: "#6b7280" }}>No holidays added yet.</div>}
    </div>
  );
}
