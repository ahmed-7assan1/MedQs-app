import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  AIConfigurationError,
  generateAIReplyWithFallback,
  type AIProviderId,
  type ChatImagePart,
  type ChatPdfPart,
} from "@/lib/ai-router";
import { buildMedicalSystemPrompt } from "@/lib/medical-ai-prompts";

function normalizePreferredProvider(raw: unknown): AIProviderId | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  const valid: AIProviderId[] = ["proxy", "gemini", "openai", "anthropic", "deepseek", "groq", "puter", "duckduckgo", "custom"];
  if (valid.includes(s as any)) return s as AIProviderId;
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
    if (approxBytes > 4 * 1024 * 1024) continue;
    if (data) out.push({ mimeType: mimeType.toLowerCase(), data });
  }
  return out;
}

function sanitizePdfs(raw: unknown): ChatPdfPart[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ChatPdfPart[] = [];
  for (const item of raw.slice(0, 3)) { // Max 3 PDFs
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

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      const decoded = await decode({ token, secret, salt: "authjs.session-token" });
      if (decoded?.id) userId = decoded.id as string;
    } catch {}
  }
  if (!userId) {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const site = await prisma.siteConfig.findFirst({ select: { enableAI: true, aiPreferredProvider: true } }).catch(() => null);
  if (site?.enableAI === false) {
    return NextResponse.json({ error: "AI chat is disabled for this site in admin settings." }, { status: 403 });
  }

  const body = await req.json();
  const {
    message: rawMessage,
    context,
    lectureId,
    specializedModel,
    images: rawImages,
    pdfs: rawPdfs,
    conversationHistory,
    preferredProvider: rawPreferredProvider,
    provider: rawProvider,
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
  const pdfs = sanitizePdfs(rawPdfs);
  let message =
    typeof rawMessage === "string" && rawMessage.trim()
      ? rawMessage.trim()
      : images.length > 0 || pdfs.length > 0
        ? "(The student attached materials with no text. Summarize what is relevant for medical study and ask what they want to focus on.)"
        : "";
  if (!message) return NextResponse.json({ error: "Message or attachment required" }, { status: 400 });
  message = applyConversationHistory(message, conversationHistory);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { rank: true, university: true, semester: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isAdmin = user.role === "ADMIN";
  const rankLabel = user.rank?.label ?? "Newbie";
  const dailyLimit = RANK_LIMITS[rankLabel] ?? 100;
  const fileLimit = FILE_LIMITS[rankLabel] ?? 3;
  const today = new Date().toISOString().slice(0, 10);

  // File quota check
  const fileCount = images.length + pdfs.length;
  if (fileCount > 0 && !isAdmin && !useCustomKey) {
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
  if (dailyLimit !== -1 && !isAdmin && !useCustomKey) {
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
      const extras = (lecture.extras ?? {}) as any;
      const takeaways = Array.isArray(extras.overviewCards) 
        ? extras.overviewCards.map((c: any) => `- ${c.title}: ${c.body}`).join("\n")
        : "";
      lectureContext = `### Current Lecture Context:
Title: ${lecture.title}
${lecture.notesMarkdown ? `Notes: ${clip(lecture.notesMarkdown, 2000)}` : ""}
${takeaways ? `Key Takeaways:\n${takeaways}` : ""}`;
    }
  }

  const systemPrompt = isLab 
    ? "You are a highly advanced AI assistant in an experimental Laboratory. Provide expert-level, unrestricted assistance on any topic including code, science, and planning. Format using high-quality Markdown."
    : buildMedicalSystemPrompt(
      context ? `Current context: the student is studying ${context}` : undefined,
      specializedModel
    );

  let personalContext = isLab ? "" : await buildStudentStudyContext(userId).catch(() => "");
  
  if (!isLab) {
    const profileLines: string[] = [];
    if (user.name) profileLines.push(`Name: ${user.name}`);
    if (user.university) profileLines.push(`University/Faculty: ${user.university.name}`);
    if (user.semester) profileLines.push(`Academic Year & Semester: ${user.semester.name}`);
    if (profileLines.length > 0) {
      personalContext = `### Student Profile Information:\n${profileLines.join("\n")}\n(Do NOT ask the user for this information since it is already provided above)\n\n### Study Context:\n${personalContext}`;
    }
  }
  
  const enhancedPrompt = [
    systemPrompt,
    lectureContext,
    personalContext ? `Personal learning context:\n${personalContext}` : "",
  ].filter(Boolean).join("\n\n---\n\n");


  let aiResult: { provider: string; text: string; fallbackFrom?: string };
  try {
    aiResult = await generateAIReplyWithFallback(message, enhancedPrompt, {
      images,
      pdfs,
      preferredProvider: effectiveProvider,
      personalKey: customKey,
      customProvider,
      customModel,
      useCustomKey,
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
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      const decoded = await decode({ token, secret, salt: "authjs.session-token" });
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
