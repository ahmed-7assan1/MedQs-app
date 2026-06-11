import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";
import { generateJsonWithFallback } from "@/lib/ai-router";

export const runtime = "nodejs";
export const maxDuration = 300;

import { fileToText, scrapeUrlContent } from "@/lib/manus-fetcher";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const w = await requireAdminWriter(session);
    if (!w.ok) return w.response;

    const { getSiteConfig } = await import("@/lib/get-site-config");
    const site = await getSiteConfig();
    if (site && site.enableAI === false) {
      return NextResponse.json({ error: "AI is disabled in Site Settings" }, { status: 400 });
    }

    const form = await req.formData();
    const lectureId = String((form as any).get("lectureId") ?? "").trim();
    const wantNotes = String((form as any).get("notes") ?? "") === "1";
    const wantFlashcards = String((form as any).get("flashcards") ?? "") === "1";
    const wantQuestions = String((form as any).get("questions") ?? "") === "1";
    const wantVideos = String((form as any).get("videos") ?? "") === "1";
    const preferredProvider = String((form as any).get("preferredProvider") ?? "").trim() || undefined;
    const dryRun = String((form as any).get("dryRun") ?? "") === "1";

    const file = (form as any).get("file") as File | null;
    const linkText = String((form as any).get("linkText") || "").trim();

    if (!lectureId) return NextResponse.json({ error: "lectureId required" }, { status: 400 });
    if (!file && !linkText) return NextResponse.json({ error: "Either a file or a link is required" }, { status: 400 });
    if (!wantNotes && !wantFlashcards && !wantQuestions && !wantVideos) {
      return NextResponse.json({ error: "Select at least one output" }, { status: 400 });
    }
    if (file && file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Max file size 20MB" }, { status: 400 });

    const boundary = await assertLecture(w.scope, lectureId);
    if (boundary) return boundary;

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { subject: { select: { name: true, module: { select: { name: true } } } } },
    });
    if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

    let text = "";
    if (linkText) {
       text = await scrapeUrlContent(linkText) || "";
    } else if (file) {
       text = (await fileToText(file)).trim();
    }
    
    if (!text) return NextResponse.json({ error: "File or Link contained no readable text" }, { status: 422 });

    const cap = text.slice(0, 14000);
    const prompt = `You help medical educators turn lecture materials into structured study assets.

Lecture title: ${lecture.title}
Module: ${lecture.subject.module?.name ?? "General"}
Subject: ${lecture.subject.name}

MATERIAL (extract): 
${cap}

Return ONLY valid JSON:
{
  "notesMarkdown": "markdown or empty",
  "flashcards": [{"front":"...","back":"..."}],
  "questions": [{"body":"...","choices":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],"answer":"A","explanation":"...","difficulty":"EASY"}],
  "videoSuggestions": [{"title":"...","searchQuery":"..."}]
}

Rules:
- Use ONLY information supported by the material.
- notesMarkdown: concise, high-yield, use ## headings and bullet points.
- flashcards: 8–24 if requested; short Q/A.
- questions: 5–20 if requested; medically accurate; include explanation; difficulty EASY/MEDIUM/HARD.
- videoSuggestions: 3–8 items if requested; do NOT include direct URLs; provide searchQuery suitable for YouTube search.
- Outputs requested this run:
  wantNotes=${wantNotes}
  wantFlashcards=${wantFlashcards}
  wantQuestions=${wantQuestions}
  wantVideos=${wantVideos}`;

    const fallback = { notesMarkdown: "", flashcards: [], questions: [], videoSuggestions: [] };
    const row = await generateJsonWithFallback<typeof fallback>(prompt, fallback, {
      preferredProvider,
      systemPrompt: "You are a careful medical education assistant. Return only JSON.",
    });

    const notesMarkdown = wantNotes ? String(row.data.notesMarkdown ?? "").trim() : "";
    const flashcards = wantFlashcards ? (row.data.flashcards ?? []) : [];
    const questions = wantQuestions ? (row.data.questions ?? []) : [];
    const videoSuggestions = wantVideos ? (row.data.videoSuggestions ?? []) : [];

    const flashcardsClean = flashcards
      .filter((c: any) => c && String(c.front ?? "").trim() && String(c.back ?? "").trim())
      .map((c: any) => ({ front: String(c.front).trim().slice(0, 500), back: String(c.back).trim().slice(0, 1200) }))
      .slice(0, 40);

    const questionsClean = questions
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

    const suggestionsClean = videoSuggestions
      .filter((v: any) => v && String(v.title ?? "").trim() && String(v.searchQuery ?? "").trim())
      .map((v: any) => ({
        title: String(v.title).trim().slice(0, 140),
        searchQuery: String(v.searchQuery).trim().slice(0, 200),
      }))
      .slice(0, 12);

    if (!dryRun) {
      // Persist selected outputs (notes append + createMany)
      await prisma.$transaction(async (tx: any) => {
        if (wantNotes && notesMarkdown) {
          const rows = (await tx.$queryRawUnsafe(
            `SELECT "notesMarkdown" FROM "Lecture" WHERE "id" = $1 LIMIT 1`,
            lectureId
          )) as Array<{ notesMarkdown: string | null }>;
          const prev = rows[0]?.notesMarkdown?.trim() ?? "";
          const merged = prev ? `${prev}\n\n---\n\n${notesMarkdown}` : notesMarkdown;
          await tx.$executeRawUnsafe(`UPDATE "Lecture" SET "notesMarkdown" = $1 WHERE "id" = $2`, merged, lectureId);
        }
        if (wantFlashcards && flashcardsClean.length) {
          await tx.flashcard.createMany({
            data: flashcardsClean.map((c) => ({ lectureId, front: c.front, back: c.back })),
          });
        }
        if (wantQuestions && questionsClean.length) {
          for (const q of questionsClean) {
            await tx.question.create({
              data: {
                lectureId,
                body: q.body,
                choices: q.choices,
                answer: q.answer,
                explanation: q.explanation || undefined,
                difficulty: q.difficulty,
                stemLayout: "STANDARD",
              },
            });
          }
        }
      });
    }

    return NextResponse.json({
      ok: true,
      provider: row.provider,
      fallbackFrom: row.fallbackFrom,
      dryRun,
      notesAdded: !dryRun && wantNotes && Boolean(notesMarkdown),
      flashcardsAdded: !dryRun && wantFlashcards ? flashcardsClean.length : 0,
      questionsAdded: !dryRun && wantQuestions ? questionsClean.length : 0,
      draft: {
        notesMarkdown: wantNotes ? notesMarkdown : "",
        flashcards: wantFlashcards ? flashcardsClean : [],
        questions: wantQuestions ? questionsClean : [],
        videoSuggestions: wantVideos ? suggestionsClean : [],
      },
    });
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

