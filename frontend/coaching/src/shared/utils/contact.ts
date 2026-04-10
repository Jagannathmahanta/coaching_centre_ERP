const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function sanitizePhoneInput(value: string) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

export function sanitizeEmailInput(value: string) {
  return String(value || "").replace(/\s+/g, "").trim().toLowerCase();
}

export function isValidPhone(value: string) {
  return PHONE_REGEX.test(String(value || "").trim());
}

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(String(value || "").trim());
}

export function validateOptionalPhone(value: string, label = "Phone") {
  if (!String(value || "").trim()) return null;
  return isValidPhone(value) ? null : `${label} must be exactly 10 digits with no spaces or symbols.`;
}

export function validateOptionalEmail(value: string, label = "Email") {
  if (!String(value || "").trim()) return null;
  return isValidEmail(value) ? null : `${label} must be a valid email address like name@example.com.`;
}
