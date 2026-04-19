import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  try {
    const { resourceId, resourceType, targetSubjectId, targetSemesterId, targetModuleId } = await req.json();

    if (!resourceId || !resourceType) {
      return NextResponse.json({ error: "Missing identity fields" }, { status: 400 });
    }

    // 1. IMPORT LECTURE
    if (resourceType === "LECTURE") {
      if (!targetSubjectId) return NextResponse.json({ error: "Target Subject required" }, { status: 400 });

      const sourceLec = await prisma.lecture.findUnique({
        where: { id: resourceId },
        include: { flashcards: true, files: true }
      });

      if (!sourceLec) return NextResponse.json({ error: "Source not found" }, { status: 404 });

      // Create cloned lecture
      const clonedLec = await prisma.lecture.create({
        data: {
          title: sourceLec.title,
          videoUrl: sourceLec.videoUrl,
          notesMarkdown: sourceLec.notesMarkdown,
          subjectId: targetSubjectId,
          order: 0, // append at start
          flashcards: {
            create: sourceLec.flashcards.map(f => ({
              front: f.front,
              back: f.back
            }))
          },
          files: {
            create: sourceLec.files.map(f => ({
              name: f.name,
              url: f.url,
              mimeType: f.mimeType
            }))
          }
        }
      });

      return NextResponse.json({ success: true, lecture: clonedLec });
    }

    // 2. IMPORT PAST PAPER / QUIZ
    if (resourceType === "PAST_PAPER") {
      if (!targetSemesterId) return NextResponse.json({ error: "Target Semester required" }, { status: 400 });

      const sourcePaper = await prisma.pastPaper.findUnique({
        where: { id: resourceId },
        include: { 
          quizLecture: { 
            include: { questions: true } 
          } 
        }
      });

      if (!sourcePaper) return NextResponse.json({ error: "Source not found" }, { status: 404 });

      // Create cloned paper
      const clonedPaper = await prisma.pastPaper.create({
        data: {
          title: sourcePaper.title,
          pdfUrl: sourcePaper.pdfUrl,
          isInteractive: sourcePaper.isInteractive,
          isPrivate: false,
          kind: sourcePaper.kind,
          semesterId: targetSemesterId,
          moduleId: targetModuleId || sourcePaper.moduleId, // use target module if provided
          quizLecture: sourcePaper.quizLecture ? {
            create: {
              title: sourcePaper.quizLecture.title,
              subjectId: targetSubjectId ?? "import-placeholder",
              questions: {
                create: sourcePaper.quizLecture.questions.map(q => ({
                  body: q.body,
                  choices: q.choices as any,
                  answer: q.answer,
                  explanation: q.explanation,
                  aiExplanation: q.aiExplanation,
                  difficulty: q.difficulty,
                  questionType: q.questionType,
                  imageUrl: q.imageUrl,
                  stemLayout: q.stemLayout,
                  essayReference: q.essayReference
                }))
              }
            }
          } : undefined
        }
      });

      return NextResponse.json({ success: true, paper: clonedPaper });
    }

    return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });

  } catch (error) {
    console.error("[POST import]", error);
    return NextResponse.json({ error: "Import failed: " + (error as Error).message }, { status: 500 });
  }
}
