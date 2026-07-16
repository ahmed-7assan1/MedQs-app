"use client";

import { cn } from "@/lib/utils";
import {
  BADGES, getBadgeProgress, getBadgeHint,
  type BadgeData,
} from "@/components/dashboard/shared/badges";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

const BADGE_CARD_STYLES: Record<string, string> = {
  legend: "border-2 border-rose-500/30 dark:border-rose-500/20 shadow-[0_0_16px_rgba(225,29,72,0.12)]",
  master: "border border-pink-300/40 dark:border-pink-500/20 bg-gradient-to-br from-pink-50/30 to-transparent dark:from-pink-950/10",
  expert: "border border-rose-300/40 dark:border-red-500/20 border-l-4 border-l-rose-400 dark:border-l-red-500/50",
  streak_30: "border border-amber-300/40 dark:border-amber-500/20 border-dashed",
  centurion: "border-2 border-violet-300/40 dark:border-violet-500/20 rounded-t-lg rounded-b-xl rounded-tr-xl",
  streak_7: "border border-sky-300/40 dark:border-sky-500/20 border-b-4 border-b-sky-400 dark:border-b-sky-500/50",
  scholar: "border border-sky-300/40 dark:border-sky-500/20 rounded-[18px]",
  first_steps: "border border-slate-300/40 dark:border-slate-600/30 rounded-lg",
};

const ANIM_STYLES = `
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
  const sorted = [...BADGES].reverse();

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-0">
        <SheetHeader className="sticky top-0 z-10 bg-background px-5 pt-3 pb-2 border-b border-border/40">
          <div className="flex justify-center pt-1 pb-2">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
          </div>
          <SheetTitle className="text-sm font-black uppercase tracking-widest">Achievements</SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-6 pt-4">
          <div className="space-y-3">
            {sorted.map((badge) => {
              const BadgeIcon = badge.icon;
              const earned = badge.check(data);
              const progress = getBadgeProgress(badge.id, data);
              const cardStyle = BADGE_CARD_STYLES[badge.id] || "";

              return (
                <Card
                  key={badge.id}
                  className={cn(
                    "transition-colors relative overflow-hidden shadow-none",
                    earned
                      ? "bg-sky-50/50 dark:bg-sky-500/5"
                      : "bg-white/5 dark:bg-white/5",
                    cardStyle
                  )}
                >
                  <CardContent className="p-3.5">
                  {earned && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-sky-400/20 blur-xl" />
                  )}

                  <div className="flex items-center gap-3 mb-2.5 relative z-10">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                      earned ? badge.gradient : "from-muted/30 to-muted/10 text-muted-foreground"
                    )}>
                      <BadgeIcon className={cn("h-4 w-4", earned && `bss-icon-${badge.id}`)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{badge.label}</p>
                        {earned && <span className="text-[9px] font-black text-sky-600 uppercase tracking-wider bg-sky-100 dark:bg-sky-500/20 px-1.5 py-0.5 rounded">Earned</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{badge.desc}</p>
                    </div>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden relative z-10">
                    <Progress
                      value={progress}
                      className={cn(
                        "h-full",
                        earned ? "[&>div]:bg-sky-500" : badge.gradient.split(" ")[0].replace("from-", "[&>div]:bg-")
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1.5 relative z-10">
                    <p className="text-[9px] font-semibold text-muted-foreground">
                      {earned ? "Earned" : `${progress}%`}
                    </p>
                    {!earned && (
                      <p className="text-[9px] text-muted-foreground text-right max-w-[60%] truncate">{getBadgeHint(badge.id)}</p>
                    )}
                  </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <style jsx global>{ANIM_STYLES}</style>
      </SheetContent>
    </Sheet>
  );
}
