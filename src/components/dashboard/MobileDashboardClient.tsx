"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Flame, Trophy, Target, Brain, BookOpen, ArrowRight,
  PlayCircle, Wrench, Mic, Sparkles, ChevronRight,
  GraduationCap, Clock, Bell, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard, ProgressRing, StatsCard, SubjectCard, AIWidget, SwipeCarousel } from "@/components/mobile";

interface MobileDashboardClientProps {
  firstName: string;
  greeting: string;
  currentStreak: number;
  rankPoints: number;
  rankLabel: string;
  dailyPct: number;
  overallPct: number;
  todayItemCount: number;
  dailyTarget: number;
  totalQuestions: number;
  lastLectureActivity: any;
  moduleProgress: any[];
  alert?: React.ReactNode;
}

export function MobileDashboardClient({
  firstName, greeting, currentStreak, rankPoints, rankLabel,
  dailyPct, overallPct, todayItemCount, dailyTarget,
  totalQuestions, lastLectureActivity, moduleProgress, alert,
}: MobileDashboardClientProps) {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const itemAnim = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="md:hidden cinematic-bg min-h-screen pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
      {alert && <div className="px-4 pt-4">{alert}</div>}

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 px-4 pt-6">

        {/* ── Hero: Greeting + Streak Stats ── */}
        <motion.div variants={itemAnim} className="relative">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/[0.06] blur-[80px]" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{greeting}</p>
              <h1 className="text-[28px] font-black text-white tracking-tight leading-tight">
                {firstName}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1">
                  <Flame className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-black text-primary">{currentStreak} day streak</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
                  <Trophy className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-400">{rankPoints.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
            <Link
              href="/profile/me"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all"
            >
              <Bell className="h-4 w-4 text-white/60" />
            </Link>
          </div>
        </motion.div>

        {/* ── Main Progress Stats ── */}
        <motion.div variants={itemAnim} className="grid grid-cols-2 gap-3">
          <StatsCard
            label="Daily Goal"
            value={`${todayItemCount}/${dailyTarget}`}
            icon={<Target className="h-4 w-4 text-primary" />}
            progress={dailyPct}
            color="text-primary"
            ring
          />
          <StatsCard
            label="Knowledge Mastery"
            value={`${overallPct}%`}
            icon={<Brain className="h-4 w-4 text-cyan-400" />}
            progress={overallPct}
            color="text-cyan-400"
            ring
          />
          <StatsCard
            label="Questions Solved"
            value={totalQuestions.toLocaleString()}
            icon={<GraduationCap className="h-4 w-4 text-emerald-400" />}
            progress={Math.min(100, (totalQuestions / 1000) * 100)}
            color="text-emerald-400"
          />
          <StatsCard
            label="Active Modules"
            value={`${moduleProgress.length}`}
            icon={<BookOpen className="h-4 w-4 text-amber-400" />}
            progress={Math.min(100, moduleProgress.length * 20)}
            color="text-amber-400"
          />
        </motion.div>

        {/* ── Continue Learning ── */}
        <motion.div variants={itemAnim}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black text-white/60 uppercase tracking-[0.15em]">Continue Learning</h2>
            <Link href="/modules" className="flex items-center gap-1 text-[10px] font-bold text-primary">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {lastLectureActivity?.lecture?.subject ? (
            <Link href={`/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}`}>
              <GlassCard className="group relative overflow-hidden" padding="lg">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-cyan-500" />
                <div className="relative flex items-center gap-4 pl-4">
                  <ProgressRing progress={overallPct} size={52} strokeWidth={3.5}>
                    <span className="text-[10px] font-black text-white">{overallPct}%</span>
                  </ProgressRing>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Resume</span>
                    </div>
                    <h3 className="text-sm font-black text-white truncate">{lastLectureActivity.lecture.title}</h3>
                    <p className="text-[10px] font-medium text-white/40 mt-0.5">{lastLectureActivity.lecture.subject.name}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 border border-primary/30 shrink-0 group-hover:scale-110 transition-transform">
                    <PlayCircle className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          ) : (
            <GlassCard padding="lg" className="text-center">
              <p className="text-xs font-bold text-white/40">No active sessions</p>
              <Link href="/modules" className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-wider">
                Start Learning <ArrowRight className="h-3 w-3" />
              </Link>
            </GlassCard>
          )}
        </motion.div>

        {/* ── AI Widget ── */}
        <motion.div variants={itemAnim}>
          <AIWidget placeholder="Ask about pharmacology, anatomy..." />
        </motion.div>

        {/* ── Active Disciplines ── */}
        <motion.div variants={itemAnim}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black text-white/60 uppercase tracking-[0.15em]">Active Disciplines</h2>
            <Link href="/modules" className="flex items-center gap-1 text-[10px] font-bold text-primary">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {moduleProgress.slice(0, 5).map((mod: any, i: number) => (
              <SubjectCard
                key={mod.id}
                name={mod.name}
                progress={mod.pct}
                href={`/modules/${mod.id}`}
                delay={i * 0.05}
                icon={
                  <BookOpen className={cn(
                    "h-4 w-4",
                    i === 0 ? "text-primary" : i === 1 ? "text-cyan-400" : i === 2 ? "text-emerald-400" : "text-amber-400"
                  )} />
                }
                color={cn(
                  i === 0 ? "text-primary" : i === 1 ? "text-cyan-400" : i === 2 ? "text-emerald-400" : "text-amber-400"
                )}
                gradient={cn(
                  i === 0 ? "from-primary/20" : i === 1 ? "from-cyan-500/20" : i === 2 ? "from-emerald-500/20" : "from-amber-500/20"
                )}
              />
            ))}
            {moduleProgress.length === 0 && (
              <GlassCard padding="lg" className="text-center">
                <p className="text-xs font-bold text-white/40">No disciplines yet</p>
                <Link href="/modules" className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-wider">
                  Browse Modules <ArrowRight className="h-3 w-3" />
                </Link>
              </GlassCard>
            )}
          </div>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div variants={itemAnim}>
          <h2 className="text-[11px] font-black text-white/60 uppercase tracking-[0.15em] mb-3">Quick Access</h2>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: "Videos", icon: PlayCircle, color: "text-rose-400 bg-rose-500/10 border-rose-500/20", href: "/videos" },
              { label: "Exams", icon: Target, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", href: "/past-papers" },
              { label: "Tools", icon: Wrench, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", href: "/study-tools" },
              { label: "Audio", icon: Mic, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", href: "/podcasts" },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <GlassCard padding="md" className="flex flex-col items-center gap-2 text-center">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">{item.label}</span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom spacing ── */}
        <div className="h-4" />
      </motion.div>
    </div>
  );
}
