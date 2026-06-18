import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const quizzes = await prisma.savedQuiz.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const attemptCounts = await prisma.sharedQuizAttempt.groupBy({
      by: ["quizId"],
      _count: { id: true },
    });

    const countMap = new Map(attemptCounts.map(a => [a.quizId, a._count.id]));

    const data = quizzes.map(q => ({
      id: q.id,
      title: q.title,
      questionCount: (q.questions as any[])?.length || 0,
      solverCount: countMap.get(q.id) || 0,
      createdAt: q.createdAt,
      creatorId: q.userId,
    }));

    return NextResponse.json({ quizzes: data });
  } catch (error) {
    console.error("Failed to fetch library:", error);
    return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
  }
}
