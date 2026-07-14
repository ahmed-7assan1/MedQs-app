import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { verifyMobileToken } from '@/lib/supabase/auth-helpers';
import { prisma } from "@/lib/prisma";
import { redisIncrWithExpire } from "@/lib/redis";
import {
  AIConfigurationError,
  generateAIReplyWithFallback,
  generateStreamingReply,
  type AIProviderId,
  type ChatImagePart,
} from "@/lib/ai-router";
import { buildMedicalSystemPrompt } from "@/lib/medical-ai-prompts";
import { buildStudentContext } from "@/lib/ai-context-builder";
import { processBotCommand, SECRET_CODE } from "@/lib/bot-commander";
import { getCachedSiteData } from "@/lib/site-cache";
import { telemetry } from "@/lib/session-cache";

const FETCH_MS = Number(process.env.AI_FETCH_TIMEOUT_MS ?? "") > 0 ? Number(process.env.AI_FETCH_TIMEOUT_MS) : 30_000;

function normalizePreferredProvider(raw: unknown): AIProviderId | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  const valid: string[] = ["proxy", "gemini", "openai", "anthropic", "deepseek", "groq", "openrouter", "xai", "duckduckgo", "custom", "siliconflow"];
  if (valid.includes(s)) return s as AIProviderId;
  return undefined;
}

function short(s: string, n = 140) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

