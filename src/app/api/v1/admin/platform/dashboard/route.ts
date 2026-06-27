import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeToday, newThisWeek, newThisMonth,
      totalQuestions, totalQuizAttempts, totalVideos, totalLectures,
      totalPastPapers, totalPosts,
      securityAlertCount, bannedCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActivityAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.question.count(),
      prisma.quizAttempt.count(),
      prisma.lectureVideo.count(),
      prisma.lecture.count(),
      prisma.pastPaper.count(),
      prisma.post.count(),
      prisma.securityEvent.count({ where: { status: { in: ["NEW", "INVESTIGATING"] } } }),
      prisma.user.count({ where: { isBanned: true } }),
    ]);

    const growthData = await getGrowthData(7);
    const uniRanking = await getUniversityRanking();
    const contentStats = await getContentStats(weekAgo);

    return NextResponse.json({
      data: {
        platformStats: {
          totalUsers, activeToday, newThisWeek, newThisMonth,
          totalQuestions, totalQuizAttempts, totalVideos,
          totalLectures, totalPastPapers, totalPosts,
          bannedCount,
        },
        securityAlerts: { openCount: securityAlertCount },
        growthData,
        uniRanking,
        contentStats,
      },
    });
  } catch (error: any) {
    console.error("[PLATFORM_DASHBOARD] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function getGrowthData(days: number) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("createdAt") as date, COUNT(*)::int as count
    FROM "User"
    WHERE "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;
  const countMap = new Map(rows.map((r) => [String(r.date).slice(0, 10), Number(r.count)]));
  const points: { date: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    points.push({ date: key, count: countMap.get(key) ?? 0 });
  }
  return points;
}

async function getUniversityRanking() {
  const universities = await prisma.university.findMany({
    select: {
      id: true, name: true, abbr: true,
      _count: { select: { users: true } },
    },
    orderBy: { users: { _count: "desc" } },
    take: 10,
  });
  return universities.map((u) => ({
    id: u.id, name: u.name, abbr: u.abbr, userCount: u._count.users,
  }));
}

async function getContentStats(since: Date) {
  const [newQuestions, newLectures, newPapers] = await Promise.all([
    prisma.question.count({ where: { createdAt: { gte: since } } }),
    Promise.resolve(0),
    prisma.pastPaper.count({ where: { createdAt: { gte: since } } }),
  ]);
  return { newQuestions, newLectures, newPapers };
}
