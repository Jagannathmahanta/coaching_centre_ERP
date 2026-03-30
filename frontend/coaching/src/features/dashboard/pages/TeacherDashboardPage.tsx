// features/dashboard/pages/TeacherDashboardPage.tsx

import { Panel } from "../components/Panel";
import { NoticeList } from "../components/NoticeList";
import { ExamList } from "../components/ExamList";
import { ResultList } from "../components/ResultList";

import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDownloadResult } from "../hooks/useDownloadResult";
import {  isNewBatch, shortDate } from "../../../shared/utils/format";
import { DashboardLayout } from "../components/DashboardLayout";

export default function TeacherDashboardPage() {
  const { data, isLoading } = useDashboardQuery();
  const { download } = useDownloadResult();

  if (isLoading) {
    return <div className="dashboard-panel">Loading...</div>;
  }

  return (
    <DashboardLayout
  left={
    <>
      <Panel title="Notice" subtitle="updates">
        <NoticeList notices={data?.recent_notices} shortDate={shortDate} />
      </Panel>

      <Panel title="Exams" subtitle="upcoming">
        <ExamList exams={data?.upcoming_exams} shortDate={shortDate} />
      </Panel>
    </>
  }
  right={
    <Panel title="Results" subtitle="Latest entries">
      <ResultList
        results={data?.recent_results}
        isNewBatch={isNewBatch}
        downloadResultBatch={download}
      />
    </Panel>
  }
/>
  );
}