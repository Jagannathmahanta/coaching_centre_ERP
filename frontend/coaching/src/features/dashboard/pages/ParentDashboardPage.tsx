import { CalendarDays, IndianRupee, ReceiptText, Users } from "lucide-react";
import getGreeting from "../../../shared/utils/greeting";
import { currency, isNewBatch, shortDate } from "../../../shared/utils/format";
import { getUser } from "../../../shared/services/auth";
import { HolidayList } from "../components/HolidayList";
import { NoticeList } from "../components/NoticeList";
import { ExamList } from "../components/ExamList";
import { ResultList } from "../components/ResultList";
import { PendingFeeTable } from "../components/PendingFeeTable";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import { useDownloadResult } from "../hooks/useDownloadResult";
import { useParentDashboardQuery } from "../hooks/useParentDashboardQuery";
import "../styles/dashboard.css";

export default function ParentDashboardPage() {
  const { data, isLoading } = useParentDashboardQuery();
  const { download } = useDownloadResult();
  const user = getUser();

  if (isLoading) {
    return <div className="dashboard-panel">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <h1 className="dashboard-greeting">{getGreeting()}</h1>
          <h2 className="dashboard-username">{user?.name || data?.parent?.name || "Parent"}</h2>
          <p className="dashboard-description">
            Track your children&apos;s attendance, exams, results, notices, holidays, and fee status in one dashboard.
          </p>
        </div>
      </section>

      <section className="dashboard-stats dashboard-stats--studentParent">
        <StatCard
          accent="#2563eb"
          label="Children"
          value={data?.stats.total_children || 0}
          subvalue={`${data?.stats.active_children || 0} active`}
          icon={Users}
        />
        <StatCard
          accent="#16a34a"
          label="Today Attendance"
          value={`${data?.analytics.today_attendance.present_percentage || 0}%`}
          subvalue={`${data?.analytics.today_attendance.present_count || 0} present today`}
          icon={CalendarDays}
        />
        <StatCard
          accent="#ea580c"
          label="Pending Fees"
          value={currency(data?.stats.pending_amount || 0)}
          subvalue={`${data?.stats.pending_fee_count || 0} due items`}
          icon={IndianRupee}
        />
        <StatCard
          accent="#7c3aed"
          label="Upcoming Exams"
          value={data?.stats.upcoming_exam_count || 0}
          subvalue={`${data?.recent_results?.length || 0} recent results`}
          icon={ReceiptText}
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel title="Children Overview" subtitle="Linked students">
            {!data?.children?.length ? (
              <div className="dashboard-empty">No children linked to this parent account yet.</div>
            ) : (
              <div className="dashboard-list">
                {data.children.map((child) => (
                  <div className="dashboard-listItem" key={child.id}>
                    <div>
                      <div className="dashboard-listTitle">{child.name}</div>
                      <div className="dashboard-listMeta">
                        {child.class}
                        {child.roll_number ? ` | ${child.roll_number}` : ""}
                      </div>
                    </div>
                    <span className={`dashboard-badge ${child.status === "active" ? "newBatch" : ""}`}>
                      {child.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Notice Board" subtitle="Recent updates">
            <NoticeList notices={data?.recent_notices} shortDate={shortDate} />
          </Panel>

          <Panel title="Upcoming Holidays" subtitle="Plan ahead">
            <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
          </Panel>
        </div>

        <div className="dashboard-stack">
          <Panel title="Upcoming Exams" subtitle="Across your children">
            <ExamList exams={data?.upcoming_exams} shortDate={shortDate} />
          </Panel>

          <Panel title="Results" subtitle="Latest result updates">
            <ResultList
              results={data?.recent_results}
              isNewBatch={isNewBatch}
              downloadResultBatch={download}
            />
          </Panel>

          <Panel title="Fee Status" subtitle="Pending dues">
            <PendingFeeTable
              fees={data?.pending_fees}
              shortDate={shortDate}
              currency={currency}
              showAction={false}
            />
          </Panel>
        </div>
      </section>
    </div>
  );
}