async function buildStudentStudyContext(userId: string): Promise<string> {
  const now = Date.now();
  const since = new Date(now - 90 * 24 * 60 * 60 * 1000);

  const [lastViewRows, lastAttemptItem, wrongItems] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        lastViewedAt: Date;
        source: string | null;
        lectureId: string;
        lectureTitle: string;
        subjectName: string;
        moduleName: string;
      }>
    >(
      Prisma.sql`
        SELECT
          a."lastViewedAt",
          a."source",
          l."id" as "lectureId",
          l."title" as "lectureTitle",
          s."name" as "subjectName",
          m."name" as "moduleName"
        FROM "UserLectureActivity" a
        JOIN "Lecture" l ON l."id" = a."lectureId"
        JOIN "Subject" s ON s."id" = l."subjectId"
        JOIN "Module" m ON m."id" = s."moduleId"
        WHERE a."userId" = ${userId}
        ORDER BY a."lastViewedAt" DESC
        LIMIT 1
      `
    ),
    prisma.quizAttemptItem.findFirst({
      where: { attempt: { userId } },
      orderBy: { attempt: { createdAt: "desc" } },
      select: {
        attempt: { select: { createdAt: true } },
        question: {
          select: {
            lecture: {
              select: {
                id: true,
                title: true,
                subject: { select: { name: true, module: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.quizAttemptItem.findMany({
      where: {
        attempt: { userId, createdAt: { gte: since } },
        isCorrect: false,
      },
      take: 200,
      orderBy: { attempt: { createdAt: "desc" } },
      select: {
        chosen: true,
        question: {
          select: {
            body: true,
            answer: true,
            lecture: {
              select: {
                id: true,
                title: true,
                subject: { select: { name: true, module: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
  ]);

  const lines: string[] = [];
  const lastView = lastViewRows[0];
  if (lastView) {
    lines.push(
      `Latest viewed lecture: ${lastView.lectureTitle} (${lastView.moduleName} / ${lastView.subjectName}) via ${lastView.source ?? "unknown"}`
    );
  } else if (lastAttemptItem) {
    const lec = lastAttemptItem.question.lecture;
    lines.push(
      `Latest attempted lecture: ${lec.title} (${lec.subject.module?.name ?? "General"} / ${lec.subject.name})`
    );
  }

  if (wrongItems.length > 0) {
    type Bucket = { count: number; lectureTitle: string; moduleName: string; subjectName: string; sample: string[] };
    const byLecture = new Map<string, Bucket>();
    for (const item of wrongItems) {
      const lec = item.question.lecture;
      const key = lec.id;
      const row = byLecture.get(key) ?? {
        count: 0,
        lectureTitle: lec.title,
        moduleName: lec.subject.module?.name ?? "General",
        subjectName: lec.subject.name,
        sample: [],
      };
      row.count += 1;
      if (row.sample.length < 2) {
        row.sample.push(`Q: ${short(item.question.body, 90)} | correct=${item.question.answer}${item.chosen ? ` | chosen=${item.chosen}` : ""}`);
      }
      byLecture.set(key, row);
    }
    const top = [...byLecture.values()].sort((a, b) => b.count - a.count).slice(0, 5);
    lines.push("Weak areas from wrong answers (last 90 days):");
    for (const t of top) {
      lines.push(`- ${t.lectureTitle} (${t.moduleName}/${t.subjectName}) -> ${t.count} mistakes`);
      for (const s of t.sample) lines.push(`  ${s}`);
    }
  }

  return lines.join("\n");
}

function sanitizeImages(raw: unknown): ChatImagePart[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ChatImagePart[] = [];
  for (const item of raw.slice(0, 3)) { // Max 3 images
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
    if (approxBytes > 5 * 1024 * 1024) continue;  // Max 5MB per image
    if (data) out.push({ mimeType: mimeType.toLowerCase(), data });
  }
  return out;
}

function clip(s: string, max: number) {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

// applyConversationHistory removed — history is now sent as contextHistory from client

const RANK_LIMITS: Record<string, number> = {
  Newbie:       100,
  Active:       300,
  Contributor:  600,
  Expert:       1200,
  Elite:        -1, // unlimited
};

const FILE_LIMITS: Record<string, number> = {
  Newbie:       3,
  Active:       5,
  Contributor:  10,
  Expert:       20,
  Elite:        -1, // unlimited
};

/* ─── Helpers ──────────────────────────────────────────────────────── */

function buildLectureSummary(lecture: {
  title: string;
  notesMarkdown: string | null;
  extras: any;
}): { summary: string; notes: string; hasOverviewCards: boolean } {
  const extras = (lecture.extras ?? {}) as any;
  const overviewCards = Array.isArray(extras.overviewCards) ? extras.overviewCards : [];
  const hasOverviewCards = overviewCards.length > 0;
  const summary = hasOverviewCards
    ? overviewCards.map((c: any) => `- ${c.title}: ${c.body}`).join("\n")
    : clip(lecture.notesMarkdown ?? "", 500);
  const notes = clip(lecture.notesMarkdown ?? "", 2000);
  return { summary, notes, hasOverviewCards };
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
            const decoded = await verifyMobileToken(token);
      if (decoded?.id) userId = decoded.id as string;
    } catch {}
  }
  if (!userId) {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Quick peek at the body to check for secret code BEFORE expensive DB calls ──
  const rawBody = await req.text();
  let bodyJson: any = {};
  try { bodyJson = JSON.parse(rawBody); } catch { /* ignore */ }
  const peekMessage: string = typeof bodyJson.message === "string" ? bodyJson.message.trim() : "";

  // ── Server-enforced rate limit (protects shared Gemini quota) ──
  const isByok = !!(bodyJson as any)?.byokEnabled;
  const rlKey = isByok ? `byok:${userId}` : `server:${userId}`;
  const rlMax = isByok ? 100 : 20;
  const rlWindow = isByok ? 3600 : 86400;
  const rlCount = await redisIncrWithExpire(rlKey, rlWindow);
  if (rlCount > rlMax) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(isByok ? 3600 : 86400) } },
    );
  }

  if (peekMessage.includes(SECRET_CODE)) {
    // Verify the user is ADMIN (only admins can use bot commands)
    const callerRole = await prisma.user
      .findUnique({ where: { id: userId }, select: { role: true } })
      .then((u) => u?.role ?? "STUDENT")
      .catch(() => "STUDENT");

    if (callerRole === "ADMIN" || callerRole === "SUPER_ADMIN") {
      const result = await processBotCommand(peekMessage, userId);
      if (result.handled) {
        return NextResponse.json({
          reply: result.reply,
          provider: "bot-commander",
          used: 0,
          limit: -1,
          rankLabel: "Admin",
        });
      }
    } else {
      return NextResponse.json(
        { reply: "🚫 السيكريت كود ده مخصوص للأدمن فقط. Access denied.", provider: "bot-commander", used: 0, limit: -1, rankLabel: "Student" }
      );
    }
  }

  // ── Use cached site config instead of DB call every request ────────────────
  const siteData = await getCachedSiteData().catch(() => null);
  const site = siteData?.siteConfig ?? null;
  if (site?.enableAI === false) {
    return NextResponse.json({ error: "AI chat is disabled for this site in admin settings." }, { status: 403 });
  }

  // Body already parsed above (rawBody / bodyJson)
  const body = bodyJson;
  const {
    message: rawMessage,
    context,
    lectureId,
    contextHistory,
    specializedModel,
    images: rawImages,
    preferredProvider: rawPreferredProvider,
    provider: rawProvider,
    stream: wantsStream,
    // BYOK properties
    customKey,
    customProvider,
    customModel,
    useCustomKey,
    isLab: rawIsLab,
  } = body;

  const isLab = !!rawIsLab;
  const preferred = rawProvider || rawPreferredProvider;
  const effectiveProvider = normalizePreferredProvider(preferred) ?? normalizePreferredProvider(site?.aiPreferredProvider) ?? "proxy";
  const images = sanitizeImages(rawImages);
  let message =
    typeof rawMessage === "string" && rawMessage.trim()
      ? rawMessage.trim()
      : images.length > 0
        ? "(The student attached images with no text. Summarize what is relevant for medical study and ask what they want to focus on.)"
        : "";
  if (!message) return NextResponse.json({ error: "Message or attachment required" }, { status: 400 });

  // Attach context history from client (dynamic token-budgeted window)
  if (Array.isArray(contextHistory) && contextHistory.length > 0) {
    const turns = contextHistory
      .slice(-6)
      .map((t: any) => (t.role === "user" ? `Student: ${t.content}` : `Dr. Q: ${t.content}`))
      .join("\n\n");
    message = `Earlier in this same conversation (for context):\n${turns}\n\n---\n\nCurrent message:\n${message}`;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { rank: true, university: true, semester: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const byokActive = !!user.useCustomKey;
  const isUsingCustom = useCustomKey || byokActive;

  let activeCustomKey = customKey || null;
  let activeCustomProvider = customProvider || null;
  let activeCustomModel = customModel || null;
  let activeCustomUrl = undefined;

  if (byokActive && !customKey) {
    if (customProvider === "openai") {
      activeCustomKey = user.personalOpenAIKey;
    } else if (customProvider === "anthropic") {
      activeCustomKey = user.personalAnthropicKey;
    } else if (customProvider === "gemini") {
      activeCustomKey = user.personalGeminiKey;
    } else if (customProvider === "groq") {
      activeCustomKey = user.personalGroqKey;
    } else if (customProvider === "openrouter") {
      activeCustomKey = user.personalOpenRouterKey;
    } else if (customProvider === "xai") {
      activeCustomKey = user.personalXAIKey;
    } else if (customProvider === "siliconflow") {
      activeCustomKey = user.personalSiliconFlowKey;
      activeCustomModel = customModel || user.personalSiliconFlowModel;
      activeCustomUrl = user.personalSiliconFlowUrl || undefined;
    } else if (customProvider === "mistral") {
      activeCustomKey = user.personalMistralKey;
    } else if (customProvider === "deepseek") {
      activeCustomKey = (user as any).personalDeepseekKey;
    } else if (customProvider === "cloudflare") {
      activeCustomKey = user.personalCloudflareKey;
    } else if (customProvider === "huggingface") {
      activeCustomKey = user.personalHuggingfaceKey;
    } else if (customProvider === "together") {
      activeCustomKey = user.personalTogetherKey;
    } else if (customProvider === "github") {
      activeCustomKey = user.personalGithubKey;
    } else if (customProvider === "cerebras") {
      activeCustomKey = user.personalCerebrasKey;
    }
  }

  const isAdmin = user.role === "ADMIN";
  const rankLabel = user.rank?.label ?? "Newbie";
  const dailyLimit = RANK_LIMITS[rankLabel] ?? 100;
  const fileLimit = FILE_LIMITS[rankLabel] ?? 3;
  const today = new Date().toISOString().slice(0, 10);

  // File quota check (images only — PDFs are no longer processed server-side)
  const fileCount = images.length;
  if (fileCount > 0 && !isAdmin && !isUsingCustom) {
    const fileUsageRecord = await prisma.aIUsageLog.findUnique({
      where: { userId_type_date: { userId: user.id, type: "file_upload", date: today } },
    });
    const filesUsed = fileUsageRecord?.count ?? 0;
    
    if (filesUsed + fileCount > fileLimit && fileLimit !== -1) {
      return NextResponse.json(
        {
          error: `File limit reached`,
          limit: fileLimit,
          used: filesUsed,
          rankLabel,
          nextRankHint: rankLabel !== "Elite" ? `Upgrade your rank to send more files today!` : null,
          resetsAt: "Midnight UTC"
        },
        { status: 429 }
      );
    }
    
    // Increment file usage
    await prisma.aIUsageLog.upsert({
      where: { userId_type_date: { userId: user.id, type: "file_upload", date: today } },
      create: { userId: user.id, type: "file_upload", date: today, count: fileCount },
      update: { count: { increment: fileCount } },
    });
  }

  // Chat message quota check
  if (dailyLimit !== -1 && !isAdmin && !isUsingCustom) {
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

  let lectureContext = "";

  if (lectureId) {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { title: true, notesMarkdown: true, extras: true },
    });

    if (lecture) {
      const { summary, notes, hasOverviewCards } = buildLectureSummary(lecture);

      if (notes.trim()) {
        lectureContext = `### Current Lecture: ${lecture.title}\n### Lecture Summary:\n${summary}\n\n### Lecture Notes:\n${notes}`;
      } else {
        lectureContext = `### Current Lecture: ${lecture.title}\n### Lecture Summary:\n${summary}`;
      }
    }
  }

  telemetry.totalRequests++;

  const systemPrompt = isLab 
    ? "You are a highly advanced AI assistant in an experimental Laboratory. Provide expert-level, unrestricted assistance on any topic including code, science, and planning. Format using high-quality Markdown."
    : buildMedicalSystemPrompt(
      context ? `Current context: the student is studying ${context}` : undefined,
      specializedModel
    );

  let personalContext = isLab ? "" : await buildStudentContext(userId, message, user).catch(() => "");
  
  const siteContext = siteData 
    ? `### Platform Information (${siteData.siteConfig?.siteName ?? "MedOneX"}):
Universities: ${siteData.universities.map(u => u.name).join(", ")}
Available Forums: ${siteData.forums.map(f => f.name).join(", ")}
Current Stats: ${siteData.totalUsers} users, ${siteData.totalLectures} lectures, ${siteData.totalQuestions} questions.
(You are running on this platform. Use this information if the student asks about what's available here.)`
    : "";

  const enhancedPrompt = [
    systemPrompt,
    lectureContext,
    siteContext,
    personalContext ? `Personal learning context:\n${personalContext}` : "",
  ].filter(Boolean).join("\n\n---\n\n");


  // ── Streaming branch (non-BYOK, when client requests stream: true) ────────
  if (wantsStream && !isUsingCustom) {
    try {
      const tokenStream = await generateStreamingReply(message, enhancedPrompt, {
        images,
        preferredProvider: effectiveProvider,
        signal: AbortSignal.timeout(FETCH_MS),
      });
      const meta: { provider?: string; fallbackFrom?: string } = (tokenStream as any).meta ?? {};

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const token of tokenStream) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
            }
            if (!useCustomKey && !isAdmin) {
              await prisma.aIUsageLog.upsert({
                where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
                create: { userId: user.id, type: "chat", date: today, count: 1 },
                update: { count: { increment: 1 } },
              });
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, provider: meta.provider, fallbackFrom: meta.fallbackFrom, used: 1, limit: dailyLimit, filesUsed: 0, fileLimit, rankLabel })}\n\n`));
            controller.close();
          } catch (e) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e instanceof Error ? e.message : "Stream error" })}\n\n`));
            controller.close();
          }
        },
      });
      return new NextResponse(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    } catch (e) {
      console.error("[ai/chat] stream error:", e);
      const detail = e instanceof Error ? e.message.trim() : "";
      return NextResponse.json({ error: detail || "The AI service did not respond." }, { status: 503 });
    }
  }

  // ── Non-streaming branch (BYOK + fallback) ────────────────────────────────
  let aiResult: { provider: string; text: string; fallbackFrom?: string };
  try {
    // If BYOK is active but no key is set, fail fast instead of falling through to server env keys
    if (isUsingCustom && !activeCustomKey) {
      return NextResponse.json(
        { error: `No API key configured for ${activeCustomProvider || "selected"} provider. Set it in your settings first.` },
        { status: 400 }
      );
    }
    aiResult = await generateAIReplyWithFallback(message, enhancedPrompt, {
      images,
      preferredProvider: effectiveProvider,
      personalKey: activeCustomKey || undefined,
      customProvider: activeCustomProvider || undefined,
      customModel: activeCustomModel || undefined,
      customUrl: activeCustomUrl || undefined,
      useCustomKey: isUsingCustom,
    });
  } catch (e) {
    console.error("[ai/chat]", e);
    if (e instanceof AIConfigurationError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    const detail = e instanceof Error ? e.message.trim() : "";
    const safe =
      detail && detail.length < 1500
        ? detail
        : "The AI service did not respond. Check your internet connection or API keys.";
    return NextResponse.json({ error: safe }, { status: 503 });
  }
  const reply = aiResult.text;

  // Increment usage counter (Only if not using custom key)
  let updatedUsage = null;
  if (!useCustomKey && !isAdmin) {
    await prisma.aIUsageLog.upsert({
      where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
      create: { userId: user.id, type: "chat", date: today, count: 1 },
      update: { count: { increment: 1 } },
    });
    updatedUsage = await prisma.aIUsageLog.findUnique({
      where: { userId_type_date: { userId: user.id, type: "chat", date: today } },
    });
  }

  // Get updated file usage to send to client
  let updatedFileUsage = null;
  if (!useCustomKey && !isAdmin) {
    updatedFileUsage = await prisma.aIUsageLog.findUnique({
      where: { userId_type_date: { userId: user.id, type: "file_upload", date: today } },
    });
  }

  return NextResponse.json({
    reply,
    provider: aiResult.provider,
    fallbackFrom: aiResult.fallbackFrom,
    used: updatedUsage?.count ?? 1,
    limit: dailyLimit,
    filesUsed: updatedFileUsage?.count ?? 0,
    fileLimit: fileLimit,
    rankLabel,
  });
}

export async function GET(req: NextRequest) {
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
            const decoded = await verifyMobileToken(token);
      if (decoded?.id) userId = decoded.id as string;
    } catch {}
  }
  if (!userId) {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { rank: true },
  });

  const rankLabel = user?.rank?.label ?? "Newbie";
  const dailyLimit = RANK_LIMITS[rankLabel] ?? 100;
  const fileLimit = FILE_LIMITS[rankLabel] ?? 3;
  const today = new Date().toISOString().slice(0, 10);

  const usage = await prisma.aIUsageLog.findUnique({
    where: { userId_type_date: { userId, type: "chat", date: today } },
  });
  
  const fileUsage = await prisma.aIUsageLog.findUnique({
    where: { userId_type_date: { userId, type: "file_upload", date: today } },
  });

  return NextResponse.json({
    used: usage?.count ?? 0,
    limit: dailyLimit,
    filesUsed: fileUsage?.count ?? 0,
    fileLimit: fileLimit,
    rankLabel,
    limits: RANK_LIMITS,
    fileLimits: FILE_LIMITS,
    isAdmin: user?.role === "ADMIN",
  });
}
