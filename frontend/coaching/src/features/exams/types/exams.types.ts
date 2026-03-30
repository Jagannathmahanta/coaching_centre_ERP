import type { Exam, RosterRow } from "../../../modules/exams/exams.types";

export type { Exam, ExamFormState, FeeStructureOption, ResultDraft, RosterRow } from "../../../modules/exams/exams.types";

export type RosterResponse = {
  exam: Exam | null;
  students: RosterRow[];
};
