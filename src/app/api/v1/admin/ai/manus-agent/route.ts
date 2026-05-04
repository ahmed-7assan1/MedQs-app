import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { generateJsonWithFallback } from "@/lib/ai-router";
import { scrapeUrlContent } from "@/lib/manus-fetcher";
import { searchOpenIMedicalImage } from "@/lib/open-i";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;

    const site = await prisma.siteConfig.findFirst({ select: { enableAI: true, aiPreferredProvider: true } });
    if (site && site.enableAI === false) {
      return NextResponse.json({ error: "AI is disabled in Site Settings" }, { status: 400 });
    }

    const body = await req.json();
    const lectureId = String(body.lectureId || "").trim();
    const url = String(body.url || "").trim();
    const personalKey = String(body.apiKey || "").trim();
    const personalProvider = String(body.provider || "").trim();

    if (!lectureId || !url) {
      return NextResponse.json({ error: "lectureId and url are required" }, { status: 400 });
    }

    const boundary = await assertLecture(w.scope, lectureId);
    if (boundary) return boundary;

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { subject: { select: { name: true, module: { select: { name: true } } } } },
    });
    if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

    // MANUS Fetcher Intervention
    const text = await scrapeUrlContent(url);
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "MANUS Agent could not extract readable text from link" }, { status: 422 });
    }

    const cap = text.slice(0, 30000); // up to 30k chars

    const prompt = `You are the MANUS Autonomous Agent for a medical curriculum platform.
You are processing a link that was attached to a lecture.

Lecture title: ${lecture.title}
Module: ${lecture.subject.module?.name ?? "General"}
Subject: ${lecture.subject.name}
Extracted Text Snapshot:
${cap}

Your job is to read the text and produce COMPLETE study assets.
CRITICAL INSTRUCTIONS:
1. If the text contains RAW MCQs, extract all of them exactly.
2. If the text is a LECTURE EXPLANATION/PDF (no questions), you MUST creatively generate at least 10-15 high-yield MCQs and 10-20 Flashcards based on the clinical facts in the text.
3. If the text is very short, generate as much as possible to ensure the student has revision material.
4. Never return empty arrays if there is any readable medical content.

Return ONLY valid JSON:
{
  "notesMarkdown": "markdown summary with ## and bullets",
  "flashcards": [{"front":"...","back":"..."}],
  "questions": [{"body":"...","choices":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],"answer":"A","explanation":"...","difficulty":"MEDIUM"}]
}

Rules:
- notesMarkdown: Keep it structured and high-yield.
- flashcards: Aim for 10-20 items.
- questions: Aim for 10-15 items.`;

    const fallback = { notesMarkdown: "", flashcards: [], questions: [] };
    const row = await generateJsonWithFallback<typeof fallback>(prompt, fallback, {
      preferredProvider: personalProvider || site?.aiPreferredProvider || undefined,
      systemPrompt: "You are the MANUS Agent. Return only JSON.",
      personalKey: personalKey || undefined,
    });

    const flashcardsClean = (row.data.flashcards ?? [])
      .filter((c: any) => c && String(c.front ?? "").trim() && String(c.back ?? "").trim())
      .map((c: any) => ({ front: String(c.front).trim().slice(0, 500), back: String(c.back).trim().slice(0, 1200) }))
      .slice(0, 40);

    const questionsClean = (row.data.questions ?? [])
      .filter((q: any) => q && String(q.body ?? "").trim() && Array.isArray(q.choices) && String(q.answer ?? "").trim())
      .map((q: any) => ({
        body: String(q.body).trim().slice(0, 6000),
        choices: (q.choices as any[])
          .slice(0, 6)
          .map((c) => ({ key: String(c.key ?? "").trim(), text: String(c.text ?? "").trim() }))
          .filter((c) => c.key && c.text)
          .slice(0, 4),
        answer: String(q.answer).trim().slice(0, 2),
        explanation: String(q.explanation ?? "").trim().slice(0, 4000),
        difficulty: (String(q.difficulty ?? "MEDIUM").toUpperCase() === "EASY"
          ? "EASY"
          : String(q.difficulty ?? "").toUpperCase() === "HARD"
            ? "HARD"
            : "MEDIUM") as "EASY" | "MEDIUM" | "HARD",
      }))
      .filter((q) => q.choices.length >= 2)
      .slice(0, 30);

    // Commit results directly into DB
    await prisma.$transaction(async (tx: any) => {
      // 1. Update Notes (Append)
      if (row.data.notesMarkdown) {
        const lectureCurrent = await tx.lecture.findUnique({
          where: { id: lectureId },
          select: { notesMarkdown: true }
        });
        const prevNotes = lectureCurrent?.notesMarkdown?.trim() ?? "";
        const mergedNotes = prevNotes ? `${prevNotes}\n\n---\n\n${row.data.notesMarkdown}` : row.data.notesMarkdown;
        await tx.lecture.update({
          where: { id: lectureId },
          data: { notesMarkdown: mergedNotes }
        });
      }

      // 2. Add Flashcards
      if (flashcardsClean.length > 0) {
        await tx.flashcard.createMany({
          data: flashcardsClean.map((f: any) => ({
            lectureId,
            front: f.front,
            back: f.back
          }))
        });
      }

    // 3. Add Questions
    if (questionsClean.length > 0) {
      const questionsWithImages = await Promise.all(questionsClean.map(async (q: any) => {
        let imageUrl = null;
        if (body.enableSmartImages) {
          imageUrl = await searchOpenIMedicalImage(q.body);
        }
        return {
          lectureId,
          body: q.body,
          choices: q.choices,
          answer: q.answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          imageUrl: imageUrl || null
        };
      }));

      await tx.question.createMany({
        data: questionsWithImages
      });
    }
    });

    return NextResponse.json({
      ok: true,
      provider: row.provider,
      generatedResults: {
        questions: questionsClean.length,
        flashcards: flashcardsClean.length,
        notes: row.data.notesMarkdown ? true : false,
      }
    });
  } catch (e: any) {
    console.error("MANUS Agent failed:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
