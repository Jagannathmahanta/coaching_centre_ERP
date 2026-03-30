import { useEffect, useMemo, useState } from "react";
import { getStudents } from "../services/students.service";
import type {
  StudentFiltersState,
  StudentLoginDraft,
  StudentRecord,
} from "../types/students.types";
import { initialStudentFilters, initialStudentLoginDraft } from "../types/students.types";

export function useStudentsQuery() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<StudentFiltersState>(initialStudentFilters);
  const [accountDraft, setAccountDraft] = useState<StudentLoginDraft>(initialStudentLoginDraft);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudents(filters);
      setStudents(data);
    } catch (loadError) {
      console.error("Error fetching students:", loadError);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [filters.className, filters.board, filters.academicYear]);

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.class).filter(Boolean))),
    [students]
  );

  const boardOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.board).filter(Boolean) as string[])),
    [students]
  );

  const yearOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.academic_year).filter(Boolean) as string[])),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) =>
      [
        student.name,
        student.class,
        student.roll_number || "",
        student.phone || "",
        student.board || "",
        student.academic_year || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, students]);

  return {
    students,
    loading,
    search,
    setSearch,
    message,
    setMessage,
    error,
    setError,
    filters,
    setFilters,
    accountDraft,
    setAccountDraft,
    classOptions,
    boardOptions,
    yearOptions,
    filteredStudents,
    loadStudents,
  };
}
