type ExamItem = {
  id: number;
  exam_name: string;
  subject: string;
  class: string;
  board?: string | null;
  exam_date: string;
  time?: string | null;
};

type Props = {
  exams?: ExamItem[];
  shortDate: (date: string) => string;
};

export const ExamList = ({ exams, shortDate }: Props) => {
  if (!exams?.length) {
    return <div className="dashboard-empty">No upcoming exams.</div>;
  }

  return (
    <div className="dashboard-list">
      {exams.map((exam) => (
        <div className="dashboard-listItem" key={exam.id}>
          <div>
            <div className="dashboard-listTitle">{exam.exam_name}</div>
            <div className="dashboard-listMeta">
              {exam.subject} | {exam.class} | {exam.board || "No board"}
            </div>
          </div>

          <div className="dashboard-listMeta">
            {shortDate(exam.exam_date)}
            {exam.time ? `, ${exam.time.slice(0, 5)}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
};