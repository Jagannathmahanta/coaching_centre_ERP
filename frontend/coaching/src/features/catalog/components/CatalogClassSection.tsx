import type { FormEvent } from "react";
import type { CatalogClass } from "../../../shared/types/catalog";
import type { ClassFormState } from "../types/catalog-admin.types";

type Props = {
  mode: "list" | "form";
  classes: CatalogClass[];
  classForm: ClassFormState;
  savingClass: boolean;
  formId?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  onChange: (updater: (current: ClassFormState) => ClassFormState) => void;
  onReset: () => void;
  onEdit?: (item: CatalogClass) => void;
  onAddBatch?: (item: CatalogClass) => void;
  onShowBatches?: (item: CatalogClass) => void;
};

export function CatalogClassSection({
  mode,
  classes,
  classForm,
  savingClass,
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
            <h2>{classForm.id ? "Edit Class" : "Create Class"}</h2>
            <p>Admin can create academic class labels here.</p>
          </div>
        </div>

        <form id={formId} className="catalogForm" onSubmit={onSubmit}>
          <label>
            Class Name
            <input
              value={classForm.class_name}
              onChange={(event) =>
                onChange((current) => ({ ...current, class_name: event.target.value }))
              }
              placeholder="Class IX"
              required
            />
          </label>

          <label>
            Status
            <select
              value={classForm.status}
              onChange={(event) =>
                onChange((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="catalogForm__actions">
            <button type="submit" className="catalogButton" disabled={savingClass}>
              {savingClass ? "Saving..." : classForm.id ? "Update Class" : "Create Class"}
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
          <h2>Classes</h2>
          <p>Manage academic class labels and batch mapping from one place.</p>
        </div>
      </div>

      <div className="catalogTableCard">
        <table className="catalogDataTable">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.class_name}</td>
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
                          class_name: item.class_name,
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
