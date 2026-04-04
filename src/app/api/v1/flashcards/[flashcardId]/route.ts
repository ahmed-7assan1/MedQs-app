import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const FlashcardSchema = z.object({
  front: z.string().min(1).max(500).trim(),
  back:  z.string().min(1).max(1000).trim(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { flashcardId: string } }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = FlashcardSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

  const flashcard = await prisma.flashcard.update({
    where: { id: params.flashcardId },
    data: parsed.data,
  });
  return NextResponse.json(flashcard);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { flashcardId: string } }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.flashcard.delete({ where: { id: params.flashcardId } });
  return NextResponse.json({ ok: true });
}
