import "../components/ExamsPage.css";
import ExamFormPanel from "../components/ExamFormPanel";
import { createInitialExamForm } from "../components/exams.constants";
import ExamScheduleTable from "../components/ExamScheduleTable";
import ResultsPanel from "../components/ResultsPanel";
import { useExamsData } from "../hooks/useExamsData";

export default function ExamsPage() {
  const state = useExamsData();

  return (
    <div className="exams-page">
      <div className="exams-header">
        <div>
          <h1>Exams</h1>
          <p>Create exams, schedule them by class and subject, and enter results student-wise by manual form or CSV upload.</p>
        </div>
        <button
          className="exams-button exams-buttonPrimary"
          type="button"
          onClick={() => {
            state.setEditingExamId(null);
            state.setExamForm(createInitialExamForm());
            state.setOpenForm((current) => !current);
          }}
        >
          {state.openForm ? "Back" : "+ Create Exam"}
        </button>
      </div>

      {state.message && <div className="exams-message exams-messageSuccess">{state.message}</div>}
      {state.error && <div className="exams-message exams-messageError">{state.error}</div>}

      {state.openForm && (
        <ExamFormPanel
          classOptions={state.classOptions}
          editingExamId={state.editingExamId}
          examForm={state.examForm}
          onCancel={state.resetExamForm}
          onSubmit={state.handleSaveExam}
          setExamForm={state.setExamForm}
        />
      )}

      <ExamScheduleTable
        exams={state.exams}
        loading={state.examsQuery.isLoading}
        onDelete={state.handleDeleteExam}
        onEdit={state.handleEditExam}
        selectedExamId={state.selectedExamId}
      />

      {state.selectedExamSummary && (
        <ResultsPanel
          activeTab={state.resultsTab}
          academicYearOptions={state.academicYearOptions}
          classOptions={state.classOptions}
          drafts={state.drafts as any}
          examOptions={state.filteredExamOptions}
          examValue={state.selectedExamId ? String(state.selectedExamId) : ""}
          loading={state.rosterQuery.isLoading}
          onCsvUpload={state.handleCsvUpload}
          onDraftChange={state.handleDraftChange}
          onExamChange={(examId) => {
            state.setSelectedExamId(examId ? Number(examId) : null);
            state.setStudentSearch("");
          }}
          onGenerateResult={state.handleGenerateResult}
          onSaveResults={() => state.saveResultsMutation.mutate()}
          roster={state.filteredRoster}
          saving={state.saveResultsMutation.isPending}
          searchValue={state.studentSearch}
          selectedExam={state.selectedExamSummary}
          selectedAcademicYear={state.selectedAcademicYearFilter}
          selectedClass={state.selectedClassFilter}
          setSearchValue={state.setStudentSearch}
          setSelectedAcademicYear={state.setSelectedAcademicYearFilter}
          setSelectedClass={state.setSelectedClassFilter}
          setActiveTab={state.setResultsTab}
        />
      )}
    </div>
  );
}
