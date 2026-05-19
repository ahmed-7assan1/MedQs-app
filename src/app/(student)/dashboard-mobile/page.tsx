import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { fetchDashboardData } from "@/lib/dashboard-queries";
import { getUserRankInfo } from "@/lib/engagement";
import { MobileDashboardWrapper } from "@/components/dashboard/MobileDashboardWrapper";
import { MobileDashboardClient } from "@/components/dashboard/MobileDashboardClient";

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

  // Data for Listed Stats Rows
  const statsData = [
    {
      label: "Daily Target",
      value: `${todayItemCount} / ${dailyTarget} solved`,
      iconName: "Target",
      progress: dailyPct,
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    {
      label: "Knowledge Mastery",
      value: `${overallPct}% completed`,
      iconName: "Brain",
      progress: overallPct,
      color: "bg-violet-500/10 text-violet-400 border-violet-500/20"
    },
    {
      label: "Clinical Experience",
      value: `${totalQuestions.toLocaleString()} Qs`,
      iconName: "Stethoscope",
      progress: 75,
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      label: "Active Modules",
      value: `${moduleProgress.length} modules`,
      iconName: "Library",
      progress: 60,
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }
  ];

  // Data for Compact Tool Strip
  const toolsData = [
    { label: "Videos", iconName: "PlayCircle", href: "/videos", color: "bg-red-500/15 text-red-400" },
    { label: "Exams", iconName: "Zap", href: "/past-papers", color: "bg-emerald-500/15 text-emerald-400" },
    { label: "Syllabus", iconName: "BookOpen", href: "/modules", color: "bg-purple-500/15 text-purple-400" },
    { label: "Cards", iconName: "Layers", href: "/modules", color: "bg-fuchsia-500/15 text-fuchsia-400" },
    { label: "Audio", iconName: "Mic", href: "/podcasts", color: "bg-amber-500/15 text-amber-400" },
    { label: "Tasks", iconName: "Award", href: "/taskat", color: "bg-cyan-500/15 text-cyan-400" }
  ];

  return (
    <MobileDashboardWrapper user={{ name: user.user_metadata?.name || user.email || "Student", role: rankLabel, initial: userInitial }}>
      <MobileDashboardClient 
        firstName={firstName}
        greeting={greeting}
        currentStreak={currentStreak}
        rankPoints={rankPoints}
        rankLabel={rankLabel}
        dailyPct={dailyPct}
        overallPct={overallPct}
        todayItemCount={todayItemCount}
        dailyTarget={dailyTarget}
        totalQuestions={totalQuestions}
        lastLectureActivity={lastLectureActivity}
        moduleProgress={moduleProgress}
      />
    </MobileDashboardWrapper>
  );
}
