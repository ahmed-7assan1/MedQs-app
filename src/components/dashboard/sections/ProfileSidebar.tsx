"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, Trophy, GraduationCap, Target, Bell, Search, Sparkles, BrainCircuit, BookOpen, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/components/dashboard/shared/animations";
import { getDailyQuote } from "@/components/dashboard/shared/quotes";
import type { DashboardData } from "@/types/dashboard";

const QUICK_LINKS = [
  { icon: BrainCircuit, label: "Dr. Q", href: "/ai-chat", color: "text-primary" },
  { icon: Zap, label: "Quiz", href: "/quiz", color: "text-emerald-500" },
  { icon: BookOpen, label: "Library", href: "/medical-books", color: "text-violet-500" },
  { icon: Users, label: "Community", href: "/social", color: "text-rose-500" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export function ProfileSidebar({ data }: { data: DashboardData }) {
  const quote = getDailyQuote();
  const initials = getInitials(data.firstName);

  return (
    <div className="space-y-5">
      {/* Profile Card */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl p-6 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]"
      >
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-6 -bottom-6 h-16 w-16 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-glow-pulse" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg">
              {initials}
            </div>
          </div>

          {/* Name + Greeting */}
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">{data.greeting}</p>
          <h2 className="text-xl font-black tracking-tighter text-foreground mb-1">
            Dr. {data.firstName}
          </h2>

          {/* Rank Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Trophy className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-black text-foreground">{data.rankLabel}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="grid h-8 w-8 place-items-center rounded-full bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all" title="Search">
              <Search className="h-3.5 w-3.5" />
            </button>
            <button className="relative grid h-8 w-8 place-items-center rounded-full bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all" title="Notifications">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border border-background" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Key Stats */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 gap-2"
      >
        {[
          { label: "Streak", value: `${data.currentStreak}d`, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "XP", value: (data.rankPoints || 0).toLocaleString(), icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Mastery", value: `${data.overallPct}%`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Solved", value: (data.totalQuestions || 0).toLocaleString(), icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              custom={i}
              variants={statVariants}
              className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-xl p-3 shadow-sm"
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", stat.bg)}>
                <Icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
              <p className="text-base font-black tabular-nums text-foreground">{stat.value}</p>
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Daily Quote */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl bg-muted/30 border border-border/40 p-4"
      >
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] leading-relaxed text-foreground/60 italic">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mt-1 text-[8px] font-bold text-foreground/30 tracking-wider">
              &mdash; {quote.author}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        variants={fadeUp}
        className="flex flex-wrap gap-1.5"
      >
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/60 transition-all text-[10px] font-bold text-foreground/70 hover:text-foreground"
            >
              <Icon className={cn("h-3 w-3", link.color)} />
              {link.label}
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
