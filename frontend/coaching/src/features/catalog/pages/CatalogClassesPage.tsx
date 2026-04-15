import "./catalog.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarRange, CheckCircle2, Clock3, Plus, Presentation } from "lucide-react";
import { CatalogClassSection } from "../components/CatalogClassSection";
import { useCatalogAdmin } from "../hooks/useCatalogAdmin";

export default function CatalogClassesPage() {
  const navigate = useNavigate();
  const state = useCatalogAdmin();
  const [view, setView] = useState<"list" | "form">("list");
  const activeCount = state.classes.filter((item) => item.status === "active").length;
  const inactiveCount = state.classes.length - activeCount;
  const linkedBatchCount = state.batches.filter((item) => item.program_type === "academic").length;
  const stats = [
    { label: "Total Classes", value: state.classes.length, tone: "indigo", icon: Presentation },
    { label: "Active", value: activeCount, tone: "green", icon: CheckCircle2 },
    { label: "Inactive", value: inactiveCount, tone: "amber", icon: Clock3 },
    { label: "Academic Batches", value: linkedBatchCount, tone: "violet", icon: CalendarRange },
  ];

  return (
    <div className="catalogModule catalogModule--light">
      <section className="catalogHero">
        <div>
          <h1>{view === "list" ? "Class Schedule" : state.classForm.id ? "Edit Class" : "Add New Class"}</h1>
          <p>
            {view === "list"
              ? "Manage academic class labels and keep them ready for batch mapping."
              : "Open the class form separately, then return back to the list when done."}
          </p>
        </div>
        <button
          type="button"
          className="catalogHero__action"
          onClick={() => {
            if (view === "form") {
              state.resetClassForm();
              setView("list");
              return;
            }

            state.resetClassForm();
            setView("form");
          }}
        >
          {view === "list" ? <Plus size={18} /> : null}
          {view === "list" ? "Add New Class" : "Back to Classes"}
        </button>
      </section>

      {state.error ? <div className="catalogPage__alert catalogPage__alert--error">{state.error}</div> : null}
      {state.message ? <div className="catalogPage__alert catalogPage__alert--success">{state.message}</div> : null}
      {state.loading ? <div className="catalogPage__loading">Loading classes...</div> : null}

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

          <CatalogClassSection
            mode="list"
            classes={state.classes}
            classForm={state.classForm}
            savingClass={state.savingClass}
            onSubmit={state.handleClassSubmit}
            onChange={(updater) => state.setClassForm((current) => updater(current))}
            onReset={state.resetClassForm}
            onEdit={() => setView("form")}
            onAddBatch={(item) =>
              navigate("/batches", {
                state: {
                  sourceLabel: item.class_name,
                  classId: item.id,
                  programType: "academic",
                  openForm: true,
                  backTo: "/classes",
                },
              })
            }
            onShowBatches={(item) =>
              navigate("/batches", {
                state: {
                  sourceLabel: item.class_name,
                  classId: item.id,
                  programType: "academic",
                  backTo: "/classes",
                },
              })
            }
          />
        </>
      ) : null}

      {!state.loading && view === "form" ? (
        <CatalogClassSection
          mode="form"
          classes={state.classes}
          classForm={state.classForm}
          savingClass={state.savingClass}
          formId="catalog-class-form"
          onSubmit={async (event) => {
            await state.handleClassSubmit(event);
            setView("list");
          }}
          onChange={(updater) => state.setClassForm((current) => updater(current))}
          onReset={() => {
            state.resetClassForm();
            setView("list");
          }}
        />
      ) : null}
    </div>
  );
}
