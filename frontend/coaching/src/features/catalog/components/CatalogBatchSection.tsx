import type { FormEvent } from "react";
import type { CatalogClass, CatalogCourse } from "../../../shared/types/catalog";
import type { BatchFormState } from "../types/catalog-admin.types";

type Props = {
  batchForm: BatchFormState;
  activeClasses: CatalogClass[];
  activeCourses: CatalogCourse[];
  savingBatch: boolean;
  formId?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  onChange: (updater: (current: BatchFormState) => BatchFormState) => void;
  onReset: () => void;
};

export function CatalogBatchSection({
  batchForm,
  activeClasses,
  activeCourses,
  savingBatch,
  formId,
  onSubmit,
  onChange,
  onReset,
}: Props) {
  return (
    <section className="catalogCard catalogCard--wide">
      <div className="catalogCard__header">
        <div>
          <h2>{batchForm.id ? "Edit Batch" : "Create Batch"}</h2>
          <p>Create class-wise or course-wise batches with time, shift, and capacity.</p>
        </div>
      </div>

      <form id={formId} className="catalogForm catalogForm--grid" onSubmit={onSubmit}>
        <label>
          Program Type
          <select
            value={batchForm.program_type}
            onChange={(e) =>
              onChange((cur) => ({
                ...cur,
                program_type: e.target.value as BatchFormState["program_type"],
                class_id: "",
                course_id: "",
              }))
            }
          >
            <option value="academic">Academic</option>
            <option value="non_academic">Non-Academic</option>
          </select>
        </label>

        {batchForm.program_type === "academic" ? (
          <>
            <label>
              Board
              <select
                value={batchForm.board}
                onChange={(e) => onChange((cur) => ({ ...cur, board: e.target.value }))}
              >
                <option value="CBSE">CBSE</option>
                <option value="State Board">State Board</option>
                <option value="ICSE">ICSE</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Class
              <select
                value={batchForm.class_id}
                onChange={(e) => onChange((cur) => ({ ...cur, class_id: e.target.value }))}
                required
              >
                <option value="">Select class</option>
                {activeClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class_name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label>
            Course
            <select
              value={batchForm.course_id}
              onChange={(e) => onChange((cur) => ({ ...cur, course_id: e.target.value }))}
              required
            >
              <option value="">Select course</option>
              {activeCourses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.course_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Shift
          <select
            value={batchForm.shift}
            onChange={(e) =>
              onChange((cur) => ({
                ...cur,
                shift: e.target.value as BatchFormState["shift"],
              }))
            }
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </label>

        {/* <label>
          Batch Name
          <input
            value={batchForm.batch_name}
            onChange={(e) => onChange((cur) => ({ ...cur, batch_name: e.target.value }))}
            // required
          />
        </label> */}
         <label>
          Capacity
          <input
            type="number"
            value={batchForm.capacity}
            onChange={(e) => onChange((cur) => ({ ...cur, capacity: e.target.value }))}
          />
        </label>

        <label>
          Start Time
          <input
            type="time"
            value={batchForm.start_time}
            onChange={(e) => onChange((cur) => ({ ...cur, start_time: e.target.value }))}
            required
          />
        </label>

        <label>
          End Time
          <input
            type="time"
            value={batchForm.end_time}
            onChange={(e) => onChange((cur) => ({ ...cur, end_time: e.target.value }))}
            required
          />
        </label>

       

        <label>
          Status
          <select
            value={batchForm.status}
            onChange={(e) => onChange((cur) => ({ ...cur, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <div className="catalogForm__actions catalogForm__actions--full">
          <button type="submit" className="catalogButton" disabled={savingBatch}>
            {savingBatch ? "Saving..." : batchForm.id ? "Update Batch" : "Create Batch"}
          </button>

          <button
            type="button"
            className="catalogButton catalogButton--secondary"
            onClick={onReset}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}