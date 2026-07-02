import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["questions", "flashcards", "references", "diagrams"] as const;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await Promise.resolve(ctx.params);
  const type = req.nextUrl.searchParams.get("type") ?? "questions";

  if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return NextResponse.json({ error: `Invalid type "${type}". Must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
  }

  const lecture = await prisma.lecture.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!lecture) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let items: unknown[] = [];
  let version = "0";

  if (type === "questions") {
    const questions = await prisma.question.findMany({
      where: { lectureId: id },
      select: { id: true, body: true, choices: true, answer: true, explanation: true, difficulty: true },
      orderBy: { createdAt: "asc" },
    });
    items = questions;
    version = `${questions.length}-${questions.reduce((s, q) => s + q.body.length, 0)}`;
  } else if (type === "flashcards") {
    const flashcards = await prisma.flashcard.findMany({
      where: { lectureId: id },
      select: { id: true, front: true, back: true },
      orderBy: { id: "asc" },
    });
    items = flashcards;
    version = `${flashcards.length}-${flashcards.reduce((s, f) => s + f.front.length, 0)}`;
  }

  return NextResponse.json({
    lectureId: id,
    itemType: type,
    version,
    items,
  });
}
