"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Trophy, Star, ChevronRight, Sparkles, Rocket, BookCheck, Target, Zap, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import { STREAK_MILESTONES } from "@/components/dashboard/shared/confetti";
import { Q_MILESTONES } from "@/components/dashboard/shared/badges";
import type { DashboardData } from "@/types/dashboard";

function computeBadges(data: DashboardData) {
  const badges: { icon: typeof Sparkles; label: string; unlocked: boolean; color: string }[] = [];

  const modulesCompleted = data.moduleProgress.filter(m => m.pct >= 80).length;
  badges.push({
    icon: BookCheck,
    label: `${modulesCompleted} Module${modulesCompleted !== 1 ? "s" : ""} Mastered`,
    unlocked: modulesCompleted > 0,
    color: "text-sky-500",
  });

  const nearestQ = Q_MILESTONES.slice().reverse().find(m => data.totalQuestions >= m);
  badges.push({
    icon: Target,
    label: nearestQ ? `${nearestQ.toLocaleString()} Questions` : "0 Questions",
    unlocked: !!nearestQ,
    color: "text-violet-500",
  });

  badges.push({
    icon: Zap,
    label: data.overallPct >= 80 ? `${data.overallPct}% Accuracy` : `${data.overallPct}% Accuracy`,
    unlocked: data.overallPct >= 80,
    color: data.overallPct >= 80 ? "text-amber-500" : "text-muted-foreground",
  });

  return badges;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function AchievementsShelf({ data }: { data: DashboardData }) {
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
    if (data.currentStreak < 1) return;
    if (celebrated.includes(data.currentStreak)) return;
    const isMilestone = STREAK_MILESTONES.includes(data.currentStreak);
    if (isMilestone) saveMilestones([...celebrated, data.currentStreak]);
  }, [data.currentStreak, celebrated, saveMilestones]);

  const nextMilestone = STREAK_MILESTONES.find((m) => m > data.currentStreak);
  const streakProgress = nextMilestone ? (data.currentStreak / nextMilestone) * 100 : 100;

  let emoji: { icon: typeof Flame; label: string; color: string };
  if (data.currentStreak >= 30) emoji = { icon: Trophy, label: "Legendary", color: "text-amber-500" };
  else if (data.currentStreak >= 7) emoji = { icon: Star, label: "On Fire", color: "text-orange-500" };
  else emoji = { icon: Flame, label: "Streak", color: "text-rose-500" };
  const StreakIcon = emoji.icon;

  const badges = useMemo(() => computeBadges(data), [data]);

  return (
    <div>
      <SectionHeader icon={Medal} title="Achievements" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Streak Card */}
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="rounded-2xl bg-card/80 border-border/40 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 overflow-hidden relative">
            {/* Background fire gradient on active streak */}
            {data.currentStreak > 0 && (
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-xl" />
            )}
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl",
                  data.currentStreak >= 30 ? "bg-amber-500/15" : data.currentStreak >= 7 ? "bg-orange-500/15" : "bg-rose-500/15"
                )}>
                  <StreakIcon size={20} className={cn(emoji.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black text-foreground tabular-nums">{data.currentStreak} day{data.currentStreak !== 1 ? "s" : ""}</p>
                  <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">{emoji.label}</p>
                </div>
              </div>
              {nextMilestone && (
                <div className="mt-3">
                  <div className="flex justify-between text-[9px] font-bold text-foreground/30 mb-1">
                    <span>Next: {nextMilestone}d</span>
                    <span>{Math.round(streakProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${streakProgress}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Rank Card */}
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="rounded-2xl bg-card/80 border-border/40 p-5 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/70">Rank</p>
              <h3 className="text-base font-black text-foreground truncate">{data.rankLabel}</h3>
              <p className="text-[10px] font-medium text-muted-foreground">{data.progressToNext}% to next</p>
            </div>
          </Card>
        </motion.div>

        {/* Total Questions Card */}
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="rounded-2xl bg-card/80 border-border/40 p-5 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-black text-foreground tabular-nums">{(data.totalQuestions || 0).toLocaleString()}</p>
              <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">Questions Solved</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 shrink-0">
              <Link href="/leaderboard">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              </Link>
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* Badges Row */}
      <motion.div
        className="grid grid-cols-3 gap-2 mt-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
        }}
      >
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Card
                className={cn(
                  "transition-all duration-300 hover:-translate-y-0.5",
                  badge.unlocked
                    ? "border-border/40 bg-card/60 hover:shadow-sm"
                    : "border-border/20 bg-muted/20 opacity-50"
                )}
              >
                <CardContent className="flex items-center gap-2.5 p-3">
                  <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg shrink-0", badge.unlocked ? "bg-current/10" : "bg-muted/30")}>
                    <Icon className={cn("h-3.5 w-3.5", badge.color)} />
                  </div>
                  <span className={cn("text-[10px] font-bold leading-tight", badge.unlocked ? "text-foreground/80" : "text-muted-foreground/50")}>
                    {badge.label}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
