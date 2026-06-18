import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sets = await prisma.savedFlashcardSet.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const data = sets.map(s => ({
      id: s.id,
      title: s.title,
      cardCount: (s.flashcards as any[])?.length || 0,
      createdAt: s.createdAt,
      creatorId: s.userId,
    }));

    return NextResponse.json({ flashcardSets: data });
  } catch (error) {
    console.error("Failed to fetch flashcard library:", error);
    return NextResponse.json({ error: "Failed to fetch flashcard library" }, { status: 500 });
  }
}
