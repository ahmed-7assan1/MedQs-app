import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis, redisIncrWithExpire } from "@/lib/redis";
import { generateAIReplyWithFallback, AIConfigurationError } from "@/lib/ai-router";
import { resolveBestKey } from "@/lib/byok-resolver";

export const maxDuration = 60;

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

const PROVIDER_PRIORITY = ["gemini", "openai", "groq", "openrouter", "xai", "anthropic", "deepseek", "siliconflow"] as const;

async function resolveUserKey(userId: string): Promise<{ key: string; provider: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      useCustomKey: true,
      personalGeminiKey: true,
      personalOpenAIKey: true,
      personalGroqKey: true,
      personalOpenRouterKey: true,
      personalXAIKey: true,
      personalAnthropicKey: true,
      personalSiliconFlowKey: true,
      personalSiliconFlowModel: true,
      adminAiKeys: true,
    },
  });
  if (!user?.useCustomKey) return null;
  for (const provider of PROVIDER_PRIORITY) {
    const resolved = resolveBestKey(user, provider);
    if (resolved) return { key: resolved.key, provider };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { url, title: rawTitle, lectureId, personalKey } = body;
  if (!url && !lectureId) {
    return NextResponse.json({ error: "url or lectureId required" }, { status: 400 });
  }

  const videoId = typeof url === "string" ? extractYouTubeId(url) : null;
  const cacheKey = `ai:lecture-summary:${videoId || lectureId}`;

  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached && typeof cached === "string") {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.summary) return NextResponse.json(parsed);
    } catch {}
  }

  const rlKey = `ratelimit:ai:summary:${session.user.id}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(rlKey, 3600);
  if (count > 10) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 summaries per hour." },
      { status: 429 }
    );
  }

  const title = rawTitle || "this video";
  let notesContext = "";
  let videoTitle = title;

  if (lectureId) {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { title: true, notesMarkdown: true },
    });
    if (lecture) {
      videoTitle = lecture.title || title;
      if (lecture.notesMarkdown) {
        notesContext = `\n\nLecture notes for context:\n${lecture.notesMarkdown.slice(0, 3000)}`;
      }
    }
  }

  const ytId = typeof url === "string" ? extractYouTubeId(url) : null;
  if (ytId && !notesContext) {
    try {
      const oRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      const oData = await oRes.json();
      if (oData?.title) videoTitle = oData.title;
    } catch {}
  }

  const prompt = [
    `Summarize the video "${videoTitle}" in 3-5 clear bullet points in Arabic.`,
    `Focus on medical key concepts, main takeaways, and study-relevant points.`,
    `Keep each bullet under 80 characters. Format as a clean markdown list.`,
    notesContext ? `Use the lecture notes below for accuracy:\n${notesContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    let byok: { key: string; provider: string } | null = personalKey ? { key: personalKey, provider: "gemini" } : null;
    if (!byok) {
      byok = await resolveUserKey(session.user.id);
    }

    const result = await generateAIReplyWithFallback(
      prompt,
      "You summarize medical lecture videos concisely in Arabic.",
      byok
        ? { personalKey: byok.key, customProvider: byok.provider as any, useCustomKey: true }
        : { preferredProvider: "gemini" },
    );

    const summary = result.text.trim() || "لم يتمكن الذكاء الاصطناعي من تلخيص هذا الفيديو حالياً.";
    const payload = { summary, provider: result.provider, fallbackFrom: result.fallbackFrom };

    await redis.setex(cacheKey, 86400, JSON.stringify(payload)).catch(() => {});

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[ai/summary]", e);
    const msg = e instanceof AIConfigurationError ? e.message : "AI summary failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
