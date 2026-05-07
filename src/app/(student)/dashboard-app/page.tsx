import { auth } from "@/lib/auth";
import { redirectIncompleteStudentToRegister } from "@/lib/student-onboarding";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Sparkles, BookOpen, Target, Trophy, Flame,
  Brain, Zap, TrendingUp, ArrowRight, BarChart2, Clock,
  CheckCircle, Star, GraduationCap, Activity, Search,
  PlayCircle, Mic, Users, Heart, ShieldCheck
} from "lucide-react";
import { getUserRankInfo } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { fetchDashboardData } from "@/lib/dashboard-queries";
import { FadeIn, AnimatedBar } from "@/components/dashboard/DashboardAnimations";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await redirectIncompleteStudentToRegister(session);

  const userId = session.user.id;
  const chartDays = last7DayKeys();
  const chartDayKeyStrings = chartDays.map((d) => d.key);

  let dashData: Awaited<ReturnType<typeof fetchDashboardData>> | null = null;
  let rankInfo: Awaited<ReturnType<typeof getUserRankInfo>> | null = null;

  try {
    [dashData, rankInfo] = await Promise.all([
      fetchDashboardData(userId, chartDayKeyStrings),
      getUserRankInfo(userId),
    ]);
  } catch (err) {
    console.warn("[dashboard-app] DB error:", err instanceof Error ? err.message : err);
  }

  const { stats, moduleProgress, lastLectureActivity } = (dashData as any) || {
    stats: { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 },
    moduleProgress: [],
    lastLectureActivity: null,
  };

  const safeStats = stats || { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 };
  const { totalQuestions, totalCorrect, todayItemCount, currentStreak } = safeStats;
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const dailyTarget = 50;
  const dailyPct = Math.min(100, Math.round((todayItemCount / dailyTarget) * 100));
  const firstName = session.user.name?.split(" ")[0] || "Student";

  const { label: rankLabel, totalPoints: rankPoints } = (rankInfo as any) || {
    label: "Med Student",
    totalPoints: 0,
  };

  const activityArr = (dashData as any)?.activity || [];
  const maxCount = Math.max(...activityArr.map((a: any) => a.count), 5);

  return (
    <div className="min-h-screen bg-[#09080F] selection:bg-primary/30 relative">
      {/* Dynamic Background Noise/Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 pb-20 pt-28 md:px-8 lg:pt-32">
        
        {/* ══════════════ TOP COMMAND BAR ══════════════ */}
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <FadeIn delay={0.1}>
              <div className="flex items-center gap-3">
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                    <Activity className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Clinical Performance Dashboard</p>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                       Salutations, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Dr. {firstName}</span>
                    </h1>
                 </div>
              </div>
              <p className="text-sm font-medium text-white/40 max-w-xl">
                 Your academic trajectory is currently at <span className="text-white font-bold">{overallPct}% mastery</span>. 
                 System diagnostics indicate peak focus levels.
              </p>
           </FadeIn>

           <FadeIn delay={0.3}>
              <div className="flex items-center gap-3">
                 <div className="group relative flex items-center gap-4 rounded-3xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-xl transition-all hover:bg-white/[0.06]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 shadow-inner">
                       <Flame className={cn("h-6 w-6 transition-transform group-hover:scale-110", currentStreak > 0 ? "text-orange-500" : "text-white/20")} />
                    </div>
                    <div className="pr-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Active Streak</p>
                       <p className="text-xl font-black text-white">{currentStreak} <span className="text-xs text-white/40 font-bold uppercase">Days</span></p>
                    </div>
                    {currentStreak > 0 && <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 animate-ping" />}
                 </div>

                 <div className="group flex items-center gap-4 rounded-3xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-xl transition-all hover:bg-white/[0.06]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 shadow-inner">
                       <Trophy className="h-6 w-6 text-amber-500 transition-transform group-hover:rotate-12" />
                    </div>
                    <div className="pr-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{rankLabel}</p>
                       <p className="text-xl font-black text-white">{(rankPoints || 0).toLocaleString()} <span className="text-xs text-white/40 font-bold uppercase">Pts</span></p>
                    </div>
                 </div>
              </div>
           </FadeIn>
        </div>

        {/* ══════════════ KEY PERFORMANCE INDICATORS ══════════════ */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Daily Objective"
            value={`${dailyPct}%`}
            sub={`${todayItemCount} of ${dailyTarget} units`}
            icon={Target}
            color="blue"
            progress={dailyPct}
          />
          <KPICard
            label="Knowledge Mastery"
            value={`${overallPct}%`}
            sub={`${totalCorrect} validated answers`}
            icon={Brain}
            color="purple"
            progress={overallPct}
          />
          <KPICard
            label="Clinical Exposure"
            value={totalQuestions.toLocaleString()}
            sub="total questions resolved"
            icon={ShieldCheck}
            color="emerald"
          />
          <KPICard
            label="Curriculum Scope"
            value={moduleProgress.length}
            sub="active medical modules"
            icon={GraduationCap}
            color="amber"
          />
        </div>

        {/* ══════════════ BENTO GRID LAYOUT ══════════════ */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Main Content Area (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ── SECTION: MISSION CONTINUATION ── */}
            {lastLectureActivity && (
              <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent p-8 shadow-2xl transition-all hover:border-primary/30">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] transition-transform group-hover:scale-110 duration-700">
                   <BookOpen className="h-48 w-48 text-primary" />
                </div>
                
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                       <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Mission Persistence</p>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                       Last accessed {new Date(lastLectureActivity.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/10">
                        <PlayCircle className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight capitalize group-hover:text-primary transition-colors">
                          {lastLectureActivity.lecture.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                           <span className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-black text-white/50 uppercase tracking-widest">
                              {lastLectureActivity.lecture.subject.name}
                           </span>
                           <span className="h-1 w-1 rounded-full bg-white/20" />
                           <span className="text-xs font-bold text-white/30">Module: {lastLectureActivity.lecture.subject.module?.name ?? "General"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href={`/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}`}
                      className="group/btn relative flex shrink-0 items-center gap-3 overflow-hidden rounded-2xl bg-primary px-10 py-5 text-sm font-black text-white shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                      CONTINUE PHASE <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION: MODULE ANALYSIS ── */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-1 rounded-full bg-primary" />
                     <h2 className="text-2xl font-black text-white tracking-tight">Active Specializations</h2>
                  </div>
                  <Link href="/modules" className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
                     View All Curricula <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
               </div>

               <div className="grid gap-4 sm:grid-cols-2">
                  {(moduleProgress.slice(0, 4) as any[]).map((mod: any, idx) => (
                    <Link
                      key={mod.id}
                      href={`/modules/${mod.id}`}
                      className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.05] hover:border-primary/20"
                    >
                      <div className="relative z-10">
                        <div className="mb-4 flex items-center justify-between">
                           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                              <BookOpen className="h-5 w-5" />
                           </div>
                           <span className={cn(
                             "text-sm font-black",
                             mod.pct >= 70 ? "text-emerald-500" : mod.pct > 0 ? "text-amber-500" : "text-white/20"
                           )}>
                             {mod.pct}%
                           </span>
                        </div>
                        <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors truncate">{mod.name}</h4>
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                           <div 
                             className={cn("h-full rounded-full transition-all duration-1000", mod.pct >= 70 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary")} 
                             style={{ width: `${Math.max(mod.pct, 2)}%` }} 
                           />
                        </div>
                      </div>
                      <div className="absolute -bottom-4 -right-4 text-white/[0.02] font-black text-6xl italic group-hover:text-primary/[0.03] transition-colors">
                         0{idx + 1}
                      </div>
                    </Link>
                  ))}
               </div>
            </div>

            {/* ── SECTION: INTEL HUB ── */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {[
                { href: "/videos",      label: "Video Hub",    icon: PlayCircle, color: "text-red-400",    bg: "bg-red-500/10"    },
                { href: "/past-papers", label: "Mock Exams",   icon: Zap,        color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { href: "/forum",       label: "Collaborate",  icon: Users,      color: "text-blue-400",    bg: "bg-blue-500/10"    },
                { href: "/podcasts",    label: "Audio Lab",    icon: Mic,        color: "text-amber-400",   bg: "bg-amber-500/10"   },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex flex-col items-center gap-3 rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.06] hover:-translate-y-1 hover:border-primary/20"
                >
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-all group-hover:scale-110 group-hover:shadow-2xl", item.bg)}>
                    <item.icon className={cn("h-7 w-7", item.color)} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Sidebar (4/12) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* ── WIDGET: ACTIVITY RADIUS ── */}
            <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 shadow-xl backdrop-blur-md">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Learning Intensity</p>
                  <p className="text-2xl font-black text-white">
                    {activityArr.reduce((a: number, b: any) => a + b.count, 0)} <span className="text-xs text-white/30 uppercase tracking-tighter">Units / Week</span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                   <BarChart2 className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="flex h-32 items-end justify-between gap-2.5 px-1">
                {chartDays.map((d, i) => {
                  const dayData = activityArr.find((x: any) => x.day === d.key);
                  const val = dayData?.count || 0;
                  const h = maxCount > 0 ? (val / maxCount) * 100 : 0;
                  const isToday = i === chartDays.length - 1;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-3">
                      <div className="relative w-full flex-1 overflow-hidden rounded-full bg-white/5">
                        <AnimatedBar height={Math.max(h, val > 0 ? 15 : 5)} delay={i * 0.1} isToday={isToday} />
                      </div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-tighter",
                        isToday ? "text-primary" : "text-white/20"
                      )}>{d.shortLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── WIDGET: AI SYNERGY ── */}
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-2xl">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-[80px] animate-pulse" />
              <div className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 shadow-inner">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Sentinel AI</p>
                    <h4 className="text-xl font-black text-white">Ask Dr. Q</h4>
                  </div>
                </div>
                <p className="mb-8 text-sm leading-relaxed text-white/50 font-medium">
                  Instant synthesis of clinical data and curriculum-aligned medical explanations.
                </p>
                <Link
                  href="/ai-chat"
                  className="group/ai relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white px-6 py-5 text-xs font-black uppercase tracking-widest text-black shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-primary/10 -translate-x-full group-hover/ai:translate-x-0 transition-transform duration-500" />
                  <Sparkles className="h-4 w-4" /> <span className="relative z-10">Initialize Session</span>
                </Link>
              </div>
            </div>

            {/* ── WIDGET: PRESTIGE METRICS ── */}
            <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Prestige Standing</p>
                  <p className="text-xl font-black text-white">{rankLabel}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-white/30 mb-3">
                <span>{(rankPoints || 0).toLocaleString()} pts</span>
                <span className="text-primary">Next Phase</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  style={{ width: `${Math.min(((rankInfo as any)?.progressToNext || 0), 100)}%` }}
                />
              </div>
              <p className="mt-4 text-[10px] font-bold text-center text-white/20 uppercase tracking-tighter">
                Accelerate your studies to reach the next professional tier.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── KPI Card Component ── */
function KPICard({ label, value, sub, icon: Icon, color, progress }: {
  label: string; value: string | number; sub: string;
  icon: any; color: "blue" | "purple" | "emerald" | "amber";
  progress?: number;
}) {
  const colors = {
    blue:    "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
    purple:  "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
    amber:   "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
  };

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:bg-white/[0.06] hover:border-white/10 shadow-2xl">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/[0.02] blur-2xl" />
      <div className="relative">
        <div className={cn("mb-5 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border backdrop-blur-xl transition-all group-hover:scale-110", colors[color])}>
          <Icon className="h-7 w-7" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">{label}</p>
        <p className="mt-1 text-3xl font-black text-white tracking-tighter">{value}</p>
        <p className="mt-1 text-xs font-medium text-white/40">{sub}</p>
        {progress !== undefined && (
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", 
                color === "blue" ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" : 
                color === "purple" ? "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]" : 
                "bg-primary"
              )}
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
