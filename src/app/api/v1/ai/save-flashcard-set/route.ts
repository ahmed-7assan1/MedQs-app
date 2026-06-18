import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, flashcards, shareCode } = await req.json();
    if (!title || !flashcards || !Array.isArray(flashcards) || flashcards.length === 0 || !shareCode) {
      return NextResponse.json({ error: "Missing title, flashcards, or shareCode" }, { status: 400 });
    }

    const saved = await prisma.savedFlashcardSet.create({
      data: {
        userId: session.user.id,
        title,
        flashcards,
        shareCode,
      },
    });

    return NextResponse.json({ success: true, flashcardSet: saved });
  } catch (error) {
    console.error("Failed to save flashcard set:", error);
    return NextResponse.json({ error: "Failed to save flashcard set" }, { status: 500 });
  }
}
