const https = require("https");

const MYMEMORY_BASE_URL = "https://api.mymemory.translated.net/get";
const TARGET_LANGUAGE = "or";
const SUPPORTED_LANGUAGES = ["en", "or"];

function normalizeLanguage(value, fallback = "en") {
  const normalized = String(value || "").trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : fallback;
}

function buildQueryUrl(text, sourceLanguage, targetLanguage) {
  const url = new URL(MYMEMORY_BASE_URL);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${sourceLanguage}|${targetLanguage}`);

  if (process.env.MYMEMORY_EMAIL) {
    url.searchParams.set("de", process.env.MYMEMORY_EMAIL);
  }

  return url.toString();
}

async function translateText(text, sourceLanguage, targetLanguage) {
  const cleanText = String(text || "").trim();
  if (!cleanText) return "";
  if (sourceLanguage === targetLanguage) return cleanText;

  const data = await new Promise((resolve, reject) => {
    https.get(buildQueryUrl(cleanText, sourceLanguage, targetLanguage), (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        raw += chunk;
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Translation request failed with status ${response.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
  });

  const translated = data?.responseData?.translatedText;
  return typeof translated === "string" && translated.trim() ? translated.trim() : cleanText;
}

function normalizeTranslations(value, fallbackLanguage = "en") {
  if (typeof value === "string") {
    return value.trim() ? { [fallbackLanguage]: value.trim() } : {};
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [language, text]) => {
    const normalizedLanguage = normalizeLanguage(language, language);
    if (typeof text === "string" && text.trim()) {
      acc[normalizedLanguage] = text.trim();
    }
    return acc;
  }, {});
}

function getTranslation(translations, language, fallback = "") {
  return translations?.[language] || translations?.en || fallback || "";
}

async function ensureEnglishAndOdiaTranslations(input, sourceLanguage = "en") {
  const normalizedSourceLanguage = normalizeLanguage(sourceLanguage, "en");
  const translations = normalizeTranslations(input, normalizedSourceLanguage);
  const sourceText = getTranslation(translations, normalizedSourceLanguage);

  if (!sourceText) {
    return {};
  }

  if (!translations[normalizedSourceLanguage]) {
    translations[normalizedSourceLanguage] = sourceText;
  }

  if (normalizedSourceLanguage === "en" && !translations.or) {
    try {
      translations.or = await translateText(sourceText, "en", TARGET_LANGUAGE);
    } catch (error) {
      translations.or = sourceText;
    }
  }

  if (normalizedSourceLanguage === "or" && !translations.en) {
    try {
      translations.en = await translateText(sourceText, "or", "en");
    } catch (error) {
      translations.en = sourceText;
    }
  }

  if (!translations.en) {
    translations.en = sourceText;
  }

  if (!translations.or) {
    translations.or = translations.en;
  }

  return {
    en: translations.en,
    or: translations.or,
  };
}

async function ensureOptionTranslations(options, sourceLanguage = "en") {
  const list = Array.isArray(options) ? options : [];
  return Promise.all(list.map((option) => ensureEnglishAndOdiaTranslations(option, sourceLanguage)));
}

module.exports = {
  ensureEnglishAndOdiaTranslations,
  ensureOptionTranslations,
  getTranslation,
  normalizeLanguage,
  normalizeTranslations,
};
