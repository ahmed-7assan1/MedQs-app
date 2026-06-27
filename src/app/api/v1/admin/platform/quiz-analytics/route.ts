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
    const days = Math.max(1, parseInt(searchParams.get("days") || "30") || 30);
    const since = new Date(Date.now() - days * 86400000);

    const [paperGroups, totalAttempts, uniqueStudents, avgScoreAgg] = await Promise.all([
      prisma.quizAttempt.groupBy({
        by: ["pastPaperId"],
        where: { createdAt: { gte: since } },
        _count: { id: true, userId: true },
        _avg: { score: true },
        orderBy: { _count: { id: "desc" } },
        take: 50,
      }),
      prisma.quizAttempt.count({ where: { createdAt: { gte: since } } }),
      prisma.quizAttempt.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: since }, userId: { not: null as any } },
      }),
      prisma.quizAttempt.aggregate({
        where: { createdAt: { gte: since } },
        _avg: { score: true },
      }),
    ]);

    const paperIds = paperGroups.map((p) => p.pastPaperId).filter((id): id is string => id !== null);
    const paperTitles = paperIds.length > 0
      ? await prisma.pastPaper.findMany({
          where: { id: { in: paperIds } },
          select: { id: true, title: true },
        })
      : [];
    const titleMap = new Map(paperTitles.map((p) => [p.id, p.title]));

    const data = paperGroups.map((p) => {
      const count = p._count as { id: number; userId: number };
      const avg = p._avg as { score: number | null };
      return {
        paperId: p.pastPaperId ?? "",
        paperName: titleMap.get(p.pastPaperId ?? "") ?? "Unknown Paper",
        totalAttempts: count.id,
        questionsCount: 0,
        totalParticipants: count.userId,
        avgScore: Math.round(avg.score ?? 0),
        passRate: Math.round((avg.score ?? 0) >= 50 ? 100 : 0),
      };
    });

    const summary = {
      totalAttempts,
      totalParticipants: uniqueStudents.length,
      overallAvgScore: Math.round(avgScoreAgg._avg.score ?? 0),
      overallPassRate: Math.round(
        totalAttempts > 0
          ? (data.filter((d) => d.avgScore >= 50).reduce((s, d) => s + d.totalAttempts, 0) / totalAttempts) * 100
          : 0
      ),
    };

    return NextResponse.json({ data, summary });
  } catch (error: any) {
    console.error("[PLATFORM_QUIZ_ANALYTICS] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
