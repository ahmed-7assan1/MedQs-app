"use client";

import { useMemo } from "react";
import { Lightbulb, TrendingUp, Target, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
    <div>

      <div className="grid gap-3">
        {recommendations.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <Card
                key={rec.title}
                className="group shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
             >
               <CardContent className="flex items-start gap-3 p-4 relative">
               <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
               <Icon className={cn("h-5 w-5 shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110", rec.textColor)} />
               <div className="min-w-0 relative">
                 <p className="text-xs font-bold text-foreground">{rec.title}</p>
                 <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{rec.desc}</p>
         </div>
               </CardContent>
       </Card>
     );
          })}
        </div>
      </div>
  );
}
