import { auth } from "@/lib/auth";
import { redirectIncompleteStudentToRegister } from "@/lib/student-onboarding";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Sparkles, BookOpen, Clock, Target, Trophy, Flame } from "lucide-react";
import { getUserRankInfo } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { fetchDashboardData } from "@/lib/dashboard-queries";

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
    lastLectureActivity: null
  };

  const safeStats = stats || { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 };
  const { totalQuestions, totalCorrect, todayItemCount, currentStreak } = safeStats;
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const dailyTarget = 50;
  const dailyPct = Math.min(100, Math.round((todayItemCount / dailyTarget) * 100));

  const { label: rankLabel, totalPoints: rankPoints, progressToNext: rankProgress } = (rankInfo as any) || {
    label: "Med Student",
    totalPoints: 0,
    progressToNext: 0
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pt-16 md:px-8">
      {/* ── Greeting ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight dark:text-white text-slate-800 md:text-4xl">
            Welcome back, <span className="text-primary">{session.user.name?.split(' ')[0]}</span>.
          </h1>
          <p className="mt-2 text-sm font-medium dark:text-white/40 text-slate-500">Ready to master your clinical concepts today?</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 rounded-xl dark:bg-white/5 bg-white px-4 py-2 border dark:border-white/5 border-slate-200 shadow-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-bold dark:text-white text-slate-800">{currentStreak} Day Streak</span>
           </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left Col */}
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
             <StatBox label="Daily Goal" value={`${dailyPct}%`} sub={`${todayItemCount}/${dailyTarget} Qs`} icon={Target} color="text-blue-500" bg="bg-blue-500/10" />
             <StatBox label="Total Points" value={(rankPoints || 0).toLocaleString()} sub={rankLabel} icon={Trophy} color="text-amber-500" bg="bg-amber-500/10" />
             <StatBox label="Overall Mastery" value={`${overallPct}%`} sub={`${totalCorrect} correct`} icon={BookOpen} color="text-emerald-500" bg="bg-emerald-500/10" />
          </div>

          {/* Continue Learning */}
          {lastLectureActivity && (
            <div className="rounded-[24px] border dark:border-white/5 border-slate-200 dark:bg-[#131220] bg-white p-6 shadow-xl">
               <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest dark:text-white/30 text-slate-400">Resume Learning</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary ring-1 ring-primary/20">Next Lesson</span>
               </div>
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl dark:bg-white/5 bg-slate-100 text-primary">
                        <BookOpen className="h-6 w-6" />
                     </div>
                     <div>
                        <h3 className="font-display text-lg font-bold dark:text-white text-slate-800">{lastLectureActivity.lecture.title}</h3>
                        <p className="text-xs dark:text-white/40 text-slate-500 font-medium">{lastLectureActivity.lecture.subject.name}</p>
                     </div>
                  </div>
                  <Link href={`/modules/${lastLectureActivity.lecture.subject.moduleId}/lectures/${lastLectureActivity.lecture.id}`} className="btn-gradient flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                     Continue <ChevronRight className="h-4 w-4" />
                  </Link>
               </div>
            </div>
          )}

          {/* Module Grid */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <h2 className="font-display text-xl font-bold dark:text-white text-slate-800">Module Progress</h2>
                <Link href="/modules" className="text-xs font-bold text-primary hover:underline">See all modules</Link>
             </div>
             <div className="grid gap-4 sm:grid-cols-2">
                {moduleProgress.slice(0, 4).map((mod: any) => (
                  <div key={mod.id} className="rounded-[20px] border dark:border-white/5 border-slate-200 dark:bg-[#131220] bg-white p-5 transition-all hover:shadow-md">
                     <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-bold dark:text-white/90 text-slate-700">{mod.name}</span>
                        <span className="text-xs font-bold dark:text-white/30 text-slate-400">{mod.pct}%</span>
                     </div>
                     <div className="h-1.5 w-full overflow-hidden rounded-full dark:bg-white/5 bg-slate-100">
                        <div className="h-full bg-primary transition-all duration-700" style={{ width: `${mod.pct}%` }} />
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-6">
           {/* Weekly activity simplified */}
           <div className="rounded-[24px] border dark:border-white/5 border-slate-200 dark:bg-[#131220] bg-white p-6 shadow-xl">
              <p className="mb-6 text-[10px] font-black uppercase tracking-widest dark:text-white/30 text-slate-400">Activity Hub</p>
              <div className="flex h-32 items-end justify-between gap-1.5 px-1">
                 {chartDays.map((d, i) => {
                    const activityArr = (dashData as any)?.activity || [];
                    const dayData = activityArr.find((x: any) => x.day === d.key);
                    const val = dayData?.count || 0;
                    const maxCount = Math.max(...activityArr.map((a: any) => a.count), 5);
                    const h = (val / maxCount) * 100;
                    return (
                       <div key={i} className="flex flex-1 flex-col items-center gap-2">
                          <div className="relative w-full overflow-hidden rounded-t-md dark:bg-white/5 bg-slate-100" style={{ height: '100%' }}>
                             <div className="absolute bottom-0 w-full bg-primary transition-all duration-1000" style={{ height: `${Math.max(h, 4)}%` }} />
                          </div>
                          <span className="text-[9px] font-bold dark:text-white/20 text-slate-400">{d.shortLabel}</span>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* Dr Q Promo */}
           <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 relative overflow-hidden group">
              <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-primary opacity-10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                 <h4 className="text-sm font-bold text-white mb-2">AI Study Assistant</h4>
                 <p className="text-[11px] leading-relaxed text-white/40 mb-5">Have a question about a clinical case? Ask Dr. Q for an instant explanation.</p>
                 <Link href="/ai-chat" className="btn-gradient flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-bold">
                    Start Chatting →
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, icon: Icon, color, bg }: any) {
  return (
    <div className="rounded-[24px] border dark:border-white/5 border-slate-200 dark:bg-[#131220] bg-white p-5 shadow-xl transition-transform hover:-translate-y-1">
       <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", bg, color)}>
          <Icon className="h-5 w-5" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-widest dark:text-white/30 text-slate-400">{label}</p>
       <p className="mt-1 text-2xl font-black dark:text-white text-slate-800">{value}</p>
       <p className="text-[11px] font-medium dark:text-white/40 text-slate-500 mt-1">{sub}</p>
    </div>
  );
}
