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

  const lecture = await prisma.lecture.findUnique({
    where: { id },
    select: {
      title: true,
      notesMarkdown: true,
      _count: { select: { questions: true, flashcards: true, files: true } },
    },
  });

  if (!lecture) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = `${lecture.notesMarkdown?.length ?? 0}-${lecture._count.questions}-${lecture._count.flashcards}-${lecture._count.files}`;

  return NextResponse.json({
    lectureId: id,
    version,
    title: lecture.title,
    summary: "",
    content: lecture.notesMarkdown ?? "",
    transcript: "",
  });
}
