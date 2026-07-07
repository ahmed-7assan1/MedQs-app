import { getAuthenticatedUser } from "@/lib/get-authenticated-user";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma, withRetry } from "@/lib/prisma";
import { getCachedDashboardData, getCachedRankInfo } from "@/lib/dashboard-queries";
import { last7DayKeys } from "@/lib/dashboard-stats";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardData } from "@/types/dashboard";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personalized medical study dashboard.",
};

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/auth?mode=login");

  let fullProfile = user ? await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, universityId: true, facultyId: true, semesterId: true }
  }) : null;

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
      getCachedRankInfo(userId),
    ]), 2);
  } catch (err) {
    console.warn("[dashboard-app] DB error:", err instanceof Error ? err.message : err);
  }

  const { stats, moduleProgress, activity: activityArr, lastLectureActivity, recentQuizzes } = dashData || {
    stats: { totalQuestions: 0, totalCorrect: 0, todayItemCount: 0, currentStreak: 0 },
    moduleProgress: [],
    activity: [],
    lastLectureActivity: null,
    recentQuizzes: [],
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

  const getCachedAds = unstable_cache(
    async (semesterId: string | undefined) => {
      const siteConfig = await prisma.siteConfig.findFirst({ select: { enableAds: true } });
      const adsEnabled = siteConfig?.enableAds !== false;
      if (!adsEnabled) return [];
      return prisma.adBanner.findMany({
        where: {
          active: true,
          OR: [
            { semesterId: semesterId ?? undefined },
            { semesterId: null, universityId: null },
          ],
        },
        select: { id: true, imageUrl: true, linkUrl: true },
        orderBy: { createdAt: "desc" },
      });
    },
    ["ads"],
    { revalidate: 300, tags: ["ads"] }
  );

  let ads: { id: string; imageUrl: string; linkUrl: string | null }[] = [];
  try {
    ads = await getCachedAds(fullProfile?.semesterId ?? undefined);
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
    videoUrl: lastLectureActivity.lecture.videoUrl
      || lastLectureActivity.lecture.videos?.[0]?.url
      || null,
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
    recentQuizzes: recentQuizzes || [],
  };

  return <DashboardShell data={dashboardData} />;
}
