import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";
import { extractQuestionsFromTextByModeWithMeta, validateQuestionsWithMeta } from "@/lib/gemini";
import { generateAIReplyWithFallback } from "@/lib/ai-router";
import { redisIncrWithExpire } from "@/lib/redis";

const RATE_LIMIT = 5; // PDF extractions per hour — each can be large

function normalizePreferredProvider(raw: unknown): "gemini" | "openai" | "anthropic" | "deepseek" | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (s === "gemini" || s === "openai" || s === "anthropic" || s === "deepseek") return s;
  return undefined;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  // Rate limit: 5 extractions per hour per admin
  const key = `ratelimit:ai:extract:${session!.user!.id}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(key, 3600);
  if (count > RATE_LIMIT) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Max ${RATE_LIMIT} PDF extractions per hour.` },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const startedAt = Date.now();
  const file = formData.get("file") as File | null;
  const questionModeRaw = String(formData.get("questionMode") ?? "mcq").trim().toLowerCase();
  const questionMode = questionModeRaw === "essay" || questionModeRaw === "mixed" ? questionModeRaw : "mcq";
  const preferredProvider = String(formData.get("preferredProvider") ?? "").trim() || undefined;
  const site = await prisma.siteConfig.findFirst({ select: { aiPreferredProvider: true } }).catch(() => null);
  const effectiveProvider =
    normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  if (file.size > 35 * 1024 * 1024)
    return NextResponse.json({ error: "Max file size 35MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  const lcName = file.name.toLowerCase();
  const isImage = lcName.endsWith(".png") || lcName.endsWith(".jpg") || lcName.endsWith(".jpeg") || lcName.endsWith(".webp");

  if (lcName.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (lcName.endsWith(".docx")) {
    text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, " ");
  } else if (isImage) {
    text = "";
  } else {
    return NextResponse.json({ error: "Only PDF, DOCX, and images supported" }, { status: 400 });
  }

  // OCR assist via Gemini multimodal when scanned/noisy files produce little text.
  // Skip OCR for very large files to avoid request timeout.
  const shouldTryOcr = (!text.trim() || text.trim().length < 120) && file.size <= 12 * 1024 * 1024;
  if (shouldTryOcr) {
    try {
      const ocrPrompt =
        "Extract clean readable text from this medical study file. Return plain text only, keep line breaks.";
      if (isImage) {
        const row = await generateAIReplyWithFallback(ocrPrompt, "OCR extraction for education content.", {
          preferredProvider: effectiveProvider,
          images: [{ mimeType: file.type || "image/png", data: buffer.toString("base64") }],
        });
        text = `${text}\n${row.text}`.trim();
      } else if (lcName.endsWith(".pdf")) {
        const row = await generateAIReplyWithFallback(ocrPrompt, "OCR extraction for PDF content.", {
          preferredProvider: effectiveProvider,
          pdfs: [{ mimeType: "application/pdf", data: buffer.toString("base64") }],
        });
        text = `${text}\n${row.text}`.trim();
      }
    } catch {
      // fallback to whatever extracted text we have
    }
  }

  // Local Tesseract fallback for images when cloud OCR / PDF text is still empty or tiny.
  if ((!text.trim() || text.trim().length < 40) && isImage && file.size <= 15 * 1024 * 1024) {
    try {
      const { ocrImageBuffer } = await import("@/lib/ocr");
      const local = await ocrImageBuffer(buffer);
      if (local?.trim()) {
        text = `${text}\n${local}`.trim();
      }
    } catch {
      /* ignore */
    }
  }

  if (!text.trim()) return NextResponse.json({ questions: [], issues: [], ocrUsed: true });

  try {
    const extracted = await extractQuestionsFromTextByModeWithMeta(text, questionMode as any, {
      preferredProvider: effectiveProvider,
    });
    // Validation is a second AI pass; skip on large/slow requests to reduce timeout risk.
    const elapsed = Date.now() - startedAt;
    const shouldValidate = elapsed < 45_000 && text.length < 8_000 && extracted.data.length <= 25;
    const reviewed = shouldValidate
      ? await validateQuestionsWithMeta(
          extracted.data.map((q) => ({ body: q.body, answer: q.answer })),
          { preferredProvider: effectiveProvider }
        )
      : { data: [] as { index: number; issue: string }[] };
    return NextResponse.json({
      questions: extracted.data,
      issues: reviewed.data,
      questionMode,
      ocrUsed: shouldTryOcr,
      provider: extracted.meta.provider,
      fallbackFrom: extracted.meta.fallbackFrom,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI extraction failed";
    console.error("[api/v1/ai/extract]", e);
    return NextResponse.json({ error: msg, questions: [], issues: [] }, { status: 502 });
  }
}
