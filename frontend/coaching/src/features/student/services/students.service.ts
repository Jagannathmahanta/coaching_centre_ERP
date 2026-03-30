import api from "../../../shared/services/api";
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
    },
  });

  return response.data || [];
}

export async function deleteStudent(studentId: number) {
  const response = await api.delete(`/students/${studentId}`);
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
  const [definitionsRes, hostelsRes, studentRes] = await Promise.all([
    api.get("/fees/structures"),
    api.get("/hostel"),
    studentId ? api.get(`/students/${studentId}`) : Promise.resolve({ data: null }),
  ]);

  return {
    definitions: definitionsRes.data || [],
    hostels: hostelsRes.data || [],
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
    phone: form.phone || undefined,
    gender: form.gender,
    parent_name: form.parent_name || undefined,
    parent_phone: form.parent_phone || undefined,
    parent_email: form.parent_email || undefined,
    create_parent_login: form.create_parent_login,
    parent_login_password: form.parent_login_password || undefined,
    create_student_login: form.create_student_login,
    student_login_email: form.student_login_email || undefined,
    student_login_phone: form.student_login_phone || undefined,
    student_login_password: form.student_login_password || undefined,
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
