import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
    const location = useLocation();
    const collapsed = false;

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6fa" }}>
            <Sidebar
                collapsed={collapsed}
                currentPath={location.pathname}
            />

            <div style={{ flex: 1 }}>
                <Topbar />
                <div style={{ padding: 32 }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
