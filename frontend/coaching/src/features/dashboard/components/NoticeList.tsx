import { FileText } from "lucide-react";
import { useI18n } from "../../../shared/i18n/I18nProvider";

type NoticeItem = {
  id: number;
  title: string;
  content: string;
  priority?: string | null;
  created_at: string;
};

type ExamItem = {
  id: number;
  exam_name: string;
  subject: string;
  class: string;
  board?: string | null;
  exam_date: string;
  time?: string | null;
};

type ResultItem = {
  exam_id: number;
  exam_name: string;
  subject: string;
  class: string;
  last_result_at?: string | null;
};

type Props = {
  notices?: NoticeItem[];
  exams?: ExamItem[];
  results?: ResultItem[];
  shortDate: (date: string) => string;
  isNewBatch?: (date?: string | null) => boolean;
  downloadResultBatch?: (examId: number) => void;
};

type FeedItem =
  | {
      kind: "notice";
      id: string;
      title: string;
      description: string;
      meta: string;
      priority: string;
      timestamp: number;
    }
  | {
      kind: "exam";
      id: string;
      title: string;
      description: string;
      meta: string;
      timestamp: number;
    }
  | {
      kind: "result";
      id: string;
      title: string;
      description: string;
      meta: string;
      timestamp: number;
      examId: number;
      isNew: boolean;
    };

export const NoticeList = ({
  notices,
  exams,
  results,
  shortDate,
  isNewBatch,
  downloadResultBatch,
}: Props) => {
  const { t } = useI18n();
  const feed: FeedItem[] = [
    ...(notices || []).map((notice) => ({
      kind: "notice" as const,
      id: `notice-${notice.id}`,
      title: notice.title,
      description: notice.content,
      meta: t("dashboard.posted", { date: shortDate(notice.created_at) }),
      priority: (notice.priority || "medium").toLowerCase(),
      timestamp: new Date(notice.created_at).getTime(),
    })),
    ...(exams || []).map((exam) => ({
      kind: "exam" as const,
      id: `exam-${exam.id}`,
      title: exam.exam_name,
      description: `${exam.subject} | ${exam.class} | ${exam.board || t("dashboard.noBoard")}`,
      meta: `${shortDate(exam.exam_date)}${exam.time ? `, ${exam.time.slice(0, 5)}` : ""}`,
      timestamp: new Date(exam.exam_date).getTime(),
    })),
    ...(results || []).map((result, index) => ({
      kind: "result" as const,
      id: `result-${result.exam_id}-${index}`,
      title: result.exam_name,
      description: `${result.class} | ${result.subject}`,
      meta: result.last_result_at ? t("dashboard.publishedLabel", { date: shortDate(result.last_result_at) }) : t("dashboard.recentlyPublished"),
      timestamp: result.last_result_at ? new Date(result.last_result_at).getTime() : 0,
      examId: result.exam_id,
      isNew: isNewBatch ? isNewBatch(result.last_result_at) : false,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  if (!feed.length) {
    return <div className="dashboard-empty">{t("dashboard.noRecentFeed")}</div>;
  }

  return (
    <div className="dashboard-list">
      {feed.map((item) => (
        <div className="dashboard-listItem" key={item.id}>
          <div>
            {item.kind === "result" ? (
              <>
                <div className="dashboard-resultDate">{item.meta}</div>
                <div className="dashboard-listTitle dashboard-listTitle--result">{item.title}</div>
                <div className="dashboard-listMeta">{item.description}</div>
              </>
            ) : (
              <>
                <div className="dashboard-listTitle">{item.title}</div>
                <div className="dashboard-listMeta">{item.description}</div>
                <div className="dashboard-listMeta">{item.meta}</div>
              </>
            )}
          </div>

          {item.kind === "notice" ? (
            <span className={`dashboard-priority ${item.priority}`}>{t(`notice.${item.priority}`)}</span>
          ) : null}

          {item.kind === "exam" ? (
            <span className="dashboard-badge">{t("dashboard.examBadge")}</span>
          ) : null}

          {item.kind === "result" ? (
            <div className="dashboard-resultActions">
              {item.isNew ? (
                <span className="dashboard-resultNewWrap">
                  <FileText size={16} className="dashboard-resultPdfIcon" />
                  <span className="dashboard-badge newBatch">{t("dashboard.new")}</span>
                </span>
              ) : null}
              {downloadResultBatch ? (
                <button
                  className="dashboard-actionLink dashboard-actionLink--text"
                  onClick={() => downloadResultBatch(item.examId)}
                >
                  {t("dashboard.download")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};
