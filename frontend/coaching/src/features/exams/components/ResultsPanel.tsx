import type { ChangeEvent } from "react";
import type { Exam, ResultDraft, RosterRow } from "../types/exams.types";
import { getPassFail, getResultFeedback, getResultPercentage } from "../utils/exams.utils";

type ResultsPanelProps = {
  activeTab: "manual" | "csv";
  classOptions: string[];
  drafts: Record<number, ResultDraft>;
  examOptions: Exam[];
  examValue: string;
  academicYearOptions: string[];
  loading: boolean;
  onCsvUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDraftChange: (studentId: number, field: keyof ResultDraft, value: string) => void;
  onExamChange: (examId: string) => void;
  onGenerateResult: () => void;
  onSaveResults: () => void;
  roster: RosterRow[];
  saving: boolean;
  searchValue: string;
  selectedExam: Exam;
  selectedAcademicYear: string;
  selectedClass: string;
  setSearchValue: (value: string) => void;
  setSelectedAcademicYear: (value: string) => void;
  setSelectedClass: (value: string) => void;
  setActiveTab: (tab: "manual" | "csv") => void;
};

export default function ResultsPanel({
  activeTab,
  classOptions,
  drafts,
  examOptions,
  examValue,
  academicYearOptions,
  loading,
  onCsvUpload,
  onDraftChange,
  onExamChange,
  onGenerateResult,
  onSaveResults,
  roster,
  saving,
  searchValue,
  selectedExam,
  selectedAcademicYear,
  selectedClass,
  setSearchValue,
  setSelectedAcademicYear,
  setSelectedClass,
  setActiveTab,
}: ResultsPanelProps) {
  return (
    <section className="exams-card exams-resultsCard">
      <div className="exams-cardHeader">
        <div>
          <h2>Manage Result</h2>
          <p>Select the exam, filter students, and update results in one section below.</p>
        </div>
        <div className="exams-badgeGroup">
          <span className="exams-badge">{selectedExam.max_marks || 100} marks</span>
          <span className="exams-badge">{selectedExam.pass_marks || 35} pass marks</span>
          <span className="exams-badge">{roster.length} students</span>
        </div>
      </div>

      <div className="exams-filterGrid">
        <label className="exams-field">
          <span>Exam</span>
          <select value={examValue} onChange={(event) => onExamChange(event.target.value)}>
            <option value="">Select exam</option>
            {examOptions.map((exam) => (
              <option key={exam.id} value={String(exam.id)}>
                {exam.exam_name}
              </option>
            ))}
          </select>
        </label>
        <label className="exams-field">
          <span>Class</span>
          <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
            <option value="">All classes</option>
            {classOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="exams-field">
          <span>Session</span>
          <select value={selectedAcademicYear} onChange={(event) => setSelectedAcademicYear(event.target.value)}>
            <option value="">All sessions</option>
            {academicYearOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="exams-field">
          <span>Student Search</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by student name or admission no"
          />
        </label>
      </div>

      <div className="exams-selectedInfo">
        <strong>{selectedExam.exam_name}</strong>
        <span>{selectedExam.subject}</span>
        <span>{selectedExam.class}</span>
        <span>{selectedExam.board || "No board"}</span>
        <span>{selectedExam.academic_year || "No year"}</span>
      </div>

      <div className="exams-tabs" role="tablist" aria-label="Result entry mode">
        <button
          className={`exams-tab ${activeTab === "manual" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveTab("manual")}
        >
          Manual Entry
        </button>
        <button
          className={`exams-tab ${activeTab === "csv" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveTab("csv")}
        >
          CSV Upload
        </button>
      </div>

      {activeTab === "csv" ? (
        <div className="exams-uploadPanel">
          <p className="exams-muted">
            Upload exam results by CSV. Supported columns: <code>student_id</code> or <code>roll_number</code>, <code>marks_obtained</code>, <code>grade</code>, <code>rank</code>, <code>status</code>, <code>remarks</code>.
          </p>
          <label className="exams-uploadBox">
            <span>Choose CSV file</span>
            <input type="file" accept=".csv" onChange={onCsvUpload} />
          </label>
          <div className="exams-uploadHint">
            Example row: <code>101,85,A,2,present,Good work</code>
          </div>
        </div>
      ) : (
        <>
          <p className="exams-muted">Enter student-wise results manually. Class column is hidden here to keep the table cleaner.</p>

          <div className="exams-tableWrap">
            <table className="exams-table exams-tableResults">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Rank</th>
                  <th>%</th>
                  <th>Pass / Fail</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="exams-empty" colSpan={9}>
                      Loading student roster...
                    </td>
                  </tr>
                )}
                {roster.map((row) => (
                  <tr key={row.student_id}>
                    <td>{row.roll_number || "-"}</td>
                    <td>
                      <strong>{row.student_name}</strong>
                    </td>
                    <td>
                      <select
                        value={drafts[row.student_id]?.status || "present"}
                        onChange={(event) => onDraftChange(row.student_id, "status", event.target.value)}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={String(selectedExam.max_marks || 100)}
                        value={drafts[row.student_id]?.marks_obtained || ""}
                        onChange={(event) => onDraftChange(row.student_id, "marks_obtained", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        value={drafts[row.student_id]?.grade || ""}
                        onChange={(event) => onDraftChange(row.student_id, "grade", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={drafts[row.student_id]?.rank || ""}
                        onChange={(event) => onDraftChange(row.student_id, "rank", event.target.value)}
                      />
                    </td>
                    <td>
                      <span className="exams-dataPill">
                        {getResultPercentage(drafts[row.student_id]?.marks_obtained, selectedExam.max_marks)}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const passFail = getPassFail(
                          drafts[row.student_id]?.status,
                          drafts[row.student_id]?.marks_obtained,
                          selectedExam.max_marks,
                          selectedExam.pass_marks
                        );

                        return (
                          <span className={`exams-dataPill ${passFail === "Pass" ? "is-pass" : passFail === "Fail" ? "is-fail" : ""}`}>
                            {passFail}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <span className="exams-feedbackBadge">
                        {getResultFeedback(
                          drafts[row.student_id]?.status,
                          drafts[row.student_id]?.marks_obtained,
                          selectedExam.max_marks
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && roster.length === 0 && (
                  <tr>
                    <td className="exams-empty" colSpan={9}>
                      No students found for this class, board, and academic year.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="exams-resultsFooter">
            <button className="exams-button exams-buttonSecondary" type="button" onClick={onGenerateResult}>
              Generate Result
            </button>
            <button className="exams-button exams-buttonPrimary" type="button" onClick={onSaveResults} disabled={saving}>
              {saving ? "Saving..." : "Save All Results"}
            </button>
          </div>
        </>
      )}

    </section>
  );
}
