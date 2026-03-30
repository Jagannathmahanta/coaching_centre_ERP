import { Link } from "react-router-dom";

const navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/students", label: "Students", icon: "students" },
    { path: "/fees", label: "Fees", icon: "fees" },
    { path: "/transport", label: "Transport", icon: "transport" },
    { path: "/hostel", label: "Hostel", icon: "hostel" },
    { path: "/teachers", label: "Teachers", icon: "teacher" },
    { path: "/teacher-salary", label: "Teacher Salary", icon: "salary" },
    { path: "/exams", label: "Exams", icon: "exam" },
    { path: "/attendance", label: "Attendance", icon: "attendance" },
    { path: "/holidays", label: "Holidays", icon: "holiday" },
    { path: "/leaves", label: "Leaves", icon: "leave" },
    { path: "/notices", label: "Notices", icon: "notice" },
    { path: "/parents", label: "Parents", icon: "parents" },
];

type Props = {
    collapsed: boolean;
    currentPath: string;
};

export default function Sidebar({ collapsed, currentPath }: Props) {
    return (
        <div
            style={{
                width: collapsed ? 72 : 240,
                background: "#111827",
                transition: "width 0.2s",
                minHeight: "100vh",
                position: "sticky",
                top: 0,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div style={{ padding: 20, color: "#fff" }}>
                {!collapsed ? "BrightCoach" : "B"}
            </div>

            <nav>
                {navItems.map((item) => {
                    const active = currentPath === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: "block",
                                padding: "10px 16px",
                                color: active ? "#fff" : "#aaa",
                                background: active ? "#4f46e5" : "transparent",
                                textDecoration: "none",
                            }}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

        </div>
    );
}
