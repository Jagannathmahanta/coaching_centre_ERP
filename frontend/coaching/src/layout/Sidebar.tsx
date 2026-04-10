import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getUser, isStaffTeacher } from "../shared/services/auth";
import { getSidebarMenu, type UserRole } from "../shared/utils/sidebarMenu";
import { LogOut } from "lucide-react";
import api from "../shared/services/api";
import { useI18n } from "../shared/i18n/I18nProvider";
import Logo from "../assets/newLogo.png";
import "./layout.css"
type Props = {
  collapsed: boolean;
  currentPath: string;
  mobileMenuOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({
  collapsed,
  currentPath,
  mobileMenuOpen,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const user = getUser();
  const { t } = useI18n();
  const [hasNewNotice, setHasNewNotice] = useState(false);

  const role: UserRole =
    user?.role === "admin" || user?.role === "student" || user?.role === "parent" || user?.role === "teacher" || user?.role === "super_admin"
      ? user.role
      : "student";
  const navItems = getSidebarMenu(role, isStaffTeacher(user));
  const shouldCheckNoticeBadge = role === "student" || role === "parent";

  const recentCutoff = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    return date.getTime();
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadNoticeBadge = async () => {
      if (!shouldCheckNoticeBadge) {
        setHasNewNotice(false);
        return;
      }

      try {
        const response = await api.get("/notices");
        const notices = response.data || [];
        const hasRecent = notices.some((item: { created_at?: string }) => {
          if (!item.created_at) return false;
          return new Date(item.created_at).getTime() >= recentCutoff;
        });

        if (!ignore) {
          setHasNewNotice(hasRecent);
        }
      } catch {
        if (!ignore) {
          setHasNewNotice(false);
        }
      }
    };

    loadNoticeBadge();

    return () => {
      ignore = true;
    };
  }, [recentCutoff, shouldCheckNoticeBadge]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`appSidebar${mobileMenuOpen ? " appSidebar--open" : ""}`}>
      
      {/* Brand */}
      <div className="appSidebar__brand">
  {!collapsed ? (
    <div className="sidebar-brand">
      <img src={Logo} alt="Logo" className="sidebar-brand__logo" />
      <span>
        Tutorial<span style={{ color: "#fd6900" }}>Hub</span>ERP
      </span>
    </div>
  ) : (
    "T"
  )}
</div>

      {/* Menu */}
      <nav className="appSidebar__nav">
        {navItems.map((item) => {
          const active = currentPath === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`appSidebar__link ${
                active ? "appSidebar__link--active" : ""
              }`}
              onClick={onClose}
            >
              <Icon size={20} className="appSidebar__icon" />
              {!collapsed ? (
                <>
                  <span className="appSidebar__label">{t(item.labelKey)}</span>
                  {item.path === "/notices" && hasNewNotice ? (
                    <span className="appSidebar__badge">{t("common.new")}</span>
                  ) : null}
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="appSidebar__footer">
        {!collapsed && (
          <div className="appSidebar__user">
            {user ? t("topbar.welcome", { name: user.name || user.email || t("common.guest") }) : t("common.guest")}
          </div>
        )}

        <button className="appSidebar__logout" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && t("common.logout")}
        </button>
      </div>
    </div>
  );
}
