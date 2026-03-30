import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { boardOptions, examTypeOptions } from "./exams.constants";
import type { ExamFormState } from "../types/exams.types";

type ExamFormPanelProps = {
  classOptions: string[];
  editingExamId: number | null;
  examForm: ExamFormState;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setExamForm: Dispatch<SetStateAction<ExamFormState>>;
};

export default function ExamFormPanel({
  classOptions,
  editingExamId,
  examForm,
  onCancel,
  onSubmit,
  setExamForm,
}: ExamFormPanelProps) {
  return (
    <form className="exams-card exams-form" onSubmit={onSubmit}>
      <div className="exams-cardHeader">
        <div>
          <h2>{editingExamId ? "Edit exam" : "Create exam"}</h2>
          <p>Set the exam type, subject, class, marks, and exam timing in one place.</p>
        </div>
        <button className="exams-button exams-buttonSecondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="exams-formGrid exams-formGrid--three">
        <Field label="Exam Name">
          <input
            value={examForm.exam_name}
            onChange={(event) => setExamForm((current) => ({ ...current, exam_name: event.target.value }))}
            placeholder="Monthly Maths Test"
            required
          />
        </Field>
        <Field label="Exam Type">
          <select
            value={examForm.exam_type}
            onChange={(event) => setExamForm((current) => ({ ...current, exam_type: event.target.value }))}
          >
            {examTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subject">
          <input
            value={examForm.subject}
            onChange={(event) => setExamForm((current) => ({ ...current, subject: event.target.value }))}
            placeholder="Mathematics"
            required
          />
        </Field>
      </div>

      <div className="exams-formGrid exams-formGrid--three">
        <Field label="Class">
          <select
            value={examForm.class}
            onChange={(event) => setExamForm((current) => ({ ...current, class: event.target.value }))}
            required
          >
            <option value="">Select class</option>
            {classOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Board">
          <select
            value={examForm.board}
            onChange={(event) => setExamForm((current) => ({ ...current, board: event.target.value }))}
          >
            {boardOptions.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Academic Year">
          <input
            value={examForm.academic_year}
            onChange={(event) => setExamForm((current) => ({ ...current, academic_year: event.target.value }))}
            placeholder="2026-2027"
          />
        </Field>
      </div>

      <div className="exams-formGrid exams-formGrid--four">
        <Field label="Exam Date">
          <input
            type="date"
            value={examForm.exam_date}
            onChange={(event) => setExamForm((current) => ({ ...current, exam_date: event.target.value }))}
            required
          />
        </Field>
        <Field label="Time">
          <input
            type="time"
            value={examForm.time}
            onChange={(event) => setExamForm((current) => ({ ...current, time: event.target.value }))}
          />
        </Field>
        <Field label="Duration">
          <input
            value={examForm.duration}
            onChange={(event) => setExamForm((current) => ({ ...current, duration: event.target.value }))}
            placeholder="1 hr"
          />
        </Field>
        <Field label="Max Marks">
          <input
            type="number"
            min="1"
            value={examForm.max_marks}
            onChange={(event) => setExamForm((current) => ({ ...current, max_marks: event.target.value }))}
          />
        </Field>
      </div>

      <div className="exams-formGrid exams-formGrid--two">
        <Field label="Pass Marks">
          <input
            type="number"
            min="1"
            value={examForm.pass_marks}
            onChange={(event) => setExamForm((current) => ({ ...current, pass_marks: event.target.value }))}
          />
        </Field>
        <div />
      </div>

      <div className="exams-formGrid exams-formGrid--two">
        <Field label="Examiner">
          <input
            value={examForm.examiner}
            onChange={(event) => setExamForm((current) => ({ ...current, examiner: event.target.value }))}
            placeholder="Teacher name"
          />
        </Field>
        <Field label="Hall / Room">
          <input
            value={examForm.hall}
            onChange={(event) => setExamForm((current) => ({ ...current, hall: event.target.value }))}
            placeholder="Room 12"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          rows={3}
          value={examForm.notes}
          onChange={(event) => setExamForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Add exam instructions or syllabus coverage"
        />
      </Field>

      <div className="exams-formActions">
        <button className="exams-button exams-buttonPrimary" type="submit">
          {editingExamId ? "Update Exam" : "Save Exam"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="exams-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
