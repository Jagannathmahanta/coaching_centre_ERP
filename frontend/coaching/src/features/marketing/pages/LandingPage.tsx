import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  CreditCard,
  LaptopMinimal,
  GraduationCap,
  Hotel,
  Shield,
  Users,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaXTwitter
} from "react-icons/fa6";
import "./landing.css";
import Logo from "../../../assets/newLogo.png";
import AdminDashboardImage from "../../../assets/admin_dashboard.png";
import TeacherDashboardImage from "../../../assets/teacher_dash.png";
import { useI18n } from "../../../shared/i18n/I18nProvider";

type LoginRole = "admin" | "parent" | "teacher" | "student";
type LandingSection = "home" | "features" | "about" | "contact";

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

const portalItems: Array<{
  role: LoginRole;
  titleKey: string;
  shortKey: string;
  subtitleKey: string;
  icon: React.ReactNode;
  iconClass: string;
}> = [
    {
      role: "admin",
      titleKey: "landing.adminLogin",
      shortKey: "landing.adminPortal",
      subtitleKey: "landing.adminSubtitle",
      icon: <Shield size={18} />,
      iconClass: "admin",
    },
    {
      role: "parent",
      titleKey: "landing.parentLogin",
      shortKey: "landing.parentPortal",
      subtitleKey: "landing.parentSubtitle",
      icon: <Users size={18} />,
      iconClass: "parent",
    },
    {
      role: "teacher",
      titleKey: "landing.teacherLogin",
      shortKey: "landing.teacherPortal",
      subtitleKey: "landing.teacherSubtitle",
      icon: <BookOpen size={18} />,
      iconClass: "teacher",
    },
    {
      role: "student",
      titleKey: "landing.studentLogin",
      shortKey: "landing.studentPortal",
      subtitleKey: "landing.studentSubtitle",
      icon: <GraduationCap size={18} />,
      iconClass: "student",
    },
  ];

const featureCards = [
  {
    icon: <GraduationCap size={22} />,
    titleKey: "landing.featureAdmissionTitle",
    descriptionKey: "landing.featureAdmissionDesc",
  },
  {
    icon: <CircleDot size={22} />,
    titleKey: "landing.featureAttendanceTitle",
    descriptionKey: "landing.featureAttendanceDesc",
  },
  {
    icon: <CreditCard size={22} />,
    titleKey: "landing.featureFeesTitle",
    descriptionKey: "landing.featureFeesDesc",
  },
  {
    icon: <BriefcaseBusiness size={22} />,
    titleKey: "landing.featureExamTitle",
    descriptionKey: "landing.featureExamDesc",
  },
  {
    icon: <ChartNoAxesCombined size={22} />,
    titleKey: "landing.featureAnalyticsTitle",
    descriptionKey: "landing.featureAnalyticsDesc",
  },
  {
    icon: <LaptopMinimal size={22} />,
    titleKey: "landing.featureOnlineExamTitle",
    descriptionKey: "landing.featureOnlineExamDesc",
  },
  {
    icon: <Hotel size={22} />,
    titleKey: "landing.featureHostelTitle",
    descriptionKey: "landing.featureHostelDesc",
  },
  {
    icon: <Building2 size={22} />,
    titleKey: "landing.featureStaffTitle",
    descriptionKey: "landing.featureStaffDesc",
  },
];

const dashboardScreens = {
  admin: {
    labelKey: "landing.adminDashboard",
    descriptionKey: "landing.adminDashboardDesc",
    image: AdminDashboardImage,
    highlights: ["landing.adminHighlight1", "landing.adminHighlight2", "landing.adminHighlight3"],
  },
  teacher: {
    labelKey: "landing.teacherDashboard",
    descriptionKey: "landing.teacherDashboardDesc",
    image: TeacherDashboardImage,
    highlights: ["landing.teacherHighlight1", "landing.teacherHighlight2", "landing.teacherHighlight3"],
  },
} as const;

