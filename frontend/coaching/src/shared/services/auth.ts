export type AuthUser = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  center_id?: number;
  student_id?: number | null;
  teacher_id?: number | null;
  parent_id?: number | null;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

export const saveAuth = (payload: AuthPayload) => {
  localStorage.setItem("token", payload.token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: payload.user.id,
      name: payload.user.name,
      email: payload.user.email,
      phone: payload.user.phone,
      role: payload.user.role,
      center_id: payload.user.center_id,
      student_id: payload.user.student_id,
      teacher_id: payload.user.teacher_id,
      parent_id: payload.user.parent_id,
    }),
  );
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(localStorage.getItem("token"));
