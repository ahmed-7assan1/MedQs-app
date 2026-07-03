"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Flame, Trophy, Star, ChevronRight, Sparkles, Rocket, BookCheck, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AnimatedRing } from "@/components/dashboard/RedesignedComponents";
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
  color: "text-emerald-500",
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
    <SectionHeader icon={Sparkles} title="Achievements" />

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
     {/* Streak Card */}
     <Card className="rounded-2xl bg-card/80 border-border/40 p-5 shadow-sm transition-shadow transition-colors duration-300 hover:shadow-md hover:border-primary/40">
      <div className="flex items-center gap-3">
       <StreakIcon size={22} className={cn(emoji.color)} />
       <div className="flex-1 min-w-0">
        <p className="text-lg font-black text-foreground tabular-nums">{data.currentStreak} day{data.currentStreak !== 1 ? "s" : ""}</p>
        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">{emoji.label}</p>
       </div>
      </div>
      {nextMilestone && (
       <div className="mt-3">
        <div className="flex justify-between text-[9px] font-bold text-foreground/30 mb-1">
         <span>Next: {nextMilestone}d</span>
         <span>{Math.round(streakProgress)}%</span>
        </div>
        <Progress value={streakProgress} className="h-1 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
       </div>
      )}
     </Card>

     {/* Rank / Prestige Card */}
      <Card className="rounded-2xl bg-card/80 border-border/40 p-5 shadow-sm flex items-center gap-4 transition-shadow transition-colors duration-300 hover:shadow-md hover:border-primary/40">
       <AnimatedRing progress={data.progressToNext} size={56} color="text-amber-500" />
       <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/70">Rank</p>
        <h3 className="text-base font-black text-foreground truncate">{data.rankLabel}</h3>
        <p className="text-[10px] font-medium text-muted-foreground">{data.progressToNext}% to next</p>
       </div>
      </Card>

     {/* Total Questions Card */}
      <Card className="rounded-2xl bg-card/80 border-border/40 p-5 shadow-sm flex items-center gap-4 transition-shadow transition-colors duration-300 hover:shadow-md hover:border-primary/40">
       <Rocket className="h-6 w-6 text-primary" />
      <div className="flex-1 min-w-0">
       <p className="text-lg font-black text-foreground tabular-nums">{(data.totalQuestions || 0).toLocaleString()}</p>
       <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Questions Solved</p>
      </div>
      <Button variant="ghost" size="sm" asChild className="h-8 w-8 rounded-lg bg-muted/30 border border-border hover:bg-muted/50">
       <Link href="/leaderboard">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
       </Link>
      </Button>
     </Card>
    </div>

   {/* Badges Row */}
   <div className="grid grid-cols-3 gap-2 mt-3">
    {badges.map((badge, i) => {
     const Icon = badge.icon;
     return (
      <Card
         key={i}
         className={cn(
         "hover:-translate-y-0.5 hover:shadow-sm",
         badge.unlocked
          ? "border-border/40 bg-card/60"
          : "border-border/20 bg-muted/20 opacity-50"
        )}
       >
        <CardContent className="flex items-center gap-2.5 p-3">
        <Icon className={cn("h-4 w-4 shrink-0", badge.color)} />
        <span className={cn("text-[10px] font-bold leading-tight", badge.unlocked ? "text-foreground/80" : "text-muted-foreground/50")}>
         {badge.label}
        </span>
        </CardContent>
         </Card>
      );
     })}
   </div>
  </div>
 );
}
