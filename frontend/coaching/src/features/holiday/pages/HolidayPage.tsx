import { useState } from "react";
import { HolidayForm } from "../components/HolidayForm";
import { HolidayList } from "../components/HolidayList";
import { useCreateHoliday } from "../hooks/useCreateHoliday";
import { useDeleteHoliday } from "../hooks/useDeleteHoliday";
import { useHolidaysQuery } from "../hooks/useHolidaysQuery";
import type { HolidayFormValues } from "../types/holiday.types";
import { useAuth } from "../../../shared/hooks/AuthContext";
import { getUser } from "../../../shared/services/auth";
import { useI18n } from "../../../shared/i18n/I18nProvider";

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
  const { t } = useI18n();
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const holidaysQuery = useHolidaysQuery();
    const { profile } = useAuth();

     const role = profile?.role ?? getUser()?.role ?? "";
       const isDisabled = ["teacher", "student", "parent"].includes(role);

  const createHolidayMutation = useCreateHoliday(
    () => {
      setMessage(t("holiday.created"));
      setError("");
      setForm(initialForm);
      setShowForm(false);
    },
    (mutationError) => {
      setError(mutationError);
      setMessage("");
    }
  );

  const deleteHolidayMutation = useDeleteHoliday(
    () => {
      setMessage(t("holiday.deleted"));
      setError("");
    },
    (mutationError) => {
      setError(mutationError);
      setMessage("");
    }
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>{t("holiday.moduleTitle")}</h1>
          {
            !isDisabled&&
            <p style={{ color: "#6b7280", marginTop: 8 }}>
            {t("holiday.moduleSub")}
          </p>
          }
          
        </div>
      

{!isDisabled ? (
  <button
    type="button"
    disabled={isDisabled}
    style={{
      background: "#334155",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "12px 16px",
      fontWeight: 700,
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.5 : 1,
    }}
    onClick={() => setShowForm(true)}
  >
    {t("holiday.addHoliday")}
  </button>
) : null}
      </div>

      {message && <div style={{ ...cardStyle, background: "#f0fdf4", color: "#166534" }}>{message}</div>}
      {error && <div style={{ ...cardStyle, background: "#fef2f2", color: "#b91c1c" }}>{error}</div>}

      {showForm ? (
        <section style={cardStyle}>
          <HolidayForm
            form={form}
            onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
            onSubmit={() => {
              setMessage("");
              setError("");
              createHolidayMutation.mutate(form);
            }}
            onCancel={() => setShowForm(false)}
            isPending={createHolidayMutation.isPending}
          />
        </section>
      ) : (
      <section style={cardStyle}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>{t("holiday.listTitle")}</h2>
          <p style={{ color: "#6b7280", marginTop: 8 }}>{t("holiday.listSub")}</p>
        </div>
        <HolidayList
          holidays={holidaysQuery.data || []}
          isLoading={holidaysQuery.isLoading}
          onDelete={(holidayId) => {
            if (!window.confirm(t("holiday.deleteConfirm"))) return;
            deleteHolidayMutation.mutate(holidayId);
          }}
          isDisabled={isDisabled}
        />
      </section>
      )}
    </div>
  );
}
