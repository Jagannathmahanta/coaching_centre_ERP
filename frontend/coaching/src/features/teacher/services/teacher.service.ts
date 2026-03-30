import api from "../../../shared/services/api";
import type {
  ExamOption,
  FeeStructureOption,
  Teacher,
  TeacherFormState,
  TeacherLoginDraft,
} from "../types/teacher.types";

export async function getTeachers(): Promise<Teacher[]> {
  const response = await api.get("/teachers");
  return response.data || [];
}

export async function getTeacherClassStructures(): Promise<FeeStructureOption[]> {
  const response = await api.get("/fees/structures");
  return response.data || [];
}

export async function getTeacherClassExams(): Promise<ExamOption[]> {
  const response = await api.get("/exams");
  return response.data || [];
}

export async function saveTeacher(editingTeacherId: number | null, form: TeacherFormState) {
  const payload = {
    ...form,
    assigned_subjects: form.assigned_subjects,
    assigned_classes: form.assigned_classes,
  };

  if (editingTeacherId) {
    const response = await api.patch(`/teachers/${editingTeacherId}`, payload);
    return response.data;
  }

  const response = await api.post("/teachers", payload);
  return response.data;
}

export async function removeTeacher(teacherId: number) {
  const response = await api.delete(`/teachers/${teacherId}`);
  return response.data;
}

export async function createTeacherLogin(draft: TeacherLoginDraft) {
  const response = await api.post("/auth/accounts", {
    role: "teacher",
    teacher_id: draft.teacherId,
    email: draft.email || undefined,
    phone: draft.phone || undefined,
    password: draft.password,
  });
  return response.data;
}
