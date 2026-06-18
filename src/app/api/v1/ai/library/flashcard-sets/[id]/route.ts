import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const set = await prisma.savedFlashcardSet.findUnique({
      where: { id: params.id },
    });

    if (!set) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ratings = await prisma.flashcardSetRating.findMany({
      where: { flashcardSetId: set.id },
    });

    const comments = await prisma.flashcardSetComment.findMany({
      where: { flashcardSetId: set.id },
      orderBy: { createdAt: "desc" },
    });

    const avgRating = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    return NextResponse.json({
      id: set.id,
      title: set.title,
      flashcards: set.flashcards,
      creatorId: set.userId,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingCount: ratings.length,
      ratings,
      comments,
      createdAt: set.createdAt,
    });
  } catch (error) {
    console.error("Failed to fetch flashcard set:", error);
    return NextResponse.json({ error: "Failed to fetch flashcard set" }, { status: 500 });
  }
}
