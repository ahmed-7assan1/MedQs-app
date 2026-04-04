import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.lecture.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: params.id },
    include: {
      flashcards: true,
      questions: { select: { id: true, body: true, difficulty: true, answer: true, choices: true } },
      files: true,
    },
  });
  if (!lecture) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lecture);
}
