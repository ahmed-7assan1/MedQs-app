// src/app/api/v1/questions/[id]/explain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExplanationWithMeta } from "@/lib/gemini";
import { cacheGet, cacheSet } from "@/lib/redis";

function normalizePreferredProvider(raw: unknown): "gemini" | "openai" | "anthropic" | "deepseek" | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (s === "gemini" || s === "openai" || s === "anthropic" || s === "deepseek") return s;
  return undefined;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const site = await prisma.siteConfig
    .findFirst({ select: { enableAI: true, aiPreferredProvider: true } })
    .catch(() => null);
  if (site?.enableAI === false) {
    return NextResponse.json({ error: "AI explanations are disabled for this site" }, { status: 403 });
  }

  const paperId = req.nextUrl.searchParams.get("paperId")?.trim();
  const preferredProvider = req.nextUrl.searchParams.get("provider")?.trim() ?? "";
  const effectiveProvider =
    normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);
  if (paperId) {
    const paper = await prisma.pastPaper
      .findUnique({ where: { id: paperId }, select: { aiExplanationEnabled: true } })
      .catch(() => null);
    if (paper?.aiExplanationEnabled === false) {
      return NextResponse.json({ error: "AI explanations are disabled for this quiz" }, { status: 403 });
    }
  }

  const cacheKey = `explain:${params.id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json({ explanation: cached, cached: true });

  const question = await prisma.question.findUnique({
    where: { id: params.id },
    select: { body: true, choices: true, answer: true, explanation: true, aiExplanation: true },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin explanation takes priority
  if (question.explanation) {
    await cacheSet(cacheKey, question.explanation, 3600);
    return NextResponse.json({ explanation: question.explanation, source: "admin" });
  }

  // Cached AI explanation
  if (question.aiExplanation) {
    await cacheSet(cacheKey, question.aiExplanation, 3600);
    return NextResponse.json({ explanation: question.aiExplanation, source: "ai_cached" });
  }

  // Generate fresh
  const out = await generateExplanationWithMeta(
    question.body,
    question.choices as any,
    question.answer,
    { preferredProvider: effectiveProvider }
  );
  const explanation = out.data;

  // Persist AI explanation
  await prisma.question.update({ where: { id: params.id }, data: { aiExplanation: explanation } });
  await cacheSet(cacheKey, explanation, 3600);

  return NextResponse.json({
    explanation,
    source: "ai_generated",
    provider: out.meta.provider,
    fallbackFrom: out.meta.fallbackFrom,
  });
}
