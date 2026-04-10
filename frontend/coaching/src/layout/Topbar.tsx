import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks/AuthContext";
import Logo from "../assets/newlogo.png";
import { useI18n } from "../shared/i18n/I18nProvider";

type Props = {
    mobileMenuOpen: boolean;
    onMenuToggle: () => void;
};

export default function Topbar({ mobileMenuOpen, onMenuToggle }: Props) {
    const navigate = useNavigate();
    const { profile: user, signOut } = useAuth();
    const { language, setLanguage, languages, t } = useI18n();
    void mobileMenuOpen;

    const handleLogout = () => {
        signOut();
        navigate("/login", { replace: true });
    };

   return (
  <div className="appTopbar">
    <div className="appTopbar__left">
      <button
        type="button"
        className="appTopbar__menuButton"
        onClick={onMenuToggle}
      >
        ☰
      </button>

      {/* <img src={Logo} alt="Logo" className="appTopbar__logo" /> */}
    </div>
<div className="appTopbar__center">
    <a className="top-nav__brand" href="#home">
      <img src={Logo} alt="Logo" className="top-nav__brandImage" />
      <span>
        Tutorial<span style={{ color: "#fd6900" }}>Hub</span>ERP
      </span>
    </a>
  </div>

    <div className="appTopbar__actions appTopbar__actions--desktop">
      <label className="appTopbar__language">
        <span className="appTopbar__languageLabel">{t("topbar.languageLabel")}</span>
        <select
          className="appTopbar__languageSelect"
          value={language}
          onChange={(event) => setLanguage(event.target.value as typeof language)}
        >
          {languages.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <span className="appTopbar__welcome">
        {user ? t("topbar.welcome", { name: user.name || user.email || t("common.guest") }) : t("common.guest")}
      </span>
      <button onClick={handleLogout} className="appTopbar__logout">
        {t("common.logout")}
      </button>
    </div>
  </div>
);
}
