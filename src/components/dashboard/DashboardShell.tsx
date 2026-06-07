"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Flame, Trophy, BookOpen, ArrowRight,
  ChevronRight, AlertCircle,
  GraduationCap, BarChart2, Sparkles,
  PlayCircle, Zap, Users, Brain, Mic, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  StatCard, StatCardMini, QuickActionCard, QuickLinkCompact, AskDrQFeatured,
  AnimatedProgressBar, AnimatedRing, ActivityBar,
} from "@/components/dashboard/RedesignedComponents";
import { SpacedRepetitionCards } from "@/components/dashboard/SpacedRepetitionCards";
import { DailyQuote } from "@/components/dashboard/DailyQuote";
import { StudyTimer } from "@/components/dashboard/StudyTimer";
import { StreakCelebration } from "@/components/dashboard/StreakCelebration";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const last7DayKeys = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      shortLabel: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2),
    });
  }
  return days;
};

export function DashboardShell({
  firstName, greeting, currentStreak, rankPoints, rankLabel,
  dailyPct, overallPct, todayItemCount, dailyTarget,
  totalQuestions, lastLectureActivity, moduleProgress, activityArr,
  progressToNext, isProfileIncomplete,
}: {
  firstName: string; greeting: string; currentStreak: number;
  rankPoints: number; rankLabel: string;
  dailyPct: number; overallPct: number; todayItemCount: number;
  dailyTarget: number; totalQuestions: number;
  lastLectureActivity: any; moduleProgress: any[];
  activityArr: any[]; progressToNext: number;
  isProfileIncomplete: boolean;
}) {
  const chartDays = last7DayKeys();
  const maxCount = Math.max(...(activityArr?.map((a: any) => a.count) || []), 5);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-primary/30 relative">
      {isProfileIncomplete && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-2.5 px-4 md:py-3 md:px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <AlertCircle size={16} className="shrink-0" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
              Complete your academic details to unlock personalized features.
            </span>
          </div>
          <Link href="/profile/edit" className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap">
            Complete Now <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE VIEW (md:hidden) — Blog-Style Feed
          ════════════════════════════════════════════════ */}
      <div className="md:hidden">
        <div className="px-4 pt-2 pb-6 space-y-5">
          {/* ── Hero ── */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{greeting}</p>
              <h1 className="text-2xl font-black tracking-tighter text-white mt-0.5">{firstName}</h1>
              <p className="text-xs font-semibold text-white/30 mt-0.5">{overallPct}% mastery &middot; {rankLabel}</p>
            </div>
            <div className="flex gap-2">
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full", currentStreak > 0 ? "bg-orange-500/15 border border-orange-500/25" : "bg-muted/10 border border-muted/20")}>
                <Flame size={12} className={currentStreak > 0 ? "text-orange-400" : "text-white/30"} />
                <span className="text-xs font-black text-white">{currentStreak}d</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25">
                <Trophy size={12} className="text-amber-400" />
                <span className="text-xs font-black text-white">{(rankPoints || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <SpacedRepetitionCards />

          {/* ── Quick Tags ── */}
          <div className="mobile-scroll-x flex gap-2 pb-1">
            <Link href="/videos" className="px-4 py-2 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-300 text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all">🎬 Videos</Link>
            <Link href="/past-papers" className="px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all">📝 Exams</Link>
            <Link href="/social" className="px-4 py-2 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all">👥 Community</Link>
            <Link href="/podcasts" className="px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all">🎧 Podcasts</Link>
            <Link href="/atlas" className="px-4 py-2 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all">🧠 Atlas</Link>
            <Link href="/study-tools/flashcards-from-text" className="px-4 py-2 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all">🃏 Flashcards</Link>
          </div>

          {/* ── Specializations ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Specializations</h2>
              <Link href="/modules" className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">View All</Link>
            </div>
            <div className="space-y-3">
              {(moduleProgress.length > 0 ? moduleProgress.slice(0, 3) : []).map((mod: any, idx: number) => (
                <Link key={mod.id} href={`/modules/${mod.id}`} className="blog-card p-4 flex items-center gap-4 active:scale-[0.98] transition-all">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 flex items-center justify-center border border-border/30">
                    <GraduationCap className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{mod.name}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${mod.pct}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white/50">{mod.pct}%</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20 shrink-0" />
                </Link>
              ))}
              {moduleProgress.length === 0 && (
                <Link href="/modules" className="blog-card p-4 flex items-center justify-between active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-white/30" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">No active modules</p>
                      <p className="text-xs text-white/40">Enroll to get started</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </Link>
              )}
            </div>
          </div>

          {/* ── Weekly Activity ── */}
          <div className="blog-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Weekly Activity</span>
              </div>
              <span className="text-xs font-bold text-white/50">
                {activityArr?.reduce((a: number, b: any) => a + b.count, 0) || 0} units
              </span>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-20">
              {chartDays.map((d, i) => {
                const dayData = activityArr?.find((x: any) => x.day === d.key);
                const val = dayData?.count || 0;
                const h = maxCount > 0 ? (val / maxCount) * 100 : 0;
                const isToday = i === chartDays.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex-1 bg-white/5 rounded-full overflow-hidden relative" style={{ height: '100%' }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h, 4)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06 }}
                        className={cn("absolute bottom-0 left-0 right-0 rounded-full", isToday ? "bg-indigo-500 shadow-lg shadow-indigo-500/30" : "bg-white/10")}
                      />
                    </div>
                    <span className={cn("text-[7px] font-black uppercase", isToday ? "text-indigo-400" : "text-white/30")}>{d.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Dr. Q AI ── */}
          <Link href="/ai-chat" className="blog-card p-5 flex items-center gap-4 active:scale-[0.98] transition-all relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">AI Assistant</p>
              <h3 className="text-sm font-black text-white">Ask Dr. Q anything</h3>
              <p className="text-xs text-white/40 mt-0.5">Medical AI at your fingertips</p>
            </div>
            <ChevronRight className="relative h-5 w-5 text-white/30 shrink-0" />
          </Link>

          {/* ── Rank ── */}
          <div className="blog-card p-5 flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle className="text-white/5" strokeWidth="6" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                <motion.circle
                  className="text-amber-500"
                  strokeWidth="6"
                  strokeDasharray="263.76"
                  initial={{ strokeDashoffset: 263.76 }}
                  animate={{ strokeDashoffset: 263.76 - (263.76 * progressToNext) / 100 }}
                  transition={{ duration: 2 }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="42" cx="50" cy="50"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400/70">Prestige</p>
              <h3 className="text-base font-black text-white">{rankLabel}</h3>
              <p className="text-[11px] font-medium text-white/40">{progressToNext}% to next tier</p>
            </div>
            <Link href="/leaderboard" className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-muted/10 border border-muted/20 active:scale-90 transition-all">
              <ChevronRight className="h-4 w-4 text-white/40" />
            </Link>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP VIEW — Split Layout
          Left: scrollable feed | Right: sticky sidebar (xl+)
          ════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 md:px-10 pb-32 pt-4 md:pt-10 lg:pt-32">
          <div className="flex gap-8 xl:gap-10">
            {/* ─── LEFT COLUMN (scrollable feed) ─── */}
            <div className="flex-1 min-w-0">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
              >
                {/* Heading */}
                <motion.div variants={itemAnim} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{greeting}</p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter">
                      <span className="md:hidden">{firstName}</span>
                      <span className="hidden md:inline">{greeting}, <span className="text-primary">{firstName}</span></span>
                    </h1>
                    <p className="hidden md:block mt-1 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      Academic trajectory: <span className="text-foreground">{overallPct}% mastery</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <div className={cn("flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border shadow-sm", currentStreak > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-muted/30 border-border")}>
                      <Flame size={14} className={cn(currentStreak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                      <span className="text-xs md:text-sm font-black text-foreground">{currentStreak}d</span>
                      <span className="hidden md:inline text-xs font-black text-muted-foreground">streak</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
                      <Trophy size={14} className="text-amber-500" />
                      <span className="text-xs md:text-sm font-black text-foreground">{(rankPoints || 0).toLocaleString()}</span>
                      <span className="hidden md:inline text-xs font-black text-muted-foreground">pts</span>
                    </div>
                  </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={itemAnim} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-10">
                  <StatCard label="Daily Objective" value={dailyPct} subtitle={`${todayItemCount} / ${dailyTarget} today`} iconName="Target" color="text-blue-500 bg-blue-500" progress={dailyPct} delay={0.1} />
                  <StatCard label="Knowledge Mastery" value={overallPct} subtitle={`${totalQuestions} concepts`} iconName="Brain" color="text-purple-500 bg-purple-500" progress={overallPct} delay={0.2} />
                  <StatCard label="Clinical Exposure" value={totalQuestions} subtitle="clinical cases resolved" iconName="ShieldCheck" color="text-emerald-500 bg-emerald-500" trend="up" delay={0.3} />
                  <StatCard label="Curriculum Scope" value={moduleProgress.length} subtitle="active specializations" iconName="GraduationCap" color="text-amber-500 bg-amber-500" delay={0.4} />
                </motion.div>

                {/* Spaced Repetition + Weekly Activity */}
                <motion.div variants={itemAnim} className="grid lg:grid-cols-10 gap-4 md:gap-6 mb-6 md:mb-10">
                  <div className="lg:col-span-6">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground mb-3 md:mb-4">
                      Spaced Repetition
                    </h2>
                    <SpacedRepetitionCards />
                  </div>
                  <div className="lg:col-span-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground mb-3 md:mb-4">
                      Weekly Activity
                    </h2>
                    <div className="rounded-2xl border border-border bg-card p-5 shadow flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xl md:text-2xl font-black text-foreground">{activityArr?.reduce((a: number, b: any) => a + b.count, 0) || 0}</p>
                          <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Units this week</p>
                        </div>
                        <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-primary/10 text-primary">
                          <BarChart2 size={18} className="md:w-6 md:h-6" />
                        </div>
                      </div>
                      <div className="flex items-end justify-between gap-2 md:gap-3 h-24 md:h-32 px-1 md:px-2">
                        {chartDays.map((d, i) => {
                          const dayData = activityArr?.find((x: any) => x.day === d.key);
                          const val = dayData?.count || 0;
                          const h = maxCount > 0 ? (val / maxCount) * 100 : 0;
                          const isToday = i === chartDays.length - 1;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 md:gap-3">
                              <ActivityBar height={h} delay={i * 0.1} isToday={isToday} />
                              <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-tighter", isToday ? "text-primary" : "text-muted-foreground")}>{d.shortLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Specializations */}
                <motion.div variants={itemAnim} className="mb-6 md:mb-10">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground">
                      Active Specializations
                    </h2>
                    <Link href="/modules" className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                      View All
                    </Link>
                  </div>
                  {moduleProgress.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {(moduleProgress.slice(0, 4) as any[]).map((mod, idx) => (
                        <Link key={mod.id} href={`/modules/${mod.id}`} className="group p-4 md:p-5 rounded-xl md:rounded-2xl border border-border bg-card hover:border-primary/50 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                              <GraduationCap className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <span className="text-base md:text-lg font-black text-foreground">{mod.pct}%</span>
                          </div>
                          <h4 className="text-xs md:text-sm font-black text-foreground group-hover:text-primary transition-colors truncate mb-3">{mod.name}</h4>
                          <AnimatedProgressBar progress={mod.pct} />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl md:rounded-2xl border border-dashed border-border p-6 bg-card/30 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-bold text-muted-foreground">Enroll in your first module to begin.</p>
                        <Link href="/modules" className="px-6 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                          Browse Modules
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Quick Action Tools */}
                <motion.div variants={itemAnim} className="mb-6 md:mb-10">
                  <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground mb-3 md:mb-4">
                    Rapid Response Tools
                  </h2>
                  <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-4 no-scrollbar snap-x snap-mandatory scroll-smooth">
                    <QuickActionCard label="Video Hub" iconName="PlayCircle" color="bg-rose-500" href="/videos" />
                    <QuickActionCard label="Mock Exams" iconName="Zap" color="bg-emerald-500" href="/past-papers" />
                    <QuickActionCard label="Collaborate" iconName="Users" color="bg-blue-500" href="/social" />
                    <QuickActionCard label="Flashcards" iconName="Brain" color="bg-purple-500" href="/study-tools/flashcards-from-text" />
                    <QuickActionCard label="Audio Lab" iconName="Mic" color="bg-amber-500" href="/podcasts" />
                    <QuickActionCard label="Atlas" iconName="Search" color="bg-indigo-500" href="/atlas" />
                    <QuickActionCard label="Medical Books" iconName="BookOpen" color="bg-sky-500" href="/medical-books" />
                  </div>
                </motion.div>

                {/* Rank / Prestige */}
                <motion.div variants={itemAnim} className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  <AnimatedRing progress={progressToNext} size={64} color="text-amber-500" />
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-500 mb-1">Prestige Standing</p>
                    <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tight">{rankLabel}</h3>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground mt-1">
                      You are <span className="text-foreground font-bold">{progressToNext}%</span> of the way to the next tier.
                    </p>
                  </div>
                  <Link href="/leaderboard" className="h-10 md:h-12 px-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted transition-all font-black text-[10px] md:text-xs uppercase tracking-widest shrink-0">
                    Leaderboard <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* ─── RIGHT SIDEBAR (sticky, hidden below xl) ─── */}
            <div className="hidden xl:block w-[320px] shrink-0">
              <div className="sticky top-28 space-y-5">
                <DailyQuote />

                <StudyTimer />

                <StreakCelebration currentStreak={currentStreak} />

                <AskDrQFeatured />

                <div className="dash-sidebar-card">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Quick Stats</h3>
                  <div className="space-y-2">
                    <StatCardMini label="Daily" value={`${todayItemCount} / ${dailyTarget}`} iconName="Target" color="text-blue-500 bg-blue-500" />
                    <StatCardMini label="Mastery" value={`${overallPct}%`} iconName="Brain" color="text-purple-500 bg-purple-500" />
                    <StatCardMini label="Streak" value={`${currentStreak} day${currentStreak !== 1 ? "s" : ""}`} iconName="Flame" color="text-orange-500 bg-orange-500" />
                  </div>
                </div>

                <div className="dash-sidebar-card">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Quick Links</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <QuickLinkCompact label="Videos" iconName="PlayCircle" color="bg-rose-500" href="/videos" />
                    <QuickLinkCompact label="Exams" iconName="Zap" color="bg-emerald-500" href="/past-papers" />
                    <QuickLinkCompact label="Community" iconName="Users" color="bg-blue-500" href="/social" />
                    <QuickLinkCompact label="Flashcards" iconName="Brain" color="bg-purple-500" href="/study-tools/flashcards-from-text" />
                    <QuickLinkCompact label="Podcasts" iconName="Mic" color="bg-amber-500" href="/podcasts" />
                    <QuickLinkCompact label="Atlas" iconName="Search" color="bg-indigo-500" href="/atlas" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
