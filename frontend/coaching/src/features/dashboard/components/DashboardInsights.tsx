import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Chart, Doughnut } from "react-chartjs-2";
import { currency } from "../../../shared/utils/format";
import type { DashboardAnalytics } from "../types/dashboard.types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

type Props = {
  analytics?: DashboardAnalytics;
};

const distributionColors = ["#5b47d6", "#4f86f7", "#57bd8d", "#f1aa3e", "#e85e5e", "#8b5cf6"];

const compactNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const DashboardInsights = ({ analytics }: Props) => {
  const monthlyOverview = analytics?.monthly_overview || [];
  const todayAttendance = analytics?.today_attendance;
  const admissions = analytics?.admissions_comparison;
  const classDistribution = analytics?.class_wise_students || [];
  const courseDistribution = analytics?.course_wise_students || [];

  const overviewData: ChartData<"bar" | "line", number[], string> = {
    labels: monthlyOverview.map((item) => item.month_label),
    datasets: [
      {
        type: "bar",
        label: "Collected Fees",
        data: monthlyOverview.map((item) => item.collected_amount),
        backgroundColor: "#5b47d6",
        borderRadius: 10,
        borderSkipped: false,
        barPercentage: 0.68,
        categoryPercentage: 0.72,
      },
      {
        type: "line",
        label: "New Enrollments",
        data: monthlyOverview.map((item) => item.new_enrollments),
        borderColor: "#33b27b",
        backgroundColor: "rgba(51, 178, 123, 0.14)",
        pointBackgroundColor: "#33b27b",
        pointRadius: 4,
        pointHoverRadius: 5,
        tension: 0.35,
        yAxisID: "y1",
      },
    ],
  };

  const overviewOptions: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        align: "start",
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: "rect",
          padding: 18,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.15)",
        },
        ticks: {
          callback: (value) => compactNumber(Number(value)),
        },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        grid: {
          display: false,
        },
      },
    },
  };

  const attendanceData = {
    labels: ["Present", "Absent", "Leave"],
    datasets: [
          {
        data: [
          todayAttendance?.present_count || 0,
          todayAttendance?.absent_count || 0,
          todayAttendance?.leave_count || 0,
        ],
        backgroundColor: ["#52c08a", "#e95f5f", "#f1aa3e"],
        borderWidth: 0,
        cutout: "72%",
      },
    ],
  };

  const distributionOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 14,
        },
      },
    },
  };

  const attendanceOptions: ChartOptions<"doughnut"> = distributionOptions;

  const classData = {
    labels: classDistribution.map((item) => item.label),
    datasets: [
      {
        data: classDistribution.map((item) => item.value),
        backgroundColor: distributionColors.slice(0, Math.max(classDistribution.length, 1)),
        borderWidth: 0,
        cutout: "62%",
      },
    ],
  };

  const courseData = {
    labels: courseDistribution.map((item) => item.label),
    datasets: [
      {
        data: courseDistribution.map((item) => item.value),
        backgroundColor: distributionColors.slice(0, Math.max(courseDistribution.length, 1)),
        borderWidth: 0,
        cutout: "62%",
      },
    ],
  };

  return (
    <section className="dashboard-insights">
      <article className="dashboard-panel dashboard-chartCard dashboard-chartCardWide">
        <div className="dashboard-cardHeader">
          <div>
            <h2>Revenue & Enrollment Overview</h2>
            <p>Monthly collected fees and new admissions</p>
          </div>
          <div className="dashboard-chartMeta">
            <span className="dashboard-chartPill">Last 6 months</span>
            <span className={`dashboard-chartPill ${Number(admissions?.change_percent || 0) >= 0 ? "positive" : "negative"}`}>
              {Number(admissions?.change_percent || 0) >= 0 ? "+" : ""}
              {admissions?.change_percent || 0}% admissions
            </span>
          </div>
        </div>
        <div className="dashboard-chartArea dashboard-chartAreaLarge">
          <Chart type="bar" data={overviewData} options={overviewOptions} />
        </div>
      </article>

      <article className="dashboard-panel dashboard-chartCard">
        <div className="dashboard-cardHeader">
          <div>
            <h2>Today's Attendance</h2>
            <p>Today&apos;s marked attendance snapshot</p>
          </div>
        </div>
        <div className="dashboard-doughnutWrap">
          <div className="dashboard-chartArea dashboard-chartAreaDonut">
            <Doughnut data={attendanceData} options={attendanceOptions} />
            <div className="dashboard-doughnutCenter">
              <strong>{todayAttendance?.present_percentage || 0}%</strong>
              <span>present</span>
            </div>
          </div>
          <div className="dashboard-chartSummary">
            <div className="dashboard-chartSummaryCard success">
              <span>Present</span>
              <strong>{todayAttendance?.present_count || 0}</strong>
            </div>
            <div className="dashboard-chartSummaryCard danger">
              <span>Absent</span>
              <strong>{todayAttendance?.absent_count || 0}</strong>
            </div>
          </div>
        </div>
      </article>

      <article className="dashboard-panel dashboard-chartCard dashboard-chartCardFull">
        <div className="dashboard-cardHeader">
          <div>
            <h2>Student Distribution</h2>
            <p>Class-wise and course-wise active student mix</p>
          </div>
        </div>
        <div className="dashboard-distributionGrid">
          <div className="dashboard-distributionCard">
            <h3>Academic Classes</h3>
            <div className="dashboard-chartArea dashboard-chartAreaBottom">
              <Doughnut data={classData} options={distributionOptions} />
            </div>
          </div>
          <div className="dashboard-distributionCard">
            <h3>Courses</h3>
            <div className="dashboard-chartArea dashboard-chartAreaBottom">
              {courseDistribution.length ? (
                <Doughnut data={courseData} options={distributionOptions} />
              ) : (
                <div className="dashboard-empty">No active course-wise enrollments yet.</div>
              )}
            </div>
          </div>
        </div>
        <div className="dashboard-chartFootnotes">
          <span>This month fees: {currency(monthlyOverview.at(-1)?.collected_amount || 0)}</span>
          <span>New enrollments: {monthlyOverview.at(-1)?.new_enrollments || 0}</span>
        </div>
      </article>
    </section>
  );
};
