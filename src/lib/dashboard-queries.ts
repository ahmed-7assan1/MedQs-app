/**
 * dashboard-queries.ts
 * Optimized DB queries for the student dashboard.
 * Uses aggregates + raw SQL instead of loading thousands of rows.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type ModuleProgressItem = {
  id: string;
  name: string;
  total: number;
  correct: number;
  pct: number;
  lectures: number;
  imageUrl?: string | null;
};

export type DashboardData = {
  user: {
    name: string | null;
    image: string | null;
    semesterId: string | null;
    university: { name: string } | null;
    semester: { name: string } | null;
  } | null;
  rankInfo: Awaited<ReturnType<typeof import("@/lib/engagement").getUserRankInfo>>;
  recentAttempts: Array<{
    id: string;
    score: number;
    createdAt: Date;
    pastPaper: { title: string };
  }>;
  todayItemCount: number;
  streak: number;
  weekCounts: number[];
  moduleProgress: ModuleProgressItem[];
  totalQuestions: number;
  totalCorrect: number;
  quickPaper: { id: string; title: string } | null;
  lastLectureActivity: {
    lastViewedAt: Date;
    lecture: {
      id: string;
      title: string;
      subject: { moduleId: string | null; name: string };
    };
  } | null;
};

// ──────────────────────────────────────────────────────────────────────────────
// Streak — uses raw SQL to get distinct active dates (last 60 days only)
// avoids pulling 400 full attempt rows
// ──────────────────────────────────────────────────────────────────────────────

async function computeStreakFromDb(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ day: string }>>(
    Prisma.sql`
      SELECT DISTINCT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day
      FROM "QuizAttempt"
      WHERE "userId" = ${userId}
        AND "createdAt" >= NOW() - INTERVAL '60 days'
      ORDER BY day DESC
    `
  );

  if (rows.length === 0) return 0;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  let streak = 0;
  let cursor = new Date(today);

  for (let i = 0; i < 60; i++) {
    const key = cursor.toISOString().slice(0, 10);
    const hasActivity = rows.some((r) => r.day === key);

    if (i === 0 && !hasActivity) {
      // Allow yesterday to still count (streak not broken until end of day)
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!hasActivity) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ──────────────────────────────────────────────────────────────────────────────
// Weekly activity — count items per day (last 7 days)
// ──────────────────────────────────────────────────────────────────────────────

async function getWeeklyActivity(
  userId: string,
  chartDayKeys: string[]
): Promise<number[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<Array<{ day: string; cnt: bigint }>>(
    Prisma.sql`
      SELECT
        TO_CHAR(a."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
        COUNT(i.id) AS cnt
      FROM "QuizAttemptItem" i
      JOIN "QuizAttempt" a ON a.id = i."attemptId"
      WHERE a."userId" = ${userId}
        AND a."createdAt" >= ${weekAgo}
      GROUP BY day
    `
  );

  return chartDayKeys.map((k) => {
    const found = rows.find((r) => r.day === k);
    return found ? Number(found.cnt) : 0;
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Module progress — uses _count aggregate instead of loading all question rows
// ──────────────────────────────────────────────────────────────────────────────

async function getModuleProgress(userId: string, semesterId: string): Promise<ModuleProgressItem[]> {
  // 1. Load modules with subject/lecture counts only (no question rows)
  const modules = await prisma.module.findMany({
    where: { semesterId },
    orderBy: { name: "asc" },
    include: {
      subjects: {
        include: {
          lectures: {
            include: {
              _count: { select: { questions: true } },
            },
          },
        },
      },
    },
  });

  if (modules.length === 0) return [];

  // 2. Get correct question counts per module via raw aggregate
  const correctRows = await prisma.$queryRaw<Array<{ moduleId: string; cnt: bigint }>>(
    Prisma.sql`
      SELECT
        s."moduleId",
        COUNT(DISTINCT i."questionId") AS cnt
      FROM "QuizAttemptItem" i
      JOIN "QuizAttempt" a ON a.id = i."attemptId"
      JOIN "Question" q ON q.id = i."questionId"
      JOIN "Lecture" l ON l.id = q."lectureId"
      JOIN "Subject" s ON s.id = l."subjectId"
      WHERE a."userId" = ${userId}
        AND i."isCorrect" = TRUE
        AND s."moduleId" IN (${Prisma.join(modules.map((m) => m.id))})
      GROUP BY s."moduleId"
    `
  );

  const correctByModule = new Map(correctRows.map((r) => [r.moduleId, Number(r.cnt)]));

  return modules.map((mod) => {
    const total = mod.subjects
      .flatMap((s) => s.lectures)
      .reduce((acc, l) => acc + l._count.questions, 0);
    const correct = correctByModule.get(mod.id) ?? 0;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const lectures = mod.subjects.reduce((a, s) => a + s.lectures.length, 0);
    return { id: mod.id, name: mod.name, total, correct, pct, lectures, imageUrl: mod.imageUrl };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Main export — all dashboard data in one optimised pass
// ──────────────────────────────────────────────────────────────────────────────

export async function fetchDashboardData(
  userId: string,
  chartDayKeys: string[]
): Promise<Omit<DashboardData, "rankInfo">> {
  const { getUserRankInfo } = await import("@/lib/engagement");

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  // Run independent queries in parallel
  const [user, recentAttempts, todayItemCount, streak, weekCounts, lastLectureActivity] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          image: true,
          semesterId: true,
          university: { select: { name: true } },
          semester: { select: { name: true } },
        },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          score: true,
          createdAt: true,
          pastPaper: { select: { title: true } },
        },
      }),
      prisma.quizAttemptItem.count({
        where: { attempt: { userId, createdAt: { gte: dayStart } } },
      }),
      computeStreakFromDb(userId),
      getWeeklyActivity(userId, chartDayKeys),
      prisma.userLectureActivity.findFirst({
        where: { userId },
        orderBy: { lastViewedAt: "desc" },
        select: {
          lastViewedAt: true,
          lecture: {
            select: {
              id: true,
              title: true,
              videoUrl: true,
              videos: {
                take: 1,
                orderBy: { sortOrder: "asc" },
                select: { url: true },
              },
              subject: { select: { moduleId: true, name: true } },
              team: { select: { name: true, imageUrl: true } },
            },
          },
        },
      }),
    ]);

  // Module progress needs semesterId — skip if not set
  const [moduleProgress, quickPaper] = await Promise.all([
    user?.semesterId
      ? getModuleProgress(userId, user.semesterId)
      : Promise.resolve([] as ModuleProgressItem[]),
    user?.semesterId
      ? prisma.pastPaper.findFirst({
          where: { semesterId: user.semesterId },
          orderBy: { title: "asc" },
          select: { id: true, title: true },
        })
      : Promise.resolve(null),
  ]);

  const totalQuestions = moduleProgress.reduce((a, m) => a + m.total, 0);
  const totalCorrect = moduleProgress.reduce((a, m) => a + m.correct, 0);

  return {
    user,
    recentAttempts,
    todayItemCount,
    streak,
    weekCounts,
    moduleProgress,
    totalQuestions,
    totalCorrect,
    quickPaper,
    lastLectureActivity,
  };
}

export const getCachedDashboardData = unstable_cache(
  async (userId: string, chartDayKeys: string[]) => {
    return fetchDashboardData(userId, chartDayKeys);
  },
  ["dashboard-data"],
  { revalidate: 60, tags: ["dashboard"] }
);
