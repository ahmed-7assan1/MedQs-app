"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Flame, Trophy, Star, ChevronRight, Sparkles, Rocket, BookCheck, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, EASE } from "@/components/dashboard/shared/animations";
import { AnimatedRing } from "@/components/dashboard/RedesignedComponents";
import type { DashboardData } from "@/types/dashboard";

const COLORS = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
const SHAPES = ["square", "circle", "triangle"];

interface ConfettiPiece {
  id: number; x: number; color: string; shape: string; size: number; delay: number;
}

const createPieces = (count: number): ConfettiPiece[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.5,
  }));

const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];
const Q_MILESTONES = [100, 500, 1000, 5000];

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
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  const saveMilestones = useCallback((arr: number[]) => {
    setCelebrated(arr);
    try { localStorage.setItem("streak-milestones", JSON.stringify(arr)); } catch {}
  }, []);

  const trigger = useCallback((streak: number) => {
    setPieces(createPieces(8));
    setShow(true);
    setTimeout(() => setShow(false), 2500);
    saveMilestones([...celebrated, streak]);
  }, [celebrated, saveMilestones]);

  useEffect(() => {
    if (data.currentStreak < 1) return;
    if (celebrated.includes(data.currentStreak)) return;
    const isMilestone = MILESTONES.includes(data.currentStreak);
    if (isMilestone) trigger(data.currentStreak);
  }, [data.currentStreak, celebrated, trigger]);

  const nextMilestone = MILESTONES.find((m) => m > data.currentStreak);
  const streakProgress = nextMilestone ? (data.currentStreak / nextMilestone) * 100 : 100;

  let emoji: { icon: typeof Flame; label: string; color: string };
  if (data.currentStreak >= 30) emoji = { icon: Trophy, label: "Legendary", color: "text-amber-500" };
  else if (data.currentStreak >= 7) emoji = { icon: Star, label: "On Fire", color: "text-orange-500" };
  else emoji = { icon: Flame, label: "Streak", color: "text-rose-500" };
  const StreakIcon = emoji.icon;

  const badges = useMemo(() => computeBadges(data), [data]);

  return (
    <motion.div variants={fadeUp}>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {pieces.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                animate={{ y: "100vh", opacity: 0, rotate: 720 }}
                transition={{ duration: 2.5 + p.delay, ease: "easeIn" }}
                style={{
                  left: `${p.x}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  borderRadius: p.shape === "circle" ? "50%" : p.shape === "triangle" ? "0" : "2px",
                  clipPath: p.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined,
                  position: "absolute",
                  top: 0,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Achievements</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Streak Card */}
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40">
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
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${streakProgress}%` }}
                  transition={{ duration: 1, ease: EASE }}
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rank / Prestige Card */}
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-primary/40">
          <AnimatedRing progress={data.progressToNext} size={56} color="text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/70">Rank</p>
            <h3 className="text-base font-black text-foreground truncate">{data.rankLabel}</h3>
            <p className="text-[10px] font-medium text-muted-foreground">{data.progressToNext}% to next</p>
          </div>
        </div>

        {/* Total Questions Card */}
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-primary/40">
          <Rocket className="h-6 w-6 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-foreground tabular-nums">{(data.totalQuestions || 0).toLocaleString()}</p>
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Questions Solved</p>
          </div>
          <Link href="/leaderboard" className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-all duration-300">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* Badges Row */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
              viewport={{ once: true }}
              className={cn(
                "rounded-xl border p-3 flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm",
                badge.unlocked
                  ? "border-border/40 bg-card/60 backdrop-blur-sm"
                  : "border-border/20 bg-muted/20 opacity-50"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", badge.color)} />
              <span className={cn("text-[10px] font-bold leading-tight", badge.unlocked ? "text-foreground/80" : "text-muted-foreground/50")}>
                {badge.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
