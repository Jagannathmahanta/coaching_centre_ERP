import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AxiosError } from "axios";
import {
  getCatalogBootstrap,
  saveBatch,
  saveClass,
  saveCourse,
} from "../services/catalog.service";
import type { CatalogBatch, CatalogClass, CatalogCourse } from "../../../shared/types/catalog";
import "./catalog.css";

type ClassFormState = {
  id?: number;
  class_name: string;
  status: string;
};

type CourseFormState = {
  id?: number;
  course_name: string;
  description: string;
  status: string;
};

type BatchFormState = {
  id?: number;
  program_type: "academic" | "non_academic";
  board: string;
  class_id: string;
  course_id: string;
  shift: "morning" | "afternoon" | "evening";
  batch_name: string;
  start_time: string;
  end_time: string;
  capacity: string;
  status: string;
};

const initialClassForm: ClassFormState = {
  class_name: "",
  status: "active",
};

const initialCourseForm: CourseFormState = {
  course_name: "",
  description: "",
  status: "active",
};

const initialBatchForm: BatchFormState = {
  program_type: "academic",
  board: "CBSE",
  class_id: "",
  course_id: "",
  shift: "morning",
  batch_name: "",
  start_time: "07:00",
  end_time: "08:00",
  capacity: "",
  status: "active",
};

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ error?: string }>;
  return axiosError.response?.data?.error || fallback;
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 5);
}

