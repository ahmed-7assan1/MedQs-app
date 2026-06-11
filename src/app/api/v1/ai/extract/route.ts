import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdminWriter } from "@/lib/admin-scope";
import { extractQuestionsFromTextByModeWithMeta, validateQuestionsWithMeta } from "@/lib/gemini";
import { generateAIReplyWithFallback } from "@/lib/ai-router";
import { redisIncrWithExpire } from "@/lib/redis";

export const maxDuration = 60; // 60 seconds max duration for Vercel Hobby

const RATE_LIMIT = 5000; // PDF extractions per hour — effectively disabled for admin

function normalizePreferredProvider(raw: unknown): "gemini" | "openai" | "anthropic" | "deepseek" | "groq" | "openrouter" | "xai" | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (["gemini", "openai", "anthropic", "deepseek", "groq", "openrouter", "xai"].includes(s)) return s as any;
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

  const formData = await req.formData() as any;
  const startedAt = Date.now();
  const file = formData.get("file") as File | null;
  const questionModeRaw = String(formData.get("questionMode") ?? "mcq").trim().toLowerCase();
  const questionMode = questionModeRaw === "essay" || questionModeRaw === "mixed" ? questionModeRaw : "mcq";
  const preferredProvider = String(formData.get("preferredProvider") ?? "").trim() || undefined;
  const customApiKey = String(formData.get("customApiKey") ?? "").trim() || undefined;
  const customModel = String(formData.get("customModel") ?? "").trim() || undefined;

  const { getSiteConfig: getCfg } = await import("@/lib/get-site-config");
  const site = await getCfg().catch(() => null);
  const effectiveProvider =
    normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  if (file.size > 35 * 1024 * 1024)
    return NextResponse.json({ error: "Max file size 35MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";
  let ocrSuccessful = false;

  const lcName = file.name.toLowerCase();
  const isImage = lcName.endsWith(".png") || lcName.endsWith(".jpg") || lcName.endsWith(".jpeg") || lcName.endsWith(".webp");

  // 1. Primary Extraction: Gemini Multimodal OCR (Solves protected/scanned PDFs natively)
  const shouldTryOcr = file.size <= 15 * 1024 * 1024;
  if (shouldTryOcr) {
    try {
      const ocrPrompt =
        "Extract clean readable text from this medical study file. Return plain text only, keep line breaks. Ensure all questions and choices are clearly legible.";
      const useOcrKey = effectiveProvider === "gemini" ? !!customApiKey : false;
      const ocrKey = effectiveProvider === "gemini" ? customApiKey : undefined;
      const ocrModel = effectiveProvider === "gemini" ? customModel : undefined;

      if (isImage) {
        const row = await generateAIReplyWithFallback(ocrPrompt, "OCR extraction for education content.", {
          preferredProvider: "gemini",
          images: [{ mimeType: file.type || "image/png", data: buffer.toString("base64") }],
          personalKey: ocrKey,
          customModel: ocrModel,
          useCustomKey: useOcrKey,
          customProvider: useOcrKey ? "gemini" : undefined,
        });
        if (row.text && row.text.trim().length > 20) {
           text = row.text.trim();
           ocrSuccessful = true;
        }
      } else if (lcName.endsWith(".pdf")) {
        const row = await generateAIReplyWithFallback(ocrPrompt, "OCR extraction for PDF content.", {
          preferredProvider: "gemini",
          pdfs: [{ mimeType: "application/pdf", data: buffer.toString("base64") }],
          personalKey: ocrKey,
          customModel: ocrModel,
          useCustomKey: useOcrKey,
          customProvider: useOcrKey ? "gemini" : undefined,
        });
        if (row.text && row.text.trim().length > 20) {
           text = row.text.trim();
           ocrSuccessful = true;
        }
      }
    } catch (e) {
      console.warn("[OCR fallback]", e);
    }
  }

  // 2. Local Fallback: If OCR failed or file too large, use pdf-parse/docx parser
  if (!ocrSuccessful) {
    if (lcName.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (lcName.endsWith(".docx")) {
      text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, " ");
    } else if (isImage) {
      // Local Tesseract fallback for images
      try {
        const { ocrImageBuffer } = await import("@/lib/ocr");
        const local = await ocrImageBuffer(buffer);
        if (local?.trim()) text = local.trim();
      } catch {}
    } else {
      return NextResponse.json({ error: "Only PDF, DOCX, and images supported" }, { status: 400 });
    }
  }

  if (!text.trim()) return NextResponse.json({ questions: [], issues: [], ocrUsed: true });

  try {
    const extracted = await extractQuestionsFromTextByModeWithMeta(text, questionMode as any, {
      preferredProvider: effectiveProvider,
      customApiKey,
      customModel,
    });
    // Validation is a second AI pass; skip on large/slow requests to reduce timeout risk.
    const elapsed = Date.now() - startedAt;
    const shouldValidate = elapsed < 45_000 && text.length < 8_000 && extracted.data.questions.length <= 25;
    const reviewed = shouldValidate
      ? await validateQuestionsWithMeta(
          extracted.data.questions.map((q) => ({ body: q.body, answer: q.answer })),
          { 
            preferredProvider: effectiveProvider,
            customApiKey,
            customModel,
          }
        )
      : { data: [] as { index: number; issue: string }[] };
    return NextResponse.json({
      quizTitle: extracted.data.title,
      questions: extracted.data.questions,
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
