import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { getUserRankInfo } from "@/lib/engagement";
import { getCachedDashboardData } from "@/lib/dashboard-queries";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardData } from "@/types/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personalized medical study dashboard.",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?mode=login");

  let fullProfile = user ? await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, universityId: true, facultyId: true, semesterId: true }
  }) : null;

  try {
    if (user && (!fullProfile || !fullProfile.universityId || !fullProfile.semesterId)) {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p className="text-muted-foreground mb-8 text-center">Please sign in to access your personalized medical dashboard.</p>
        <Link href="/auth?mode=login" className="px-8 py-3 bg-primary rounded-2xl font-bold hover:bg-primary/90 transition-all text-primary-foreground">Sign In</Link>
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

  const { stats, moduleProgress, activity: activityArr, lastLectureActivity } = dashData || {
    stats: { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 },
    moduleProgress: [],
    activity: [],
    lastLectureActivity: null,
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

  let ads: { id: string; imageUrl: string; linkUrl: string | null }[] = [];
  try {
    const siteConfig = await prisma.siteConfig.findFirst({ select: { enableAds: true } });
    if (siteConfig?.enableAds !== false) {
      ads = await prisma.adBanner.findMany({
        where: {
          active: true,
          OR: [
            { semesterId: fullProfile?.semesterId ?? undefined },
            { semesterId: null, universityId: null },
          ],
        },
        select: { id: true, imageUrl: true, linkUrl: true },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (_) {}

  // Optimise profile image URL for display quality
  let userImage = dbUser?.image || null;
  if (userImage) {
    if (userImage.includes("lh3.googleusercontent.com")) {
      // Google OAuth avatars default to s96-c (96x96). Bump to 512px.
      userImage = userImage.replace(/=s\d+(-c)?/, "=s512-c");
    } else if (userImage.includes("res.cloudinary.com")) {
      // Insert Cloudinary transformations for quality + size
      userImage = userImage.replace(
        /\/image\/upload\//,
        "/image/upload/w_320,q_auto:best/"
      );
    }
  }

  const lastLecture = lastLectureActivity?.lecture ? {
    lectureId: lastLectureActivity.lecture.id,
    lectureTitle: lastLectureActivity.lecture.title,
    videoUrl: lastLectureActivity.lecture.videoUrl,
    moduleId: lastLectureActivity.lecture.subject.moduleId,
    subjectName: lastLectureActivity.lecture.subject.name,
    channelName: lastLectureActivity.lecture.team?.name || "MedOneX",
    channelAvatar: lastLectureActivity.lecture.team?.imageUrl || null,
  } : null;

  const dashboardData: DashboardData = {
    firstName,
    greeting,
    currentStreak,
    rankPoints,
    rankLabel,
    dailyPct,
    overallPct,
    todayItemCount,
    dailyTarget,
    totalQuestions,
    moduleProgress: moduleProgress || [],
    activityArr: activityArr || [],
    progressToNext,
    isProfileIncomplete,
    ads: ads.length ? ads : undefined,
    userImage,
    lastLecture,
  };

  return <DashboardShell data={dashboardData} />;
}
