import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Globe } from "lucide-react";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import Logo from "./assets/homeTutorial.png";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Upcoming Batch", href: "#upcoming" },
  { label: "Courses", href: "#courses" },
  { label: "Faculty", href: "#faculty" },
  { label: "Contact", href: "#contact" },
];

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

export default function Navbar() {
  const location = useLocation();
  const { language, setLanguage, languages, t } = useI18n();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);

  const loginPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const querySlug = params.get("center")?.trim().toLowerCase();
    const hostSlug = typeof window === "undefined" ? "" : detectCenterSlugFromHost(window.location.hostname);
    const center = querySlug || hostSlug;

    if (!center) {
      return "/login";
    }

    const nextParams = new URLSearchParams();
    nextParams.set("center", center);
    return `/login?${nextParams.toString()}`;
  }, [location.search]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (languageRef.current && !languageRef.current.contains(target)) {
        setLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleNavClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className={`client-nav ${scrolled ? "client-nav--scrolled" : ""}`}>
      <div className="client-shell client-nav__inner">
        <button className="client-nav__brand" onClick={() => handleNavClick("#home")}>
          <span className="client-nav__brandMark">
            <img src={Logo} alt="Home Tutorial Logo" style={{height:72,width:72}}/>
          </span>
          <span className="client-nav__brandText">
            Home Tutorial Hub
            <small>Dhenkikote</small>
          </span>
        </button>

        <div className="client-nav__desktop">
          <div className="client-nav__links">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                className="client-nav__link"
                onClick={() => handleNavClick(link.href)}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="client-nav__actions">
            <div className="client-language" ref={languageRef}>
              <button
                type="button"
                className="client-language__trigger"
                onClick={() => setLanguageOpen((current) => !current)}
              >
                <Globe size={16} />
                <span>{languages.find((option) => option.code === language)?.label || language}</span>
                <ChevronDown size={14} className={languageOpen ? "client-language__caret open" : "client-language__caret"} />
              </button>

              {languageOpen ? (
                <div className="client-language__menu">
                  <div className="client-language__label">{t("topbar.languageLabel")}</div>
                  {languages.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      className={`client-language__option ${language === option.code ? "active" : ""}`}
                      onClick={() => {
                        setLanguage(option.code);
                        setLanguageOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <Link className="client-button client-button--ghost" to={loginPath}>
              {t("landing.login")}
            </Link>
          </div>
        </div>
        <div className="client-nav__mobileTop">
          <Link className="client-button client-button--ghost client-nav__mobileLogin" to={loginPath}>
            {t("landing.login")}
          </Link>
        </div>
      </div>

      <div className="client-nav__mobile">
        <div className="client-shell client-nav__mobileBar">
          <button className="client-nav__brand client-nav__brand--mobile" onClick={() => handleNavClick("#home")}>
            <span className="client-nav__brandMark">
              <img src={Logo} alt="Home Tutorial Logo" />
            </span>
            <span className="client-nav__brandText">
              Home Tutorial Hub
              <small>Dhenkikote</small>
            </span>
          </button>

          <Link className="client-button client-button--ghost client-nav__mobileLogin" to={loginPath}>
            {t("landing.login")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
