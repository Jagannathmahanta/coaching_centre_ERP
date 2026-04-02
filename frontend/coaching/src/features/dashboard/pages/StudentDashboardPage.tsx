import { BookCheck, CalendarDays, IndianRupee, ReceiptText } from "lucide-react";
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
import { useStudentDashboardQuery } from "../hooks/useStudentDashboardQuery";
import "../styles/dashboard.css";

export default function StudentDashboardPage() {
  const { data, isLoading } = useStudentDashboardQuery();
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
          <h2 className="dashboard-username">{user?.name || data?.student?.name || "Student"}</h2>
          <p className="dashboard-description">
            Stay on top of your attendance, upcoming exams, results, notices, holidays, and pending fee reminders from one place.
          </p>
        </div>
      </section>

      <section className="dashboard-stats dashboard-stats--studentParent">
        <StatCard
          accent="#2563eb"
          label="Class"
          value={data?.student?.class || "-"}
          subvalue={data?.student?.roll_number ? `Roll ${data.student.roll_number}` : "Current class"}
          icon={BookCheck}
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
          subvalue={`${data?.stats.pending_fee_count || 0} dues`}
          icon={IndianRupee}
        />
        <StatCard
          accent="#7c3aed"
          label="Recent Results"
          value={data?.stats.recent_result_count || 0}
          subvalue={`${data?.stats.upcoming_exam_count || 0} upcoming exams`}
          icon={ReceiptText}
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel title="Notice Board" subtitle="Recent updates">
            <NoticeList notices={data?.recent_notices} shortDate={shortDate} />
          </Panel>

          <Panel title="Upcoming Exams" subtitle="Your class schedule">
            <ExamList exams={data?.upcoming_exams} shortDate={shortDate} />
          </Panel>

          <Panel title="Upcoming Holidays" subtitle="Plan ahead">
            <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
          </Panel>
        </div>

        <div className="dashboard-stack">
          <Panel title="Results" subtitle="Latest updates">
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

          <Panel title="Attendance This Month" subtitle="Your current month summary">
            <div className="dashboard-list">
              <div className="dashboard-listItem">
                <div>
                  <div className="dashboard-listTitle">Present</div>
                  <div className="dashboard-listMeta">Marked present this month</div>
                </div>
                <strong>{data?.analytics.month_attendance.present_count || 0}</strong>
              </div>
              <div className="dashboard-listItem">
                <div>
                  <div className="dashboard-listTitle">Absent</div>
                  <div className="dashboard-listMeta">Marked absent this month</div>
                </div>
                <strong>{data?.analytics.month_attendance.absent_count || 0}</strong>
              </div>
              <div className="dashboard-listItem">
                <div>
                  <div className="dashboard-listTitle">Leave</div>
                  <div className="dashboard-listMeta">Approved leave / leave marked</div>
                </div>
                <strong>{data?.analytics.month_attendance.leave_count || 0}</strong>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
