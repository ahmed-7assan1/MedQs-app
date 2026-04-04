import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/redis";

export const POINT_VALUES: Record<string, number> = {
  post:    5,
  comment: 2,
  like:    1,
  share:   3,
};

export const RANK_TIERS = [
  { label: "Newbie",       minPoints: 0    },
  { label: "Active",       minPoints: 50   },
  { label: "Contributor",  minPoints: 200  },
  { label: "Expert",       minPoints: 500  },
  { label: "Elite",        minPoints: 1500 },
];

export async function logEngagement(
  userId: string,
  action: "post" | "comment" | "like" | "share"
): Promise<{ ok: boolean; newPoints?: number; rankUp?: string }> {
  const allowed = await checkRateLimit(userId, action);
  if (!allowed) return { ok: false };

  const points = POINT_VALUES[action] ?? 0;

  const [, updatedUser] = await prisma.$transaction([
    prisma.engagementLog.create({
      data: { userId, action, points },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
      select: { points: true },
    }),
  ]);

  const newTotal = updatedUser.points;

  // Check for rank promotion
  const earned = RANK_TIERS.slice().reverse().find((r) => newTotal >= r.minPoints);
  if (earned) {
    const rank = await prisma.rank.findFirst({ where: { label: earned.label } });
    if (rank) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { rankId: true, rank: { select: { minPoints: true } } },
      });
      if (user?.rank && user.rank.minPoints < earned.minPoints) {
        await prisma.user.update({ where: { id: userId }, data: { rankId: rank.id } });
        return { ok: true, newPoints: newTotal, rankUp: earned.label };
      }
    }
  }

  return { ok: true, newPoints: newTotal };
}

export async function getUserRankInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      points: true,
      rank: true,
    },
  });
  if (!user) return null;

  const current = user.rank;
  const next = RANK_TIERS.find((r) => r.minPoints > user.points);
  const floor = current?.minPoints ?? 0;
  const denom = next ? next.minPoints - floor : 0;
  const progress =
    next && denom > 0 ? Math.round(((user.points - floor) / denom) * 100) : next ? 0 : 100;

  return {
    points: user.points,
    rank: current,
    nextRank: next ?? null,
    progress: Math.min(100, Math.max(0, progress)),
  };
}
