import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
import { getEarnedBadges, ALL_BADGES, getBadgeProgress, BadgeData } from "@/lib/badges";
export const dynamic = "force-dynamic";

type Params = { params: { roomId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = scope.userId;

  const sessions = await prisma.studySession.findMany({
    where: {
      roomId: params.roomId,
      status: "COMPLETED",
    },
    select: {
      id: true,
      startedAt: true,
      startedById: true,
      lectureId: true,
      participants: {
        where: { userId },
        select: { focusSeconds: true, sessionsCompleted: true },
      },
    },
  });

  const totalSessionsCompleted = sessions.length;
  const hostSessionsCompleted = sessions.filter((s) => s.startedById === userId).length;
  const lecturesStudied = sessions.filter((s) => s.lectureId).length;
  const totalFocusSeconds = sessions.reduce((sum, s) => {
    return sum + (s.participants[0]?.focusSeconds ?? 0);
  }, 0);

  const pointsAgg = await prisma.userPointsTransaction.aggregate({
    where: { userId, roomId: params.roomId, reason: "session_completed" },
    _sum: { points: true },
  });
  const totalPointsFromSessions = pointsAgg._sum.points ?? 0;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const sessionsThisWeek = sessions.filter((s) => new Date(s.startedAt) >= startOfWeek).length;

  const daysStudied = new Set(
    sessions
      .filter((s) => new Date(s.startedAt) >= startOfWeek)
      .map((s) => new Date(s.startedAt).toDateString())
  );
  const daysStudiedThisWeek = daysStudied.size;

  const todayStr = now.toDateString();
  const sessionsToday = sessions.filter((s) => new Date(s.startedAt).toDateString() === todayStr).length;

  const allDates = sessions.map((s) => new Date(s.startedAt).toDateString());
  const uniqueDates = [...new Set(allDates)].sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  if (uniqueDates.length > 0) {
    const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
    const diffFromToday = Math.round((now.getTime() - lastDate.getTime()) / 86400000);
    if (diffFromToday <= 1) {
      currentStreak = tempStreak;
    }
  }

  const data: BadgeData = {
    totalSessionsCompleted,
    totalFocusSeconds,
    totalPointsFromSessions: totalPointsFromSessions ?? 0,
    sessionsThisWeek,
    daysStudiedThisWeek,
    sessionsToday,
    hostSessionsCompleted,
    lecturesStudied,
    longestStreak,
    currentStreak,
  };

  const earned = getEarnedBadges(data);
  const allWithProgress = ALL_BADGES.map((b) => ({
    ...b,
    earned: earned.some((e) => e.id === b.id),
    progress: getBadgeProgress(b, data),
  }));

  return NextResponse.json({ badges: allWithProgress, data });
}
