"use client";

import Link from "next/link";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { useThemeStore } from "@/lib/store";
import { useEffect, useState } from "react";

export function LandingNavbar() {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/30 bg-white/80 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#0b0f1a]/85">
      <div className="mx-auto flex h-[66px] max-w-6xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 decoration-transparent">
          <MedQsLogoMark className="h-9 w-9 shrink-0" title="MedQs" />
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {isDark
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />
              }
            </button>
          )}

          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(37,99,235,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_22px_rgba(37,99,235,0.45)] active:scale-[0.98]"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
