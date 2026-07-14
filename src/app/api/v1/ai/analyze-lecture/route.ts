import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";
import { generateAIReplyWithFallback } from "@/lib/ai-router";
import { resolveBestKey } from "@/lib/byok-resolver";

export const maxDuration = 60; // 60 seconds max duration for Vercel Hobby

/** Fetches a URL and returns its content as a base64 string + mimeType */
async function fetchFileAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    const mimeType = contentType.split(";")[0].trim() || "application/octet-stream";
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    return { data, mimeType };
  } catch {
    return null;
  }
}

/** Extracts plain text from a PDF buffer using pdf-parse */
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    return parsed.text?.trim() || "";
  } catch {
    return "";
  }
}

const ANALYSIS_PROMPT = (content: string) => `You are a medical education AI. Analyze the following lecture content and generate educational materials.

Return ONLY valid JSON (no markdown code blocks) with this exact structure:
{
  "questions": [{"body": "Question text?", "choices": ["A. option", "B. option", "C. option", "D. option"], "answer": "A", "explanation": "Why A is correct"}],
  "flashcards": [{"front": "Term or concept", "back": "Definition or explanation"}],
  "mnemonics": [{"word": "MNEMONIC", "topic": "What it helps remember", "items": [{"l": "M", "t": "Full word meaning"}]}],
  "cases": [{"title": "Case title", "vignette": "Patient presentation and clinical scenario"}],
  "mindMapGraph": {"nodes": [{"id": "root", "label": "Main Topic", "level": 0}, {"id": "n1", "label": "Sub Topic", "level": 1, "detail": "Details"}], "edges": [{"from": "root", "to": "n1"}]},
  "notesMarkdown": "# Structured lecture summary in markdown"
}

Rules:
- Generate 5-10 high-yield MCQs. Choices MUST be an array of 4 strings like ["A. ...", "B. ...", "C. ...", "D. ..."]
- Generate 8-12 flashcards covering key terms
- Generate 2-3 mnemonics for the hardest-to-remember lists
- Generate 1-2 realistic clinical case vignettes
- Mind map should have a root node (level 0) and 4-8 child nodes (level 1-2)
- Notes markdown should be a comprehensive structured summary

Lecture Content:
${content.slice(0, 10000)}`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { lectureId } = await req.json();
  if (!lectureId) return NextResponse.json({ error: "Lecture ID required" }, { status: 400 });

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { files: true },
  });

  if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  // ─── Step 1: Collect content from all attached files + notes ─────────────────
  let contentText = lecture.notesMarkdown?.trim() || "";
  const pdfParts: { mimeType: "application/pdf"; data: string }[] = [];
  const usedSources: string[] = [];

  if (contentText) usedSources.push("📝 Lecture notes");

  // Find all PDF files attached to this lecture
  const pdfFiles = lecture.files.filter(
    (f) => f.mimeType === "application/pdf" || f.url.toLowerCase().endsWith(".pdf")
  );

  for (const file of pdfFiles.slice(0, 3)) { // max 3 PDFs
    const fetched = await fetchFileAsBase64(file.url);
    if (!fetched) {
      console.warn(`[analyze-lecture] Could not fetch: ${file.url}`);
      continue;
    }

    // Try text extraction first (fast, accurate for digital PDFs)
    const pdfBuffer = Buffer.from(fetched.data, "base64");
    const extractedText = await extractTextFromPdfBuffer(pdfBuffer);

    if (extractedText.length > 200) {
      // Good digital PDF — extract text
      contentText += `\n\n--- Content from: ${file.name} ---\n${extractedText}`;
      usedSources.push(`📄 ${file.name} (text extracted)`);
    } else if (fetched.data.length < 5 * 1024 * 1024 * 1.37) {
      // Scanned PDF — send as multimodal to Gemini
      pdfParts.push({ mimeType: "application/pdf", data: fetched.data });
      usedSources.push(`📄 ${file.name} (Gemini vision)`);
    }
  }

  if (!contentText.trim() && pdfParts.length === 0) {
    return NextResponse.json({
      error: "No content found. Please add notes or attach a PDF file to this lecture first.",
    }, { status: 400 });
  }

  console.log(`[analyze-lecture] Lecture: ${lecture.title} | Sources: ${usedSources.join(", ")}`);

  // ─── Step 2: Generate with AI ────────────────────────────────────────────────
  try {
    const userWithKeys = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { adminAiKeys: true },
    });
    const resolved = resolveBestKey(userWithKeys, "gemini");

    const result = await generateAIReplyWithFallback(
      ANALYSIS_PROMPT(contentText || "(Analyze the attached PDF file)"),
      "You are a medical education content generator. Output ONLY valid JSON — no markdown, no explanation, no preamble.",
      {
        preferredProvider: "gemini",
        pdfs: pdfParts.length > 0 ? pdfParts : undefined,
        personalKey: resolved?.key,
        useCustomKey: !!resolved,
        customProvider: "gemini",
      }
    );

    // Strip any accidental markdown fences
    const raw = result.text
      .replace(/^```(?:json)?\s*/im, "")
      .replace(/\s*```\s*$/im, "")
      .trim();

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]+\}/);
      if (!match) throw new Error("AI did not return valid JSON");
      data = JSON.parse(match[0]);
    }

    // ─── Step 3: Save to database ─────────────────────────────────────────────
    // Clear previous AI-generated flashcards to avoid duplicates
    await prisma.flashcard.deleteMany({ where: { lectureId } });

    const overviewCards = data.notesMarkdown
      ? [{ title: "AI Summary", body: (data.notesMarkdown as string).slice(0, 300).replace(/#+\s.+\n/g, "").trim() }]
      : [];

    await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        notesMarkdown: data.notesMarkdown || lecture.notesMarkdown,
        extras: {
          mnemonics: Array.isArray(data.mnemonics) ? data.mnemonics : [],
          cases: Array.isArray(data.cases) ? data.cases : [],
          mindMapGraph: data.mindMapGraph || { nodes: [], edges: [] },
          overviewCards,
          analyzedSources: usedSources,
        },
      },
    });

    // Create flashcards
    if (Array.isArray(data.flashcards) && data.flashcards.length > 0) {
      await prisma.flashcard.createMany({
        data: data.flashcards
          .filter((f: any) => f.front && f.back)
          .map((f: any) => ({ front: String(f.front), back: String(f.back), lectureId })),
      });
    }

    // Create questions (skip exact body duplicates)
    if (Array.isArray(data.questions) && data.questions.length > 0) {
      for (const q of data.questions) {
        if (!q.body || !Array.isArray(q.choices) || !q.answer) continue;
        const exists = await prisma.question.findFirst({ where: { lectureId, body: String(q.body) } });
        if (!exists) {
          await prisma.question.create({
            data: {
              body: String(q.body),
              choices: q.choices,
              answer: String(q.answer).charAt(0).toUpperCase(),
              explanation: q.explanation ? String(q.explanation) : null,
              lectureId,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sources: usedSources,
      generated: {
        questions: Array.isArray(data.questions) ? data.questions.length : 0,
        flashcards: Array.isArray(data.flashcards) ? data.flashcards.length : 0,
        mnemonics: Array.isArray(data.mnemonics) ? data.mnemonics.length : 0,
        cases: Array.isArray(data.cases) ? data.cases.length : 0,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    console.error("[analyze-lecture]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
