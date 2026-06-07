"use client";
import { useEffect, useCallback } from "react";

export function ApplyLocale() {
  const apply = useCallback(() => {
    try {
      const lang = localStorage.getItem("medqs-lang") || "en";
      document.documentElement.setAttribute("lang", lang);
      if (lang === "ar") {
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.style.setProperty("--font-geist-sans", "var(--font-cairo)");
      } else {
        document.documentElement.setAttribute("dir", "ltr");
        document.documentElement.style.removeProperty("--font-geist-sans");
      }
    } catch {}
  }, []);

  useEffect(() => { apply(); }, [apply]);

  useEffect(() => {
    const handler = (e: StorageEvent) => { if (e.key === "medqs-lang") apply(); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [apply]);

  return null;
}
