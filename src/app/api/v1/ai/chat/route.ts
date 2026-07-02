import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { verifyMobileToken } from '@/lib/supabase/auth-helpers';
import { prisma } from "@/lib/prisma";
import {
  AIConfigurationError,
  generateAIReplyWithFallback,
  type AIProviderId,
  type ChatImagePart,
  type ChatPdfPart,
} from "@/lib/ai-router";
import { buildMedicalSystemPrompt, PDF_CLASSIFIER_PROMPT } from "@/lib/medical-ai-prompts";
import { buildStudentContext } from "@/lib/ai-context-builder";
import { processBotCommand, SECRET_CODE } from "@/lib/bot-commander";
import { getCachedSiteData } from "@/lib/site-cache";
import { searchLectureContent } from "@/lib/lecture-search";
import {
  pdfTextCache,
  buildCacheKey,
  PDF_CACHE_TTL,
  telemetry,
  type PdfCacheEntry,
} from "@/lib/session-cache";

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

function sanitizePdfs(raw: unknown): ChatPdfPart[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ChatPdfPart[] = [];
  for (const item of raw.slice(0, 1)) { // Max 1 PDF (prevent bulk uploads)
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
    if (approxBytes > 2 * 1024 * 1024) continue;  // Max 2MB per PDF (prevent full textbooks)
    if (data) out.push({ mimeType: "application/pdf", data });
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

/* ─── Heuristic: PDF decision (Tier 1, 0 tokens) ──────────────────── */

function heuristicNeedsPdf(
  message: string,
  summary: string,
  notes: string,
): "yes" | "no" | "ambiguous" {
  const lower = message.toLowerCase().trim();

  const clearlyNo = [
    /^(hi|hello|hey|السلام\s*عليكم|ازيك|how are|good morning|good evening)\b/i,
    /^(مين\s*انت|what can you do|how (do|does)|how this works?)\b/i,
    /^(تمام|ok|oke?|yes|no|yep|nope|maybe|حسنًا|طيب)\s*$/i,
    /^(tell me more|elaborate|ليه|عايز\s*أعرف\s*أكتر|وإيه\s*تاني)\b/i,
    /^(ازاي\s*أغير|how (do i|to) (change|reset|update)|what is the meaning of)\b/i,
  ];

  const clearlyYes = [
    /اقرأ\s*(ال)?\s*(ملف|pdf|مرفق)/i,
    /what does the (pdf|file|lecture material) say/i,
    /وفق[ًاأ]\s*(ل)?\s*(للمحاضرة|للملف|للpdf|للlecture)/i,
    /ايه\s*المكتوب\s*(في|فى)\s*(محاضرة|ملف)/i,
    /according to the (lecture|file|material|pdf)/i,
    /read the (pdf|file|lecture|material)/i,
  ];

  // Skip if too short (likely follow-up / greeting)
  if (lower.length < 5) return "no";
  if (clearlyNo.some((r) => r.test(lower))) return "no";
  if (clearlyYes.some((r) => r.test(lower))) return "yes";

  if (!summary.trim() && !notes.trim()) return "yes";

  return "ambiguous";
}

/* ─── Classifier (Tier 2, AI call — only for ambiguous) ───────────── */

async function classifyPdfNeed(
  message: string,
  title: string,
  summary: string,
  userId: string,
): Promise<"yes" | "no"> {
  telemetry.classifierUsed++;
  const prompt = PDF_CLASSIFIER_PROMPT
    .replace("{title}", title)
    .replace("{summary}", clip(summary, 1500))
    .replace("{question}", message);

  try {
    const result = await generateAIReplyWithFallback(
      "Classify whether this question needs the PDF.",
      prompt,
      { preferredProvider: "proxy" },
    );
    const answer = result.text.trim().toUpperCase();
    if (answer.startsWith("YES") || answer.startsWith("Y")) return "yes";
    return "no";
  } catch {
    return "no";
  }
}

/* ─── PDF download + parse ──────────────────────────────────────────── */

async function downloadAndExtractPdf(
  fileUrl: string,
  filename: string,
): Promise<string[] | null> {
  const pdfParse = (await import("pdf-parse")).default;

  try {
    const proxyUrl = `/api/v1/download-proxy?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${origin}${proxyUrl}`, { cache: "no-store" });
    if (!res.ok) {
      console.error("[ai/chat] pdf download failed:", res.status, res.statusText);
      return null;
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) return null;

    const parsed = await pdfParse(Buffer.from(buffer));
    const paragraphs = parsed.text.split(/\n\n+/).filter((p: string) => p.trim().length > 20);
    return paragraphs.length > 0 ? paragraphs : [parsed.text.slice(0, 3000)];
  } catch (err) {
    console.error("[ai/chat] pdf download+parse error:", err);
    return null;
  }
}

/* ─── Search PDF paragraphs for relevant section ───────────────────── */

function searchRelevantSection(
  query: string,
  paragraphs: string[],
  maxChars = 3000,
): string {
  const results = searchLectureContent(query, paragraphs, { topK: 2, maxChars });
  return results.map((r) => r.text).join("\n\n").trim();
}

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
    pdfs: rawPdfs,
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
      activeCustomKey = user.personalDeepseekKey || (user as any).personalDeepseekKey;
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

  // File quota check
  const fileCount = images.length + pdfs.length;
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
  let retrievalSource: "summaryOnly" | "notesUsed" | "pdfUsed" = "summaryOnly";

  if (lectureId) {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { title: true, notesMarkdown: true, extras: true },
    });

    let files: Array<{ id: string; name: string; url: string; mimeType: string }> = [];
    if (lecture) {
      files = await prisma.lectureFile.findMany({
        where: { lectureId, mimeType: "application/pdf" },
        select: { id: true, name: true, url: true, mimeType: true },
      });
    }

    if (lecture) {
      const { summary, notes, hasOverviewCards } = buildLectureSummary(lecture);

      // Tier 1: Heuristic decision
      const heuristic = heuristicNeedsPdf(message, summary + (hasOverviewCards ? "" : notes), notes);
      let needExtended = heuristic === "yes";
      let needPdf = heuristic === "yes";

      // Tier 2: Classifier (only for ambiguous)
      if (heuristic === "ambiguous") {
        const classified = await classifyPdfNeed(message, lecture.title, summary, userId);
        needExtended = classified === "yes";
        needPdf = classified === "yes";
      }

      if (needExtended && files.length > 0) {
        const cacheKey = buildCacheKey(userId, lectureId);
        const cached = pdfTextCache.get(cacheKey);
        const cacheNow = Date.now();

        let paragraphs: string[] | null = null;

        if (cached && cacheNow - cached.lastAccessed < PDF_CACHE_TTL) {
          cached.lastAccessed = cacheNow;
          paragraphs = cached.paragraphs;
          telemetry.pdfCacheHit++;
        } else if (needPdf) {
          const file = files.find((f) => f.mimeType === "application/pdf");
          if (file) {
            paragraphs = await downloadAndExtractPdf(file.url, file.name);
            if (paragraphs) {
              pdfTextCache.set(cacheKey, {
                paragraphs,
                lectureId,
                userId,
                lastAccessed: cacheNow,
              });
              telemetry.pdfDownloaded++;
            }
          }
        }

        if (paragraphs && paragraphs.length > 0) {
          const relevantText = searchRelevantSection(message, paragraphs);
          retrievalSource = "pdfUsed";
          lectureContext = `### Current Lecture: ${lecture.title}\n### Lecture Summary:\n${summary}\n\n### From Lecture PDF:\n${relevantText}`;
        } else {
          // PDF failed / not found — fall back to notes
          retrievalSource = "notesUsed";
          lectureContext = `### Current Lecture: ${lecture.title}\n### Lecture Summary:\n${summary}\n\n### Lecture Notes:\n${notes}`;
        }
      } else if (needExtended) {
        retrievalSource = "notesUsed";
        lectureContext = `### Current Lecture: ${lecture.title}\n### Lecture Summary:\n${summary}\n\n### Lecture Notes:\n${notes}`;
      } else {
        retrievalSource = "summaryOnly";
        lectureContext = `### Current Lecture: ${lecture.title}\n### Lecture Summary:\n${summary}`;
      }
    }
  }

  telemetry.totalRequests++;
  telemetry.retrievalSource[retrievalSource]++;

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
      pdfs,
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
