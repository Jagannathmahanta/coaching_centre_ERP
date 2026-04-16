import "./catalog.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle2, Layers3, Plus, Sparkles } from "lucide-react";
import { CatalogCourseSection } from "../components/CatalogCourseSection";
import { useCatalogAdmin } from "../hooks/useCatalogAdmin";
import { Button } from "../../../shared/components/Button";

export default function CatalogCoursesPage() {
  const navigate = useNavigate();
  const state = useCatalogAdmin();
  const [view, setView] = useState<"list" | "form">("list");
  const activeCount = state.courses.filter((item) => item.status === "active").length;
  const withDescriptionCount = state.courses.filter((item) => Boolean(item.description?.trim())).length;
  const linkedBatchCount = state.batches.filter((item) => item.program_type === "non_academic").length;
  const stats = [
    { label: "Total Courses", value: state.courses.length, tone: "blue", icon: BookOpen },
    { label: "Active Courses", value: activeCount, tone: "green", icon: CheckCircle2 },
    { label: "Detailed Profiles", value: withDescriptionCount, tone: "pink", icon: Sparkles },
    { label: "Course Batches", value: linkedBatchCount, tone: "violet", icon: Layers3 },
  ];

  return (
    <div className="catalogModule catalogModule--course">
      <section className="catalogHero catalogHero--course">
        <div>
          <h1>{view === "list" ? "Course Catalog" : state.courseForm.id ? "Edit Course" : "Add New Course"}</h1>
          <p>
            {view === "list"
              ? "Create and manage non-academic courses with clear descriptions and status tracking."
              : "Show the course form separately and return to the list with the back action."}
          </p>
        </div>
        <Button
  type="button"
  variant={view === "list" ? "primary" : "secondary"}
  onClick={() => {
    if (view === "form") {
      state.resetCourseForm();
      setView("list");
      return;
    }

    state.resetCourseForm();
    setView("form");
  }}
>
  {view === "list" ? <Plus size={18} style={{ marginRight: 6 }} /> : null}
  {view === "list" ? "Add Course" : "Back"}
</Button>
      </section>

      {state.error ? <div className="catalogPage__alert catalogPage__alert--error">{state.error}</div> : null}
      {state.message ? <div className="catalogPage__alert catalogPage__alert--success">{state.message}</div> : null}
      {state.loading ? <div className="catalogPage__loading">Loading courses...</div> : null}

      {!state.loading && view === "list" ? (
        <>
          <section className="catalogStatsGrid">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className={`catalogStatCard catalogStatCard--${item.tone}`}>
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

          <CatalogCourseSection
            mode="list"
            courses={state.courses}
            courseForm={state.courseForm}
            savingCourse={state.savingCourse}
            onSubmit={state.handleCourseSubmit}
            onChange={(updater) => state.setCourseForm((current) => updater(current))}
            onReset={state.resetCourseForm}
            onEdit={() => setView("form")}
            onAddBatch={(item) =>
              navigate("/batches", {
                state: {
                  sourceLabel: item.course_name,
                  courseId: item.id,
                  programType: "non_academic",
                  openForm: true,
                  backTo: "/courses",
                },
              })
            }
            onShowBatches={(item) =>
              navigate("/batches", {
                state: {
                  sourceLabel: item.course_name,
                  courseId: item.id,
                  programType: "non_academic",
                  backTo: "/courses",
                },
              })
            }
          />
        </>
      ) : null}

      {!state.loading && view === "form" ? (
        <CatalogCourseSection
          mode="form"
          courses={state.courses}
          courseForm={state.courseForm}
          savingCourse={state.savingCourse}
          formId="catalog-course-form"
          onSubmit={async (event) => {
            await state.handleCourseSubmit(event);
            setView("list");
          }}
          onChange={(updater) => state.setCourseForm((current) => updater(current))}
          onReset={() => {
            state.resetCourseForm();
            setView("list");
          }}
        />
      ) : null}
    </div>
  );
}
