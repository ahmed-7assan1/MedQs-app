import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating } = await req.json();
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const existing = await prisma.flashcardSetRating.findUnique({
      where: { flashcardSetId_userId: { flashcardSetId: params.id, userId: session.user.id } },
    });

    if (existing) {
      await prisma.flashcardSetRating.update({
        where: { id: existing.id },
        data: { rating },
      });
    } else {
      await prisma.flashcardSetRating.create({
        data: { flashcardSetId: params.id, userId: session.user.id, rating },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to rate flashcard set:", error);
    return NextResponse.json({ error: "Failed to rate" }, { status: 500 });
  }
}
