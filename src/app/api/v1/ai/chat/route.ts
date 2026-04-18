import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AIConfigurationError,
  generateAIReplyWithFallback,
  type ChatImagePart,
  type ChatPdfPart,
} from "@/lib/ai-router";
import { buildMedicalSystemPrompt } from "@/lib/medical-ai-prompts";

function normalizePreferredProvider(raw: unknown): "gemini" | "openai" | "anthropic" | "deepseek" | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (s === "gemini" || s === "openai" || s === "anthropic" || s === "deepseek") return s;
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

function sanitizePdfs(raw: unknown): ChatPdfPart[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ChatPdfPart[] = [];
  for (const item of raw.slice(0, 1)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const mimeType = typeof o.mimeType === "string" ? o.mimeType.toLowerCase() : "";
    let data = typeof o.data === "string" ? o.data.trim() : "";
    if (data.startsWith("data:")) {
      const mid = data.indexOf(",");
      if (mid > 0) data = data.slice(mid + 1);
    }
    if (mimeType !== "application/pdf") continue;
    const approxBytes = (data.length * 3) / 4;
    if (approxBytes > 5 * 1024 * 1024) continue;
    if (data) out.push({ mimeType: "application/pdf", data });
  }
  return out;
}

type HistoryTurn = { role: string; content: string };

function clip(s: string, max: number) {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/** Fold recent thread into the text prompt (Gemini gets one user turn; PDFs/images are separate parts). */
function applyConversationHistory(message: string, rawHistory: unknown): string {
  if (!Array.isArray(rawHistory) || rawHistory.length === 0) return message;
  const turns: HistoryTurn[] = [];
  for (const item of rawHistory) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const role = typeof o.role === "string" ? o.role : "";
    const content = typeof o.content === "string" ? o.content : "";
    if ((role !== "user" && role !== "assistant") || !content.trim()) continue;
    turns.push({ role, content: clip(content, 3500) });
  }
  const slice = turns.slice(-12);
  if (slice.length === 0) return message;
  const block = slice
    .map((t) => (t.role === "user" ? `Student: ${t.content}` : `Dr. Q: ${t.content}`))
    .join("\n\n");
  return `Earlier in this same conversation (for context):\n${block}\n\n---\n\nCurrent message:\n${message}`;
}

// Daily chat limits per rank (label → daily limit; -1 = unlimited). ×20 vs original caps.
const RANK_LIMITS: Record<string, number> = {
  Newbie:       100,
  Active:       300,
  Contributor:  600,
  Expert:       1200,
  Elite:        -1, // unlimited
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const site = await prisma.siteConfig.findFirst({ select: { enableAI: true, aiPreferredProvider: true } }).catch(() => null);
  if (site?.enableAI === false) {
    return NextResponse.json({ error: "AI chat is disabled for this site in admin settings." }, { status: 403 });
  }

  const body = await req.json();
  const {
    message: rawMessage,
    context,
    images: rawImages,
    pdfs: rawPdfs,
    conversationHistory,
    preferredProvider,
  } = body;
  const effectiveProvider = normalizePreferredProvider(preferredProvider) ?? normalizePreferredProvider(site?.aiPreferredProvider);
  const images = sanitizeImages(rawImages);
  const pdfs = sanitizePdfs(rawPdfs);
  let message =
    typeof rawMessage === "string" && rawMessage.trim()
      ? rawMessage.trim()
      : images.length > 0 || pdfs.length > 0
        ? "(The student attached materials with no text. Summarize what is relevant for medical study and ask what they want to focus on.)"
        : "";
  if (!message) return NextResponse.json({ error: "Message or attachment required" }, { status: 400 });
  message = applyConversationHistory(message, conversationHistory);

  // Get user with rank
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { rank: true, university: true, semester: true },
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
  let personalContext = await buildStudentStudyContext(session.user.id).catch(() => "");
  
  const profileLines: string[] = [];
  if (user.name) profileLines.push(`Name: ${user.name}`);
  if (user.university) profileLines.push(`University/Faculty: ${user.university.name}`);
  if (user.semester) profileLines.push(`Academic Year & Semester: ${user.semester.name}`);
  if (profileLines.length > 0) {
    personalContext = `### Student Profile Information:\n${profileLines.join("\n")}\n(Do NOT ask the user for this information since it is already provided above)\n\n### Study Context:\n${personalContext}`;
  }
  const enhancedPrompt = personalContext
    ? `${systemPrompt}\n\nPersonal learning context (use this to personalize explanation and revision focus):\n${personalContext}`
    : systemPrompt;

  let aiResult: { provider: string; text: string; fallbackFrom?: string };
  try {
    aiResult = await generateAIReplyWithFallback(message, enhancedPrompt, {
      images,
      pdfs,
      preferredProvider: effectiveProvider,
    });
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
    fallbackFrom: aiResult.fallbackFrom,
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