export default function CatalogPage() {
  const [classes, setClasses] = useState<CatalogClass[]>([]);
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [batches, setBatches] = useState<CatalogBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [classForm, setClassForm] = useState<ClassFormState>(initialClassForm);
  const [courseForm, setCourseForm] = useState<CourseFormState>(initialCourseForm);
  const [batchForm, setBatchForm] = useState<BatchFormState>(initialBatchForm);
  const [savingClass, setSavingClass] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCatalogBootstrap();
      setClasses(data.classes || []);
      setCourses(data.courses || []);
      setBatches(data.batches || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load class, course, and batch data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === "active" || item.id === classForm.id || item.id === Number(batchForm.class_id || 0)),
    [classes, classForm.id, batchForm.class_id]
  );

  const activeCourses = useMemo(
    () => courses.filter((item) => item.status === "active" || item.id === courseForm.id || item.id === Number(batchForm.course_id || 0)),
    [courses, courseForm.id, batchForm.course_id]
  );

  const handleClassSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingClass(true);
    setError("");
    setMessage("");

    try {
      await saveClass({
        id: classForm.id,
        class_name: classForm.class_name.trim(),
        status: classForm.status,
      });
      setMessage(classForm.id ? "Class updated successfully." : "Class created successfully.");
      setClassForm(initialClassForm);
      await loadCatalog();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to save class."));
    } finally {
      setSavingClass(false);
    }
  };

  const handleCourseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingCourse(true);
    setError("");
    setMessage("");

    try {
      await saveCourse({
        id: courseForm.id,
        course_name: courseForm.course_name.trim(),
        description: courseForm.description.trim() || undefined,
        status: courseForm.status,
      });
      setMessage(courseForm.id ? "Course updated successfully." : "Course created successfully.");
      setCourseForm(initialCourseForm);
      await loadCatalog();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to save course."));
    } finally {
      setSavingCourse(false);
    }
  };

  const handleBatchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingBatch(true);
    setError("");
    setMessage("");

    try {
      await saveBatch({
        id: batchForm.id,
        program_type: batchForm.program_type,
        board: batchForm.program_type === "academic" ? batchForm.board : undefined,
        class_id: batchForm.program_type === "academic" && batchForm.class_id ? Number(batchForm.class_id) : undefined,
        course_id: batchForm.program_type === "non_academic" && batchForm.course_id ? Number(batchForm.course_id) : undefined,
        shift: batchForm.shift,
        batch_name: batchForm.batch_name.trim(),
        start_time: batchForm.start_time,
        end_time: batchForm.end_time,
        capacity: batchForm.capacity ? Number(batchForm.capacity) : undefined,
        status: batchForm.status,
      });
      setMessage(batchForm.id ? "Batch updated successfully." : "Batch created successfully.");
      setBatchForm(initialBatchForm);
      await loadCatalog();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to save batch."));
    } finally {
      setSavingBatch(false);
    }
  };

  return (
    <div className="catalogPage">
      <div className="catalogPage__hero">
        <div>
          <h1>Catalog Setup</h1>
          <p>Create classes, courses, and batches for this coaching center.</p>
        </div>
      </div>

      {error ? <div className="catalogPage__alert catalogPage__alert--error">{error}</div> : null}
      {message ? <div className="catalogPage__alert catalogPage__alert--success">{message}</div> : null}

      {loading ? <div className="catalogPage__loading">Loading catalog setup...</div> : null}

      {!loading ? (
        <div className="catalogPage__grid">
          <section className="catalogCard">
            <div className="catalogCard__header">
              <div>
                <h2>Classes</h2>
                <p>Admin can create academic class labels here.</p>
              </div>
            </div>

            <form className="catalogForm" onSubmit={handleClassSubmit}>
              <label>
                Class Name
                <input
                  value={classForm.class_name}
                  onChange={(event) => setClassForm((current) => ({ ...current, class_name: event.target.value }))}
                  placeholder="Class IX"
                  required
                />
              </label>

              <label>
                Status
                <select
                  value={classForm.status}
                  onChange={(event) => setClassForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <div className="catalogForm__actions">
                <button type="submit" className="catalogButton" disabled={savingClass}>
                  {savingClass ? "Saving..." : classForm.id ? "Update Class" : "Create Class"}
                </button>
                {classForm.id ? (
                  <button type="button" className="catalogButton catalogButton--secondary" onClick={() => setClassForm(initialClassForm)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="catalogList">
              {classes.map((item) => (
                <div key={item.id} className="catalogList__item">
                  <div>
                    <strong>{item.class_name}</strong>
                    <span>{item.status}</span>
                  </div>
                  <button
                    type="button"
                    className="catalogLinkButton"
                    onClick={() => setClassForm({ id: item.id, class_name: item.class_name, status: item.status })}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="catalogCard">
            <div className="catalogCard__header">
              <div>
                <h2>Courses</h2>
                <p>Use this for non-academic course offerings.</p>
              </div>
            </div>

            <form className="catalogForm" onSubmit={handleCourseSubmit}>
              <label>
                Course Name
                <input
                  value={courseForm.course_name}
                  onChange={(event) => setCourseForm((current) => ({ ...current, course_name: event.target.value }))}
                  placeholder="PGDCA"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={courseForm.description}
                  onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  placeholder="Six month computer course"
                />
              </label>

              <label>
                Status
                <select
                  value={courseForm.status}
                  onChange={(event) => setCourseForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <div className="catalogForm__actions">
                <button type="submit" className="catalogButton" disabled={savingCourse}>
                  {savingCourse ? "Saving..." : courseForm.id ? "Update Course" : "Create Course"}
                </button>
                {courseForm.id ? (
                  <button type="button" className="catalogButton catalogButton--secondary" onClick={() => setCourseForm(initialCourseForm)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="catalogList">
              {courses.map((item) => (
                <div key={item.id} className="catalogList__item">
                  <div>
                    <strong>{item.course_name}</strong>
                    <span>{item.status}</span>
                    {item.description ? <small>{item.description}</small> : null}
                  </div>
                  <button
                    type="button"
                    className="catalogLinkButton"
                    onClick={() =>
                      setCourseForm({
                        id: item.id,
                        course_name: item.course_name,
                        description: item.description || "",
                        status: item.status,
                      })
                    }
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="catalogCard catalogCard--wide">
            <div className="catalogCard__header">
              <div>
                <h2>Batches</h2>
                <p>Create class-wise or course-wise batches with time, shift, and capacity.</p>
              </div>
            </div>

            <form className="catalogForm catalogForm--grid" onSubmit={handleBatchSubmit}>
              <label>
                Program Type
                <select
                  value={batchForm.program_type}
                  onChange={(event) =>
                    setBatchForm((current) => ({
                      ...current,
                      program_type: event.target.value as BatchFormState["program_type"],
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
                    <select value={batchForm.board} onChange={(event) => setBatchForm((current) => ({ ...current, board: event.target.value }))}>
                      <option value="CBSE">CBSE</option>
                      <option value="State Board">State Board</option>
                      <option value="ICSE">ICSE</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label>
                    Class
                    <select value={batchForm.class_id} onChange={(event) => setBatchForm((current) => ({ ...current, class_id: event.target.value }))} required>
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
                  <select value={batchForm.course_id} onChange={(event) => setBatchForm((current) => ({ ...current, course_id: event.target.value }))} required>
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
                <select value={batchForm.shift} onChange={(event) => setBatchForm((current) => ({ ...current, shift: event.target.value as BatchFormState["shift"] }))}>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </label>

              <label>
                Batch Name
                <input
                  value={batchForm.batch_name}
                  onChange={(event) => setBatchForm((current) => ({ ...current, batch_name: event.target.value }))}
                  placeholder="Morning Batch A"
                  required
                />
              </label>

              <label>
                Start Time
                <input
                  type="time"
                  value={batchForm.start_time}
                  onChange={(event) => setBatchForm((current) => ({ ...current, start_time: event.target.value }))}
                  required
                />
              </label>

              <label>
                End Time
                <input
                  type="time"
                  value={batchForm.end_time}
                  onChange={(event) => setBatchForm((current) => ({ ...current, end_time: event.target.value }))}
                  required
                />
              </label>

              <label>
                Capacity
                <input
                  type="number"
                  min="1"
                  value={batchForm.capacity}
                  onChange={(event) => setBatchForm((current) => ({ ...current, capacity: event.target.value }))}
                  placeholder="40"
                />
              </label>

              <label>
                Status
                <select value={batchForm.status} onChange={(event) => setBatchForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <div className="catalogForm__actions catalogForm__actions--full">
                <button type="submit" className="catalogButton" disabled={savingBatch}>
                  {savingBatch ? "Saving..." : batchForm.id ? "Update Batch" : "Create Batch"}
                </button>
                {batchForm.id ? (
                  <button type="button" className="catalogButton catalogButton--secondary" onClick={() => setBatchForm(initialBatchForm)}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="catalogTable">
              <div className="catalogTable__head">
                <span>Name</span>
                <span>Type</span>
                <span>Target</span>
                <span>Shift</span>
                <span>Time</span>
                <span>Capacity</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              {batches.map((item) => (
                <div key={item.id} className="catalogTable__row">
                  <span>{item.batch_name}</span>
                  <span>{item.program_type === "academic" ? "Academic" : "Non-Academic"}</span>
                  <span>{item.program_type === "academic" ? item.class_name || "-" : item.course_name || "-"}</span>
                  <span>{item.shift}</span>
                  <span>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                  <span>{item.capacity || "-"}</span>
                  <span>{item.status}</span>
                  <button
                    type="button"
                    className="catalogLinkButton"
                    onClick={() =>
                      setBatchForm({
                        id: item.id,
                        program_type: item.program_type,
                        board: item.board || "CBSE",
                        class_id: item.class_id ? String(item.class_id) : "",
                        course_id: item.course_id ? String(item.course_id) : "",
                        shift: item.shift,
                        batch_name: item.batch_name,
                        start_time: formatTime(item.start_time),
                        end_time: formatTime(item.end_time),
                        capacity: item.capacity ? String(item.capacity) : "",
                        status: item.status,
                      })
                    }
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
