import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const set = await prisma.savedFlashcardSet.findUnique({ where: { id: params.id } });
    if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (set.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const data: any = {};
    if (body.published !== undefined) data.published = body.published;
    if (body.title !== undefined) data.title = body.title;
    const updated = await prisma.savedFlashcardSet.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ success: true, flashcardSet: updated });
  } catch (error) {
    console.error("Failed to update flashcard set:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const set = await prisma.savedFlashcardSet.findUnique({ where: { id: params.id } });
    if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (set.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.savedFlashcardSet.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete flashcard set:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
