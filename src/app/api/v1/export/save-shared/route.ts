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

    const { title, questions, shareCode: clientShareCode } = await req.json();
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Missing title or questions" }, { status: 400 });
    }

    const shareCode = clientShareCode || crypto.randomBytes(4).toString("hex");

    const saved = await prisma.savedQuiz.create({
      data: {
        userId: session.user.id,
        title,
        questions,
        shareCode,
        source: "export",
        published: true,
      },
    });

    const origin = new URL(req.url).origin;
    const url = `${origin}/quiz/shared/${shareCode}`;

    return NextResponse.json({ success: true, shareCode, url, id: saved.id });
  } catch (error) {
    console.error("Failed to save shared export:", error);
    return NextResponse.json({ error: "Failed to save shared export" }, { status: 500 });
  }
}
