"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Flame, Trophy, BookOpen, ArrowRight,
  ChevronRight, AlertCircle,
  GraduationCap, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  StatCard, ContinueLearningHero, QuickActionCard, AskDrQFeatured,
  AnimatedProgressBar, AnimatedRing, ActivityBar,
} from "@/components/dashboard/RedesignedComponents";

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
      {/* Incomplete Profile Banner */}
      {isProfileIncomplete && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white py-2.5 px-4 md:py-3 md:px-6 flex items-center justify-between shadow-2xl">
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

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-[1440px] px-4 sm:px-6 md:px-10 pb-32 pt-4 md:pt-10 lg:pt-32"
      >
        {/* ─── 1. Greeting + Streak/Points ─── */}
        <motion.div variants={itemAnim} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-12">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{greeting}</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
              <span className="md:hidden">{firstName}</span>
              <span className="hidden md:inline">{greeting}, <span className="text-primary">{firstName}</span></span>
            </h1>
            <p className="hidden md:block mt-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
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

        {/* ─── 2. Stats Grid (2×2 mobile → 4 cols desktop) ─── */}
        <motion.div variants={itemAnim} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-12">
          <StatCard label="Daily Objective" value={dailyPct} subtitle={`${todayItemCount} / ${dailyTarget} today`} iconName="Target" color="text-blue-500 bg-blue-500" progress={dailyPct} delay={0.1} />
          <StatCard label="Knowledge Mastery" value={overallPct} subtitle={`${totalQuestions} concepts`} iconName="Brain" color="text-purple-500 bg-purple-500" progress={overallPct} delay={0.2} />
          <StatCard label="Clinical Exposure" value={totalQuestions} subtitle="clinical cases resolved" iconName="ShieldCheck" color="text-emerald-500 bg-emerald-500" trend="up" delay={0.3} />
          <StatCard label="Curriculum Scope" value={moduleProgress.length} subtitle="active specializations" iconName="GraduationCap" color="text-amber-500 bg-amber-500" delay={0.4} />
        </motion.div>

        {/* ─── 3. Continue Learning + 4. Activity Chart ─── */}
        <motion.div variants={itemAnim} className="grid lg:grid-cols-10 gap-4 md:gap-8 mb-6 md:mb-12">
          <div className="lg:col-span-6">
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground mb-3 md:mb-6">
              Continue Learning
            </h2>
            {lastLectureActivity?.lecture?.subject ? (
              <ContinueLearningHero
                module={{
                  title: lastLectureActivity.lecture.title,
                  subject: lastLectureActivity.lecture.subject.name,
                  href: `/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}`,
                }}
                progress={overallPct}
                delay={0.5}
              />
            ) : (
              <div className="rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-border bg-card/50 p-6 md:p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-bold text-muted-foreground">No active sessions found. Ready to start?</p>
                  <Link href="/modules" className="px-6 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                    Browse Modules
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground mb-3 md:mb-6">
              Weekly Activity
            </h2>
            <div className="rounded-[2rem] md:rounded-[2.5rem] border border-border bg-card p-5 md:p-8 shadow-xl flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4 md:mb-8">
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

        {/* ─── 5. Specializations + 6. AI Integration ─── */}
        <motion.div variants={itemAnim} className="grid lg:grid-cols-10 gap-4 md:gap-8 mb-6 md:mb-12">
          <div className="lg:col-span-6">
            <div className="flex justify-between items-center mb-3 md:mb-6">
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
                  <Link key={mod.id} href={`/modules/${mod.id}`} className="group p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-border bg-card hover:border-primary/50 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                      <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                        <GraduationCap className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <span className="text-base md:text-lg font-black text-foreground">{mod.pct}%</span>
                    </div>
                    <h4 className="text-xs md:text-sm font-black text-foreground group-hover:text-primary transition-colors truncate mb-3 md:mb-4">{mod.name}</h4>
                    <AnimatedProgressBar progress={mod.pct} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-dashed border-border p-6 md:p-8 bg-card/30 text-center">
                <div className="flex flex-col items-center gap-3">
                  <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-bold text-muted-foreground">Enroll in your first module to begin.</p>
                  <Link href="/modules" className="px-6 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                    Browse Modules
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground mb-3 md:mb-6">
              AI Integration
            </h2>
            <AskDrQFeatured />
          </div>
        </motion.div>

        {/* ─── 7. Quick Action Tools ─── */}
        <motion.div variants={itemAnim} className="mb-6 md:mb-12">
          <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] md:tracking-[0.3em] text-muted-foreground mb-3 md:mb-6">
            Rapid Response Tools
          </h2>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-4 no-scrollbar">
            <QuickActionCard label="Video Hub" iconName="PlayCircle" color="bg-rose-500" href="/videos" />
            <QuickActionCard label="Mock Exams" iconName="Zap" color="bg-emerald-500" href="/past-papers" />
            <QuickActionCard label="Collaborate" iconName="Users" color="bg-blue-500" href="/social" />
            <QuickActionCard label="Flashcards" iconName="Brain" color="bg-purple-500" href="/study-tools/flashcards-from-text" />
            <QuickActionCard label="Audio Lab" iconName="Mic" color="bg-amber-500" href="/podcasts" />
            <QuickActionCard label="Atlas" iconName="Search" color="bg-indigo-500" href="/atlas" />
            <QuickActionCard label="Medical Books" iconName="BookOpen" color="bg-sky-500" href="/medical-books" />
          </div>
        </motion.div>

        {/* ─── 8. Rank / Prestige Card ─── */}
        <motion.div variants={itemAnim} className="p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-border bg-card/50 backdrop-blur-xl flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <AnimatedRing progress={progressToNext} size={72} color="text-amber-500" />
          <div className="flex-1 text-center md:text-left">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-500 mb-1">Prestige Standing</p>
            <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{rankLabel}</h3>
            <p className="text-xs md:text-sm font-medium text-muted-foreground mt-2">
              Accelerate your studies to reach the next tier. You are <span className="text-foreground font-bold">{progressToNext}%</span> of the way there.
            </p>
          </div>
          <Link href="/leaderboard" className="h-12 md:h-14 px-6 md:px-8 flex items-center justify-center gap-2 md:gap-3 rounded-xl md:rounded-2xl border border-border bg-card hover:bg-slate-100 dark:hover:bg-white/5 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest shrink-0">
            Leaderboard <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
