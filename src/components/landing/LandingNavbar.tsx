"use client";

import Link from "next/link";
import { ArrowRight, Sun, Moon, LogIn } from "lucide-react";
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
    <nav className="sticky top-0 z-50 border-b border-white/[0.02] bg-white/80 backdrop-blur-2xl dark:border-white/[0.02] dark:bg-[#0b0f1a]/85">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 decoration-transparent">
          <span className="inline-flex items-center dark:[filter:brightness(0)_invert(1)]">
            <MedQsLogoMark className="h-8 w-8 shrink-0" title="MedQs" />
          </span>
          <span className="inline-flex items-center leading-none text-[16px] font-bold tracking-tight text-foreground dark:text-white">
            MedQs
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.02] bg-background/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground dark:border-white/[0.03] dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* Sign In — icon only on xs, text on sm+ */}
          <Link
            href="/login"
            className="flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <LogIn className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Sign In</span>
          </Link>

          {/* Get Started — icon+text on sm+, icon only on xs */}
          <Link
            href="/register"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-3 sm:px-4 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(37,99,235,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_22px_rgba(37,99,235,0.45)] active:scale-[0.98]"
          >
            <span className="hidden sm:inline">Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}


