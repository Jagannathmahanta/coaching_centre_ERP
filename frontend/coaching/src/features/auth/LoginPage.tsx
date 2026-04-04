import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { isAuthenticated, saveAuth } from "../../shared/services/auth";
import api from "../../shared/services/api";
import "./styles/LoginPage.css"
import { useAuth } from "../../shared/hooks/AuthContext";


export default function LoginPage() {
    const navigate = useNavigate();
    const { setProfile } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            navigate("/", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", { email, password });
            saveAuth(response.data);
            setProfile(response.data.user);
            navigate("/", { replace: true });
        } catch (err) {
            const error = err as AxiosError<{ error?: string }>;
            setError(error.response?.data?.error || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

   return (
  <div className="login-container">
    <div className="login-card">
      <h1 className="login-title">CoachingERP</h1>
      <p className="login-subtitle">Coaching Management System</p>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            type="text"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <div className="password-fieldWrap">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field input-field--password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <div className="options-row">
          <label className="remember">
            <input type="checkbox" /> Remember me
          </label>
          <span className="forgot">Forgot password?</span>
        </div>

        <button type="submit" disabled={loading} className="login-button">
          {loading ? "Signing in..." : "Sign in →"}
        </button>
      </form>

      <div className="divider">NEW USER?</div>

      <p className="signup">
        Don't have an account? <span className="create">Create one</span>
      </p>
    </div>


  </div>
);
}
