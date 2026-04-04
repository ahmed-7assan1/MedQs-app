import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  front: z.string().min(1).max(500).trim(),
  back:  z.string().min(1).max(1000).trim(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

  const flashcard = await prisma.flashcard.create({
    data: { ...parsed.data, lectureId: params.id },
  });
  return NextResponse.json(flashcard, { status: 201 });
}
