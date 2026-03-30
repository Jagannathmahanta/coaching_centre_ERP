
import { currency, isNewBatch, shortDate } from "../../../shared/utils/format";
import { ExamList } from "../components/ExamList";
import { HolidayList } from "../components/HolidayList";
import { NoticeList } from "../components/NoticeList";
import { Panel } from "../components/Panel";
import { PendingFeeTable } from "../components/PendingFeeTable";
import { ResultList } from "../components/ResultList";
import { StatCard } from "../components/StatCard";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDownloadResult } from "../hooks/useDownloadResult";
import "../styles/dashboard.css";

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboardQuery();
  const { download } = useDownloadResult();

  const stats = data?.stats;

  if (isLoading) {
    return <div className="dashboard-panel">Loading...</div>;
  }

  return (
    <div className="dashboard-page">

      {/* HERO */}
      <div className="dashboard-hero">
        <div>
          <h1>Command Center</h1>
          <p>
            Track notices, upcoming exams, recent results, holidays, and pending fee collections.
          </p>
        </div>
        <span className="dashboard-chip">
          Attendance block will come after attendance module
        </span>
      </div>

      {/* STATS */}
      <section className="dashboard-stats">
        <StatCard
          accent="#2563eb"
          label="Total Students"
          value={stats?.total_students || 0}
          subvalue={`${stats?.active_students || 0} active`}
        />

        <StatCard
          accent="#059669"
          label="Fees Collected"
          value={currency(stats?.collected_this_month || 0)}
          subvalue="Current month"
        />

        <StatCard
          accent="#d97706"
          label="Pending Fees"
          value={currency(stats?.pending_this_month || 0)}
          subvalue={`${stats?.pending_fee_count || 0} installments`}
        />

        <StatCard
          accent="#7c3aed"
          label="Upcoming Exams"
          value={stats?.upcoming_exam_count || 0}
          subvalue="Next 30 days"
        />

        <StatCard
          accent="#dc2626"
          label="Active Notices"
          value={stats?.active_notice_count || 0}
          subvalue={`${stats?.holiday_notice_count || 0} holidays`}
        />
      </section>

      {/* 🔥 IMPORTANT: GRID RESTORED */}
      <section className="dashboard-grid">

        {/* LEFT SIDE */}
        <div className="dashboard-stack">

          <Panel title="Notice Board" subtitle="Recent updates">
            <NoticeList notices={data?.recent_notices} shortDate={shortDate} />
          </Panel>

          <Panel title="Upcoming Exams" subtitle="Exam schedule">
            <ExamList exams={data?.upcoming_exams} shortDate={shortDate} />
          </Panel>

          <Panel title="Upcoming Holidays" subtitle="Holiday schedule">
            <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
          </Panel>

        </div>

        {/* RIGHT SIDE */}
        <div className="dashboard-stack">

          <Panel title="Recent Results" subtitle="Latest results">
            <ResultList
              results={data?.recent_results}
              isNewBatch={isNewBatch}
              downloadResultBatch={download}
            />
          </Panel>

          <Panel title="Pending Fees" subtitle="Dues list">
            <PendingFeeTable
              fees={data?.pending_fees}
              shortDate={shortDate}
              currency={currency}
            />
          </Panel>

        </div>

      </section>
    </div>
  );
}
