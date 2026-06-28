"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, Trophy, ArrowRight, Quote, Sparkles, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/components/dashboard/shared/animations";
import { getDailyQuote } from "@/components/dashboard/shared/quotes";
import type { DashboardData } from "@/types/dashboard";

export function MissionControlHero({ data }: { data: DashboardData }) {
  const quote = getDailyQuote();
  const missionModule = data.moduleProgress?.[0];

  return (
    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">{data.greeting}</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">
                Dr. {data.firstName}
              </h1>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                <span className="text-foreground font-bold">{data.overallPct}%</span> overall mastery
                <span className="mx-2 text-muted-foreground/30">·</span>
                <span className="text-foreground/60">{data.totalQuestions} questions</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="grid h-8 w-8 place-items-center rounded-full bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all" title="Search">
                <Search className="h-3.5 w-3.5" />
              </button>
              <button className="relative grid h-8 w-8 place-items-center rounded-full bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all" title="Notifications">
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border border-background" />
              </button>
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm", data.currentStreak > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-muted/30 border-border")}>
                <Flame className={cn("h-3.5 w-3.5", data.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                <span className="text-xs font-black text-foreground">{data.currentStreak}d</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-black text-foreground">{(data.rankPoints || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground/80">
                  {missionModule
                    ? `Continue ${missionModule.name} — ${missionModule.pct}% complete`
                    : "Start your medical journey"}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                  {missionModule
                    ? `${Math.round((100 - missionModule.pct) / 10) * 5 || 5} min remaining`
                    : "Enroll in your first module to begin"}
                </p>
              </div>
              <Link
                href={missionModule ? `/modules/${missionModule.id}` : "/modules"}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)] hover:scale-[1.02] active:scale-[0.97] transition-all shrink-0"
              >
                Continue <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="md:w-56 shrink-0 flex items-start">
          <div className="rounded-xl bg-muted/30 border border-border/40 p-4 w-full">
            <div className="flex items-start gap-2">
              <Quote size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-foreground/60 italic">
                &ldquo;{quote.text}&rdquo;
              </p>
            </div>
            <p className="mt-1.5 text-[9px] font-bold text-foreground/30 text-right tracking-wider">
              &mdash; {quote.author}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
