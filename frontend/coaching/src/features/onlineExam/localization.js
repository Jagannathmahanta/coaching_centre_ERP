export const EXAM_LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "or", label: "ଓଡିଆ" },
];

function firstString(values = []) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0) || "";
}

export function normalizeLocalizedText(value) {
  if (typeof value === "string") {
    return value.trim() ? { en: value } : {};
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [key, item]) => {
    if (typeof item === "string" && item.trim().length > 0) {
      acc[key] = item;
    }
    return acc;
  }, {});
}

export function getLocalizedText(value, language = "en", fallback = "") {
  const normalized = normalizeLocalizedText(value);
  return normalized[language] || normalized.en || firstString(Object.values(normalized)) || fallback || "";
}
