"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";

type Locale = "ar" | "en";
type Translations = typeof ar;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => any;
  dir: "rtl" | "ltr";
  fontClass: string;
  translations: Translations;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getNested(obj: Record<string, any>, path: string): any {
  const keys = path.split(".");
  let current: any = obj;
  for (const k of keys) {
    if (current == null || typeof current !== "object") return path;
    current = current[k];
  }
  return current;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const stored = localStorage.getItem("medqs-lang") as Locale | null;
    if (stored === "ar" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("medqs-lang", l);
  }, []);

  const translations: Translations = locale === "ar" ? ar : en;

  const t = useCallback(
    (key: string): any => getNested(translations as Record<string, any>, key),
    [translations]
  );

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t,
    translations,
    dir: locale === "ar" ? "rtl" : "ltr",
    fontClass: locale === "ar" ? "font-arabic" : "",
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
