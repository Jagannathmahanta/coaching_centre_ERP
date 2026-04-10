import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../shared/services/api";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { sanitizeEmailInput, validateOptionalEmail } from "../../shared/utils/contact";

function slugifyCenterName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    centerName: "",
    centerSlug: "",
    city: "",
  });
  const [centerSlugTouched, setCenterSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (centerSlugTouched) return;
    setForm((current) => ({
      ...current,
      centerSlug: slugifyCenterName(current.centerName),
    }));
  }, [centerSlugTouched, form.centerName]);

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const emailError = validateOptionalEmail(form.email, "Email");
      if (emailError) {
        throw new Error(emailError);
      }
      const response = await api.post("/auth/register", form);
      setSuccess(t("signup.accountCreated"));
      const createdCenterSlug = response.data?.center_slug || form.centerSlug;
      setTimeout(() => navigate(`/login?center=${encodeURIComponent(createdCenterSlug)}`), 1000);
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || submitError.message || t("signup.signupFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">{t("signup.title")}</h2>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("signup.name")} value={form.name} onChange={(value) => handleChange("name", value)} />
          <Input label={t("signup.email")} type="email" value={form.email} onChange={(value) => handleChange("email", sanitizeEmailInput(value))} />
          <Input label={t("signup.password")} type="password" value={form.password} onChange={(value) => handleChange("password", value)} />
          <Input label={t("signup.centerName")} value={form.centerName} onChange={(value) => handleChange("centerName", value)} />
          <Input
            label="Institute code"
            value={form.centerSlug}
            onChange={(value) => {
              setCenterSlugTouched(true);
              handleChange("centerSlug", slugifyCenterName(value));
            }}
          />
          <Input label={t("signup.city")} value={form.city} onChange={(value) => handleChange("city", value)} />

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? t("signup.creating") : t("signup.signUp")}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          {t("signup.alreadyHaveAccount")} <Link to="/login" className="text-indigo-600">{t("signup.login")}</Link>
        </p>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={type === "email" ? "name@example.com" : undefined}
        className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-500"
        required
      />
    </div>
  );
}
