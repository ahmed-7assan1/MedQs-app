"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FireIcon, TrophyIcon, AcademicCapIcon, StarIcon,
  ShieldCheckIcon, RocketLaunchIcon, SparklesIcon,
  BookOpenIcon, XMarkIcon,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

interface BadgeDef {
  id: string; label: string; desc: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string; glow: string;
  check: (d: BadgeData) => boolean;
  anim: string; /* unique animation name */
  cardStyle: string; /* distinctive card treatment */
}

interface BadgeData {
  currentStreak: number; totalQuestions: number;
  overallPct: number; rankPoints: number;
}

const BADGES: BadgeDef[] = [
  { id: "legend", label: "Legend", desc: "90% mastery + 30-day streak", icon: RocketLaunchIcon, gradient: "from-rose-600 via-pink-500 to-orange-400", glow: "shadow-[0_0_12px_rgba(225,29,72,0.4)]", check: (d) => d.overallPct >= 90 && d.currentStreak >= 30, anim: "bss-rocket", cardStyle: "border-2 border-rose-500/30 dark:border-rose-500/20 shadow-[0_0_16px_rgba(225,29,72,0.12)]" },
  { id: "master", label: "Master", desc: "85% mastery + 14-day streak", icon: SparklesIcon, gradient: "from-rose-500 to-pink-600", glow: "shadow-[0_0_12px_rgba(244,63,94,0.35)]", check: (d) => d.overallPct >= 85 && d.currentStreak >= 14, anim: "bss-sparkle", cardStyle: "border border-pink-300/40 dark:border-pink-500/20 bg-gradient-to-br from-pink-50/30 to-transparent dark:from-pink-950/10" },
  { id: "expert", label: "Expert", desc: "80% overall mastery", icon: ShieldCheckIcon, gradient: "from-rose-400 to-red-500", glow: "shadow-[0_0_12px_rgba(251,113,133,0.3)]", check: (d) => d.overallPct >= 80, anim: "bss-shield", cardStyle: "border border-rose-300/40 dark:border-red-500/20 border-l-4 border-l-rose-400 dark:border-l-red-500/50" },
  { id: "streak_30", label: "Monthly Legend", desc: "30 consecutive study days", icon: StarIcon, gradient: "from-amber-500 to-orange-500", glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]", check: (d) => d.currentStreak >= 30, anim: "bss-star", cardStyle: "border border-amber-300/40 dark:border-amber-500/20 border-dashed" },
  { id: "centurion", label: "Centurion", desc: "Answer 500+ questions", icon: TrophyIcon, gradient: "from-violet-500 to-purple-600", glow: "shadow-[0_0_12px_rgba(139,92,246,0.3)]", check: (d) => d.totalQuestions >= 500, anim: "bss-trophy", cardStyle: "border-2 border-violet-300/40 dark:border-violet-500/20 rounded-t-lg rounded-b-xl rounded-tr-xl" },
  { id: "streak_7", label: "Week Warrior", desc: "7 consecutive study days", icon: FireIcon, gradient: "from-emerald-500 to-teal-500", glow: "shadow-[0_0_12px_rgba(52,211,153,0.3)]", check: (d) => d.currentStreak >= 7, anim: "bss-fire", cardStyle: "border border-emerald-300/40 dark:border-emerald-500/20 border-b-4 border-b-emerald-400 dark:border-b-emerald-500/50" },
  { id: "scholar", label: "Scholar", desc: "Answer 100+ questions", icon: AcademicCapIcon, gradient: "from-sky-500 to-cyan-500", glow: "shadow-[0_0_12px_rgba(14,165,233,0.25)]", check: (d) => d.totalQuestions >= 100, anim: "bss-scholar", cardStyle: "border border-sky-300/40 dark:border-sky-500/20 rounded-[18px]" },
  { id: "first_steps", label: "First Steps", desc: "Complete your first quiz", icon: BookOpenIcon, gradient: "from-slate-500 to-slate-600", glow: "shadow-[0_0_8px_rgba(100,116,139,0.2)]", check: () => true, anim: "bss-book", cardStyle: "border border-slate-300/40 dark:border-slate-600/30 rounded-lg" },
];

function getProgress(id: string, data: BadgeData): number {
  switch (id) {
    case "legend": return Math.min(100, Math.round(Math.min(data.currentStreak / 30, data.overallPct / 90) * 100));
    case "master": return Math.min(100, Math.round(Math.min(data.currentStreak / 14, data.overallPct / 85) * 100));
    case "expert": return Math.min(100, Math.round((data.overallPct / 80) * 100));
    case "streak_30": return Math.min(100, Math.round((data.currentStreak / 30) * 100));
    case "centurion": return Math.min(100, Math.round((data.totalQuestions / 500) * 100));
    case "streak_7": return Math.min(100, Math.round((data.currentStreak / 7) * 100));
    case "scholar": return Math.min(100, Math.round((data.totalQuestions / 100) * 100));
    default: return 100;
  }
}

