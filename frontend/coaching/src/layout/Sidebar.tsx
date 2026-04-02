import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../shared/services/auth";
import { getSidebarMenu, type UserRole } from "../shared/utils/sidebarMenu";
import { LogOut } from "lucide-react";
import api from "../shared/services/api";

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
  const [hasNewNotice, setHasNewNotice] = useState(false);

  const role: UserRole =
    user?.role === "admin" || user?.role === "student" || user?.role === "parent" || user?.role === "teacher"
      ? user.role
      : "student";
  const navItems = getSidebarMenu(role);
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
        {!collapsed ? "CoachingERP" : "C"}
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
                  <span className="appSidebar__label">{item.label}</span>
                  {item.path === "/notices" && hasNewNotice ? (
                    <span className="appSidebar__badge">New</span>
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
            {user ? `Welcome, ${user.name || user.email}` : "Guest"}
          </div>
        )}

        <button className="appSidebar__logout" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}
