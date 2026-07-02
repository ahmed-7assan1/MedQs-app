import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await Promise.resolve(ctx.params);

  const row = await prisma.lecture.findUnique({
    where: { id },
    select: {
      notesMarkdown: true,
      _count: { select: { questions: true, flashcards: true, files: true } },
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = `${row.notesMarkdown?.length ?? 0}-${row._count.questions}-${row._count.flashcards}-${row._count.files}`;

  return NextResponse.json({
    lectureId: id,
    version,
    updatedAt: new Date().toISOString(),
  });
}
