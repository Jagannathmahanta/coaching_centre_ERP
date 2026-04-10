import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
  Users,
} from "lucide-react";
import { isAuthenticated, saveAuth } from "../../shared/services/auth";
import api from "../../shared/services/api";
import "./styles/LoginPage.css";
import { useAuth } from "../../shared/hooks/AuthContext";
import Logo from "../../assets/newLogo.png";
import { useI18n } from "../../shared/i18n/I18nProvider";

type LoginRole = "admin" | "parent" | "teacher" | "student";

function detectCenterSlugFromHost(hostname: string) {
  const normalizedHost = hostname.toLowerCase();
  if (
    !normalizedHost ||
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.endsWith(".localhost")
  ) {
    return "";
  }

  const parts = normalizedHost.split(".");
  if (parts.length < 3 || parts[0] === "www") {
    return "";
  }

  return parts[0];
}

const roleConfig: Record<
  LoginRole,
  {
    label: string;
    subtitle: string;
    hint: string;
    icon: React.ReactNode;
    iconClass: string;
  }
> = {
  admin: {
    label: "login.adminLabel",
    subtitle: "login.adminRoleSubtitle",
    hint: "login.adminHint",
    icon: <Shield size={18} />,
    iconClass: "admin",
  },
  parent: {
    label: "login.parentLabel",
    subtitle: "login.parentRoleSubtitle",
    hint: "login.parentHint",
    icon: <Users size={18} />,
    iconClass: "parent",
  },
  teacher: {
    label: "login.teacherLabel",
    subtitle: "login.teacherRoleSubtitle",
    hint: "login.teacherHint",
    icon: <BookOpen size={18} />,
    iconClass: "teacher",
  },
  student: {
    label: "login.studentLabel",
    subtitle: "login.studentRoleSubtitle",
    hint: "login.studentHint",
    icon: <GraduationCap size={18} />,
    iconClass: "student",
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setProfile } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [centerSlug, setCenterSlug] = useState(() => {
    const querySlug = searchParams.get("center");
    if (querySlug) return querySlug.trim().toLowerCase();
    if (typeof window === "undefined") return "";
    return detectCenterSlugFromHost(window.location.hostname);
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const role = useMemo<LoginRole>(() => {
    const requestedRole = searchParams.get("role");
    if (requestedRole === "parent" || requestedRole === "teacher" || requestedRole === "student") {
      return requestedRole;
    }

    return "admin";
  }, [searchParams]);

  const currentRole = roleConfig[role];

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const querySlug = searchParams.get("center");
    if (querySlug) {
      setCenterSlug(querySlug.trim().toLowerCase());
      return;
    }

    if (typeof window !== "undefined") {
      setCenterSlug((current) => current || detectCenterSlugFromHost(window.location.hostname));
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
        centerSlug: centerSlug.trim().toLowerCase() || null,
      });
      saveAuth(response.data);
      setProfile(response.data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const loginError = err as AxiosError<{ error?: string }>;
      setError(loginError.response?.data?.error || t("login.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-login">
      <div className="portal-login__shell">
        <section className="portal-login__intro">
          <Link to="/" className="portal-login__backLink">
            <ArrowLeft size={16} />
            {t("login.backToWebsite")}
          </Link>

          <div className="portal-login__brand">
            <div className="portal-login__brandRow">
              <img src={Logo} alt="Logo" className="portal-login__brandImage" />
              <span className="portal-login__brandText">
                Tutorial<span className="portal-login__brandHighlight">Hub</span>ERP
              </span>
            </div>
            {/* <div className="portal-login__brandSubtitle">{t("login.brandSubtitle")}</div> */}
          </div>

          <div className="portal-login__eyebrow">{t("login.eyebrow")}</div>
          <h1>{t("login.title")}</h1>
          <p>{t("login.sub")}</p>

          <div className="portal-login__highlights">
            <div>
              <strong>{t("login.highlight1Title")}</strong>
              <span>{t("login.highlight1Desc")}</span>
            </div>
            <div>
              <strong>{t("login.highlight2Title")}</strong>
              <span>{t("login.highlight2Desc")}</span>
            </div>
            <div>
              <strong>{t("login.highlight3Title")}</strong>
              <span>{t("login.highlight3Desc")}</span>
            </div>
          </div>
        </section>

        <section className="portal-login__panel">
          <div className="portal-login__card">
            {/* ✅ TOP BAR (mobile only) */}
<div className="portal-login__topBar mobile-only">
  <Link to="/" className="portal-login__backInline">
    <ArrowLeft size={16} />
    {t("login.backToWebsite")}
  </Link>

  <div className={`portal-login__badge portal-login__badge--${currentRole.iconClass}`}>
    <span className="portal-login__badgeIcon">{currentRole.icon}</span>
    {t(currentRole.label)}
  </div>
</div>

{/* ✅ LOGO BELOW */}
<div className="portal-login__cardHeader mobile-only">
  <img src={Logo} alt="Logo" className="portal-login__brandImage" />
  <span className="portal-login__brandText">
    Tutorial<span className="portal-login__brandHighlight">Hub</span>ERP
  </span>
</div>


            <div className={`portal-login__badge portal-login__badge--${currentRole.iconClass}`}>
              <span className="portal-login__badgeIcon">{currentRole.icon}</span>
              {t(currentRole.label)}
            </div>

            <h2>{t("login.welcomeBack")}</h2>
            <p className="portal-login__desc">{t(currentRole.subtitle)}</p>
            <p className="portal-login__hint">{t(currentRole.hint)}</p>

<form onSubmit={handleSubmit} className="portal-login__form">
  <div className="portal-login__field">
    <label htmlFor="login-center-slug">Institute code</label>
    <input
      id="login-center-slug"
      type="text"
      placeholder="your-institute"
      value={centerSlug}
      onChange={(event) => setCenterSlug(event.target.value)}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
    />
  </div>

  <div className="portal-login__field">
    <label htmlFor="login-email">{t("login.emailLabel")}</label>
    <input
      id="login-email"
      type="text"
      placeholder={t("login.emailPlaceholder")}
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      required
    />
  </div>

  <div className="portal-login__field">
    {/* ✅ Removed forgot password from here */}
    <label htmlFor="login-password">{t("login.passwordLabel")}</label>

    <div className="portal-login__passwordWrap">
      <input
        id="login-password"
        type={showPassword ? "text" : "password"}
        placeholder={t("login.passwordPlaceholder")}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <button
        type="button"
        className="portal-login__passwordToggle"
        aria-label={
          showPassword
            ? t("login.hidePassword")
            : t("login.showPassword")
        }
        onClick={() => setShowPassword((current) => !current)}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>

  {error ? <div className="portal-login__error">{error}</div> : null}

  {/* ✅ Sign In Button */}
  <button
    type="submit"
    disabled={loading}
    className="portal-login__submit"
  >
    {loading ? t("login.signingIn") : t("login.signIn")}
  </button>

  {/* ✅ Forgot Password moved below */}
  <div className="portal-login__forgotWrap">
    <button type="button" className="portal-login__forgot">
      {t("login.forgotPassword")}
    </button>
  </div>
</form>

            <div className="portal-login__footer">
              <span>{t("login.needDifferentPortal")}</span>
              <div className="portal-login__roleLinks">
                {(["admin", "teacher", "parent", "student"] as LoginRole[]).map((item) => (
                  <Link
                    key={item}
                    to={`/login?role=${item}${centerSlug ? `&center=${encodeURIComponent(centerSlug)}` : ""}`}
                    className={item === role ? "active" : ""}
                  >
                    {t(roleConfig[item].label).replace(" Portal", "")}
                  </Link>
                ))}
              </div>
              {/* <Link to="/" className="portal-login__footerBackLink">
                <ArrowLeft size={16} />
                {t("login.backToWebsite")}
              </Link> */}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
