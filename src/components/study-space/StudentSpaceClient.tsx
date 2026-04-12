"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudySpaceBoard } from "@/components/study-space/StudySpaceBoard";
import { PersonalStudyCoach } from "@/components/study-assistant/PersonalStudyCoach";

type Mode = "desk" | "coach";

/**
 * Full-screen focus shell: hides the main site chrome (sidebar) so the student can study with widgets only.
 * Desk = infinite board (Spotify, PDF, timers, …). Coach = weekly AI plan (secondary, less distracting default).
 */
export function StudentSpaceClient() {
  const [mode, setMode] = useState<Mode>("desk");

  return (
    <div
      className="fixed inset-0 z-[10050] flex flex-col overflow-hidden bg-[#090a0e] text-white"
      role="application"
      aria-label="Student focus desk"
    >
      <header className="relative z-[10250] flex shrink-0 items-center gap-2 border-b border-white/[0.07] bg-[rgba(8,9,13,0.92)] px-3 py-2 backdrop-blur-xl md:gap-3 md:px-4">
        <Link
          href="/dashboard-app"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs font-semibold text-white/85 transition-colors hover:border-blue-500/35 hover:bg-blue-500/10 hover:text-white md:px-3"
        >
          <ArrowLeft className="h-3.5 w-3.5 opacity-80" aria-hidden />
          <span className="hidden sm:inline">Back to app</span>
          <span className="sm:hidden">Exit</span>
        </Link>

        <div className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden />

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold tracking-tight text-white/95">Focus desk</p>
          <p className="truncate text-[10px] text-white/38 md:text-[11px]">
            Minimal distractions · Spotify, PDF, timers & notes as widgets
          </p>
        </div>

        <nav
          className="flex shrink-0 rounded-xl border border-white/[0.08] bg-black/40 p-0.5"
          aria-label="Space mode"
        >
          <button
            type="button"
            onClick={() => setMode("desk")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all md:px-3",
              mode === "desk"
                ? "bg-blue-600/90 text-white shadow-sm shadow-blue-900/40"
                : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            Desk
          </button>
          <button
            type="button"
            title="Weekly plan, schedule, and AI coach"
            onClick={() => setMode("coach")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all md:px-3",
              mode === "coach"
                ? "bg-violet-600/90 text-white shadow-sm shadow-violet-950/40"
                : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Weekly </span>coach
          </button>
        </nav>
      </header>

      <div className="relative min-h-0 flex-1">
        {mode === "desk" ? (
          <StudySpaceBoard embedded />
        ) : (
          <div className="dark h-full min-h-0 overflow-y-auto overscroll-contain bg-[#08090d]">
            <PersonalStudyCoach />
          </div>
        )}
      </div>
    </div>
  );
}
