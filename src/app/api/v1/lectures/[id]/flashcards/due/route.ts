import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = scope.userId;
  const lectureId = params.id;

  const flashcards = await prisma.flashcard.findMany({
    where: { lectureId },
    orderBy: { id: "asc" },
    include: {
      progress: {
        where: { userId },
        select: {
          id: true,
          interval: true,
          repetitions: true,
          easeFactor: true,
          nextReviewAt: true,
          lastReviewedAt: true,
          lastRating: true,
        },
      },
    },
  });

  const enriched = flashcards.map((fc) => {
    const prog = fc.progress[0];
    const isNew = !prog;
    const isDue = prog && prog.nextReviewAt <= new Date();
    return {
      id: fc.id,
      front: fc.front,
      back: fc.back,
      progress: prog ?? null,
      isNew,
      isDue: isNew || isDue,
    };
  });

  const due = enriched.filter((c) => c.isDue).sort((a, b) => {
    if (a.isNew && b.isNew) return 0;
    if (a.isNew) return -1;
    if (b.isNew) return 1;
    return new Date(a.progress!.nextReviewAt).getTime() - new Date(b.progress!.nextReviewAt).getTime();
  });

  const later = enriched.filter((c) => !c.isDue);

  return NextResponse.json({ due, later, total: enriched.length, dueCount: due.length });
}
