import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const dueCards = await prisma.userFlashcardProgress.findMany({
    where: {
      userId,
      nextReviewAt: { lte: new Date() },
    },
    include: {
      flashcard: {
        select: { id: true, front: true, back: true, lectureId: true, lecture: { select: { title: true } } },
      },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 100,
  });

  return NextResponse.json(dueCards);
}
