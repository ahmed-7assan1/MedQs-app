"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Target, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, EASE } from "@/components/dashboard/shared/animations";
import type { DashboardData } from "@/types/dashboard";

interface Recommendation {
  icon: typeof Lightbulb;
  textColor: string;
  title: string;
  desc: string;
}

function generateRecommendations(data: DashboardData): Recommendation[] {
  const recs: Recommendation[] = [];

  if (data.currentStreak >= 3 && data.currentStreak < 7) {
    recs.push({
      icon: TrendingUp,
      textColor: "text-orange-500",
      title: `${data.currentStreak}-day streak active`,
      desc: `Just ${7 - data.currentStreak} more days to earn the Week Warrior badge!`,
    });
  } else if (data.currentStreak === 0) {
    recs.push({
      icon: Target,
      textColor: "text-primary",
      title: "Start your streak",
      desc: "Complete one study session today to begin your streak.",
    });
  }

  if (data.overallPct < 50 && data.totalQuestions > 0) {
    recs.push({
      icon: AlertCircle,
      textColor: "text-rose-500",
      title: "Focus on fundamentals",
      desc: `Your accuracy is ${data.overallPct}%. Try reviewing core concepts before attempting new material.`,
    });
  } else if (data.overallPct >= 80) {
    recs.push({
      icon: Sparkles,
      textColor: "text-emerald-500",
      title: "Excellent mastery!",
      desc: `You\'re at ${data.overallPct}% overall. Push for 90% to unlock the Expert badge.`,
    });
  }

  if (data.moduleProgress.length > 0) {
    const lowest = data.moduleProgress.reduce((a, b) => (a.pct < b.pct ? a : b));
    if (lowest && lowest.pct < 30) {
      recs.push({
        icon: Lightbulb,
        textColor: "text-violet-500",
        title: `Review ${lowest.name}`,
        desc: `You\'re only ${lowest.pct}% through. A focused session now could boost your progress significantly.`,
      });
    }
  }

  if (data.todayItemCount === 0 && data.currentStreak === 0) {
    recs.push({
      icon: Target,
      textColor: "text-blue-500",
      title: "New here? Start here",
      desc: "Begin with a quick quiz or explore the medical library to discover your study path.",
    });
  }

  if (recs.length === 0) {
    recs.push({
      icon: Sparkles,
      textColor: "text-primary",
      title: "Keep it up!",
      desc: "You\'re making great progress. Try exploring a new module or feature today.",
    });
  }

  return recs.slice(0, 3);
}

export function AIRecommendations({ data }: { data: DashboardData }) {
  const recommendations = useMemo(() => generateRecommendations(data), [data]);

  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">AI Insights</span>
      </div>

      <div className="grid gap-3">
        {recommendations.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: EASE }}
              viewport={{ once: true }}
              className="group relative flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-sm hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
              <Icon className={cn("h-5 w-5 shrink-0 mt-0.5 transition-all duration-300 group-hover:scale-110", rec.textColor)} />
              <div className="min-w-0 relative">
                <p className="text-xs font-bold text-foreground">{rec.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{rec.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
