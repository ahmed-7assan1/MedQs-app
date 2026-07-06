"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Trophy, Sparkles, GraduationCap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { DashboardData } from "@/types/dashboard";

export function MissionControlHero({ data }: { data: DashboardData }) {
  return (
    <div className="hero-mesh">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 shrink-0 shadow-lg shadow-primary/20">
              {data.userImage ? (
                <AvatarImage src={data.userImage} alt={data.firstName} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl md:text-2xl font-black">
                {data.firstName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-lg shadow-emerald-500/30" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-[0.2em]">
                {data.greeting}
              </span>
              {data.overallPct >= 80 && (
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Top Performer
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

        <div className="flex gap-2 shrink-0">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 bg-card/40",
            data.currentStreak > 0 && "border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/0"
          )}>
            <Flame className={cn("h-4 w-4", data.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground")} />
            <span className={cn("text-base font-black tabular-nums leading-none", data.currentStreak > 0 ? "text-red-500" : "text-muted-foreground")}>{data.currentStreak}</span>
            <span className="text-[9px] font-medium text-muted-foreground/60">day streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/40 bg-card/40 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/0">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-base font-black tabular-nums leading-none text-foreground">{(data.rankPoints || 0).toLocaleString()}</span>
            <span className="text-[9px] font-medium text-muted-foreground/60">XP</span>
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8 flex items-stretch gap-3 md:gap-4 flex-wrap">
        {(data.moduleProgress?.slice(0, 4) || []).map((mod) => (
          <Link
            key={mod.id}
            href={`/modules/${mod.id}`}
            className="flex-1 min-w-[120px] p-3.5 rounded-xl bg-card/40 backdrop-blur-sm border border-white/5 dark:border-white/10 hover:bg-card/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block truncate">
              {mod.name}
            </span>
            <span className="text-xl md:text-2xl font-black tracking-tighter tabular-nums text-foreground">
              {mod.pct}%
            </span>
            <div className="mt-1.5 h-1 w-full bg-muted/50 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 relative overflow-hidden"
                style={{ width: `${mod.pct}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {data.dailyTarget > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
            <span className="text-muted-foreground/60 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary/60" />
              Daily Target
            </span>
            <span className="text-foreground/80">{data.todayItemCount} / {data.dailyTarget}</span>
          </div>
          <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-0 rounded-full opacity-20 blur-sm"
              style={{
                width: `${data.dailyPct}%`,
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
              }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.dailyPct}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full rounded-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
