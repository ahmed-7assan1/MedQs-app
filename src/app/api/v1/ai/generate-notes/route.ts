import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdminWriter } from "@/lib/admin-scope";
import { generateStudyNotesWithMeta } from "@/lib/gemini";
import { generateAIReplyWithFallback } from "@/lib/ai-router";
import { redisIncrWithExpire } from "@/lib/redis";

export const maxDuration = 60; // 60 seconds max duration for Vercel Hobby

const RATE_LIMIT = 5; // Extractions per hour per user

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

  // Rate limit
  const key = `ratelimit:ai:generate-notes:${session!.user!.id}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(key, 3600);
  if (count > RATE_LIMIT) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Max ${RATE_LIMIT} notes generations per hour.` },
      { status: 429 }
    );
  }

  const formData = await req.formData() as any;
  const lectureId = formData.get("lectureId") as string;
  const file = formData.get("file") as File | null;
  const instructions = String(formData.get("instructions") ?? "").trim();
  const preferredProvider = String(formData.get("preferredProvider") ?? "").trim() || undefined;

  const { getSiteConfig: getCfg } = await import("@/lib/get-site-config");
  const site = await getCfg().catch(() => null);
  const effectiveProvider = normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);

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
    text = ""; // handled by OCR below
  } else {
    return NextResponse.json({ error: "Only PDF, DOCX, and images supported" }, { status: 400 });
  }

  // OCR assist via Gemini multimodal
  const shouldTryOcr = (!text.trim() || text.trim().length < 120) && file.size <= 12 * 1024 * 1024;
  if (shouldTryOcr) {
    try {
      const ocrPrompt = "Extract clean readable text from this medical study file. Return plain text only, keep line breaks.";
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

  // Local OCR
  if ((!text.trim() || text.trim().length < 40) && isImage && file.size <= 15 * 1024 * 1024) {
    try {
      const { ocrImageBuffer } = await import("@/lib/ocr");
      const local = await ocrImageBuffer(buffer);
      if (local?.trim()) {
        text = `${text}\n${local}`.trim();
      }
    } catch { /* ignore */ }
  }

  if (!text.trim()) return NextResponse.json({ title: "", content: "", ocrUsed: true });

  try {
    const generated = await generateStudyNotesWithMeta(text, instructions, {
      preferredProvider: effectiveProvider,
    });
    
    return NextResponse.json({
      title: generated.data.title,
      content: generated.data.content,
      ocrUsed: shouldTryOcr,
      provider: generated.meta.provider,
      fallbackFrom: generated.meta.fallbackFrom,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI extraction failed";
    console.error("[api/v1/ai/generate-notes]", e);
    return NextResponse.json({ error: msg, title: "", content: "" }, { status: 502 });
  }
}
