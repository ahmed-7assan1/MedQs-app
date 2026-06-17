import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NOTE_MAX = 2000;
const IMAGE_MAX_COUNT = 5;
const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const rawNote = typeof o.note === "string" ? o.note.trim() : "";
  const note = rawNote.slice(0, NOTE_MAX);
  const pastPaperId = typeof o.pastPaperId === "string" && o.pastPaperId.length > 0 ? o.pastPaperId : null;

  let images: string[] = [];
  if (Array.isArray(o.images)) {
    images = o.images
      .filter((img): img is string => typeof img === "string")
      .slice(0, IMAGE_MAX_COUNT)
      .filter((img) => img.length <= IMAGE_MAX_SIZE_BYTES);
  }

  const question = await prisma.question.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  if (pastPaperId) {
    const paper = await prisma.pastPaper.findUnique({
      where: { id: pastPaperId },
      select: { id: true },
    });
    if (!paper) {
      return NextResponse.json({ error: "Invalid past paper" }, { status: 400 });
    }
  }

  await prisma.questionReport.create({
    data: {
      questionId: params.id,
      userId: session.user.id,
      note: note.length > 0 ? note : null,
      images,
      pastPaperId,
    },
  });

  return NextResponse.json({ success: true });
}
