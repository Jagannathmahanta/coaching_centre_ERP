import type { FormEvent } from "react";
import type { CatalogCourse } from "../../../shared/types/catalog";
import type { CourseFormState } from "../types/catalog-admin.types";

type Props = {
  mode: "list" | "form";
  courses: CatalogCourse[];
  courseForm: CourseFormState;
  savingCourse: boolean;
  formId?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  onChange: (updater: (current: CourseFormState) => CourseFormState) => void;
  onReset: () => void;
  onEdit?: (item: CatalogCourse) => void;
  onAddBatch?: (item: CatalogCourse) => void;
  onShowBatches?: (item: CatalogCourse) => void;
};

export function CatalogCourseSection({
  mode,
  courses,
  courseForm,
  savingCourse,
  formId,
  onSubmit,
  onChange,
  onReset,
  onEdit,
  onAddBatch,
  onShowBatches,
}: Props) {
  if (mode === "form") {
    return (
      <section className="catalogCard">
        <div className="catalogCard__header">
          <div>
            <h2>{courseForm.id ? "Edit Course" : "Create Course"}</h2>
            <p>Use this for non-academic course offerings.</p>
          </div>
        </div>

        <form id={formId} className="catalogForm" onSubmit={onSubmit}>
          <label>
            Course Name
            <input
              value={courseForm.course_name}
              onChange={(event) =>
                onChange((current) => ({ ...current, course_name: event.target.value }))
              }
              placeholder="PGDCA"
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={courseForm.description}
              onChange={(event) =>
                onChange((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              placeholder="Six month computer course"
            />
          </label>

          <label>
            Status
            <select
              value={courseForm.status}
              onChange={(event) =>
                onChange((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="catalogForm__actions">
            <button type="submit" className="catalogButton" disabled={savingCourse}>
              {savingCourse ? "Saving..." : courseForm.id ? "Update Course" : "Create Course"}
            </button>
            <button type="button" className="catalogButton catalogButton--secondary" onClick={onReset}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="catalogCard">
      <div className="catalogCard__header">
        <div>
          <h2>Courses</h2>
          <p>Keep the course list separate and open forms only when needed.</p>
        </div>
      </div>

      <div className="catalogTableCard">
        <table className="catalogDataTable">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Name</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.course_name}</td>
                <td>{item.description || "-"}</td>
                <td>
                  <span className={`catalogStatus catalogStatus--${item.status}`}>{item.status}</span>
                </td>
                <td>
                  <div className="catalogActions">
                    <button type="button" className="catalogLinkButton" onClick={() => onAddBatch?.(item)}>
                      Add Batch
                    </button>
                    <button type="button" className="catalogLinkButton" onClick={() => onShowBatches?.(item)}>
                      Show Batches
                    </button>
                    <button
                      type="button"
                      className="catalogLinkButton"
                      onClick={() => {
                        onChange(() => ({
                          id: item.id,
                          course_name: item.course_name,
                          description: item.description || "",
                          status: item.status,
                        }));
                        onEdit?.(item);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
