import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, saveAuth } from "../../shared/services/auth";
import api from "../../shared/services/api";
import { useAuth } from "../../shared/hooks/AuthContext";


export default function LoginPage() {
    const navigate = useNavigate();
    const { setProfile } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            navigate("/", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", { email, password });
            saveAuth(response.data);
            setProfile(response.data.user);
            navigate("/", { replace: true });
        } catch (err: any) {
            setError(err?.response?.data?.error || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                background: "#eef2ff",
                padding: 24,
            }}
        >
            <div
                style={{
                    width: 360,
                    background: "#fff",
                    borderRadius: 24,
                    padding: 32,
                    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
                }}
            >
                <h1 style={{ margin: 0, marginBottom: 16 }}>Coach Login</h1>
                <p style={{ color: "#555", marginBottom: 24 }}>
                    Sign in with your coaching account to continue.
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={{ display: "block", marginBottom: 12, color: "#333" }}>
                        Email or Mobile
                        <input
                            type="text"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                marginTop: 8,
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                outline: "none",
                            }}
                        />
                    </label>

                    <label style={{ display: "block", marginBottom: 12, color: "#333" }}>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                marginTop: 8,
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                outline: "none",
                            }}
                        />
                    </label>

                    {error && (
                        <div style={{ color: "#b91c1c", marginBottom: 16 }}>{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            border: "none",
                            borderRadius: 12,
                            background: "#4f46e5",
                            color: "#fff",
                            fontSize: 16,
                            cursor: "pointer",
                        }}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
