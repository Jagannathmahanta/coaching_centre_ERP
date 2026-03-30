import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../shared/services/api";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    centerName: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/register", form);
      setSuccess("Account created. You can sign in now.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Create Admin Account</h2>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Your Name" value={form.name} onChange={(value) => handleChange("name", value)} />
          <Input label="Email" type="email" value={form.email} onChange={(value) => handleChange("email", value)} />
          <Input label="Password" type="password" value={form.password} onChange={(value) => handleChange("password", value)} />
          <Input label="Center Name" value={form.centerName} onChange={(value) => handleChange("centerName", value)} />
          <Input label="City" value={form.city} onChange={(value) => handleChange("city", value)} />

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account? <Link to="/login" className="text-indigo-600">Login</Link>
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
        className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-500"
        required
      />
    </div>
  );
}
