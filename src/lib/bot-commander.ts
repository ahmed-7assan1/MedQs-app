/**
 * bot-commander.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles admin commands triggered by the secret code 24010511 in AI chat.
 *
 * When a message contains the secret code, this module:
 *  1. Detects the command intent (create forum, post, pin, sync, etc.)
 *  2. Executes it directly against the DB
 *  3. Returns a structured result to be shown back in chat
 *
 * Supported commands:
 *  - "أنشئ جروب/توبيك/فوروم باسم X [نوع: GLOBAL|SEMESTER|PRIVATE]"
 *  - "انشر في جروب X رسالة: ..."
 *  - "Pin/Unpin آخر بوست في جروب X"
 *  - "أغلق/افتح جروب X"
 *  - "sync / مزامنة / زامن"
 *  - "معلومات / info / حالة السايت"
 */

import { prisma } from "./prisma";
import { syncSiteCache, getCachedSiteData, cacheSummaryText, CachedForum } from "./site-cache";

export const SECRET_CODE = "24010511";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandResult {
  handled: boolean;
  /** The reply text to send back to the user */
  reply: string;
  /** Whether it was a real DB action (vs. a read-only info command) */
  actionTaken?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064b-\u065f]/g, "") // remove Arabic diacritics
    .trim();
}

function findForum(forums: CachedForum[], query: string): CachedForum | null {
  const q = normalize(query);
  // Exact match first
  const exact = forums.find((f) => normalize(f.name) === q);
  if (exact) return exact;
  // Partial match
  return forums.find((f) => normalize(f.name).includes(q) || q.includes(normalize(f.name))) ?? null;
}

/** Extract content after a keyword like "رسالة:" or "محتوى:" or ":" */
function extractContent(msg: string): string {
  const colonIdx = msg.indexOf(":");
  if (colonIdx !== -1) {
    const content = msg.slice(colonIdx + 1).trim();
    if (content.length > 0) return content;
  }
  return "";
}

