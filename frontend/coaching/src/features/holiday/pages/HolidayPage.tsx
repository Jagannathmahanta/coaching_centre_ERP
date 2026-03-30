import { useState } from "react";
import { HolidayForm } from "../components/HolidayForm";
import { HolidayList } from "../components/HolidayList";
import { useCreateHoliday } from "../hooks/useCreateHoliday";
import { useDeleteHoliday } from "../hooks/useDeleteHoliday";
import { useHolidaysQuery } from "../hooks/useHolidaysQuery";
import type { HolidayFormValues } from "../types/holiday.types";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
};

const initialForm: HolidayFormValues = {
  title: "",
  description: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  status: "active",
};

export default function HolidayPage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const holidaysQuery = useHolidaysQuery();

  const createHolidayMutation = useCreateHoliday(
    () => {
      setMessage("Holiday created.");
      setError("");
      setForm(initialForm);
    },
    (mutationError) => {
      setError(mutationError);
      setMessage("");
    }
  );

  const deleteHolidayMutation = useDeleteHoliday(
    () => {
      setMessage("Holiday deleted.");
      setError("");
    },
    (mutationError) => {
      setError(mutationError);
      setMessage("");
    }
  );

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

      <section style={cardStyle}>
        <HolidayForm
          form={form}
          onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
          onSubmit={() => {
            setMessage("");
            setError("");
            createHolidayMutation.mutate(form);
          }}
          isPending={createHolidayMutation.isPending}
        />
      </section>

      <section style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Holiday List</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>All upcoming and past holidays for this center.</p>
        </div>

        <HolidayList
          holidays={holidaysQuery.data || []}
          isLoading={holidaysQuery.isLoading}
          onDelete={(holidayId) => {
            if (!window.confirm("Delete this holiday?")) return;
            deleteHolidayMutation.mutate(holidayId);
          }}
        />
      </section>
    </div>
  );
}
