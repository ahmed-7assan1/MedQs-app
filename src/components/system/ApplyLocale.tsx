"use client";
import { useEffect } from "react";

export function ApplyLocale() {
  useEffect(() => {
    try {
      const lang = localStorage.getItem("medqs-lang") || "en";
      document.documentElement.setAttribute("lang", lang);
      if (lang === "ar") {
        document.documentElement.setAttribute("dir", "rtl");
        document.body.classList.add("font-arabic");
      } else {
        document.documentElement.setAttribute("dir", "ltr");
        document.body.classList.remove("font-arabic");
      }
    } catch {}
  }, []);
  return null;
}
