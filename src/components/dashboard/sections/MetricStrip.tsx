"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, HelpCircle, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface MetricStripProps {
  currentStreak: number;
  rankPoints: number;
  rankLabel: string;
  todayItemCount: number;
  dailyTarget: number;
  overallPct: number;
  progressToNext: number;
}

export function MetricStrip({
  currentStreak,
  rankPoints,
  rankLabel,
  todayItemCount,
  dailyTarget,
  overallPct,
  progressToNext,
}: MetricStripProps) {
  
  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Streak Metric */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="metric-strip-chip relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-orange-500/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-300" />
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/15 shrink-0">
              <Flame className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-muted-foreground/60 uppercase tracking-wider leading-none">Streak</span>
              <span className="text-lg font-black text-foreground mt-0.5 block tabular-nums leading-none">
                {currentStreak} <span className="text-[10px] font-bold text-muted-foreground/50 lowercase">days</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* XP / Rank Metric */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="metric-strip-chip relative overflow-hidden group cursor-help">
                <div className="absolute -right-4 -top-4 w-12 h-12 bg-amber-500/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-300" />
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 shrink-0">
                  <Trophy className="h-4.5 w-4.5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-muted-foreground/60 uppercase tracking-wider leading-none">{rankLabel}</span>
                  <span className="text-lg font-black text-foreground mt-0.5 block tabular-nums leading-none">
                    {rankPoints.toLocaleString()} <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">XP</span>
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              <p className="text-xs font-bold">{progressToNext}% to your next rank</p>
            </TooltipContent>
          </Tooltip>
        </motion.div>

        {/* Questions Solved Today Metric */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="metric-strip-chip relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-300" />
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 shrink-0">
              <HelpCircle className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-muted-foreground/60 uppercase tracking-wider leading-none">Today</span>
              <span className="text-lg font-black text-foreground mt-0.5 block tabular-nums leading-none">
                {todayItemCount} <span className="text-[10px] font-bold text-muted-foreground/50">/ {dailyTarget} Qs</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Accuracy Metric */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="metric-strip-chip relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-sky-500/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-300" />
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/15 shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5 text-sky-500" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-muted-foreground/60 uppercase tracking-wider leading-none">Accuracy</span>
              <span className="text-lg font-black text-foreground mt-0.5 block tabular-nums leading-none">
                {overallPct}% <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">Correct</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
