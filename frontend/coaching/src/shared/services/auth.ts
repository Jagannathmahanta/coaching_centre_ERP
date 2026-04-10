export type AuthUser = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  platform_role?: string | null;
  is_staff?: boolean;
  center_id?: number;
  center_slug?: string | null;
  center_name?: string | null;
  student_id?: number | null;
  teacher_id?: number | null;
  parent_id?: number | null;
  is_impersonated?: boolean;
  impersonator_id?: number | null;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

const AUTH_STORAGE_KEY = "coach_auth";
const PLATFORM_AUTH_BACKUP_KEY = "coach_platform_auth_backup";

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
      platform_role: payload.user.platform_role,
      is_staff: Boolean(payload.user.is_staff),
      center_id: payload.user.center_id,
      center_slug: payload.user.center_slug,
      center_name: payload.user.center_name,
      student_id: payload.user.student_id,
      teacher_id: payload.user.teacher_id,
      parent_id: payload.user.parent_id,
      is_impersonated: Boolean(payload.user.is_impersonated),
      impersonator_id: payload.user.impersonator_id,
    }),
  );
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token: payload.token,
      user: {
        id: payload.user.id,
        name: payload.user.name,
        email: payload.user.email,
        phone: payload.user.phone,
        role: payload.user.role,
        platform_role: payload.user.platform_role,
        is_staff: Boolean(payload.user.is_staff),
        center_id: payload.user.center_id,
        center_slug: payload.user.center_slug,
        center_name: payload.user.center_name,
        student_id: payload.user.student_id,
        teacher_id: payload.user.teacher_id,
        parent_id: payload.user.parent_id,
        is_impersonated: Boolean(payload.user.is_impersonated),
        impersonator_id: payload.user.impersonator_id,
      },
    }),
  );
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const backupPlatformAuth = () => {
  const bundledAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  if (bundledAuth) {
    localStorage.setItem(PLATFORM_AUTH_BACKUP_KEY, bundledAuth);
  }
};

export const hasPlatformAuthBackup = () => Boolean(localStorage.getItem(PLATFORM_AUTH_BACKUP_KEY));

export const restorePlatformAuth = () => {
  const backup = localStorage.getItem(PLATFORM_AUTH_BACKUP_KEY);
  if (!backup) return null;

  localStorage.setItem(AUTH_STORAGE_KEY, backup);

  try {
    const parsed = JSON.parse(backup) as Partial<AuthPayload>;
    if (parsed.token) {
      localStorage.setItem("token", parsed.token);
    }
    if (parsed.user) {
      localStorage.setItem("user", JSON.stringify(parsed.user));
    }
    localStorage.removeItem(PLATFORM_AUTH_BACKUP_KEY);
    return parsed;
  } catch {
    localStorage.removeItem(PLATFORM_AUTH_BACKUP_KEY);
    return null;
  }
};

export const getToken = (): string | null => {
  const directToken = localStorage.getItem("token");
  if (directToken) return directToken;

  const bundledAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!bundledAuth) return null;

  try {
    const parsed = JSON.parse(bundledAuth) as Partial<AuthPayload>;
    return typeof parsed.token === "string" && parsed.token ? parsed.token : null;
  } catch {
    return null;
  }
};

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem("user");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem("user");
    }
  }

  const bundledAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!bundledAuth) return null;

  try {
    const parsed = JSON.parse(bundledAuth) as Partial<AuthPayload>;
    return parsed.user ?? null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(getToken());

export const isStaffTeacher = (user: AuthUser | null) =>
  Boolean(user && user.role === "teacher" && user.is_staff);
