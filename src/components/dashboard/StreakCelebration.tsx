"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { STREAK_MILESTONES } from "@/components/dashboard/shared/confetti";

export const StreakCelebration = ({ currentStreak }: { currentStreak: number }) => {
  const [celebrated, setCelebrated] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("streak-milestones");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const saveMilestones = useCallback((arr: number[]) => {
    setCelebrated(arr);
    try { localStorage.setItem("streak-milestones", JSON.stringify(arr)); } catch {}
  }, []);

  useEffect(() => {
    if (currentStreak < 1) return;
    if (celebrated.includes(currentStreak)) return;
    const isMilestone = STREAK_MILESTONES.includes(currentStreak);
    if (isMilestone) saveMilestones([...celebrated, currentStreak]);
  }, [currentStreak, celebrated, saveMilestones]);

  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak);
  const progress = nextMilestone ? (currentStreak / nextMilestone) * 100 : 100;

  let emoji: { icon: typeof Flame; label: string; color: string };
  if (currentStreak >= 30) emoji = { icon: Trophy, label: "Legendary", color: "text-amber-500" };
  else if (currentStreak >= 7) emoji = { icon: Star, label: "On Fire", color: "text-orange-500" };
  else emoji = { icon: Flame, label: "Streak", color: "text-rose-500" };

  const Icon = emoji.icon;

  return (
    <>
      <Card>
        <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", currentStreak >= 30 ? "bg-amber-500/20" : currentStreak >= 7 ? "bg-orange-500/20" : "bg-rose-500/20")}>
            <Icon size={18} className={emoji.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-foreground tabular-nums">{currentStreak} day{currentStreak !== 1 ? "s" : ""}</p>
            <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">{emoji.label}</p>
          </div>
        </div>
        {nextMilestone && (
          <div className="mt-3">
            <div className="flex justify-between text-[9px] font-bold text-foreground/60 mb-1">
              <span>Next: {nextMilestone}d</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              />
            </div>
          </div>
        )}
      </CardContent>
     </Card>
    </>
  );
};
