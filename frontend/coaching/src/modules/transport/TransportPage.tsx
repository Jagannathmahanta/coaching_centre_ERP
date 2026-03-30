import { useState } from "react";

const routes = [
    { id: 1, route: "Bhubaneswar - Khandagiri", vehicle: "Bus OD02AB1234", driver: "Ramesh Das", seats: 24 },
    { id: 2, route: "Cuttack - Chowdwar", vehicle: "Mini Bus OD05CD5678", driver: "Binita Sahoo", seats: 18 },
];

export default function TransportPage() {
    const [activeRoute, setActiveRoute] = useState<number | null>(null);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>Transport</h1>
                    <p style={{ color: "#666", marginTop: 8 }}>Manage routes, vehicles, and student transport assignments.</p>
                </div>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
                {routes.map((route) => (
                    <div key={route.id} style={{ background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 18 }}>{route.route}</h2>
                                <p style={{ margin: 8, color: "#555" }}>{route.vehicle} • Driver: {route.driver}</p>
                            </div>
                            <div style={{ fontWeight: 700, color: "#4f46e5" }}>{route.seats} seats</div>
                        </div>
                        <button
                            onClick={() => setActiveRoute(activeRoute === route.id ? null : route.id)}
                            style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #4f46e5", background: activeRoute === route.id ? "#4f46e5" : "#fff", color: activeRoute === route.id ? "#fff" : "#4f46e5", cursor: "pointer" }}
                        >
                            {activeRoute === route.id ? "Hide details" : "View details"}
                        </button>
                        {activeRoute === route.id && (
                            <div style={{ marginTop: 16, color: "#444" }}>
                                <p>Route schedule, assigned students, and fee status will appear here.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
