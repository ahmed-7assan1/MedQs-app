"use client";

import { useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeProgressSheet } from "@/components/dashboard/BadgeProgressSheet";
import { getEarnedBadge, type BadgeData } from "@/components/dashboard/shared/badges";

function AnimatedFlame() {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <span className="absolute inset-0 rounded-full bg-orange-500/30 blur-md animate-flame-glow" />
      <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-sm animate-flame-pulse" />
      <span className="relative animate-fire">
        <Flame className="h-5 w-5 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
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
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
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
        </CardContent>
      </Card>

      {/* ── Badge progress sheet ── */}
      <BadgeProgressSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        data={{ currentStreak, totalQuestions, overallPct, rankPoints }}
      />

      {/* ── Streak + Points row ── */}
      <div className="flex gap-2.5">
        <Card className="relative flex-1 overflow-hidden">
          <CardContent className="p-0">
          <ShimmerOverlay delay={1.5} />
          <div className={cn(
            "relative z-10 flex items-center gap-2.5 px-3.5 py-3",
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
          </CardContent>
        </Card>

        <Card className="relative flex-1 overflow-hidden">
          <CardContent className="p-0">
          <ShimmerOverlay delay={1.5} />
          <div className="relative z-10 flex items-center gap-2.5 px-3.5 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/5">
            <span className="relative inline-flex items-center justify-center shrink-0">
              <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-sm animate-trophy-glow" />
              <Trophy className="h-5 w-5 relative text-amber-500 animate-trophy" />
            </span>
            <div>
              <p className="text-base font-black text-foreground leading-none">{(rankPoints || 0).toLocaleString()}</p>
              <p className="text-[10px] font-semibold text-muted-foreground leading-none mt-0.5">pts</p>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
