import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";

const Schema = z.object({
  front: z.string().min(1).max(500).trim(),
  back:  z.string().min(1).max(1000).trim(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

  const flashcard = await prisma.flashcard.create({
    data: { ...parsed.data, lectureId: id },
  });
  return NextResponse.json(flashcard, { status: 201 });
}
