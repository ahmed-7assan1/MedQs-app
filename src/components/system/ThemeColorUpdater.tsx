"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store";

export function ThemeColorUpdater() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#000000" : "#ffffff");
  }, [theme]);

  return null;
}
