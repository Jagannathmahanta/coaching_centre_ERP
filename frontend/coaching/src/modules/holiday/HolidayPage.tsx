import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import api from "../../services/api";

type Holiday = {
  id: number;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  status: string;
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
};

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

const dangerButton = {
  ...buttonStyle,
  background: "#fff1f2",
  color: "#be123c",
};

export default function HolidayPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    status: "active",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const holidaysQuery = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const response = await api.get("/holidays");
      return (response.data || []) as Holiday[];
    },
  });

  const createHolidayMutation = useMutation({
    mutationFn: async () => api.post("/holidays", form),
    onSuccess: async () => {
      setMessage("Holiday created.");
      setError("");
      setForm({
        title: "",
        description: "",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
        status: "active",
      });
      await queryClient.invalidateQueries({ queryKey: ["holidays"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-command-center"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to create holiday.");
      setMessage("");
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (holidayId: number) => api.delete(`/holidays/${holidayId}`),
    onSuccess: async () => {
      setMessage("Holiday deleted.");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["holidays"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-command-center"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to delete holiday.");
      setMessage("");
    },
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Holiday Module</h1>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Create upcoming holidays and keep the holiday list visible for admin planning and dashboard updates.
        </p>
      </div>

      {message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}

      <form
        style={cardStyle}
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          setError("");
          createHolidayMutation.mutate();
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Create Holiday</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>Add one-day or multi-day holidays here.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14 }}>
          <Field label="Holiday Title">
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} style={inputStyle} required />
          </Field>
          <Field label="Start Date">
            <input type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} style={inputStyle} required />
          </Field>
          <Field label="End Date">
            <input type="date" value={form.end_date} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} style={inputStyle} required />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />
        </Field>

        <div style={{ marginTop: 16 }}>
          <button type="submit" style={buttonStyle} disabled={createHolidayMutation.isPending}>
            {createHolidayMutation.isPending ? "Saving..." : "Save Holiday"}
          </button>
        </div>
      </form>

      <section style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Holiday List</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>All upcoming and past holidays for this center.</p>
        </div>

        {holidaysQuery.isLoading ? (
          <div>Loading holidays...</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {(holidaysQuery.data || []).map((holiday) => (
              <div key={holiday.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{holiday.title}</div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>
                    {new Date(holiday.start_date).toLocaleDateString()} to {new Date(holiday.end_date).toLocaleDateString()}
                  </div>
                  {holiday.description && <div style={{ color: "#475569", marginTop: 8 }}>{holiday.description}</div>}
                </div>
                <button
                  type="button"
                  style={dangerButton}
                  onClick={() => {
                    if (!window.confirm("Delete this holiday?")) return;
                    deleteHolidayMutation.mutate(holiday.id);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            {(holidaysQuery.data || []).length === 0 && (
              <div style={{ color: "#6b7280" }}>No holidays added yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
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
