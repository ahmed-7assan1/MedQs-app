import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { fetchDashboardData } from "@/lib/dashboard-queries";
import { getUserRankInfo } from "@/lib/engagement";
import { 
  MobileTopBar, 
  MobileBottomNav, 
  MobileContinueCard,
  MobileStatCard,
  MobileQuickCard,
  MobileSpecCard,
  MobileDrQCard
} from "@/components/dashboard/MobileDashboardComponents";
import { MobileDashboardWrapper } from "@/components/dashboard/MobileDashboardWrapper";

export default async function MobileDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?mode=login");

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
    console.warn("[dashboard-mobile] DB error:", err instanceof Error ? err.message : err);
  }

  const { stats, moduleProgress, lastLectureActivity } = dashData || {
    stats: { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 },
    moduleProgress: [],
    lastLectureActivity: null,
  };

  const safeStats = stats || { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 };
  const { totalQuestions, totalCorrect, todayItemCount, currentStreak } = safeStats;
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const dailyTarget = 50;
  const dailyPct = Math.min(100, Math.round((todayItemCount / dailyTarget) * 100));
  const firstName = (user.user_metadata?.name || user.email || "Student").split(" ")[0];
  const userInitial = firstName.charAt(0);

  const { label: rankLabel, totalPoints: rankPoints } = rankInfo || {
    label: "Med Student",
    totalPoints: 0,
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <MobileDashboardWrapper user={{ name: user.user_metadata?.name || user.email || "Student", role: rankLabel, initial: userInitial }}>
      <main className="pt-[72px] pb-[100px] px-4 space-y-7">
        
        {/* 2. GREETING BLOCK */}
        <section className="space-y-1">
          <p className="text-[11px] font-medium text-[#8b8fa8] uppercase tracking-[0.08em]">{greeting},</p>
          <h1 className="text-[26px] font-bold text-white leading-tight">
            Dr. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f5fff] to-[#7b5fff]">{firstName}</span>
          </h1>
          <div className="flex gap-2 pt-2">
            <div className="flex-1 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181a2e] border border-[#2a2d4a]">
               <div className="text-amber-500">🔥</div>
               <span className="text-[13px] font-bold text-white">{currentStreak} Days</span>
            </div>
            <div className="flex-1 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181a2e] border border-[#2a2d4a]">
               <div className="text-amber-400">🏆</div>
               <span className="text-[13px] font-bold text-white">{rankPoints.toLocaleString()} Pts</span>
            </div>
          </div>
        </section>

        {/* 3. CONTINUE LEARNING CARD */}
        <section>
          {lastLectureActivity ? (
            <MobileContinueCard 
              module={lastLectureActivity.lecture.title}
              subject={lastLectureActivity.lecture.subject.name}
              progress={overallPct} // Placeholder
            />
          ) : (
            <MobileContinueCard 
              module="Start Learning"
              subject="No active session"
              progress={0}
            />
          )}
        </section>

        {/* 4. STATS ROW (HORIZONTAL SCROLL) */}
        <section className="space-y-3.5">
          <h2 className="text-[11px] font-medium text-[#8b8fa8] uppercase tracking-wider">Your Progress</h2>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-1">
            <MobileStatCard label="Daily Goal" value={`${dailyPct}%`} iconName="Target" colorClass="bg-[#3b82f6]" progress={dailyPct} delay={0} />
            <MobileStatCard label="Knowledge" value={`${overallPct}%`} iconName="Brain" colorClass="bg-[#8b5cf6]" progress={overallPct} delay={0.05} />
            <MobileStatCard label="Clinical Exp." value={totalQuestions.toLocaleString()} iconName="Stethoscope" colorClass="bg-[#06b6d4]" progress={75} delay={0.1} />
            <MobileStatCard label="Modules" value={moduleProgress.length} iconName="Library" colorClass="bg-[#f59e0b]" progress={60} delay={0.15} />
          </div>
        </section>

        {/* 5. QUICK ACCESS GRID (3x2) */}
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

        {/* 6. ACTIVE SPECIALIZATIONS */}
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

        {/* 7. ASK DR. Q FEATURED CARD */}
        <section>
          <MobileDrQCard />
        </section>

      </main>
    </MobileDashboardWrapper>
  );
}
