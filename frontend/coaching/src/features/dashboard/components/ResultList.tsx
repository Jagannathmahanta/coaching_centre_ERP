import { useNavigate } from "react-router-dom";

type ResultItem = {
  exam_id: number;
  exam_name: string;
  subject: string;
  class: string;
  last_result_at?: string | null;
};

type Props = {
  results?: ResultItem[];
  isNewBatch: (date?: string | null) => boolean;
  downloadResultBatch: (examId: number) => void;
};

export const ResultList = ({
  results,
  isNewBatch,
  downloadResultBatch,
}: Props) => {
  const navigate = useNavigate();

  if (!results?.length) {
    return <div className="dashboard-empty">No recent result batches yet.</div>;
  }

  return (
    <div className="dashboard-list">
      {results.map((item, index) => (
        <div className="dashboard-listItem" key={`${item.exam_id}-${index}`}>
          <div>
            <div className="dashboard-listTitle">{item.exam_name}</div>
            <div className="dashboard-listMeta">
              {item.class} | {item.subject}
            </div>
          </div>

          <div className="dashboard-resultActions">
            {isNewBatch(item.last_result_at) && (
              <span className="dashboard-badge new">New</span>
            )}

            <button
              className="dashboard-actionLink"
              onClick={() => downloadResultBatch(item.exam_id)}
            >
              Download Result
            </button>

            <button
              className="dashboard-actionLink secondary"
              onClick={() => navigate("/exams")}
            >
              Open
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};