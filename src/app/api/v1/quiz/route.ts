import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shareCode = searchParams.get("shareCode");

    if (!shareCode) {
      return NextResponse.json({ error: "Missing shareCode" }, { status: 400 });
    }

    const quiz = await prisma.savedQuiz.findUnique({
      where: { shareCode },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions,
      shareCode: quiz.shareCode,
      createdAt: quiz.createdAt,
    });
  } catch (error) {
    console.error("Failed to fetch shared quiz:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}
