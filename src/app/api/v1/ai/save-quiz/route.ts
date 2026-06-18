import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, questions } = await req.json();
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Missing title or questions" }, { status: 400 });
    }

    const shareCode = crypto.randomBytes(4).toString("hex");

    const saved = await prisma.savedQuiz.create({
      data: {
        userId: session.user.id,
        title,
        questions,
        shareCode,
      },
    });

    return NextResponse.json({ success: true, quiz: saved });
  } catch (error) {
    console.error("Failed to save quiz:", error);
    return NextResponse.json({ error: "Failed to save quiz" }, { status: 500 });
  }
}
