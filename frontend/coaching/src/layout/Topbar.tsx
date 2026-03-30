import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../shared/services/auth";


export default function Topbar() {
    const navigate = useNavigate();
    const user = useMemo(() => getUser(), []);

    const handleLogout = () => {
        clearAuth();
        navigate("/login", { replace: true });
    };

    return (
        <div
            style={{
                height: 60,
                background: "#fff",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                padding: "0 20px",
                alignItems: "center",
            }}
        >
            <div>
                <strong>Odisha Coaching System</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span>{user ? `Welcome, ${user.name || user.email}` : "Guest"}</span>
                <button
                    onClick={handleLogout}
                    style={{
                        border: "none",
                        background: "#4f46e5",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "8px 14px",
                        cursor: "pointer",
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}