function nextBadgeHint(id: string): string {
  switch (id) {
    case "legend": return "Keep your streak going and push for 90%+ mastery";
    case "master": return "Maintain 85%+ mastery while building a 14-day streak";
    case "expert": return "Focus on accuracy — retry weak areas to reach 80%";
    case "streak_30": return "Study at least one question daily for 30 days";
    case "centurion": return "Complete more quizzes across all subjects";
    case "streak_7": return "Study daily — don't break your streak for 7 days";
    case "scholar": return "Answer more questions to unlock this badge";
    default: return "You've earned this!";
  }
}

const ANIM_STYLES = `
@keyframes bss-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }

@keyframes bss-rocket {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.08); }
}
.bss-icon-legend { animation: bss-rocket 2s ease-in-out infinite; }

@keyframes bss-sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  25% { transform: scale(1.12) rotate(-8deg); opacity: 0.9; }
  75% { transform: scale(1.12) rotate(8deg); opacity: 0.9; }
}
.bss-icon-master { animation: bss-sparkle 1.8s ease-in-out infinite; }

@keyframes bss-shield {
  0%, 100% { transform: scale(1); }
  30% { transform: scale(0.92); }
  60% { transform: scale(1.04); }
}
.bss-icon-expert { animation: bss-shield 2.2s ease-in-out infinite; }

@keyframes bss-star {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}
.bss-icon-streak_30 { animation: bss-star 3s linear infinite; }

@keyframes bss-trophy {
  0%, 100% { filter: brightness(1); transform: scale(1); }
  40% { filter: brightness(1.25); transform: scale(1.06); }
}
.bss-icon-centurion { animation: bss-trophy 2.5s ease-in-out infinite; }

@keyframes bss-fire {
  0%, 100% { transform: scaleY(1); }
  40% { transform: scaleY(1.12) scaleX(0.92); }
  60% { transform: scaleY(0.95) scaleX(1.05); }
}
.bss-icon-streak_7 { animation: bss-fire 1.4s ease-in-out infinite; }

@keyframes bss-scholar {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.bss-icon-scholar { animation: bss-scholar 2.4s ease-in-out infinite; }

@keyframes bss-book {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.06); opacity: 1; }
}
.bss-icon-first_steps { animation: bss-book 3s ease-in-out infinite; }
`;

export function BadgeProgressSheet({
  open, onClose, data,
}: {
  open: boolean; onClose: () => void; data: BadgeData;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  // Easiest first (first_steps at top, legend at bottom)
  const sorted = [...BADGES].reverse();

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[9998]" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] rounded-t-2xl bg-background border-t border-border shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", animation: "bss-slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        <div className="flex justify-center pt-2 pb-1 sticky top-0 bg-background z-10">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Achievements</h2>
            <button onClick={onClose} aria-label="Close achievements" className="p-1.5 rounded-full hover:bg-muted/20 transition-colors text-muted-foreground">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {sorted.map((badge) => {
              const BadgeIcon = badge.icon;
              const earned = badge.check(data);
              const progress = getProgress(badge.id, data);

              return (
                <div
                  key={badge.id}
                  className={cn(
                    "rounded-xl p-3.5 transition-colors relative overflow-hidden",
                    earned
                      ? "bg-emerald-50/50 dark:bg-emerald-500/5"
                      : "bg-card/30",
                    badge.cardStyle
                  )}
                >
                  {/* earned glow dot */}
                  {earned && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-emerald-400/20 blur-xl" />
                  )}

                  <div className="flex items-center gap-3 mb-2.5 relative z-10">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                      earned ? badge.gradient : "from-muted/30 to-muted/10 text-muted-foreground/50"
                    )}>
                      <BadgeIcon className={cn("h-4 w-4", earned && `bss-icon-${badge.id}`)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{badge.label}</p>
                        {earned && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded">Earned</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{badge.desc}</p>
                    </div>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden relative z-10">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        earned ? "bg-emerald-500" : badge.gradient.split(" ")[0].replace("from-", "bg-")
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1.5 relative z-10">
                    <p className="text-[9px] font-semibold text-muted-foreground/60">
                      {earned ? "Earned" : `${progress}%`}
                    </p>
                    {!earned && (
                      <p className="text-[9px] text-muted-foreground/50 text-right max-w-[60%] truncate">{nextBadgeHint(badge.id)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{ANIM_STYLES}</style>
    </>,
    document.body
  );
}
