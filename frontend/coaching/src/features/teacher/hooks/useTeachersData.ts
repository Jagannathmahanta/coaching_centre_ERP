import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTeacherAbsencesToday,
  getTeacherClassExams,
  getTeacherClassStructures,
  getTeachers,
  removeTeacher,
  saveTeacher,
} from "../services/teacher.service";
import type { Teacher, TeacherStat } from "../types/teacher.types";
import {
  initialTeacherForm,
  SUBJECT_OPTIONS,
  type TeacherFormState,
} from "../types/teacher.types";
import { validateOptionalEmail, validateOptionalPhone } from "../../../shared/utils/contact";

export function toggleSelection(values: string[], item: string) {
  return values.includes(item) ? values.filter((value) => value !== item) : [...values, item];
}

export function useTeachersData() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TeacherFormState>(initialTeacherForm);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const teachersQuery = useQuery({ queryKey: ["teachers"], queryFn: getTeachers });
  const absentTeachersQuery = useQuery({ queryKey: ["teacher-absences-today"], queryFn: getTeacherAbsencesToday });
  const feeStructuresQuery = useQuery({ queryKey: ["teacher-class-structures"], queryFn: getTeacherClassStructures });
  const examsQuery = useQuery({ queryKey: ["teacher-class-exams"], queryFn: getTeacherClassExams });

  const classOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of feeStructuresQuery.data || []) {
      const value = item.class_name || item.course_name || item.name;
      if (value) values.add(value);
    }
    for (const exam of examsQuery.data || []) {
      if (exam.class) values.add(exam.class);
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [examsQuery.data, feeStructuresQuery.data]);

  const teacherStats = useMemo<TeacherStat>(() => {
    const teachers = teachersQuery.data || [];
    return {
      total: teachers.length,
      active: teachers.filter((item) => item.status === "active").length,
      absentToday: Number(absentTeachersQuery.data || 0),
      classes: new Set(teachers.flatMap((item) => item.assigned_classes || [])).size,
      subjects: new Set(teachers.flatMap((item) => item.assigned_subjects || [])).size,
    };
  }, [absentTeachersQuery.data, teachersQuery.data]);

  const resetForm = () => {
    setEditingTeacherId(null);
    setForm(initialTeacherForm);
    setShowForm(false);
  };

  const saveTeacherMutation = useMutation({
    mutationFn: () => {
      const contactError =
        validateOptionalPhone(form.phone, "Teacher mobile")
        || validateOptionalEmail(form.email, "Teacher email");
      if (contactError) {
        throw new Error(contactError);
      }
      return saveTeacher(editingTeacherId, form);
    },
    onSuccess: async () => {
      setMessage(editingTeacherId ? "Teacher updated." : "Teacher created.");
      setError("");
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || mutationError.message || "Failed to save teacher.");
      setMessage("");
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: removeTeacher,
    onSuccess: async () => {
      setMessage("Teacher deleted.");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (mutationError: any) => {
      setError(mutationError.response?.data?.error || "Failed to delete teacher.");
      setMessage("");
    },
  });

  const startEditTeacher = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id);
    setForm({
      name: teacher.name || "",
      phone: teacher.phone || "",
      email: teacher.email || "",
      is_staff: Boolean(teacher.is_staff),
      gender: teacher.gender || "male",
      photo_url: teacher.photo_url || "",
      photo: null,
      experience: teacher.experience || "",
      qualification: teacher.qualification || "",
      assigned_subjects: teacher.assigned_subjects || [],
      assigned_classes: teacher.assigned_classes || [],
      join_date: teacher.join_date ? String(teacher.join_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: teacher.status || "active",
      notes: teacher.notes || "",
    });
    setShowForm(true);
  };

  return {
    form,
    setForm,
    editingTeacherId,
    setEditingTeacherId,
    showForm,
    setShowForm,
    message,
    setMessage,
    error,
    setError,
    teachersQuery,
    classOptions,
    teacherStats,
    resetForm,
    saveTeacherMutation,
    deleteTeacherMutation,
    startEditTeacher,
    subjectOptions: SUBJECT_OPTIONS,
  };
}
