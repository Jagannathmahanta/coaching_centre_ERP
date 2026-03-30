type NoticeItem = {
  id: number;
  title: string;
  content: string;
  priority?: string | null;
  created_at: string;
};

type Props = {
  notices?: NoticeItem[];
  shortDate: (date: string) => string;
};

export const NoticeList = ({ notices, shortDate }: Props) => {
  if (!notices?.length) {
    return <div className="dashboard-empty">No notices posted yet.</div>;
  }

  return (
    <div className="dashboard-list">
      {notices.map((notice) => (
        <div className="dashboard-listItem" key={notice.id}>
          <div>
            <div className="dashboard-listTitle">{notice.title}</div>
            <div className="dashboard-listMeta">{notice.content}</div>
            <div className="dashboard-listMeta">
              Posted {shortDate(notice.created_at)}
            </div>
          </div>

          <span className={`dashboard-priority ${(notice.priority || "medium").toLowerCase()}`}>
            {notice.priority || "medium"}
          </span>
        </div>
      ))}
    </div>
  );
};