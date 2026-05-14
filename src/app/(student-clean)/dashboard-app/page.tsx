import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Flame, Trophy, BarChart2, AlertCircle, ArrowRightIcon
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserRankInfo } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { fetchDashboardData } from "@/lib/dashboard-queries";
import { FadeIn } from "@/components/dashboard/DashboardAnimations";
import { 
  StatCard, 
  ContinueLearningHero, 
  EmptyState, 
  QuickActionCard, 
  AskDrQFeatured,
  AnimatedProgressBar,
  AnimatedRing,
  ActivityBar
} from "@/components/dashboard/RedesignedComponents";
import { 
  MobileContinueCard,
  MobileStatCard,
  MobileQuickCard,
  MobileSpecCard,
  MobileDrQCard
} from "@/components/dashboard/MobileDashboardComponents";
import { MobileDashboardWrapper } from "@/components/dashboard/MobileDashboardWrapper";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // if (!user) redirect("/auth?mode=login");

  // Fetch full user profile to check for missing academic info
  let fullProfile = user ? await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, universityId: true, facultyId: true, semesterId: true }
  }) : null;

  // Sync logic: If Prisma is missing data but metadata has it, sync now
  if (user && (!fullProfile || !fullProfile.universityId)) {
    const meta = user.user_metadata;
    if (meta?.universityId) {
       fullProfile = await prisma.user.upsert({
         where: { id: user.id },
         create: {
            id: user.id,
            email: user.email!,
            name: meta.name || user.email?.split('@')[0] || "Student",
            universityId: meta.universityId,
            facultyId: meta.facultyId,
            semesterId: meta.semesterId,
         },
         update: {
            universityId: meta.universityId,
            facultyId: meta.facultyId,
            semesterId: meta.semesterId,
         }
       });
    }
  }

  const isProfileIncomplete = user && (!fullProfile?.universityId || !fullProfile?.semesterId);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#05070f] text-white p-6">
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p className="text-slate-400 mb-8 text-center">Please sign in to access your personalized medical dashboard.</p>
        <Link href="/auth?mode=login" className="px-8 py-3 bg-blue-600 rounded-2xl font-bold hover:bg-blue-700 transition-all">Sign In</Link>
      </div>
    );
  }

  const userId = user.id;
  const chartDays = last7DayKeys();
  const chartDayKeyStrings = chartDays.map((d) => d.key);

  let dashData: any = null;
  let rankInfo: any = null;

  try {
    [dashData, rankInfo] = await Promise.all([
      fetchDashboardData(userId, chartDayKeyStrings),
      getUserRankInfo(userId),
    ]);
  } catch (err) {
    console.warn("[dashboard-app] DB error:", err instanceof Error ? err.message : err);
  }

  const { stats, moduleProgress, lastLectureActivity, activity: activityArr } = dashData || {
    stats: { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 },
    moduleProgress: [],
    lastLectureActivity: null,
    activity: [],
  };

  const safeStats = stats || { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 };
  const { totalQuestions, totalCorrect, todayItemCount, currentStreak } = safeStats;
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const dailyTarget = 50;
  const dailyPct = Math.min(100, Math.round((todayItemCount / dailyTarget) * 100));
  const firstName = (user.user_metadata?.name || user.email || "Student").split(" ")[0];
  const userInitial = firstName.charAt(0);

  const { label: rankLabel, totalPoints: rankPoints = 0, progressToNext = 0 } = rankInfo || {
    label: "Med Student",
    totalPoints: 0,
    progressToNext: 0
  };

  const maxCount = Math.max(...(activityArr?.map((a: any) => a.count) || []), 5);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      {/* 📱 MOBILE VIEW */}
      <MobileDashboardWrapper 
      user={{
          name: user.user_metadata?.name || user.email || "Student",
          role: "Academic Tier: " + rankLabel,
          initial: userInitial
        }}
      >
          <section className="space-y-1">
            <p className="text-[11px] font-medium text-[#8b8fa8] uppercase tracking-[0.08em]">{greeting},</p>
            <h1 className="text-[26px] font-bold text-white leading-tight">
              Dr. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f5fff] to-[#7b5fff]">{firstName}</span>
            </h1>
            <div className="flex gap-2 pt-2">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181a2e] border border-[#2a2d4a]">
                 <div className="text-amber-500 text-sm">🔥</div>
                 <span className="text-[13px] font-bold text-white">{currentStreak} Days</span>
              </div>
              <div className="flex-1 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181a2e] border border-[#2a2d4a]">
                 <div className="text-amber-400 text-sm">🏆</div>
                 <span className="text-[13px] font-bold text-white">{rankPoints.toLocaleString()} Pts</span>
              </div>
            </div>
          </section>

          <section>
            {lastLectureActivity ? (
              <MobileContinueCard 
                module={lastLectureActivity.lecture.title}
                subject={lastLectureActivity.lecture.subject.name}
                progress={overallPct}
              />
            ) : (
              <MobileContinueCard module="Start Learning" subject="No active session" progress={0} />
            )}
          </section>

          <section className="space-y-3.5">
            <h2 className="text-[11px] font-medium text-[#8b8fa8] uppercase tracking-wider">Your Progress</h2>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-1">
              <MobileStatCard label="Daily Goal" value={`${dailyPct}%`} iconName="Target" colorClass="bg-[#3b82f6]" progress={dailyPct} delay={0} />
              <MobileStatCard label="Knowledge" value={`${overallPct}%`} iconName="Brain" colorClass="bg-[#8b5cf6]" progress={overallPct} delay={0.05} />
              <MobileStatCard label="Clinical Exp." value={totalQuestions.toLocaleString()} iconName="Stethoscope" colorClass="bg-[#06b6d4]" progress={75} delay={0.1} />
              <MobileStatCard label="Modules" value={moduleProgress.length} iconName="Library" colorClass="bg-[#f59e0b]" progress={60} delay={0.15} />
            </div>
          </section>

          <section className="space-y-3.5">
            <h2 className="text-[11px] font-medium text-[#8b8fa8] uppercase tracking-wider">Quick Access</h2>
            <div className="grid grid-cols-3 gap-2.5">
              <MobileQuickCard label="Video Hub" iconName="PlayCircle" color="bg-red-500/10" delay={0.1} />
              <MobileQuickCard label="Mock Exams" iconName="Zap" color="bg-emerald-500/10" delay={0.15} />
              <MobileQuickCard label="Collaborate" iconName="Users" color="bg-indigo-500/10" delay={0.2} />
              <MobileQuickCard label="Flashcards" iconName="Layers" color="bg-purple-500/10" delay={0.25} />
              <MobileQuickCard label="Audio Lab" iconName="Mic" color="bg-amber-500/10" delay={0.3} />
              <MobileQuickCard label="Prestige" iconName="BarChart" color="bg-cyan-500/10" delay={0.35} />
            </div>
          </section>

          <section className="space-y-3.5">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-[15px] font-semibold text-white">Active Specializations</h2>
              <Link href="/modules" className="text-[11px] font-bold text-[#4f5fff]">View all →</Link>
            </div>
            <div className="space-y-0">
              {moduleProgress.slice(0, 3).map((mod: any, i: number) => (
                <MobileSpecCard 
                  key={mod.id}
                  name={mod.name}
                  iconName={i === 0 ? "Brain" : i === 1 ? "Activity" : "Microscope"}
                  progress={mod.pct}
                  delay={0.1 * i}
                />
              ))}
            </div>
          </section>

          <section>
            <MobileDrQCard />
          </section>
      </MobileDashboardWrapper>

      {/* 🖥️ DESKTOP VIEW */}
      <div className="hidden md:block min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-primary/30 relative">
        {/* Incomplete Profile Alert Banner */}
        {isProfileIncomplete && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white py-3 px-6 flex items-center justify-between shadow-2xl animate-fade-in">
             <div className="flex items-center gap-3">
                <AlertCircle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Incomplete Profile detected. Please finalize your academic details to unlock full platform features.</span>
             </div>
             <Link href="/profile/edit" className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all">
                Complete Now <ArrowRightIcon size={12} />
             </Link>
          </div>
        )}

        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-6 pb-20 pt-10 md:px-10 lg:pt-32">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
             <FadeIn delay={0.1}>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
                  {greeting}, <span className="text-primary">{firstName}</span>
                </h1>
                <p className="mt-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Academic trajectory: <span className="text-foreground">{overallPct}% mastery</span>
                </p>
             </FadeIn>

             <FadeIn delay={0.2} className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-sm">
                   <Flame size={16} className={cn(currentStreak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                   <span className="text-sm font-black text-foreground">{currentStreak} day streak</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
                   <Trophy size={16} className="text-amber-500" />
                   <span className="text-sm font-black text-foreground">{(rankPoints || 0).toLocaleString()} points</span>
                </div>
             </FadeIn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
             <StatCard label="Daily Objective" value={dailyPct} subtitle={`${todayItemCount} / ${dailyTarget} units today`} iconName="Target" color="text-blue-500 bg-blue-500" progress={dailyPct} delay={0.1} />
             <StatCard label="Knowledge Mastery" value={overallPct} subtitle={`${totalCorrect} validated concepts`} iconName="Brain" color="text-purple-500 bg-purple-500" progress={overallPct} delay={0.2} />
             <StatCard label="Clinical Exposure" value={totalQuestions} subtitle="total clinical cases resolved" iconName="ShieldCheck" color="text-emerald-500 bg-emerald-500" trend="up" delay={0.3} />
             <StatCard label="Curriculum Scope" value={moduleProgress.length} subtitle="active medical specializations" iconName="GraduationCap" color="text-amber-500 bg-amber-500" delay={0.4} />
          </div>

          <div className="grid lg:grid-cols-10 gap-8 mb-12">
             <div className="lg:col-span-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Mission Continuation</h2>
                {lastLectureActivity ? (
                  <ContinueLearningHero module={{ title: lastLectureActivity.lecture.title, subject: lastLectureActivity.lecture.subject.name, href: `/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}` }} progress={overallPct} delay={0.5} />
                ) : (
                  <div className="rounded-[2.5rem] border border-dashed border-border bg-card/50">
                    <EmptyState label="No active sessions found. Ready to dive back in?" iconName="PlayCircle" href="/modules" />
                  </div>
                )}
             </div>

             <div className="lg:col-span-4 flex flex-col h-full">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Learning Intensity</h2>
                <div className="flex-1 rounded-[2.5rem] border border-border bg-card p-8 shadow-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-8">
                      <div><p className="text-2xl font-black text-foreground">{activityArr?.reduce((a: number, b: any) => a + b.count, 0) || 0}</p><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Units this week</p></div>
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary"><BarChart2 size={24} /></div>
                   </div>
                   <div className="flex items-end justify-between gap-3 h-32 px-2">
                      {chartDays.map((d, i) => {
                         const dayData = activityArr?.find((x: any) => x.day === d.key);
                         const val = dayData?.count || 0;
                         const h = maxCount > 0 ? (val / maxCount) * 100 : 0;
                         const isToday = i === chartDays.length - 1;
                         return (
                           <div key={i} className="flex-1 flex flex-col items-center gap-3">
                              <ActivityBar height={h} delay={i * 0.1} isToday={isToday} />
                              <span className={cn("text-[9px] font-black uppercase tracking-tighter", isToday ? "text-primary" : "text-muted-foreground")}>{d.shortLabel}</span>
                           </div>
                         );
                      })}
                   </div>
                </div>
             </div>
          </div>

          <div className="grid lg:grid-cols-10 gap-8 mb-12">
             <div className="lg:col-span-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Active Specializations</h2>
                  <Link href="/modules" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                   {moduleProgress.length > 0 ? (
                     (moduleProgress.slice(0, 4) as any[]).map((mod, idx) => (
                      <Link key={mod.id} href={`/modules/${mod.id}`} className="group p-6 rounded-[2rem] border border-border bg-card hover:border-primary/50 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                           <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                              <span className="text-muted-foreground group-hover:text-primary transition-colors"><BookOpenIconReplacer size={20} /></span>
                           </div>
                           <span className="text-lg font-black text-foreground">{mod.pct}%</span>
                        </div>
                        <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate mb-4">{mod.name}</h4>
                        <AnimatedProgressBar progress={mod.pct} />
                        <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last studied 2 days ago</p>
                      </Link>
                     ))
                   ) : (
                     <div className="col-span-2 rounded-[2rem] border border-dashed border-border p-4 bg-card/30">
                       <EmptyState label="Enroll in your first module to begin your journey." iconName="GraduationCap" href="/modules" />
                     </div>
                   )}
                </div>
             </div>
             <div className="lg:col-span-4"><h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">AI Integration</h2><AskDrQFeatured /></div>
          </div>

          <div className="mb-12">
             <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Rapid Response Tools</h2>
             <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                <QuickActionCard label="Video Hub" iconName="PlayCircle" color="bg-rose-500" href="/videos" />
                <QuickActionCard label="Mock Exams" iconName="Zap" color="bg-emerald-500" href="/past-papers" />
                <QuickActionCard label="Collaborate" iconName="Users" color="bg-blue-500" href="/social" />
                <QuickActionCard label="Flashcards" iconName="Brain" color="bg-purple-500" href="/study-tools/flashcards-from-text" />
                <QuickActionCard label="Audio Lab" iconName="Mic" color="bg-amber-500" href="/podcasts" />
                <QuickActionCard label="Atlas" iconName="Search" color="bg-indigo-500" href="/atlas" />
             </div>
          </div>

          <div className="mt-12 p-8 rounded-[3rem] border border-border bg-card/50 backdrop-blur-xl flex flex-col md:flex-row items-center gap-10">
             <AnimatedRing progress={progressToNext} size={96} color="text-amber-500" />
             <div className="flex-1 text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-1">Prestige Standing</p>
                <h3 className="text-3xl font-black text-foreground tracking-tight">{rankLabel}</h3>
                <p className="text-sm font-medium text-muted-foreground mt-2">Accelerate your studies to reach the next professional tier. You are <span className="text-foreground font-bold">{progressToNext}%</span> of the way there.</p>
             </div>
             <Link href="/leaderboard" className="h-14 px-8 flex items-center justify-center gap-3 rounded-2xl border border-border bg-card hover:bg-slate-100 dark:hover:bg-white/5 transition-all font-black text-xs uppercase tracking-widest">View Leaderboard</Link>
          </div>
        </div>
      </div>
    </>
  );
}

function BookOpenIconReplacer({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
