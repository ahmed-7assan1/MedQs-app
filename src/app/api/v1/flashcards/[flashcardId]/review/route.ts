import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseQuality, calculateSM2 } from "@/lib/sm2";
export const dynamic = "force-dynamic";

type Params = { params: { flashcardId: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { flashcardId } = params;
  const body = await req.json().catch(() => ({}));
  const qualityLabel = body.quality as string;

  if (!qualityLabel || !["again", "hard", "good", "easy"].includes(qualityLabel)) {
    return NextResponse.json({ error: "Invalid quality. Use: again, hard, good, easy" }, { status: 400 });
  }

  const flashcard = await prisma.flashcard.findUnique({ where: { id: flashcardId } });
  if (!flashcard) return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });

  const quality = parseQuality(qualityLabel);

  const existing = await prisma.userFlashcardProgress.findUnique({
    where: { userId_flashcardId: { userId, flashcardId } },
  });

  const prev = existing ?? { repetitions: 0, easeFactor: 2.5, interval: 0 };
  const result = calculateSM2(
    { repetitions: prev.repetitions, easeFactor: prev.easeFactor, interval: prev.interval },
    quality
  );

  const progress = await prisma.userFlashcardProgress.upsert({
    where: { userId_flashcardId: { userId, flashcardId } },
    create: {
      userId,
      flashcardId,
      interval: result.interval,
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      nextReviewAt: result.nextReviewAt,
      lastReviewedAt: new Date(),
      lastRating: quality,
    },
    update: {
      interval: result.interval,
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      nextReviewAt: result.nextReviewAt,
      lastReviewedAt: new Date(),
      lastRating: quality,
    },
  });

  return NextResponse.json(progress);
}
