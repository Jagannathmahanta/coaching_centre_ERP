import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

export default function Layout() {
    const location = useLocation();
    const collapsed = false;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="appLayout">
            <div className="appLayout__topbar">
                <Topbar
                    mobileMenuOpen={mobileMenuOpen}
                    onMenuToggle={() => setMobileMenuOpen((c) => !c)}
                />
            </div>

            <div className="appLayout__body">
                <Sidebar
                    collapsed={collapsed}
                    currentPath={location.pathname}
                    mobileMenuOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                />

                {mobileMenuOpen && (
                    <button
                        className="appLayout__backdrop"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close navigation menu"
                    />
                )}

                <div className="appLayout__main">
                    <div className="appLayout__content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
