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
import { useI18n } from "../../../shared/i18n/I18nProvider";

export default function StudentDashboardPage() {
  const { t } = useI18n();
  const { data, isLoading } = useStudentDashboardQuery();
  const { download } = useDownloadResult();
  const user = getUser();

  if (isLoading) {
    return <div className="dashboard-panel">{t("dashboard.loading")}</div>;
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <h1 className="dashboard-greeting">{getGreeting()}</h1>
          <h2 className="dashboard-username">{user?.name || data?.student?.name || t("dashboard.studentDefaultName")}</h2>
          <p className="dashboard-description">
            {t("dashboard.studentHeroDesc")}
          </p>
        </div>
      </section>

      <section className="dashboard-stats dashboard-stats--studentParent">
        <StatCard
          accent="#2563eb"
          label="dashboard.class"
          value={data?.student?.class || "-"}
          subvalue={data?.student?.roll_number ? t("dashboard.rollLabel", { roll: data.student.roll_number }) : "dashboard.currentClass"}
          icon={BookCheck}
        />
        <StatCard
          accent="#16a34a"
          label="dashboard.todayAttendance"
          value={`${data?.analytics.today_attendance.present_percentage || 0}%`}
          subvalue={t("dashboard.presentToday", { count: data?.analytics.today_attendance.present_count || 0 })}
          icon={CalendarDays}
        />
        <StatCard
          accent="#ea580c"
          label="dashboard.pendingFees"
          value={currency(data?.stats.pending_amount || 0)}
          subvalue={t("dashboard.dues", { count: data?.stats.pending_fee_count || 0 })}
          icon={IndianRupee}
        />
        <StatCard
          accent="#7c3aed"
          label="dashboard.recentResults"
          value={data?.stats.recent_result_count || 0}
          subvalue={t("dashboard.upcomingExamsCount", { count: data?.stats.upcoming_exam_count || 0 })}
          icon={ReceiptText}
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel title="dashboard.noticeBoard" subtitle="dashboard.recentUpdates">
            <NoticeList notices={data?.recent_notices} shortDate={shortDate} />
          </Panel>

          <Panel title="dashboard.upcomingExams" subtitle="dashboard.classSchedule">
            <ExamList exams={data?.upcoming_exams} shortDate={shortDate} />
          </Panel>

          <Panel title="dashboard.upcomingHolidays" subtitle="dashboard.planAhead">
            <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
          </Panel>
        </div>

        <div className="dashboard-stack">
          <Panel title="dashboard.results" subtitle="dashboard.latestUpdates">
            <ResultList
              results={data?.recent_results}
              isNewBatch={isNewBatch}
              downloadResultBatch={download}
            />
          </Panel>

          <Panel title="dashboard.feeStatus" subtitle="dashboard.pendingDues">
            <PendingFeeTable
              fees={data?.pending_fees}
              shortDate={shortDate}
              currency={currency}
              showAction={false}
            />
          </Panel>

          <Panel title="dashboard.attendanceThisMonth" subtitle="dashboard.currentMonthSummary">
            <div className="dashboard-list">
              <div className="dashboard-listItem">
                <div>
                  <div className="dashboard-listTitle">{t("dashboard.present")}</div>
                  <div className="dashboard-listMeta">{t("dashboard.presentMonthDesc")}</div>
                </div>
                <strong>{data?.analytics.month_attendance.present_count || 0}</strong>
              </div>
              <div className="dashboard-listItem">
                <div>
                  <div className="dashboard-listTitle">{t("dashboard.absent")}</div>
                  <div className="dashboard-listMeta">{t("dashboard.absentMonthDesc")}</div>
                </div>
                <strong>{data?.analytics.month_attendance.absent_count || 0}</strong>
              </div>
              <div className="dashboard-listItem">
                <div>
                  <div className="dashboard-listTitle">{t("dashboard.leave")}</div>
                  <div className="dashboard-listMeta">{t("dashboard.leaveMonthDesc")}</div>
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
