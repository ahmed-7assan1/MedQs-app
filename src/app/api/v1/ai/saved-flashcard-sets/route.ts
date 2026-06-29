import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sets = await prisma.savedFlashcardSet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ flashcardSets: sets });
  } catch (error) {
    console.error("Failed to fetch saved flashcard sets:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
