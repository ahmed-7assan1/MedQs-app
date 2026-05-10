import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Leaderboard refreshes every 5 minutes — no need to hit DB per student.
// Real-time changes will appear after at most 5 minutes.
export const revalidate = 300;

export async function GET(req: NextRequest) {
  // Check if leaderboard is enabled
  const config = await prisma.siteConfig.findFirst({ select: { enableLeaderboard: true } });
  if (!config?.enableLeaderboard) {
    return NextResponse.json({ disabled: true, users: [] });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "global"; // "global" | "semester"
  const semesterId = searchParams.get("semesterId");

  const session = await auth();
  const currentSemesterId = (session?.user as any)?.semesterId;
  const targetSemesterId = scope === "semester" ? (semesterId ?? currentSemesterId) : undefined;

  const users = await prisma.user.findMany({
    where: {
      ...(targetSemesterId ? { semesterId: targetSemesterId } : {}),
      points: { gt: 0 },
      hideRank: false,
    },
    orderBy: { points: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      nickname: true,
      image: true,
      points: true,
      hideRank: true,
      rank: { select: { label: true, badge: true } },
      semester: { select: { name: true } },
    },
  });

  return NextResponse.json({ users, scope, semesterId: targetSemesterId, disabled: false });
}
