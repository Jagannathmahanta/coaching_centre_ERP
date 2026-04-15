import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import type { CatalogBatch, CatalogClass, CatalogCourse } from "../../../shared/types/catalog";
import { getCatalogBootstrap, saveBatch, saveClass, saveCourse } from "../services/catalog.service";
import {
  initialBatchForm,
  initialClassForm,
  initialCourseForm,
  type BatchFormState,
  type ClassFormState,
  type CourseFormState,
} from "../types/catalog-admin.types";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ error?: string }>;
  return axiosError.response?.data?.error || fallback;
}

export function formatTime(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 5);
}

export function useCatalogAdmin() {
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

  const loadCatalog = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const activeClasses = useMemo(
    () =>
      classes.filter(
        (item) =>
          item.status === "active" ||
          item.id === classForm.id ||
          item.id === Number(batchForm.class_id || 0),
      ),
    [classes, classForm.id, batchForm.class_id],
  );

  const activeCourses = useMemo(
    () =>
      courses.filter(
        (item) =>
          item.status === "active" ||
          item.id === courseForm.id ||
          item.id === Number(batchForm.course_id || 0),
      ),
    [courses, courseForm.id, batchForm.course_id],
  );

  const handleClassSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
    },
    [classForm, loadCatalog],
  );

  const handleCourseSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
    },
    [courseForm, loadCatalog],
  );

  const handleBatchSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSavingBatch(true);
      setError("");
      setMessage("");

      try {
        await saveBatch({
          id: batchForm.id,
          program_type: batchForm.program_type,
          board: batchForm.program_type === "academic" ? batchForm.board : undefined,
          class_id:
            batchForm.program_type === "academic" && batchForm.class_id
              ? Number(batchForm.class_id)
              : undefined,
          course_id:
            batchForm.program_type === "non_academic" && batchForm.course_id
              ? Number(batchForm.course_id)
              : undefined,
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
    },
    [batchForm, loadCatalog],
  );

  return {
    classes,
    courses,
    batches,
    loading,
    error,
    message,
    classForm,
    courseForm,
    batchForm,
    savingClass,
    savingCourse,
    savingBatch,
    activeClasses,
    activeCourses,
    setClassForm,
    setCourseForm,
    setBatchForm,
    handleClassSubmit,
    handleCourseSubmit,
    handleBatchSubmit,
    resetClassForm: () => setClassForm(initialClassForm),
    resetCourseForm: () => setCourseForm(initialCourseForm),
    resetBatchForm: () => setBatchForm(initialBatchForm),
  };
}

export type CatalogAdminState = ReturnType<typeof useCatalogAdmin>;