/** Extract the forum name from a message like "أنشئ جروب باسم طب أسنان" */
function extractForumName(msg: string): string {
  const patterns = [
    /باسم\s+(.+?)(?:\s+نوع|\s+type|\s+للسيمستر|\s*$)/i,
    /اسمه?\s+(.+?)(?:\s+نوع|\s+type|\s*$)/i,
    /named?\s+["']?(.+?)["']?(?:\s+type|\s*$)/i,
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  // fallback: take everything after "جروب/توبيك/فوروم" keyword
  const after = msg.replace(/.*?(جروب|توبيك|فوروم|group|forum|topic)\s*/i, "").trim();
  return after.split(/\s{2,}/)[0] ?? after;
}

/** Detect forum type from message */
function extractForumType(msg: string): "GLOBAL" | "SEMESTER" | "PRIVATE" {
  const m = normalize(msg);
  if (m.includes("private") || m.includes("خاص") || m.includes("مخصوص")) return "PRIVATE";
  if (m.includes("semester") || m.includes("سيمستر") || m.includes("فصل")) return "SEMESTER";
  return "GLOBAL";
}

// ─── Command Detectors ────────────────────────────────────────────────────────

function isCreateForumCmd(msg: string): boolean {
  const m = normalize(msg);
  return (
    (m.includes("أنشئ") || m.includes("انشئ") || m.includes("create") || m.includes("اضف") || m.includes("أضف")) &&
    (m.includes("جروب") || m.includes("توبيك") || m.includes("فوروم") || m.includes("forum") || m.includes("group") || m.includes("topic") || m.includes("مجموعة"))
  );
}

function isPostCmd(msg: string): boolean {
  const m = normalize(msg);
  return (
    (m.includes("انشر") || m.includes("أنشر") || m.includes("post") || m.includes("اكتب") || m.includes("أكتب")) &&
    (m.includes("جروب") || m.includes("فوروم") || m.includes("group") || m.includes("forum") || m.includes("مجموعة"))
  );
}

function isPinCmd(msg: string): boolean {
  const m = normalize(msg);
  return m.includes("pin") || m.includes("تثبيت") || m.includes("ثبت") || m.includes("unpin") || m.includes("الغاء التثبيت");
}

function isCloseForumCmd(msg: string): boolean {
  const m = normalize(msg);
  return (
    (m.includes("أغلق") || m.includes("اغلق") || m.includes("close") || m.includes("افتح") || m.includes("open") || m.includes("reopen")) &&
    (m.includes("جروب") || m.includes("فوروم") || m.includes("group") || m.includes("forum"))
  );
}

function isSyncCmd(msg: string): boolean {
  const m = normalize(msg);
  return (
    m.includes("sync") || m.includes("مزامنة") || m.includes("زامن") || m.includes("تحديث الكاش") ||
    m.includes("حدث البيانات") || m.includes("refresh")
  );
}

function isInfoCmd(msg: string): boolean {
  const m = normalize(msg);
  return (
    m.includes("معلومات") || m.includes("info") || m.includes("حالة السايت") || m.includes("إحصائيات") ||
    m.includes("احصائيات") || m.includes("stats") || m.includes("status") || m.includes("بيانات السايت")
  );
}

function isListForumsCmd(msg: string): boolean {
  const m = normalize(msg);
  return (
    (m.includes("اعرض") || m.includes("أعرض") || m.includes("list") || m.includes("show") || m.includes("ايه") || m.includes("ما هي")) &&
    (m.includes("جروبات") || m.includes("فورمز") || m.includes("forums") || m.includes("groups") || m.includes("توبيكات"))
  );
}

// ─── Command Executors ────────────────────────────────────────────────────────

async function handleCreateForum(msg: string, userId: string): Promise<CommandResult> {
  const data = await getCachedSiteData();
  const firstUni = data.universities[0];
  if (!firstUni) {
    return { handled: true, reply: "❌ مفيش جامعات متسجلة في السيستم." };
  }

  const name = extractForumName(msg);
  if (!name || name.length < 2) {
    return { handled: true, reply: "❌ محتاج تحدد اسم الجروب. مثال: `أنشئ جروب باسم طب أسنان`" };
  }

  const type = extractForumType(msg);

  const forum = await prisma.forum.create({
    data: {
      name,
      type: type as any,
      status: "OPEN",
      universityId: firstUni.id,
      createdBy: userId,
    },
  });

  // Invalidate cache so next sync picks up the new forum
  const { invalidateSiteCache } = await import("./site-cache");
  invalidateSiteCache();

  return {
    handled: true,
    actionTaken: true,
    reply: `✅ **تم إنشاء الجروب بنجاح!**\n\n📌 الاسم: **${forum.name}**\n🏷️ النوع: \`${forum.type}\`\n🆔 ID: \`${forum.id}\`\n\n> 💡 يمكنك الآن نشر فيه بـ: \`انشر في جروب ${name} رسالة: نص الرسالة\``,
  };
}

async function handlePost(msg: string, userId: string): Promise<CommandResult> {
  const data = await getCachedSiteData();

  // Extract forum name — text between "في جروب" and "رسالة:"
  const forumMatch = msg.match(/في\s+(?:جروب|فوروم|مجموعة|group|forum)\s+(.+?)(?:\s+رسالة|\s+message|\s*:|\s*$)/i);
  const forumQuery = forumMatch?.[1]?.trim() ?? "";
  if (!forumQuery) {
    return { handled: true, reply: "❌ حدد اسم الجروب. مثال: `انشر في جروب اسم الجروب رسالة: المحتوى`" };
  }

  const forum = findForum(data.forums, forumQuery);
  if (!forum) {
    return {
      handled: true,
      reply: `❌ مش لاقي جروب باسم **"${forumQuery}"**.\n\nالجروبات المتاحة:\n${data.forums.map((f) => `• ${f.name}`).join("\n") || "لا يوجد"}`,
    };
  }

  const content = extractContent(msg) || msg.replace(/.*رسالة[:：]/i, "").trim();
  if (!content || content.length < 3) {
    return { handled: true, reply: "❌ محتوى الرسالة فاضي. أضف نص بعد `رسالة:`" };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 10);

  const post = await prisma.post.create({
    data: {
      content,
      authorId: userId,
      forumId: forum.id,
      universityId: forum.universityId,
      audience: "UNIVERSITY",
      expiresAt,
      isForumPost: true,
    },
  });

  return {
    handled: true,
    actionTaken: true,
    reply: `✅ **تم النشر في "${forum.name}" بنجاح!**\n\n📝 المحتوى: ${content.slice(0, 120)}${content.length > 120 ? "…" : ""}\n🆔 Post ID: \`${post.id}\``,
  };
}

async function handlePinPost(msg: string): Promise<CommandResult> {
  const data = await getCachedSiteData();
  const m = normalize(msg);
  const isUnpin = m.includes("unpin") || m.includes("الغاء") || m.includes("إلغاء");

  // Find forum name
  const forumMatch = msg.match(/(?:في\s+)?(?:جروب|فوروم|forum|group)\s+(.+?)(?:\s*$)/i);
  const forumQuery = forumMatch?.[1]?.trim() ?? "";

  if (!forumQuery) {
    return { handled: true, reply: "❌ حدد اسم الجروب. مثال: `ثبت آخر بوست في جروب اسم الجروب`" };
  }

  const forum = findForum(data.forums, forumQuery);
  if (!forum) {
    return { handled: true, reply: `❌ مش لاقي جروب باسم **"${forumQuery}"**.` };
  }

  // Find latest post
  const latestPost = await prisma.post.findFirst({
    where: { forumId: forum.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, content: true },
  });

  if (!latestPost) {
    return { handled: true, reply: `❌ الجروب **"${forum.name}"** فاضي، مفيش بوستات.` };
  }

  await prisma.post.update({
    where: { id: latestPost.id },
    data: { isPinned: !isUnpin },
  });

  const action = isUnpin ? "إلغاء تثبيت" : "تثبيت";
  return {
    handled: true,
    actionTaken: true,
    reply: `✅ **تم ${action} البوست في "${forum.name}"**\n\n📌 المحتوى: ${latestPost.content.slice(0, 100)}…`,
  };
}

async function handleCloseForum(msg: string): Promise<CommandResult> {
  const data = await getCachedSiteData();
  const m = normalize(msg);
  const isOpen = m.includes("افتح") || m.includes("open") || m.includes("reopen");

  const forumMatch = msg.match(/(?:جروب|فوروم|forum|group)\s+(.+?)(?:\s*$)/i);
  const forumQuery = forumMatch?.[1]?.trim() ?? "";

  if (!forumQuery) {
    return { handled: true, reply: "❌ حدد اسم الجروب." };
  }

  const forum = findForum(data.forums, forumQuery);
  if (!forum) {
    return { handled: true, reply: `❌ مش لاقي جروب باسم **"${forumQuery}"**.` };
  }

  const newStatus = isOpen ? "OPEN" : "CLOSED";
  await prisma.forum.update({ where: { id: forum.id }, data: { status: newStatus as any } });

  // Invalidate cache
  const { invalidateSiteCache } = await import("./site-cache");
  invalidateSiteCache();

  return {
    handled: true,
    actionTaken: true,
    reply: `✅ **تم ${isOpen ? "فتح" : "إغلاق"} الجروب "${forum.name}"** بنجاح.\n🔒 الحالة الجديدة: \`${newStatus}\``,
  };
}

async function handleSync(): Promise<CommandResult> {
  const start = Date.now();
  const data = await syncSiteCache();
  const ms = Date.now() - start;

  return {
    handled: true,
    actionTaken: false,
    reply: `🔄 **تمت المزامنة بنجاح** (${ms}ms)\n\n${cacheSummaryText(data)}`,
  };
}

async function handleInfo(): Promise<CommandResult> {
  const data = await getCachedSiteData();
  return {
    handled: true,
    reply: cacheSummaryText(data),
  };
}

async function handleListForums(): Promise<CommandResult> {
  const data = await getCachedSiteData();
  if (data.forums.length === 0) {
    return { handled: true, reply: "📭 لا توجد جروبات مسجلة حالياً." };
  }

  const lines = data.forums.map((f) => {
    const icon = f.status === "OPEN" ? "🟢" : f.status === "CLOSED" ? "🔴" : "🟡";
    return `${icon} **${f.name}** — \`${f.type}\` | ID: \`${f.id.slice(0, 8)}…\``;
  });

  return {
    handled: true,
    reply: `📋 **قائمة الجروبات (${data.forums.length}):**\n\n${lines.join("\n")}`,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Process a message that contains the secret code.
 * Returns a CommandResult. If `handled` is false, fall through to normal AI.
 */
export async function processBotCommand(
  rawMessage: string,
  userId: string
): Promise<CommandResult> {
  // Strip the secret code from the message for cleaner parsing
  const msg = rawMessage.replace(SECRET_CODE, "").trim();

  try {
    if (isSyncCmd(msg)) return handleSync();
    if (isInfoCmd(msg)) return handleInfo();
    if (isListForumsCmd(msg)) return handleListForums();
    if (isCreateForumCmd(msg)) return handleCreateForum(msg, userId);
    if (isPostCmd(msg)) return handlePost(msg, userId);
    if (isPinCmd(msg)) return handlePinPost(msg);
    if (isCloseForumCmd(msg)) return handleCloseForum(msg);

    // Secret code present but no recognized command — show help
    return {
      handled: true,
      reply: buildHelpText(),
    };
  } catch (err: any) {
    console.error("[bot-commander] Error:", err);
    return {
      handled: true,
      reply: `❌ **حصل خطأ أثناء تنفيذ الأمر:**\n\`\`\`\n${err?.message ?? "Unknown error"}\n\`\`\``,
    };
  }
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function buildHelpText(): string {
  return `🔐 **وضع المشرف — الأوامر المتاحة:**

**📋 معلومات:**
• \`${SECRET_CODE} معلومات\` — إحصائيات ومعلومات السايت من الكاش
• \`${SECRET_CODE} اعرض الجروبات\` — قائمة بكل الجروبات

**🔄 مزامنة:**
• \`${SECRET_CODE} sync\` أو \`${SECRET_CODE} مزامنة\` — تحديث الكاش من قاعدة البيانات

**💬 الجروبات:**
• \`${SECRET_CODE} أنشئ جروب باسم [الاسم]\` — إنشاء جروب GLOBAL
• \`${SECRET_CODE} أنشئ جروب خاص باسم [الاسم]\` — إنشاء PRIVATE
• \`${SECRET_CODE} أغلق جروب [الاسم]\` — إغلاق الجروب
• \`${SECRET_CODE} افتح جروب [الاسم]\` — إعادة فتح الجروب

**📝 البوستات:**
• \`${SECRET_CODE} انشر في جروب [الاسم] رسالة: [المحتوى]\`
• \`${SECRET_CODE} ثبت آخر بوست في جروب [الاسم]\`
• \`${SECRET_CODE} الغاء تثبيت آخر بوست في جروب [الاسم]\``;
}