export default function LandingPage() {
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [activePreview, setActivePreview] = useState<keyof typeof dashboardScreens>("admin");
  const [activeSection, setActiveSection] = useState<LandingSection>("home");
  const { language, setLanguage, languages, t } = useI18n();
  const year = useMemo(() => new Date().getFullYear(), []);
  const activeScreen = dashboardScreens[activePreview];
  const languageRef = useRef<HTMLDivElement | null>(null);
  const loginRef = useRef<HTMLDivElement | null>(null);
  const centerSlug = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const querySlug = params.get("center")?.trim().toLowerCase();
    if (querySlug) {
      return querySlug;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return detectCenterSlugFromHost(window.location.hostname);
  }, [location.search]);

  const buildAuthPath = (path: "/login" | "/signup", role?: LoginRole) => {
    const params = new URLSearchParams();
    if (role) {
      params.set("role", role);
    }
    if (centerSlug) {
      params.set("center", centerSlug);
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
  };

  useEffect(() => {
    const sectionIds: LandingSection[] = ["home", "features", "about", "contact"];

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 140;
      let currentSection: LandingSection = "home";

      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) {
          return;
        }

        if (scrollPosition >= element.offsetTop) {
          currentSection = id;
        }
      });

      setActiveSection(currentSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (languageRef.current && !languageRef.current.contains(target)) {
        setLanguageOpen(false);
      }

      if (loginRef.current && !loginRef.current.contains(target)) {
        setLoginOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div className="marketing-page">
      <nav className="marketing-nav">
        <a className="marketing-nav__brand" href="#home">
          <img src={Logo} alt="Logo" className="marketing-nav__brandImage" />
          <span>
            Tutorial<span style={{ color: "#fd6900" }}>Hub</span>ERP
          </span>
        </a>
        <ul className="marketing-nav__links">
          <li><a href="#home" className={activeSection === "home" ? "active" : ""}>{t("landing.navHome")}</a></li>
          <li><a href="#features" className={activeSection === "features" ? "active" : ""}>{t("landing.navFeatures")}</a></li>
          <li><a href="#about" className={activeSection === "about" ? "active" : ""}>{t("landing.navAbout")}</a></li>
          <li><a href="#contact" className={activeSection === "contact" ? "active" : ""}>{t("landing.navContact")}</a></li>
        </ul>

        <div className="marketing-nav__actions">
          <div className={`marketing-language ${languageOpen ? "open" : ""}`} ref={languageRef}>
            <button
              type="button"
              className="marketing-language__trigger"
              onClick={() => setLanguageOpen((current) => !current)}
            >
              <span>{languages.find((option) => option.code === language)?.label || language}</span>
              <ChevronDown size={14} className="marketing-language__caret" />
            </button>

            <div className="marketing-language__dropdown">
              {languages.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={`marketing-language__option ${language === option.code ? "active" : ""}`}
                  onClick={() => {
                    setLanguage(option.code);
                    setLanguageOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <a className="marketing-button marketing-button--ghost" href="#contact">Book a Demo</a>

          <div className={`marketing-login ${loginOpen ? "open" : ""}`} ref={loginRef}>
            <button
              type="button"
              className="marketing-button marketing-button--primary"
              onClick={() => setLoginOpen((current) => !current)}
            >
              {t("landing.login")} <ChevronDown size={14} className="marketing-login__caret" />
            </button>

            <div className="marketing-login__dropdown">
              <div className="marketing-login__label">{t("landing.choosePortal")}</div>
              {portalItems.map((item) => (
                <Link
                  key={item.role}
                  to={buildAuthPath("/login", item.role)}
                  className="marketing-login__item"
                  onClick={() => setLoginOpen(false)}
                >
                  <span className={`marketing-login__icon ${item.iconClass}`}>{item.icon}</span>
                  <span>
                    <strong>{t(item.titleKey)}</strong>
                    <small>{t(item.subtitleKey)}</small>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <section className="marketing-hero" id="home">
        <div className="marketing-hero__badge">
          <span className="marketing-hero__dot" />
          {t("landing.trustedBadge")}
        </div>

        <h1>
          {t("landing.heroTitle1")}
          <br />
          {t("landing.heroTitle2")} <span>{t("landing.heroHighlight")}</span>
        </h1>

        <p className="marketing-hero__sub">
          {t("landing.heroSub")}
        </p>

        <div className="marketing-hero__actions">
          <Link className="marketing-button marketing-button--primary marketing-button--large" to={buildAuthPath("/login", "admin")}>
            {t("landing.startFreeTrial")} <ArrowRight size={16} />
          </Link>
          <a className="marketing-button marketing-button--outline marketing-button--large" href="#contact">
            {t("landing.bookLiveDemo")}
          </a>
        </div>

        <div className="marketing-mockup">
          <div className="marketing-mockup__glow" />
          <div className="marketing-browser">
            <div className="marketing-browser__bar">
              <span />
              <span />
              <span />
              <div className="marketing-browser__url">https://www.tutorialhub.co.in/dashboard</div>
            </div>

            <div className="marketing-dash marketing-dash--imageOnly">
              <div className="marketing-dash__topline">
                <div>
                  <div className="marketing-dash__greeting">{t(activeScreen.labelKey)}</div>
                  <div className="marketing-dash__subtitle">{t(activeScreen.descriptionKey)}</div>
                </div>
                <div className="marketing-dash__tabs">
                  {(Object.keys(dashboardScreens) as Array<keyof typeof dashboardScreens>).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`marketing-dash__tab ${activePreview === key ? "active" : ""}`}
                      onClick={() => setActivePreview(key)}
                    >
                      {t(key === "admin" ? "landing.adminPortal" : "landing.teacherPortal")}
                    </button>
                  ))}
                </div>
              </div>

              <img
                src={activeScreen.image}
                alt={t(activeScreen.labelKey)}
                className="marketing-dash__heroImage"
              />

              <div className="marketing-dash__highlights">
                {activeScreen.highlights.map((item) => (
                  <div key={item} className="marketing-dash__highlight">
                    <CheckCircle2 size={15} />
                    <span>{t(item)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-trusted">
        <p>{t("landing.trustedLine")}</p>
        <div className="marketing-trusted__logos">
          <div>Excel Academy</div>
          <div>Bright Future Coaching</div>
          <div>Success Point</div>
          <div>TopRank Institute</div>
          <div>Gurukul Classes</div>
        </div>
      </section>

      <section className="marketing-section marketing-section--soft" id="features">
        <div className="marketing-section__tag">{t("landing.featuresTag")}</div>
        <h2 className="marketing-section__title">{t("landing.featuresTitle")}</h2>
        <p className="marketing-section__sub">
          {t("landing.featuresSub")}
        </p>

        <div className="marketing-features">
          {featureCards.map((item) => (
            <article key={item.titleKey} className="marketing-feature">
              <div className="marketing-feature__icon">{item.icon}</div>
              <h3>{t(item.titleKey)}</h3>
              <p>{t(item.descriptionKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__tag marketing-section__tag--light">{t("landing.roleTag")}</div>
        <h2 className="marketing-section__title marketing-section__title--light">{t("landing.roleTitle")}</h2>
        <p className="marketing-section__sub marketing-section__sub--light">
          {t("landing.roleSub")}
        </p>

        <div className="marketing-portals">
          {portalItems.map((item) => (
            <Link key={item.role} to={buildAuthPath("/login", item.role)} className="marketing-portal">
              <div className="marketing-portal__icon">{item.icon}</div>
              <h3>{t(item.shortKey)}</h3>
              <p>{t(item.subtitleKey)}</p>
              <span>{t(item.titleKey)} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="marketing-about" id="about">
        <div>
          <div className="marketing-section__tag">{t("landing.aboutTag")}</div>
          <h2 className="marketing-section__title marketing-section__title--left">
            {t("landing.aboutTitle1")}
            <br />
            {t("landing.aboutTitle2")}
          </h2>
          <p>{t("landing.aboutPara1")}</p>
          <p>{t("landing.aboutPara2")}</p>

          <div className="marketing-about__stats">
            <div><strong>10+</strong><span>{t("landing.institutes")}</span></div>
            <div><strong>5K+</strong><span>{t("landing.landingStudents")}</span></div>
            <div><strong>2+ yrs</strong><span>{t("landing.experience")}</span></div>
          </div>
        </div>

        <div className="marketing-about__card">
          <h3>{t("landing.whyChoose")}</h3>
          {[
            "landing.aboutPoint1",
            "landing.aboutPoint2",
            "landing.aboutPoint3",
            "landing.aboutPoint4",
            "landing.aboutPoint5",
          ].map((item) => (
            <div key={item} className="marketing-about__check">
              <span>✓</span>
              <p>{t(item)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-section--soft" id="contact">
        <div className="marketing-section__tag">{t("landing.contactTag")}</div>
        <h2 className="marketing-section__title">{t("landing.contactTitle")}</h2>
        <p className="marketing-section__sub">
          {t("landing.contactSub")}
        </p>

        {/* CONTACT CARDS */}
        <div className="marketing-contact">

          {/* EMAIL */}
          <div className="contact-card">
            <Mail size={22} />
            <strong>{t("landing.email")}</strong>
            <p>tutorialhub.co.in@gmail.com</p>
          </div>

          {/* PHONE */}
          <div className="contact-card">
            <Phone size={22} />
            <strong>{t("landing.phone")}</strong>

            <div className="phone-list">
              <a href="tel:+917207185616">+91 7207185616</a>
              <a href="tel:+917008928140">+91 7008928140</a>
            </div>
          </div>

          {/* WHATSAPP */}
          <div className="contact-card">
            <FaWhatsapp size={22} color="#25D366" />
            <strong>{t("landing.whatsapp")}</strong>

            <a
              href="https://wa.me/917207185616"
              target="_blank"
              rel="noreferrer"
              className="whatsapp-link"
            >
              {t("landing.whatsappSub")}
            </a>
          </div>

          {/* LOCATION */}
          <div className="contact-card">
            <MapPin size={22} />
            <strong>{t("landing.location")}</strong>
            <p>{t("landing.locationValue")}</p>
          </div>

        </div>

        {/* SOCIAL SECTION */}
        <div className="marketing-social">
          <h4>{t("landing.followUs")}</h4>

          <div className="social-icons">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram />
            </a>

            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              <FaFacebook />
            </a>

            <a href="https://x.com" target="_blank" rel="noreferrer">
              <FaXTwitter />
            </a>
          </div>
        </div>
      </section>

      <section className="marketing-cta">
        <h2>{t("landing.ctaTitle")}</h2>
        <p>{t("landing.ctaSub")}</p>
        <div className="marketing-cta__actions">
          <Link className="marketing-button marketing-button--white marketing-button--large" to={buildAuthPath("/login", "admin")}>
            {t("landing.startFreeTrial")}
          </Link>
          <a className="marketing-button marketing-button--transparent marketing-button--large" href="#contact">
            {t("landing.bookDemo")}
          </a>
        </div>
      </section>

      <footer className="marketing-footer">
        © {year} <span>tutorialhub.co.in</span> · TutorialHubERP · {t("landing.footer")} · {t("landing.locationValue")}
      </footer>
    </div>
  );
}
