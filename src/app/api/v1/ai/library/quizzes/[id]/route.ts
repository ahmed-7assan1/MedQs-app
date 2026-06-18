import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quiz = await prisma.savedQuiz.findUnique({
      where: { id: params.id },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ratings = await prisma.quizRating.findMany({
      where: { quizId: quiz.id },
    });

    const comments = await prisma.quizComment.findMany({
      where: { quizId: quiz.id },
      orderBy: { createdAt: "desc" },
    });

    const solverCount = await prisma.sharedQuizAttempt.count({
      where: { quizId: quiz.id },
    });

    const avgRating = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions,
      creatorId: quiz.userId,
      solverCount,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingCount: ratings.length,
      ratings,
      comments,
      createdAt: quiz.createdAt,
    });
  } catch (error) {
    console.error("Failed to fetch quiz details:", error);
    return NextResponse.json({ error: "Failed to fetch quiz details" }, { status: 500 });
  }
}
