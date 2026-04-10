import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, BriefcaseBusiness, ChevronDown, Clock3, GraduationCap, IndianRupee, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/hooks/AuthContext";
import { getUser, hasPlatformAuthBackup, restorePlatformAuth } from "../../../shared/services/auth";
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
import { useI18n } from "../../../shared/i18n/I18nProvider";

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const { setProfile } = useAuth();
    const { t } = useI18n();
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

    const showReturnToPlatform = Boolean(
        user?.is_impersonated &&
        user?.platform_role === "super_admin" &&
        hasPlatformAuthBackup()
    );

    const handleReturnToPlatform = () => {
        const restored = restorePlatformAuth();
        if (restored?.user) {
            setProfile(restored.user);
            navigate("/dashboard", { replace: true });
        }
    };

    if (isLoading) {
        return <div className="dashboard-panel">{t("dashboard.loading")}</div>;
    }

    return (
        <div className="dashboard-page">

            {/* HERO */}
            <div className="dashboard-hero">
                <div className="dashboard-hero-left">
                    {showReturnToPlatform ? (
                        <div className="dashboard-platformReturn">
                            <span className="dashboard-platformReturnLabel">
                                Viewing {user?.center_name || user?.center_slug || "institute"} as Super Admin
                            </span>
                            <button
                                type="button"
                                className="dashboard-platformReturnButton"
                                onClick={handleReturnToPlatform}
                            >
                                Return to platform
                            </button>
                        </div>
                    ) : null}

                    <h1 className="dashboard-greeting">
                        {getGreeting()}
                    </h1>

                    <h2 className="dashboard-username">
                        {user?.name || t("dashboard.adminDefaultName")}
                    </h2>

                    <p className="dashboard-subtext">
                        {t("dashboard.productiveDay")}
                    </p>

                    <p className="dashboard-description">
                        {t("dashboard.adminHeroDesc")}
                    </p>

                </div>

                <div className="dashboard-admissionMenu" ref={menuRef}>
                    <button
                        type="button"
                        className="dashboard-admissionButton"
                        onClick={() => setAdmissionMenuOpen((current) => !current)}
                    >
                        <Plus size={16} />
                        <span>{t("dashboard.newAdmission")}</span>
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
                                {t("dashboard.addStudent")}
                            </button>
                            <button
                                type="button"
                                className="dashboard-admissionDropdownItem"
                                onClick={() => {
                                    setAdmissionMode("teacher");
                                    setAdmissionMenuOpen(false);
                                }}
                            >
                                {t("dashboard.addTeacher")}
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
                    label="dashboard.totalStudents"
                    value={stats?.total_students || 0}
                    subvalue={t("dashboard.activeCount", { count: stats?.active_students || 0 })}
                    icon={Users}
                />

                <StatCard
                    accent="#9333ea"
                    label="dashboard.totalTeachers"
                    value={stats?.total_teachers || 0}
                    subvalue={t("dashboard.activeCount", { count: stats?.active_teachers || 0 })}
                    icon={GraduationCap}
                />

                <StatCard
                    accent="#0f766e"
                    label="dashboard.checkInTeacher"
                    value={stats?.checked_in_teachers_today || 0}
                    subvalue={t("dashboard.onDutySummary", { onDuty: stats?.teachers_on_duty_now || 0, checkedOut: stats?.checked_out_teachers_today || 0 })}
                    icon={Clock3}
                />

                <StatCard
                    accent="#059669"
                    label="dashboard.feeCollection"
                    value={currency(stats?.collected_this_month || 0)}
                    subvalue="dashboard.currentMonth"
                    icon={IndianRupee}
                />

                <StatCard
                    accent="#d97706"
                    label="dashboard.pendingFees"
                    value={currency(stats?.pending_this_month || 0)}
                    subvalue={t("dashboard.installmentsCount", { count: stats?.pending_fee_count || 0 })}
                    icon={BriefcaseBusiness}
                />

                <StatCard
                    accent="#ea580c"
                    label="dashboard.avgAttendance"
                    value={`${attendance?.this_month.present_percentage || 0}%`}
                    subvalue={t("dashboard.vsLastMonth", { value: `${attendanceChange >= 0 ? "+" : ""}${attendanceChange}` })}
                    icon={BookOpenCheck}
                />
            </section>

            <DashboardInsights analytics={data?.analytics} />

            {/* 🔥 IMPORTANT: GRID RESTORED */}
            <section className="dashboard-grid">

                {/* LEFT SIDE */}
                <div className="dashboard-stack">

                    <Panel title="dashboard.noticeBoard" subtitle="dashboard.recentUpdates">
                        <NoticeList
                            notices={data?.recent_notices}
                            exams={data?.upcoming_exams}
                            results={data?.recent_results}
                            shortDate={shortDate}
                            isNewBatch={isNewBatch}
                            downloadResultBatch={download}
                        />
                    </Panel>
                    <Panel title="dashboard.upcomingHolidays" subtitle="dashboard.holidaySchedule">
                        <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
                    </Panel>

                </div>

                {/* RIGHT SIDE */}
                <div className="dashboard-stack">

                    <Panel title="dashboard.pendingFeesPanel" subtitle="dashboard.duesList">
                        <PendingFeeTable
                            fees={data?.pending_fees}
                            shortDate={shortDate}
                            currency={currency}
                        />
                    </Panel>

                    <Panel title="dashboard.teacherAttendanceToday" subtitle="dashboard.teacherAttendanceSub">
                        {!data?.teacher_attendance_today?.length ? (
                            <div className="dashboard-empty">{t("dashboard.noTeacherCheckIn")}</div>
                        ) : (
                            <div className="dashboard-list">
                                {data.teacher_attendance_today.map((item) => (
                                    <div className="dashboard-listItem" key={item.id}>
                                        <div>
                                            <div className="dashboard-listTitle">{item.teacher_name}</div>
                                            <div className="dashboard-listMeta">
                                                {t("dashboard.checkIn")}: {item.check_in_at ? new Date(item.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                                            </div>
                                            <div className="dashboard-listMeta">
                                                {t("dashboard.checkOut")}: {item.check_out_at ? new Date(item.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                                            </div>
                                        </div>

                                        <div className="dashboard-adminTeacherAttendanceMeta">
                                            <span className={`dashboard-badge ${item.status === "checked_out" ? "" : "newBatch"}`}>
                                                {item.status === "checked_out" ? t("dashboard.checkedOut") : t("dashboard.onDuty")}
                                            </span>
                                            <span className="dashboard-listMeta">
                                                {item.total_minutes > 0 ? `${Math.floor(item.total_minutes / 60)}h ${item.total_minutes % 60}m` : t("dashboard.live")}
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
