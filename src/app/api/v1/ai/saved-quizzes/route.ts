import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizzes = await prisma.savedQuiz.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error("Failed to fetch saved quizzes:", error);
    return NextResponse.json({ error: "Failed to fetch saved quizzes" }, { status: 500 });
  }
}
