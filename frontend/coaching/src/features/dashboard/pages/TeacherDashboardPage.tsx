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
      setActionMessage("Checked in successfully.");
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    },
    onError: (error: any) => {
      setActionError(error.response?.data?.error || error.message || "Check-in failed.");
      setActionMessage("");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation();
      return teacherCheckOut(location);
    },
    onSuccess: async () => {
      setActionMessage("Checked out successfully.");
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    },
    onError: (error: any) => {
      setActionError(error.response?.data?.error || error.message || "Check-out failed.");
      setActionMessage("");
    },
  });

  const liveSeconds = useLiveSeconds(data?.today_attendance);
  const liveClock = formatClock(liveSeconds);
  const attendance = data?.analytics.today_attendance;
  const classAttendance = data?.analytics.class_attendance || [];
  const isCheckedIn = Boolean(data?.today_attendance?.check_in_at && !data?.today_attendance?.check_out_at);
  const statusLabel = data?.today_attendance?.check_out_at
    ? "Checked Out"
    : data?.today_attendance?.check_in_at
      ? "Checked In"
      : "Not Checked In";

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
        label: "Present",
        data: classAttendance.map((item) => item.present_count),
        backgroundColor: "#22c55e",
        borderRadius: 10,
      },
      {
        label: "Absent",
        data: classAttendance.map((item) => item.absent_count),
        backgroundColor: "#ef4444",
        borderRadius: 10,
      },
      {
        label: "Leave",
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
    return <div className="dashboard-panel">Loading...</div>;
  }

  return (
    <div className="dashboard-page teacher-dashboard">
      <section className="dashboard-hero teacher-dashboard__hero">
        <div className="teacher-dashboard__heroCopy">
          <div className="dashboard-chip">Teacher Workspace</div>
          <h1 className="dashboard-greeting">{getGreeting()}</h1>
          <h2 className="dashboard-username">{user?.name || data?.teacher?.name || "Teacher"}</h2>
          <p className="dashboard-description">
            Track your day from one place with live attendance, assigned class activity, notices, holidays, and pending work.
          </p>
        </div>

        <article className="dashboard-panel teacher-dashboard__attendanceCard">
          <div className="teacher-dashboard__attendanceHeader">
            <div>
              <div className="dashboard-statLabel">Today&apos;s Attendance</div>
              <div className={`teacher-dashboard__status teacher-dashboard__status--${isCheckedIn ? "in" : data?.today_attendance?.check_out_at ? "out" : "idle"}`}>
                {statusLabel}
              </div>
            </div>
            <div className="teacher-dashboard__locationHint">
              <MapPin size={16} />
              <span>Location enabled check-in</span>
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
            <span>Check-in: {data?.today_attendance?.check_in_at ? new Date(data.today_attendance.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
            <span>Check-out: {data?.today_attendance?.check_out_at ? new Date(data.today_attendance.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
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
              {checkInMutation.isPending ? "Checking In..." : "Check In"}
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
              {checkOutMutation.isPending ? "Checking Out..." : "Check Out"}
            </button>
          </div>
        </article>
      </section>

      <section className="dashboard-stats">
        <StatCard accent="#2563eb" label="Assigned Classes" value={data?.stats.assigned_class_count || 0} subvalue={`${(data?.teacher?.assigned_classes || []).length || 0} mapped labels`} icon={GraduationCap} />
        <StatCard accent="#059669" label="Total Students" value={data?.stats.total_student_count || 0} subvalue="Across assigned classes / courses" icon={Users} />
        <StatCard accent="#ea580c" label="Pending Leave" value={data?.stats.pending_leave_count || 0} subvalue="Your pending leave requests" icon={CalendarDays} />
        <StatCard accent="#7c3aed" label="Attendance Pending" value={data?.stats.classes_pending_attendance || 0} subvalue="Assigned classes with no marks today" icon={BookCheck} />
      </section>

      <section className="dashboard-insights teacher-dashboard__insights">
        <article className="dashboard-panel dashboard-chartCard">
          <div className="dashboard-cardHeader">
            <div>
              <h2>Students Attendance Today</h2>
              <p>All marked attendance from your assigned classes and courses</p>
            </div>
          </div>
          <div className="dashboard-doughnutWrap">
            <div className="dashboard-chartArea dashboard-chartAreaDonut">
              <Doughnut data={attendanceChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
              <div className="dashboard-doughnutCenter">
                <strong>{attendance?.present_percentage || 0}%</strong>
                <span>present</span>
              </div>
            </div>
            <div className="dashboard-chartSummary">
              <div className="dashboard-chartSummaryCard success">
                <span>Present</span>
                <strong>{attendance?.present_count || 0}</strong>
              </div>
              <div className="dashboard-chartSummaryCard danger">
                <span>Absent</span>
                <strong>{attendance?.absent_count || 0}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel dashboard-chartCard dashboard-chartCardWide">
          <div className="dashboard-cardHeader">
            <div>
              <h2>Class-wise Attendance</h2>
              <p>Today&apos;s attendance split across your assigned classes and courses</p>
            </div>
          </div>
          <div className="dashboard-chartArea teacher-dashboard__barChart">
            {classAttendance.length ? (
              <Bar data={classChartData} options={classChartOptions} />
            ) : (
              <div className="dashboard-empty">No student attendance marked yet for your assigned classes today.</div>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
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

          <Panel title="Upcoming Holidays" subtitle="Plan ahead">
            <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
          </Panel>
        </div>

        <div className="dashboard-stack">
          <Panel title="Pending Work" subtitle="Things that still need your attention">
            <div className="teacher-dashboard__pendingList">
              <div className="teacher-dashboard__pendingItem">
                <Bell size={18} />
                <div>
                  <strong>{data?.stats.classes_pending_attendance || 0} classes pending attendance</strong>
                  <p>Classes or courses under you with no marked student attendance today.</p>
                </div>
              </div>
              <div className="teacher-dashboard__pendingItem">
                <CalendarDays size={18} />
                <div>
                  <strong>{data?.stats.pending_leave_count || 0} leave requests pending</strong>
                  <p>Your leave applications that are still waiting for review.</p>
                </div>
              </div>
              <div className="teacher-dashboard__pendingItem">
                <Timer size={18} />
                <div>
                  <strong>{data?.today_attendance?.check_in_at ? (data?.today_attendance?.check_out_at ? "Day closed" : "Check-out pending") : "Check-in pending"}</strong>
                  <p>
                    {data?.today_attendance?.check_in_at
                      ? data?.today_attendance?.check_out_at
                        ? "Your attendance for today is complete."
                        : "Remember to check out once your day is over."
                      : "Start the day with a location-based check-in."}
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
