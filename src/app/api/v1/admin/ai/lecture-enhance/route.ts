import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLectureEnhancements } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const lectureId = typeof body.lectureId === "string" ? body.lectureId.trim() : "";
  const instructions = typeof body.instructions === "string" ? body.instructions : "";
  const wantNotes = Boolean(body.notes);
  const wantFlashcards = Boolean(body.flashcards);
  if (!lectureId) return NextResponse.json({ error: "lectureId required" }, { status: 400 });
  if (!wantNotes && !wantFlashcards)
    return NextResponse.json({ error: "Select notes and/or flashcards" }, { status: 400 });

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: {
      subject: { select: { name: true, module: { select: { name: true } } } },
    },
  });
  if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  try {
    const { notesMarkdown, flashcards } = await generateLectureEnhancements(
      lecture.title,
      lecture.subject.name,
      lecture.subject.module.name,
      instructions,
      wantNotes,
      wantFlashcards
    );

    await prisma.$transaction(async (tx) => {
      if (wantNotes && notesMarkdown) {
        /** Raw SQL so this works even when Prisma Client was not regenerated after adding `notesMarkdown` (common Windows EPERM during `prisma generate`). */
        const rows = await tx.$queryRaw<Array<{ notesMarkdown: string | null }>>(
          Prisma.sql`SELECT "notesMarkdown" FROM "Lecture" WHERE "id" = ${lectureId} LIMIT 1`
        );
        const prev = rows[0]?.notesMarkdown?.trim() ?? "";
        const merged = prev ? `${prev}\n\n---\n\n${notesMarkdown}` : notesMarkdown;
        await tx.$executeRaw(
          Prisma.sql`UPDATE "Lecture" SET "notesMarkdown" = ${merged} WHERE "id" = ${lectureId}`
        );
      }
      if (wantFlashcards && flashcards.length > 0) {
        await tx.flashcard.createMany({
          data: flashcards.map((c) => ({
            lectureId,
            front: c.front,
            back: c.back,
          })),
        });
      }
    });

    return NextResponse.json({
      ok: true,
      notesAdded: wantNotes && Boolean(notesMarkdown),
      flashcardsAdded: wantFlashcards ? flashcards.length : 0,
    });
  } catch (e) {
    console.error("[lecture-enhance]", e);
    const msg = e instanceof Error ? e.message : "AI failed";
    if (/notesMarkdown|column .* does not exist|42703/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "The Lecture.notesMarkdown column is missing in the database. Run: npx prisma db push (or npm run db:sync), then retry.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
