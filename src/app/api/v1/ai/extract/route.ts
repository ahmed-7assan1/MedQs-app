import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";
import { extractQuestionsFromTextWithMeta, validateQuestionsWithMeta } from "@/lib/gemini";
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
  const file = formData.get("file") as File | null;
  const preferredProvider = String(formData.get("preferredProvider") ?? "").trim() || undefined;
  const site = await prisma.siteConfig.findFirst({ select: { aiPreferredProvider: true } }).catch(() => null);
  const effectiveProvider =
    normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  if (file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: "Max file size 20MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (file.name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    text = parsed.text;
  } else if (file.name.endsWith(".docx")) {
    text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, " ");
  } else {
    return NextResponse.json({ error: "Only PDF and DOCX supported" }, { status: 400 });
  }

  if (!text.trim()) return NextResponse.json({ questions: [], issues: [] });

  try {
    const extracted = await extractQuestionsFromTextWithMeta(text, { preferredProvider: effectiveProvider });
    const reviewed = await validateQuestionsWithMeta(
      extracted.data.map((q) => ({ body: q.body, answer: q.answer })),
      { preferredProvider: effectiveProvider }
    );
    return NextResponse.json({
      questions: extracted.data,
      issues: reviewed.data,
      provider: extracted.meta.provider,
      fallbackFrom: extracted.meta.fallbackFrom,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI extraction failed";
    console.error("[api/v1/ai/extract]", e);
    return NextResponse.json({ error: msg, questions: [], issues: [] }, { status: 502 });
  }
}
