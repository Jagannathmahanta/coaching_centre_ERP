import api from "../../../shared/services/api";
import type { CatalogBootstrap } from "../../../shared/types/catalog";
import type {
  AdmissionBootstrap,
  HostelRoomOption,
  StudentAdmissionForm,
  StudentFiltersState,
} from "../types/students.types";

export async function getStudents(filters: StudentFiltersState) {
  const response = await api.get("/students", {
    params: {
      class: filters.className || undefined,
      board: filters.board || undefined,
      academic_year: filters.academicYear || undefined,
      status: filters.status || undefined,
    },
  });

  return response.data || [];
}

export async function deleteStudent(studentId: number) {
  const response = await api.delete(`/students/${studentId}`);
  return response.data;
}

export async function deactivateStudent(studentId: number, payload: { left_date: string; left_reason: string }) {
  const response = await api.patch(`/students/${studentId}/deactivate`, payload);
  return response.data;
}

export async function createStudentLogin(payload: {
  role: "student";
  student_id: number;
  email?: string;
  phone?: string;
  password: string;
}) {
  const response = await api.post("/auth/accounts", payload);
  return response.data;
}

export async function getAdmissionBootstrap(studentId?: string): Promise<AdmissionBootstrap> {
  const [definitionsRes, hostelsRes, catalogRes, studentRes] = await Promise.all([
    api.get("/fees/structures"),
    api.get("/hostel"),
    api.get("/catalog/bootstrap"),
    studentId ? api.get(`/students/${studentId}`) : Promise.resolve({ data: null }),
  ]);

  const catalog = (catalogRes.data || {}) as CatalogBootstrap;

  return {
    definitions: definitionsRes.data || [],
    hostels: hostelsRes.data || [],
    classes: catalog.classes || [],
    courses: catalog.courses || [],
    batches: catalog.batches || [],
    student: studentRes.data || null,
  };
}

export async function getHostelRooms(hostelId: string): Promise<HostelRoomOption[]> {
  if (!hostelId) return [];
  const response = await api.get("/hostel/rooms/list", { params: { hostel_id: hostelId } });
  return response.data || [];
}

function toStudentPayload(form: StudentAdmissionForm) {
  return {
    name: form.name,
    class: form.class,
    email: form.email || undefined,
    program_type: form.program_type,
    board: form.program_type === "academic" ? form.board || undefined : undefined,
    class_id: form.program_type === "academic" && form.class_id ? Number(form.class_id) : undefined,
    course_id: form.program_type === "non_academic" && form.course_id ? Number(form.course_id) : undefined,
    batch_id: form.batch_id ? Number(form.batch_id) : undefined,
    admission_year: Number(form.admission_year),
    phone: form.phone || undefined,
    gender: form.gender,
    parent_name: form.parent_name || undefined,
    parent_phone: form.parent_phone || undefined,
    parent_email: form.parent_email || undefined,
    join_date: form.join_date,
    fee_structure_id: form.fee_structure_id ? Number(form.fee_structure_id) : undefined,
    billing_cycle: form.billing_cycle,
    academic_year: form.academic_year,
    due_day: Number(form.due_day),
    include_hostel: form.include_hostel,
    hostel_id: form.hostel_id ? Number(form.hostel_id) : undefined,
    room_id: form.room_id ? Number(form.room_id) : undefined,
    include_transport: form.include_transport,
    notes: form.notes || undefined,
  };
}

export async function createStudentAdmission(form: StudentAdmissionForm) {
  const response = await api.post("/students", toStudentPayload(form));
  return response.data;
}

export async function updateStudentAdmission(studentId: string, form: StudentAdmissionForm) {
  const payload = toStudentPayload(form);

  await api.patch(`/students/${studentId}`, {
    name: payload.name,
    class: payload.class,
    email: payload.email,
    status: form.status,
    left_date: form.status === "active" ? undefined : form.left_date || undefined,
    left_reason: form.status === "active" ? undefined : form.left_reason || undefined,
    parent_name: form.parent_name || undefined,
    parent_phone: form.parent_phone || undefined,
    parent_email: form.parent_email || undefined,
    program_type: payload.program_type,
    board: payload.board,
    class_id: payload.class_id,
    course_id: payload.course_id,
    batch_id: payload.batch_id,
    admission_year: payload.admission_year,
    phone: payload.phone,
    gender: payload.gender,
    join_date: payload.join_date,
    include_hostel: payload.include_hostel,
    hostel_id: payload.hostel_id,
    room_id: payload.room_id,
  });

  return payload;
}

export async function updateStudentFeePlan(studentId: string, payload: ReturnType<typeof toStudentPayload>) {
  const response = await api.patch(`/fees/student/${studentId}/plan`, {
    fee_structure_id: payload.fee_structure_id,
    billing_cycle: payload.billing_cycle,
    academic_year: payload.academic_year,
    due_day: payload.due_day,
    include_transport: payload.include_transport,
    notes: payload.notes,
  });

  return response.data;
}
