import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { createFlashcardSchema } from "@/lib/validation/flashcard";
import { validateBody } from "@/lib/validation/validate";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  const validation = await validateBody(createFlashcardSchema, req);
  if (!validation.success) return validation.response;

  const flashcard = await prisma.flashcard.create({
    data: { ...validation.data, lectureId: id },
  });
  return NextResponse.json(flashcard, { status: 201 });
}
