import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertFlashcard, requireAdminWriter } from "@/lib/admin-scope";
import { updateFlashcardSchema } from "@/lib/validation/flashcard";
import { validateBody } from "@/lib/validation/validate";
import { badRequest } from "@/lib/api-error";

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

  const validation = await validateBody(updateFlashcardSchema, req);
  if (!validation.success) return validation.response;

  const flashcard = await prisma.flashcard.update({
    where: { id: flashcardId },
    data: validation.data,
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
