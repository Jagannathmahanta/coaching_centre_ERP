import { useState } from "react";
import Button from "../../shared/componets/Button";


const sampleNotices = [
    { id: 1, title: "Holi Holiday", date: "2026-03-14", priority: "High" },
    { id: 2, title: "Monthly Fee Due", date: "2026-03-31", priority: "Medium" },
];

export default function NoticesPage() {
    const [notices] = useState(sampleNotices);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28 }}>Notices</h1>
                    <p style={{ color: "#666", marginTop: 8 }}>Post updates and announcements for students and parents.</p>
                </div>
                <Button onClick={() => alert("Notice posting coming soon")}>Post Notice</Button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
                {notices.map((notice) => (
                    <div key={notice.id} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <h2 style={{ margin: 0, fontSize: 18 }}>{notice.title}</h2>
                            <span style={{ color: notice.priority === "High" ? "#dc2626" : "#f59e0b", fontWeight: 700 }}>{notice.priority}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#555" }}>Posted on {notice.date}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
