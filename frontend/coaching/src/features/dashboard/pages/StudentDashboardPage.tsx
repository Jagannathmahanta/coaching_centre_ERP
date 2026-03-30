// features/dashboard/pages/StudentDashboardPage.tsx

import { Panel } from "../components/Panel";
import { NoticeList } from "../components/NoticeList";
import { ExamList } from "../components/ExamList";
import { ResultList } from "../components/ResultList";
import { PendingFeeTable } from "../components/PendingFeeTable";

import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDownloadResult } from "../hooks/useDownloadResult";
import { currency, isNewBatch, shortDate } from "../../../shared/utils/format";

import { DashboardLayout } from "../components/DashboardLayout";

export default function StudentDashboardPage() {
  const { data, isLoading } = useDashboardQuery();
  const { download } = useDownloadResult();

  if (isLoading) {
    return <div className="dashboard-panel">Loading...</div>;
  }

  return (
    <div className="dashboard-page">

      <DashboardLayout
        left={
          <>
            <Panel title="Notices" subtitle="Updates">
              <NoticeList notices={data?.recent_notices} shortDate={shortDate} />
            </Panel>

            <Panel title="Exams" subtitle="upcoming exams">
              <ExamList exams={data?.upcoming_exams} shortDate={shortDate} />
            </Panel>
          </>
        }
        right={
          <>
            <Panel title="Results" subtitle="performance">
              <ResultList
                results={data?.recent_results}
                isNewBatch={isNewBatch}
                downloadResultBatch={download}
              />
            </Panel>

            <Panel title="Fees" subtitle="pending dues">
              <PendingFeeTable
                fees={data?.pending_fees}
                shortDate={shortDate}
                currency={currency}
              />
            </Panel>
          </>
        }
      />

    </div>
  );
}