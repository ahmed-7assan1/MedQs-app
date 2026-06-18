import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { getUserRankInfo } from "@/lib/engagement";
import { getCachedDashboardData } from "@/lib/dashboard-queries";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personalized medical study dashboard. Track progress, continue lectures, review past papers, and monitor your learning statistics.",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?mode=login");

  // Fetch full user profile to check for missing academic info
  let fullProfile = user ? await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, universityId: true, facultyId: true, semesterId: true }
  }) : null;

  // Sync logic: If Prisma is missing data but metadata has it, sync now
  try {
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
  } catch (syncErr) {
    console.error("[dashboard-app] Profile sync error:", syncErr);
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
    [dashData, rankInfo] = await withRetry(() => Promise.all([
      getCachedDashboardData(userId, chartDayKeyStrings),
      getUserRankInfo(userId),
    ]), 2);
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
  const dbUser = dashData?.user;
  const firstName = (dbUser?.name || user.email?.split('@')[0] || "Student").split(" ")[0];

  const { rank, points: rankPoints = 0, progress: progressToNext = 0 } = rankInfo || {
    rank: { label: "Med Student" },
    points: 0,
    progress: 0
  };
  const rankLabel = rank?.label || "Med Student";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardShell
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
      activityArr={activityArr || []}
      progressToNext={progressToNext}
      isProfileIncomplete={isProfileIncomplete}
    />
  );
}
