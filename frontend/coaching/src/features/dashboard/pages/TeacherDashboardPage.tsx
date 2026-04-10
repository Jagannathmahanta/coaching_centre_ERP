import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArcElement,
  BarElement,
  BarController,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { isNewBatch } from "../../../shared/utils/format";
import { Bell, BookCheck, CalendarDays, GraduationCap, MapPin, Timer, Users } from "lucide-react";
import getGreeting from "../../../shared/utils/greeting";
import { getUser } from "../../../shared/services/auth";
import { shortDate } from "../../../shared/utils/format";
import { HolidayList } from "../components/HolidayList";
import { NoticeList } from "../components/NoticeList";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { useTeacherDashboardQuery } from "../hooks/useTeacherDashboardQuery";
import { useDownloadResult } from "../hooks/useDownloadResult";
import { teacherCheckIn, teacherCheckOut } from "../services/dashboard.service";
import "../styles/dashboard.css";
import { useI18n } from "../../../shared/i18n/I18nProvider";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, DoughnutController, ArcElement, Tooltip, Legend);

function formatClock(totalSeconds: number) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return { hours, minutes, seconds };
}

function useLiveSeconds(session?: { check_in_at?: string | null; check_out_at?: string | null; total_minutes?: number | null } | null) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!session?.check_in_at || session?.check_out_at) return undefined;
    const interval = window.setInterval(() => forceTick((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [session?.check_in_at, session?.check_out_at]);

  if (!session?.check_in_at) return 0;
  if (session?.check_out_at) return Math.max(0, Number(session.total_minutes || 0) * 60);
  const diff = Math.floor((Date.now() - new Date(session.check_in_at).getTime()) / 1000);
  return Math.max(0, diff);
}

async function getCurrentLocation() {
  if (!navigator.geolocation) {
    throw new Error("Location is not supported in this browser.");
  }

  return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => reject(new Error("Location permission is required for check-in and check-out.")),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export default function TeacherDashboardPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const user = useMemo(() => getUser(), []);
  const { data, isLoading } = useTeacherDashboardQuery();
  const { download } = useDownloadResult();
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      return teacherCheckIn(location);
    },
    onSuccess: async () => {
      setActionMessage(t("dashboard.checkedInSuccess"));
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    },
    onError: (error: any) => {
      setActionError(error.response?.data?.error || error.message || t("dashboard.checkInFailed"));
      setActionMessage("");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      return teacherCheckOut(location);
    },
    onSuccess: async () => {
      setActionMessage(t("dashboard.checkedOutSuccess"));
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    },
    onError: (error: any) => {
      setActionError(error.response?.data?.error || error.message || t("dashboard.checkOutFailed"));
      setActionMessage("");
    },
  });

  const liveSeconds = useLiveSeconds(data?.today_attendance);
  const liveClock = formatClock(liveSeconds);
  const attendance = data?.analytics.today_attendance;
  const classAttendance = data?.analytics.class_attendance || [];
  const isCheckedIn = Boolean(data?.today_attendance?.check_in_at && !data?.today_attendance?.check_out_at);
  const statusLabel = data?.today_attendance?.check_out_at
    ? t("dashboard.checkedOut")
    : data?.today_attendance?.check_in_at
      ? t("dashboard.checkedIn")
      : t("dashboard.notCheckedIn");

  const attendanceChartData: ChartData<"doughnut", number[], string> = {
    labels: ["Present", "Absent", "Leave"],
    datasets: [
      {
        data: [
          attendance?.present_count || 0,
          attendance?.absent_count || 0,
          attendance?.leave_count || 0,
        ],
        backgroundColor: ["#22c55e", "#ef4444", "#f59e0b"],
        borderWidth: 0,
      },
    ],
  };

  const classChartData: ChartData<"bar", number[], string> = {
    labels: classAttendance.map((item) => item.label),
    datasets: [
      {
        label: t("dashboard.present"),
        data: classAttendance.map((item) => item.present_count),
        backgroundColor: "#22c55e",
        borderRadius: 10,
      },
      {
        label: t("dashboard.absent"),
        data: classAttendance.map((item) => item.absent_count),
        backgroundColor: "#ef4444",
        borderRadius: 10,
      },
      {
        label: t("dashboard.leave"),
        data: classAttendance.map((item) => item.leave_count),
        backgroundColor: "#f59e0b",
        borderRadius: 10,
      },
    ],
  };

  const classChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.15)" },
      },
    },
  };

  if (isLoading) {
    return <div className="dashboard-panel">{t("dashboard.loading")}</div>;
  }

  return (
    <div className="dashboard-page teacher-dashboard">
      <section className="dashboard-hero teacher-dashboard__hero">
        <div className="teacher-dashboard__heroCopy">
          <div className="dashboard-chip">{t("dashboard.teacherWorkspace")}</div>
          <h1 className="dashboard-greeting">{getGreeting()}</h1>
          <h2 className="dashboard-username">{user?.name || data?.teacher?.name || t("dashboard.teacherDefaultName")}</h2>
          <p className="dashboard-description">
            {t("dashboard.teacherHeroDesc")}
          </p>
        </div>

        <article className="dashboard-panel teacher-dashboard__attendanceCard">
          <div className="teacher-dashboard__attendanceHeader">
            <div>
              <div className="dashboard-statLabel">{t("dashboard.todaysAttendance")}</div>
              <div className={`teacher-dashboard__status teacher-dashboard__status--${isCheckedIn ? "in" : data?.today_attendance?.check_out_at ? "out" : "idle"}`}>
                {statusLabel}
              </div>
            </div>
            <div className="teacher-dashboard__locationHint">
              <MapPin size={16} />
              <span>{t("dashboard.locationEnabledCheckIn")}</span>
            </div>
          </div>

          <div className="teacher-dashboard__timer">
            <div>{liveClock.hours}</div>
            <span>:</span>
            <div>{liveClock.minutes}</div>
            <span>:</span>
            <div>{liveClock.seconds}</div>
          </div>

          <div className="teacher-dashboard__attendanceMeta">
            <span>{t("dashboard.checkIn")}: {data?.today_attendance?.check_in_at ? new Date(data.today_attendance.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
            <span>{t("dashboard.checkOut")}: {data?.today_attendance?.check_out_at ? new Date(data.today_attendance.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
          </div>

          {actionMessage ? <div className="dashboard-inlineMessage success">{actionMessage}</div> : null}
          {actionError ? <div className="dashboard-inlineMessage error">{actionError}</div> : null}

          <div className="teacher-dashboard__attendanceActions">
            <button
              type="button"
              className="teacher-dashboard__primaryButton"
              disabled={checkInMutation.isPending || Boolean(data?.today_attendance?.check_in_at)}
              onClick={() => {
                setActionError("");
                setActionMessage("");
                checkInMutation.mutate();
              }}
            >
              {checkInMutation.isPending ? t("dashboard.checkingIn") : t("dashboard.checkIn")}
            </button>
            <button
              type="button"
              className="teacher-dashboard__secondaryButton"
              disabled={checkOutMutation.isPending || !isCheckedIn}
              onClick={() => {
                setActionError("");
                setActionMessage("");
                checkOutMutation.mutate();
              }}
            >
              {checkOutMutation.isPending ? t("dashboard.checkingOut") : t("dashboard.checkOut")}
            </button>
          </div>
        </article>
      </section>

      <section className="dashboard-stats">
        <StatCard accent="#2563eb" label="dashboard.assignedClasses" value={data?.stats.assigned_class_count || 0} subvalue={t("dashboard.mappedLabels", { count: (data?.teacher?.assigned_classes || []).length || 0 })} icon={GraduationCap} />
        <StatCard accent="#059669" label="dashboard.totalStudents" value={data?.stats.total_student_count || 0} subvalue="dashboard.totalStudentsAcross" icon={Users} />
        <StatCard accent="#ea580c" label="dashboard.pendingLeave" value={data?.stats.pending_leave_count || 0} subvalue="dashboard.pendingLeaveSub" icon={CalendarDays} />
        <StatCard accent="#7c3aed" label="dashboard.attendancePending" value={data?.stats.classes_pending_attendance || 0} subvalue="dashboard.attendancePendingSub" icon={BookCheck} />
      </section>

      <section className="dashboard-insights teacher-dashboard__insights">
        <article className="dashboard-panel dashboard-chartCard">
          <div className="dashboard-cardHeader">
            <div>
              <h2>{t("dashboard.studentsAttendanceToday")}</h2>
              <p>{t("dashboard.studentsAttendanceSub")}</p>
            </div>
          </div>
          <div className="dashboard-doughnutWrap">
            <div className="dashboard-chartArea dashboard-chartAreaDonut">
              <Doughnut data={attendanceChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
              <div className="dashboard-doughnutCenter">
                <strong>{attendance?.present_percentage || 0}%</strong>
                <span>{t("dashboard.presentLower")}</span>
              </div>
            </div>
            <div className="dashboard-chartSummary">
              <div className="dashboard-chartSummaryCard success">
                <span>{t("dashboard.present")}</span>
                <strong>{attendance?.present_count || 0}</strong>
              </div>
              <div className="dashboard-chartSummaryCard danger">
                <span>{t("dashboard.absent")}</span>
                <strong>{attendance?.absent_count || 0}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel dashboard-chartCard dashboard-chartCardWide">
          <div className="dashboard-cardHeader">
            <div>
              <h2>{t("dashboard.classWiseAttendance")}</h2>
              <p>{t("dashboard.classWiseAttendanceSub")}</p>
            </div>
          </div>
          <div className="dashboard-chartArea teacher-dashboard__barChart">
            {classAttendance.length ? (
              <Bar data={classChartData} options={classChartOptions} />
            ) : (
              <div className="dashboard-empty">{t("dashboard.noStudentAttendance")}</div>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
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

          <Panel title="dashboard.upcomingHolidays" subtitle="dashboard.planAhead">
            <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
          </Panel>
        </div>

        <div className="dashboard-stack">
          <Panel title="dashboard.pendingWork" subtitle="dashboard.pendingWorkSub">
            <div className="teacher-dashboard__pendingList">
              <div className="teacher-dashboard__pendingItem">
                <Bell size={18} />
                <div>
                  <strong>{t("dashboard.classesPendingAttendance", { count: data?.stats.classes_pending_attendance || 0 })}</strong>
                  <p>{t("dashboard.classesPendingAttendanceDesc")}</p>
                </div>
              </div>
              <div className="teacher-dashboard__pendingItem">
                <CalendarDays size={18} />
                <div>
                  <strong>{t("dashboard.leaveRequestsPending", { count: data?.stats.pending_leave_count || 0 })}</strong>
                  <p>{t("dashboard.leaveRequestsPendingDesc")}</p>
                </div>
              </div>
              <div className="teacher-dashboard__pendingItem">
                <Timer size={18} />
                <div>
                  <strong>{data?.today_attendance?.check_in_at ? (data?.today_attendance?.check_out_at ? t("dashboard.dayClosed") : t("dashboard.checkOutPending")) : t("dashboard.checkInPending")}</strong>
                  <p>
                    {data?.today_attendance?.check_in_at
                      ? data?.today_attendance?.check_out_at
                        ? t("dashboard.attendanceComplete")
                        : t("dashboard.rememberCheckOut")
                      : t("dashboard.startDayCheckIn")}
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
