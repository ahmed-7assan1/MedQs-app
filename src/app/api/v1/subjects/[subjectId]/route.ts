import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const subject = await prisma.subject.update({
    where: { id: params.subjectId },
    data: { name: name.trim() },
  });
  return NextResponse.json(subject);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Cascade: deletes lectures, questions, flashcards inside
  await prisma.subject.delete({ where: { id: params.subjectId } });
  return NextResponse.json({ ok: true });
}
