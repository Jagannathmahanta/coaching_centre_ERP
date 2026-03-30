import { formatExamType, toLocaleDate } from "../exams.utils";
import type { Exam } from "../exams.types";

type ExamScheduleTableProps = {
  exams: Exam[];
  loading: boolean;
  onDelete: (examId: number) => void;
  onEdit: (exam: Exam) => void;
  selectedExamId: number | null;
};

export default function ExamScheduleTable({
  exams,
  loading,
  onDelete,
  onEdit,
  selectedExamId,
}: ExamScheduleTableProps) {
  return (
    <section className="exams-card">
      <div className="exams-cardHeader">
        <div>
          <h2>Exam Schedule</h2>
          <p>Create and manage monthly tests, unit tests, and final exams from here.</p>
        </div>
        <div className="exams-muted">Choose an exam to enter student results.</div>
      </div>

      {loading ? (
        <div className="exams-empty">Loading exams...</div>
      ) : (
        <div className="exams-tableWrap">
          <table className="exams-table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Type</th>
                <th>Class</th>
                <th>Board</th>
                <th>Date</th>
                <th>Time</th>
                <th>Results</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className={selectedExamId === exam.id ? "is-selected" : undefined}>
                  <td>
                    <strong>{exam.exam_name}</strong>
                    <div className="exams-subtle">{exam.subject}</div>
                  </td>
                  <td>{formatExamType(exam.exam_type)}</td>
                  <td>
                    <strong>{exam.class}</strong>
                    <div className="exams-subtle">{exam.academic_year || "-"}</div>
                  </td>
                  <td>{exam.board || "-"}</td>
                  <td>{toLocaleDate(exam.exam_date)}</td>
                  <td>{exam.time ? exam.time.slice(0, 5) : "-"}</td>
                  <td>{exam.results_count || 0}</td>
                  <td>
                    <div className="exams-inlineActions">
                      <button className="exams-button exams-buttonSecondary" type="button" onClick={() => onEdit(exam)}>
                        Edit
                      </button>
                      <button className="exams-button exams-buttonDanger" type="button" onClick={() => onDelete(exam.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td className="exams-empty" colSpan={8}>
                    No exams created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
