import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AIConfigurationError,
  generateAIReplyWithFallback,
  type ChatImagePart,
} from "@/lib/ai-router";
import { buildMedicalSystemPrompt } from "@/lib/medical-ai-prompts";

function sanitizeImages(raw: unknown): ChatImagePart[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ChatImagePart[] = [];
  for (const item of raw.slice(0, 2)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const mimeType = typeof o.mimeType === "string" ? o.mimeType : "";
    let data = typeof o.data === "string" ? o.data.trim() : "";
    if (data.startsWith("data:")) {
      const mid = data.indexOf(",");
      if (mid > 0) data = data.slice(mid + 1);
    }
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(mimeType)) continue;
    const approxBytes = (data.length * 3) / 4;
    if (approxBytes > 4 * 1024 * 1024) continue;
    if (data) out.push({ mimeType: mimeType.toLowerCase(), data });
  }
  return out;
}

// Daily chat limits per rank (label → daily limit; -1 = unlimited)
const RANK_LIMITS: Record<string, number> = {
  Newbie:       5,
  Active:       15,
  Contributor:  30,
  Expert:       60,
  Elite:        -1, // unlimited
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const site = await prisma.siteConfig.findFirst({ select: { enableAI: true } }).catch(() => null);
  if (site?.enableAI === false) {
    return NextResponse.json({ error: "AI chat is disabled for this site in admin settings." }, { status: 403 });
  }

  const body = await req.json();
  const { message: rawMessage, context, images: rawImages } = body;
  const images = sanitizeImages(rawImages);
  const message =
    typeof rawMessage === "string" && rawMessage.trim()
      ? rawMessage.trim()
      : images.length > 0
        ? "(The student attached image(s) with no text. Describe what you see in a medical-education context and ask what they want to know.)"
        : "";
  if (!message) return NextResponse.json({ error: "Message or image required" }, { status: 400 });

  // Get user with rank
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { rank: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const rankLabel = user.rank?.label ?? "Newbie";
  const dailyLimit = RANK_LIMITS[rankLabel] ?? 5;

  // Check daily usage
  const today = new Date().toISOString().slice(0, 10);

  if (dailyLimit !== -1) {
    const usageRecord = await prisma.aIUsageLog.findUnique({
      where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
    });
    const used = usageRecord?.count ?? 0;

    if (used >= dailyLimit) {
      return NextResponse.json(
        {
          error: `Daily limit reached`,
          limit: dailyLimit,
          used,
          rankLabel,
          nextRankHint: rankLabel !== "Elite"
            ? `Earn more points to reach a higher rank and get more daily messages!`
            : null,
        },
        { status: 429 }
      );
    }
  }

  const systemPrompt = buildMedicalSystemPrompt(
    context ? `Current context: the student is studying ${context}` : undefined
  );

  let aiResult: { provider: string; text: string };
  try {
    aiResult = await generateAIReplyWithFallback(message, systemPrompt, { images });
  } catch (e) {
    console.error("[ai/chat]", e);
    if (e instanceof AIConfigurationError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    const detail = e instanceof Error ? e.message.trim() : "";
    const safe =
      detail && detail.length < 500
        ? detail
        : "The AI service did not respond. Set GEMINI_API_KEY, restart `npm run dev`, or try GEMINI_MODEL=gemini-1.5-flash in .env if the model is unavailable.";
    return NextResponse.json({ error: safe }, { status: 503 });
  }
  const reply = aiResult.text;

  // Increment usage counter
  await prisma.aIUsageLog.upsert({
    where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
    create: { userId: user.id, type: "chat", date: today, count: 1 },
    update: { count: { increment: 1 } },
  });

  // Get updated count
  const updatedUsage = await prisma.aIUsageLog.findUnique({
    where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
  });

  return NextResponse.json({
    reply,
    provider: aiResult.provider,
    used: updatedUsage?.count ?? 1,
    limit: dailyLimit,
    rankLabel,
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { rank: true },
  });

  const rankLabel = user?.rank?.label ?? "Newbie";
  const dailyLimit = RANK_LIMITS[rankLabel] ?? 5;
  const today = new Date().toISOString().slice(0, 10);

  const usage = await prisma.aIUsageLog.findUnique({
    where: { userId_type_date: { userId: session.user.id, type: "chat", date: today } },
  });

  return NextResponse.json({
    used: usage?.count ?? 0,
    limit: dailyLimit,
    rankLabel,
    limits: RANK_LIMITS,
  });
}
