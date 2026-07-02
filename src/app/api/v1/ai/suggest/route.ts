import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";
import { suggestQuestionDetailsWithMeta } from "@/lib/gemini";
import { redisIncrWithExpire } from "@/lib/redis";
import { resolveBestKey } from "@/lib/byok-resolver";

const RATE_LIMIT = 20; // requests per hour per admin user

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

  // Rate limit: 20 AI suggest requests per hour per admin
  const key = `ratelimit:ai:suggest:${session!.user!.id}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(key, 3600);
  if (count > RATE_LIMIT) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Max ${RATE_LIMIT} AI suggestions per hour.` },
      { status: 429 }
    );
  }

  const { body, preferredProvider, customApiKey, customModel } = await req.json();
  const { getSiteConfig: getCfg } = await import("@/lib/get-site-config");
  const site = await getCfg().catch(() => null);
  const effectiveProvider =
    normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);
  if (!body?.trim())
    return NextResponse.json({ error: "Question body required" }, { status: 400 });

  let effectiveApiKey = customApiKey;
  if (!effectiveApiKey && effectiveProvider) {
    const userWithKeys = await prisma.user.findUnique({
      where: { id: session!.user!.id },
      include: { adminAiKeys: true },
    });
    const resolved = resolveBestKey(userWithKeys, effectiveProvider);
    if (resolved) effectiveApiKey = resolved.key;
  }

  try {
    const out = await suggestQuestionDetailsWithMeta(body, { 
      preferredProvider: effectiveProvider,
      customApiKey: effectiveApiKey,
      customModel,
    });
    return NextResponse.json({
      ...out.data,
      provider: out.meta.provider,
      fallbackFrom: out.meta.fallbackFrom,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI suggestion failed";
    console.error("[api/v1/ai/suggest]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
