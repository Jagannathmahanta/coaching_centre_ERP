import "./catalog.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Layers3, Plus, Timer, Users2 } from "lucide-react";
import { CatalogBatchSection } from "../components/CatalogBatchSection";
import { useCatalogAdmin } from "../hooks/useCatalogAdmin";
import { initialBatchForm } from "../types/catalog-admin.types";
import { Button } from "../../../shared/components/Button";

type BatchRouteState = {
  sourceLabel?: string;
  backTo?: string;
  classId?: number;
  courseId?: number;
  programType?: "academic" | "non_academic";
  openForm?: boolean;
};

export default function CatalogBatchesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state || {}) as BatchRouteState;
  const state = useCatalogAdmin();
  const [showForm, setShowForm] = useState(Boolean(routeState.openForm));
  const [batchTypeFilter, setBatchTypeFilter] = useState<"all" | "academic" | "non_academic">(
    routeState.programType || "all",
  );

  useEffect(() => {
    if (!routeState.openForm) return;

    state.setBatchForm({
      ...initialBatchForm,
      program_type: routeState.programType || initialBatchForm.program_type,
      class_id: routeState.classId ? String(routeState.classId) : "",
      course_id: routeState.courseId ? String(routeState.courseId) : "",
    });
  }, [routeState.classId, routeState.courseId, routeState.openForm, routeState.programType, state.setBatchForm]);

  const activeCount = state.batches.filter((item) => item.status === "active").length;
  const academicCount = state.batches.filter((item) => item.program_type === "academic").length;
  const nonAcademicCount = state.batches.length - academicCount;
  const capacityCount = state.batches.reduce((total, item) => total + (item.capacity || 0), 0);

  const formatBatchTime = (value?: string) => {
    if (!value) return "-";
    const [hourString, minuteString] = value.split(":");
    const hour = Number(hourString);
    const minute = Number(minuteString || "0");
    const suffix = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}${minute > 0 ? `:${minute.toString().padStart(2, "0")}` : ""} ${suffix}`;
  };

  const visibleBatches = state.batches.filter((item) => {
    if (routeState.programType && item.program_type !== routeState.programType) return false;
    if (routeState.classId && item.class_id !== routeState.classId) return false;
    if (routeState.courseId && item.course_id !== routeState.courseId) return false;
    if (batchTypeFilter !== "all" && item.program_type !== batchTypeFilter) return false;
    return true;
  });

  const stats = [
    { label: "Active Batches", value: activeCount, tone: "green", icon: CheckCircle2 },
    { label: "Academic", value: academicCount, tone: "blue", icon: Layers3 },
    { label: "Course Batches", value: nonAcademicCount, tone: "amber", icon: Timer },
    { label: "Total Capacity", value: capacityCount, tone: "violet", icon: Users2 },
  ];

  return (
    <div className="catalogModule catalogModule--batch">
      <section className="catalogHero catalogHero--batch">
        <div>
          <h1>
            {showForm
              ? state.batchForm.id
                ? "Edit Batch"
                : "Add Batch"
              : routeState.sourceLabel
                ? `${routeState.sourceLabel} Batches`
                : "All Batches"}
          </h1>
          <p>
            {showForm
              ? "Configure the batch and return to the list with the back action."
              : "Track timings, capacity, and status for every active class and course batch."}
          </p>
        </div>

      <Button
  type="button"
  onClick={() => {
    if (showForm) {
      state.resetBatchForm();
      if (routeState.backTo) {
        navigate(routeState.backTo);
        return;
      }
      setShowForm(false);
      return;
    }

    if (routeState.backTo) {
      navigate(routeState.backTo);
      return;
    }

    state.resetBatchForm();
    setShowForm(true);
  }}
  
>
  {!showForm && !routeState.backTo ? <Plus size={18} style={{ marginRight: 6 }} /> : null}
  {showForm ? "Back to Batches" : routeState.backTo ? "Back" : "Add Batch"}
</Button>
      </section>

      {state.error && <div className="catalogPage__alert catalogPage__alert--error">{state.error}</div>}
      {state.message && <div className="catalogPage__alert catalogPage__alert--success">{state.message}</div>}
      {state.loading && <div className="catalogPage__loading catalogPage__loading--dark">Loading batches...</div>}

      {!state.loading && !showForm ? (
        <>
          <section className="catalogStatsGrid">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className={`catalogStatCard catalogStatCard--batch catalogStatCard--${item.tone}`}>
                  <div className="catalogStatCard__icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="catalogBatchBoard">
            <div className="catalogBatchBoard__toolbar">
              <div className="catalogBatchBoard__title">
                <h2>{routeState.sourceLabel ? `${routeState.sourceLabel} Batches` : "All Batches"}</h2>
              </div>
              <div className="catalogBatchBoard__filters">
                <button
                  type="button"
                  className={`catalogBatchFilterBtn ${batchTypeFilter === "all" ? "active" : ""}`}
                  onClick={() => setBatchTypeFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`catalogBatchFilterBtn ${batchTypeFilter === "academic" ? "active" : ""}`}
                  onClick={() => setBatchTypeFilter("academic")}
                >
                  Academic
                </button>
                <button
                  type="button"
                  className={`catalogBatchFilterBtn ${batchTypeFilter === "non_academic" ? "active" : ""}`}
                  onClick={() => setBatchTypeFilter("non_academic")}
                >
                  Non-Academic
                </button>
              </div>
              <div className="catalogBatchBoard__filterSelect">
                <label>
                  <span>Type</span>
                  <select
                    value={batchTypeFilter}
                    onChange={(event) => setBatchTypeFilter(event.target.value as "all" | "academic" | "non_academic")}
                  >
                    <option value="all">All</option>
                    <option value="academic">Academic</option>
                    <option value="non_academic">Non-Academic</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="catalogBatchTableWrapper">
              <div className="catalogTableV2">
                <div className="catalogTableV2__head">
                <span>SL No</span>
                <span>Batch Name</span>
                <span>Course</span>
                <span>Type</span>
                <span>Timing</span>
                <span>Capacity</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {visibleBatches.map((item, index) => {
                const capacity = item.capacity || 0;
                const filled = item.enrolled_count || 0;
                const percent = capacity ? Math.min((filled / capacity) * 100, 100) : 0;

                return (
                  <div key={item.id} className="catalogTableV2__row">
                    <div>{index + 1}</div>

                    <div className="catalogTableV2__cell catalogTableV2__name">
                      <div>
                        <strong>{item.batch_name}</strong>
                        <p>ID: #{item.id}</p>
                      </div>
                    </div>

                    <div>{item.program_type === "academic" ? item.class_name : item.course_name}</div>

                    <div>{item.program_type === "academic" ? "Academic" : "Non-Academic"}</div>

                    <div className="catalogTableV2__timing">
                      <span>⏱ {formatBatchTime(item.start_time)} to {formatBatchTime(item.end_time)}</span>
                      <p>{item.shift}</p>
                    </div>

                    <div className="catalogTableV2__capacity">
                      <div className="progressBar">
                        <div className="progressBar__fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span>
                        {filled}/{capacity}
                      </span>
                    </div>

                    <div>
                      <span className={`statusBadge statusBadge--${item.status}`}>{item.status}</span>
                    </div>

                    <div className="catalogActionBtns">
                      <button
                        type="button"
                        className="catalogActionBtn"
                        onClick={() => {
                          state.setBatchForm({
                            id: item.id,
                            program_type: item.program_type,
                            board: item.board || "CBSE",
                            class_id: item.class_id ? String(item.class_id) : "",
                            course_id: item.course_id ? String(item.course_id) : "",
                            shift: item.shift,
                            batch_name: item.batch_name,
                            start_time: item.start_time,
                            end_time: item.end_time,
                            capacity: item.capacity ? String(item.capacity) : "",
                            status: item.status,
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="catalogActionBtn catalogActionBtn--danger"
                        onClick={() => {
                          if (!window.confirm("Delete this batch?")) return;
                          window.alert("Delete is not available in this view yet.");
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </section>
        </>
      ) : null}

      {!state.loading && showForm ? (
        <CatalogBatchSection
          batchForm={state.batchForm}
          activeClasses={state.activeClasses}
          activeCourses={state.activeCourses}
          savingBatch={state.savingBatch}
          formId="catalog-batch-form"
          onSubmit={async (event) => {
            await state.handleBatchSubmit(event);
            state.resetBatchForm();
            if (routeState.backTo) {
              navigate(routeState.backTo);
              return;
            }
            setShowForm(false);
          }}
          onChange={(updater) => state.setBatchForm((current) => updater(current))}
          onReset={() => {
            state.resetBatchForm();
            if (routeState.backTo) {
              navigate(routeState.backTo);
              return;
            }
            setShowForm(false);
          }}
        />
      ) : null}
    </div>
  );
}
