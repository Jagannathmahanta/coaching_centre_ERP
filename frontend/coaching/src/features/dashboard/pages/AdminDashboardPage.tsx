import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, BriefcaseBusiness, ChevronDown, Clock3, GraduationCap, IndianRupee, Plus, Users } from "lucide-react";
import { getUser } from "../../../shared/services/auth";
import { currency, isNewBatch, shortDate } from "../../../shared/utils/format";
import getGreeting from "../../../shared/utils/greeting";
import { DashboardTeacherAdmissionPanel } from "../components/DashboardTeacherAdmissionPanel";
import { HolidayList } from "../components/HolidayList";
import { NoticeList } from "../components/NoticeList";
import { DashboardInsights } from "../components/DashboardInsights";
import { Panel } from "../components/Panel";
import { PendingFeeTable } from "../components/PendingFeeTable";
import { StatCard } from "../components/StatCard";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDownloadResult } from "../hooks/useDownloadResult";
import NewStudentPage from "../../student/pages/NewStudentPage";
import "../styles/dashboard.css";

export default function AdminDashboardPage() {
    const { data, isLoading } = useDashboardQuery();
    const { download } = useDownloadResult();
    const user = useMemo(() => getUser(), []);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [admissionMenuOpen, setAdmissionMenuOpen] = useState(false);
    const [admissionMode, setAdmissionMode] = useState<"student" | "teacher" | null>(null);
    const stats = data?.stats;
    const attendance = data?.analytics?.attendance_comparison;
    const attendanceChange = attendance
        ? Number((attendance.this_month.present_percentage - attendance.last_month.present_percentage).toFixed(1))
        : 0;

    useEffect(() => {
        const handleOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setAdmissionMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    if (isLoading) {
        return <div className="dashboard-panel">Loading...</div>;
    }

    return (
        <div className="dashboard-page">

            {/* HERO */}
            <div className="dashboard-hero">
                <div className="dashboard-hero-left">

                    <h1 className="dashboard-greeting">
                        {getGreeting()}
                    </h1>

                    <h2 className="dashboard-username">
                        {user?.name || "Admin"}
                    </h2>

                    <p className="dashboard-subtext">
                        Have a productive day!
                    </p>

                    <p className="dashboard-description">
                        Track notices, upcoming exams, recent results, holidays, and pending fee collections.
                    </p>

                </div>

                <div className="dashboard-admissionMenu" ref={menuRef}>
                    <button
                        type="button"
                        className="dashboard-admissionButton"
                        onClick={() => setAdmissionMenuOpen((current) => !current)}
                    >
                        <Plus size={16} />
                        <span>New Admission</span>
                        <ChevronDown size={16} />
                    </button>

                    {admissionMenuOpen ? (
                        <div className="dashboard-admissionDropdown">
                            <button
                                type="button"
                                className="dashboard-admissionDropdownItem"
                                onClick={() => {
                                    setAdmissionMode("student");
                                    setAdmissionMenuOpen(false);
                                }}
                            >
                                Add Student
                            </button>
                            <button
                                type="button"
                                className="dashboard-admissionDropdownItem"
                                onClick={() => {
                                    setAdmissionMode("teacher");
                                    setAdmissionMenuOpen(false);
                                }}
                            >
                                Add Teacher
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {admissionMode === "student" ? <NewStudentPage embedded onClose={() => setAdmissionMode(null)} /> : null}
            {admissionMode === "teacher" ? <DashboardTeacherAdmissionPanel onClose={() => setAdmissionMode(null)} /> : null}

            {/* STATS */}
            <section className="dashboard-stats">
                <StatCard
                    accent="#2563eb"
                    label="Total Students"
                    value={stats?.total_students || 0}
                    subvalue={`${stats?.active_students || 0} active`}
                    icon={Users}
                />

                <StatCard
                    accent="#9333ea"
                    label="Total Teachers"
                    value={stats?.total_teachers || 0}
                    subvalue={`${stats?.active_teachers || 0} active`}
                    icon={GraduationCap}
                />

                <StatCard
                    accent="#0f766e"
                    label="Check In Teacher"
                    value={stats?.checked_in_teachers_today || 0}
                    subvalue={`${stats?.teachers_on_duty_now || 0} on duty • ${stats?.checked_out_teachers_today || 0} checked out`}
                    icon={Clock3}
                />

                <StatCard
                    accent="#059669"
                    label="Fee Collection"
                    value={currency(stats?.collected_this_month || 0)}
                    subvalue="Current month"
                    icon={IndianRupee}
                />

                <StatCard
                    accent="#d97706"
                    label="Pending Fees"
                    value={currency(stats?.pending_this_month || 0)}
                    subvalue={`${stats?.pending_fee_count || 0} installments`}
                    icon={BriefcaseBusiness}
                />

                <StatCard
                    accent="#ea580c"
                    label="Avg. Attendance"
                    value={`${attendance?.this_month.present_percentage || 0}%`}
                    subvalue={`${attendanceChange >= 0 ? "+" : ""}${attendanceChange}% vs last month`}
                    icon={BookOpenCheck}
                />
            </section>

            <DashboardInsights analytics={data?.analytics} />

            {/* 🔥 IMPORTANT: GRID RESTORED */}
            <section className="dashboard-grid">

                {/* LEFT SIDE */}
                <div className="dashboard-stack">

                    <Panel title="Notice Board" subtitle="Recent updates">
                        <NoticeList
                            notices={data?.recent_notices}
                            exams={data?.upcoming_exams}
                            results={data?.recent_results}
                            shortDate={shortDate}
                            isNewBatch={isNewBatch}
                            downloadResultBatch={download}
                        />
                    </Panel>
                    <Panel title="Upcoming Holidays" subtitle="Holiday schedule">
                        <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
                    </Panel>

                </div>

                {/* RIGHT SIDE */}
                <div className="dashboard-stack">

                    <Panel title="Pending Fees" subtitle="Dues list">
                        <PendingFeeTable
                            fees={data?.pending_fees}
                            shortDate={shortDate}
                            currency={currency}
                        />
                    </Panel>

                    <Panel title="Teacher Attendance Today" subtitle="Check in and check out status">
                        {!data?.teacher_attendance_today?.length ? (
                            <div className="dashboard-empty">No teachers have checked in today yet.</div>
                        ) : (
                            <div className="dashboard-list">
                                {data.teacher_attendance_today.map((item) => (
                                    <div className="dashboard-listItem" key={item.id}>
                                        <div>
                                            <div className="dashboard-listTitle">{item.teacher_name}</div>
                                            <div className="dashboard-listMeta">
                                                Check in: {item.check_in_at ? new Date(item.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                                            </div>
                                            <div className="dashboard-listMeta">
                                                Check out: {item.check_out_at ? new Date(item.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                                            </div>
                                        </div>

                                        <div className="dashboard-adminTeacherAttendanceMeta">
                                            <span className={`dashboard-badge ${item.status === "checked_out" ? "" : "newBatch"}`}>
                                                {item.status === "checked_out" ? "Checked Out" : "On Duty"}
                                            </span>
                                            <span className="dashboard-listMeta">
                                                {item.total_minutes > 0 ? `${Math.floor(item.total_minutes / 60)}h ${item.total_minutes % 60}m` : "Live"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                </div>

            </section>
        </div>
    );
}
