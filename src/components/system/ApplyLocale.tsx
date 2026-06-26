"use client";
import { useEffect } from "react";

export function ApplyLocale() {
  useEffect(() => {
    try {
      const lang = localStorage.getItem("medqs-lang") || "ar";
      document.documentElement.setAttribute("lang", lang);
    } catch {}
  }, []);

  return null;
}
