"use client";

import { useState } from "react";
import {
  FireIcon, TrophyIcon, AcademicCapIcon, StarIcon,
  ShieldCheckIcon, RocketLaunchIcon, SparklesIcon,
  BookOpenIcon,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";
import { BadgeProgressSheet } from "@/components/dashboard/BadgeProgressSheet";

function AnimatedFlame() {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <span className="absolute inset-0 rounded-full bg-orange-500/30 blur-md animate-flame-glow" />
      <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-sm animate-flame-pulse" />
      <span className="relative animate-fire">
        <FireIcon className="h-5 w-5 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
      </span>
    </span>
  );
}

function ShimmerOverlay({ delay = 1 }: { delay?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
      <div
        className="absolute -inset-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-20deg] animate-shimmer"
        style={{ animationDelay: `${delay}s` }}
      />
    </div>
  );
}

/* ── Achievement badges based on actual dashboard data ── */
interface BadgeDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  glow: string;
  check: (data: BadgeData) => boolean;
}

interface BadgeData {
  currentStreak: number;
  totalQuestions: number;
  overallPct: number;
  rankPoints: number;
}

const BADGES: BadgeDef[] = [
  {
    id: "legend",
    label: "Legend",
    icon: RocketLaunchIcon,
    gradient: "from-rose-600 via-pink-500 to-orange-400",
    glow: "shadow-[0_0_12px_rgba(225,29,72,0.4)]",
    check: (d) => d.overallPct >= 90 && d.currentStreak >= 30,
  },
  {
    id: "master",
    label: "Master",
    icon: SparklesIcon,
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.35)]",
    check: (d) => d.overallPct >= 85 && d.currentStreak >= 14,
  },
  {
    id: "expert",
    label: "Expert",
    icon: ShieldCheckIcon,
    gradient: "from-rose-400 to-red-500",
    glow: "shadow-[0_0_12px_rgba(251,113,133,0.3)]",
    check: (d) => d.overallPct >= 80,
  },
  {
    id: "streak_30",
    label: "Monthly Legend",
    icon: StarIcon,
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    check: (d) => d.currentStreak >= 30,
  },
  {
    id: "centurion",
    label: "Centurion",
    icon: TrophyIcon,
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-[0_0_12px_rgba(139,92,246,0.3)]",
    check: (d) => d.totalQuestions >= 500,
  },
  {
    id: "streak_7",
    label: "7-Day Streak",
    icon: StarIcon,
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.3)]",
    check: (d) => d.currentStreak >= 7,
  },
  {
    id: "scholar",
    label: "Scholar",
    icon: AcademicCapIcon,
    gradient: "from-sky-500 to-cyan-500",
    glow: "shadow-[0_0_12px_rgba(14,165,233,0.25)]",
    check: (d) => d.totalQuestions >= 100,
  },
  {
    id: "first_steps",
    label: "First Steps",
    icon: BookOpenIcon,
    gradient: "from-slate-500 to-slate-600",
    glow: "shadow-[0_0_8px_rgba(100,116,139,0.2)]",
    check: () => true,
  },
];

function getEarnedBadge(data: BadgeData): BadgeDef {
  for (const badge of BADGES) {
    if (badge.check(data)) return badge;
  }
  return BADGES[BADGES.length - 1];
}

export function MobileDashboardHero({
  greeting, firstName, overallPct,
  currentStreak, rankPoints, totalQuestions,
}: {
  greeting: string; firstName: string; overallPct: number;
  currentStreak: number; rankPoints: number; totalQuestions: number;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const earned = getEarnedBadge({ currentStreak, totalQuestions, overallPct, rankPoints });
  const BadgeIcon = earned.icon;

  return (
    <div className="px-4 pt-6 space-y-3">
      {/* ── Name card (full width) ── */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <ShimmerOverlay delay={0.5} />
        <div className="relative z-10 flex items-center gap-3 px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{greeting}</p>
            <h1 className="text-xl font-black text-foreground tracking-tight -mt-0.5 truncate">Dr. {firstName}</h1>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              <span className="text-foreground font-bold">{overallPct}%</span> mastery
            </p>
          </div>

          {/* Earned badge (clickable) */}
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl bg-gradient-to-br text-white shrink-0 transition-transform active:scale-95",
              earned.gradient, earned.glow
            )}
          >
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div
                className="absolute -inset-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shimmer"
                style={{ animationDelay: "0.2s", animationDuration: "2s" }}
              />
            </div>
            <BadgeIcon className="h-4 w-4 relative z-10 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
            <span className="text-[7px] font-black uppercase tracking-wider relative z-10">{earned.label}</span>
          </button>
        </div>
      </div>

      {/* ── Badge progress sheet ── */}
      <BadgeProgressSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        data={{ currentStreak, totalQuestions, overallPct, rankPoints }}
      />

      {/* ── Streak + Points row ── */}
      <div className="flex gap-2.5">
        <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-card">
          <ShimmerOverlay delay={1.5} />
          <div className={cn(
            "relative z-10 flex items-center gap-2.5 px-3.5 py-3 rounded-xl",
            currentStreak > 0
              ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/5"
              : ""
          )}>
            <AnimatedFlame />
            <div>
              <p className="text-base font-black text-foreground leading-none">{currentStreak}d</p>
              <p className="text-[10px] font-semibold text-muted-foreground leading-none mt-0.5">streak</p>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-card">
          <ShimmerOverlay delay={1.5} />
          <div className="relative z-10 flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/5">
            <span className="relative inline-flex items-center justify-center shrink-0">
              <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-sm animate-trophy-glow" />
              <TrophyIcon className="h-5 w-5 relative text-amber-500 animate-trophy" />
            </span>
            <div>
              <p className="text-base font-black text-foreground leading-none">{(rankPoints || 0).toLocaleString()}</p>
              <p className="text-[10px] font-semibold text-muted-foreground leading-none mt-0.5">pts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
