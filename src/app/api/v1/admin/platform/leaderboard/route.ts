import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50") || 50));
    const days = searchParams.get("days");
    const since = days && !isNaN(parseInt(days)) ? new Date(Date.now() - parseInt(days) * 86400000) : undefined;

    const where: any = { role: { not: "SUPER_ADMIN" } };
    if (since) where.lastActivityAt = { gte: since };

    const users = await prisma.user.findMany({
      where,
      orderBy: { points: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        points: true,
        _count: {
          select: {
            quizAttempts: true,
            posts: true,
            sessionParticipations: true,
          },
        },
      },
    });

    const data = users.map((u, i) => ({
      userId: u.id,
      name: u.name ?? "Unknown",
      email: u.email ?? "",
      image: u.image,
      totalPoints: u.points,
      quizScore: u._count.quizAttempts * 10,
      videoScore: u._count.sessionParticipations * 5,
      pointsScore: u.points,
      rank: i + 1,
    }));

    const totalUsers = users.length;
    const avgPoints = totalUsers > 0 ? Math.round(users.reduce((s, u) => s + u.points, 0) / totalUsers) : 0;
    const topScore = users.length > 0 ? users[0].points : 0;

    const summary = {
      totalUsers,
      avgPoints,
      topScore,
    };

    return NextResponse.json({ data, summary });
  } catch (error: any) {
    console.error("[PLATFORM_LEADERBOARD] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
