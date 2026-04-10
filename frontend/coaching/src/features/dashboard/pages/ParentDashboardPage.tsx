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
import { useI18n } from "../../../shared/i18n/I18nProvider";

export default function ParentDashboardPage() {
  const { t } = useI18n();
  const { data, isLoading } = useParentDashboardQuery();
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
          <h2 className="dashboard-username">{user?.name || data?.parent?.name || t("dashboard.parentDefaultName")}</h2>
          <p className="dashboard-description">
            {t("dashboard.parentHeroDesc")}
          </p>
        </div>
      </section>

      <section className="dashboard-stats dashboard-stats--studentParent">
        <StatCard
          accent="#2563eb"
          label="dashboard.children"
          value={data?.stats.total_children || 0}
          subvalue={t("dashboard.activeCount", { count: data?.stats.active_children || 0 })}
          icon={Users}
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
          subvalue={t("dashboard.dueItems", { count: data?.stats.pending_fee_count || 0 })}
          icon={IndianRupee}
        />
        <StatCard
          accent="#7c3aed"
          label="dashboard.upcomingExams"
          value={data?.stats.upcoming_exam_count || 0}
          subvalue={t("dashboard.recentResultsCount", { count: data?.recent_results?.length || 0 })}
          icon={ReceiptText}
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-stack">
          <Panel title="dashboard.childrenOverview" subtitle="dashboard.linkedStudents">
            {!data?.children?.length ? (
              <div className="dashboard-empty">{t("dashboard.noChildrenLinked")}</div>
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
                      {child.status === "active" ? t("dashboard.statusActive") : t("dashboard.statusInactive")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="dashboard.noticeBoard" subtitle="dashboard.recentUpdates">
            <NoticeList notices={data?.recent_notices} shortDate={shortDate} />
          </Panel>

          <Panel title="dashboard.upcomingHolidays" subtitle="dashboard.planAhead">
            <HolidayList holidays={data?.upcoming_holidays} shortDate={shortDate} />
          </Panel>
        </div>

        <div className="dashboard-stack">
          <Panel title="dashboard.upcomingExams" subtitle="dashboard.acrossChildren">
            <ExamList exams={data?.upcoming_exams} shortDate={shortDate} />
          </Panel>

          <Panel title="dashboard.results" subtitle="dashboard.latestResultUpdates">
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
        </div>
      </section>
    </div>
  );
}
