"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Target, AlertCircle, Sparkles, BrainCircuit, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import type { DashboardData } from "@/types/dashboard";

interface Recommendation {
  icon: typeof Lightbulb;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  title: string;
  desc: string;
  action?: string;
  actionHref?: string;
}

function generateRecommendations(data: DashboardData): Recommendation[] {
  const recs: Recommendation[] = [];

  if (data.currentStreak >= 3 && data.currentStreak < 7) {
    recs.push({
      icon: TrendingUp,
      accentColor: "text-orange-500",
      borderColor: "border-l-orange-500",
      bgColor: "from-orange-500/5",
      title: `${data.currentStreak}-day streak active`,
      desc: `Just ${7 - data.currentStreak} more days to earn the Week Warrior badge!`,
      action: "Study now",
      actionHref: "/modules",
    });
  } else if (data.currentStreak === 0) {
    recs.push({
      icon: Target,
      accentColor: "text-primary",
      borderColor: "border-l-primary",
      bgColor: "from-primary/5",
      title: "Start your streak",
      desc: "Complete one study session today to begin your streak.",
      action: "Take a quiz",
      actionHref: "/quiz",
    });
  }

  if (data.overallPct < 50 && data.totalQuestions > 0) {
    recs.push({
      icon: AlertCircle,
      accentColor: "text-rose-500",
      borderColor: "border-l-rose-500",
      bgColor: "from-rose-500/5",
      title: "Focus on fundamentals",
      desc: `Your accuracy is ${data.overallPct}%. Try reviewing core concepts before attempting new material.`,
      action: "Review concepts",
      actionHref: "/study-tools",
    });
  } else if (data.overallPct >= 80) {
    recs.push({
      icon: Sparkles,
      accentColor: "text-emerald-500",
      borderColor: "border-l-emerald-500",
      bgColor: "from-emerald-500/5",
      title: "Excellent mastery!",
      desc: `You\'re at ${data.overallPct}% overall. Push for 90% to unlock the Expert badge.`,
      action: "Challenge yourself",
      actionHref: "/quiz",
    });
  }

  if (data.moduleProgress.length > 0) {
    const lowest = data.moduleProgress.reduce((a, b) => (a.pct < b.pct ? a : b));
    if (lowest && lowest.pct < 30) {
      recs.push({
        icon: Lightbulb,
        accentColor: "text-violet-500",
        borderColor: "border-l-violet-500",
        bgColor: "from-violet-500/5",
        title: `Review ${lowest.name}`,
        desc: `You\'re only ${lowest.pct}% through. A focused session now could boost your progress significantly.`,
        action: "Continue",
        actionHref: `/modules/${lowest.id}`,
      });
    }
  }

  if (data.todayItemCount === 0 && data.currentStreak === 0) {
    recs.push({
      icon: BrainCircuit,
      accentColor: "text-blue-500",
      borderColor: "border-l-blue-500",
      bgColor: "from-blue-500/5",
      title: "New here? Start here",
      desc: "Begin with a quick quiz or explore the medical library to discover your study path.",
      action: "Get started",
      actionHref: "/modules",
    });
  }

  if (recs.length === 0) {
    recs.push({
      icon: CheckCircle2,
      accentColor: "text-primary",
      borderColor: "border-l-primary",
      bgColor: "from-primary/5",
      title: "Keep it up!",
      desc: "You\'re making great progress. Try exploring a new module or feature today.",
      action: "Explore",
      actionHref: "/medical-books",
    });
  }

  return recs.slice(0, 3);
}

export function AIRecommendations({ data }: { data: DashboardData }) {
  const recommendations = useMemo(() => generateRecommendations(data), [data]);

  return (
    <div>
      <SectionHeader icon={BrainCircuit} title="AI Insights" />

      <div className="grid gap-2.5">
        {recommendations.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className={cn(
                "group overflow-hidden rounded-2xl border-border/40 bg-card/40 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-l-2",
                rec.borderColor
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted/50 shrink-0 mt-0.5">
                      <Icon className={cn("h-4 w-4", rec.accentColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-foreground">{rec.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{rec.desc}</p>
                        </div>
                        {rec.action && rec.actionHref && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-7 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <a href={rec.actionHref}>
                              {rec.action} <ArrowRight className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
