import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations, type LanguageCode } from "./translations";

const STORAGE_KEY = "coaching-app-language";

type TranslateParams = Record<string, string | number>;

type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, params?: TranslateParams) => string;
  languages: typeof SUPPORTED_LANGUAGES;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguageCode(value: string): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some((language) => language.code === value);
}

function resolveInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && isLanguageCode(stored)) {
    return stored;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  const matchingLanguage = SUPPORTED_LANGUAGES.find(({ code }) => browserLanguage.startsWith(code));
  return matchingLanguage?.code || DEFAULT_LANGUAGE;
}

function getNestedValue(source: unknown, key: string): string | undefined {
  if (!source || typeof source !== "object") return undefined;

  return key.split(".").reduce<unknown>((value, part) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[part];
  }, source) as string | undefined;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;

  return template.replace(/\{\{(.*?)\}\}/g, (_, name: string) => {
    const value = params[name.trim()];
    return value === undefined ? "" : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(resolveInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
    t: (key, params) => {
      const current = getNestedValue(translations[language], key);
      const fallback = getNestedValue(translations[DEFAULT_LANGUAGE], key);
      const text = current || fallback || key;
      return interpolate(text, params);
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}
