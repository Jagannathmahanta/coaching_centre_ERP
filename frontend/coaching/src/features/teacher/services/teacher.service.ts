import api from "../../../shared/services/api";
import type {
  ExamOption,
  FeeStructureOption,
  Teacher,
  TeacherFormState,
} from "../types/teacher.types";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read teacher image."));
    reader.readAsDataURL(file);
  });
}

function validatePhotoFile(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Teacher image must be 5 MB or smaller.");
  }
}

export async function getTeachers(): Promise<Teacher[]> {
  const response = await api.get("/teachers");
  return response.data || [];
}

export async function getTeacherAbsencesToday(): Promise<number> {
  const response = await api.get("/leaves", {
    params: {
      applicant_type: "teacher",
      status: "approved",
    },
  });
  const today = new Date().toISOString().slice(0, 10);
  const leaves = response.data || [];

  return leaves.filter((item: any) => {
    const fromDate = String(item.from_date || "").slice(0, 10);
    const toDate = String(item.to_date || "").slice(0, 10);
    return fromDate && toDate && fromDate <= today && toDate >= today;
  }).length;
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
  if (form.photo) {
    validatePhotoFile(form.photo);
  }

  const payload = {
    name: form.name,
    phone: form.phone,
    email: form.email,
    is_staff: form.is_staff,
    gender: form.gender,
    experience: form.experience,
    qualification: form.qualification,
    photo: form.photo
      ? {
          name: form.photo.name,
          content: await readFileAsDataUrl(form.photo),
        }
      : undefined,
    assigned_subjects: form.assigned_subjects,
    assigned_classes: form.assigned_classes,
    join_date: form.join_date,
    status: form.status,
    notes: form.notes,
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
