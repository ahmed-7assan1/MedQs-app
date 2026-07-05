"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Trophy, Sparkles, GraduationCap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { DashboardData } from "@/types/dashboard";

export function MissionControlHero({ data }: { data: DashboardData }) {
  return (
    <div>
        {/* Top row: avatar + greeting + badges */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-accent to-primary blur-md opacity-50 animate-scale-pulse" />
              <Avatar className="relative h-14 w-14 md:h-16 md:w-16 shrink-0 border-2 border-border/60 ring-2 ring-primary/20">
                {data.userImage ? (
                  <AvatarImage src={data.userImage} alt={data.firstName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg md:text-xl font-black">
                  {data.firstName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card shadow-sm" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded-full">{data.greeting}</span>
                {data.overallPct >= 80 && (
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Top Performer
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter text-foreground leading-none">
                Dr. {data.firstName}
              </h1>
              <p className="mt-1.5 text-xs font-medium text-muted-foreground/70 flex items-center gap-1.5 flex-wrap">
                <GraduationCap className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-foreground/80 font-bold">{data.rankLabel}</span>
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 shrink-0">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border",
              data.currentStreak > 0
                ? "bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20 shadow-sm shadow-orange-500/5"
                : "bg-muted/30 border-border/50"
            )}>
              <Flame className={cn("h-3.5 w-3.5", data.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground")} />
              <span className="text-[10px] font-black tabular-nums text-foreground">{data.currentStreak}d</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20 shadow-sm shadow-amber-500/5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-black tabular-nums text-foreground">{(data.rankPoints || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Module progress cards */}
        <div className="mt-6 md:mt-8 flex items-stretch gap-3 md:gap-4 flex-wrap">
          {(data.moduleProgress?.slice(0, 4) || []).map((mod) => (
            <Link
              key={mod.id}
              href={`/modules/${mod.id}`}
              className="flex-1 min-w-[120px] p-3.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 hover:border-primary/30 transition-all"
            >
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block truncate">
                {mod.name}
              </span>
              <span className="text-lg md:text-xl font-black tracking-tighter tabular-nums text-foreground">
                {mod.pct}%
              </span>
              <div className="mt-1.5 h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${mod.pct}%` }}
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Daily progress bar */}
        {data.dailyTarget > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
              <span className="text-muted-foreground/60 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary/60" />
                Daily Target
              </span>
              <span className="text-foreground/80">{data.todayItemCount} / {data.dailyTarget}</span>
            </div>
            <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.dailyPct}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
          </div>
        )}
    </div>
  );
}
