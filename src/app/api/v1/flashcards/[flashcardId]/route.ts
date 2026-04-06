import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { assertFlashcard, requireAdminWriter } from "@/lib/admin-scope";

const FlashcardSchema = z.object({
  front: z.string().min(1).max(500).trim(),
  back:  z.string().min(1).max(1000).trim(),
});

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ flashcardId: string }> | { flashcardId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { flashcardId } = await Promise.resolve(ctx.params);
  const boundary = await assertFlashcard(w.scope, flashcardId);
  if (boundary) return boundary;

  const body = await req.json();
  const parsed = FlashcardSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

  const flashcard = await prisma.flashcard.update({
    where: { id: flashcardId },
    data: parsed.data,
  });
  return NextResponse.json(flashcard);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ flashcardId: string }> | { flashcardId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { flashcardId } = await Promise.resolve(ctx.params);
  const boundary = await assertFlashcard(w.scope, flashcardId);
  if (boundary) return boundary;

  await prisma.flashcard.delete({ where: { id: flashcardId } });
  return NextResponse.json({ ok: true });
}
