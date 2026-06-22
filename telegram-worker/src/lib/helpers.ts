import postgres from "postgres";

let _sql: ReturnType<typeof postgres> | null = null;

export function setSql(sql: ReturnType<typeof postgres>): void {
  _sql = sql;
}

export function getSql(): ReturnType<typeof postgres> {
  if (!_sql) throw new Error("sql not initialized. Call setSql() first.");
  return _sql;
}

export type ProviderKey =
  | "gemini" | "groq" | "openai" | "anthropic" | "siliconflow"
  | "huggingface" | "together" | "openrouter" | "xai" | "mistral"
  | "cloudflare" | "cerebras" | "github";

export interface LinkedUser {
  id: string;
  name: string;
  email: string;
  telegramId: string | null;
  telegramVerified: boolean;
  university_name: string | null;
  faculty_name: string | null;
  academic_year: number | null;
  semester_name: string | null;
  semesterId: string | null;
  universityId: string | null;
  points: number;
  personalGeminiKey: string | null;
  personalGroqKey: string | null;
  personalOpenRouterKey: string | null;
  personalXAIKey: string | null;
  personalAnthropicKey: string | null;
  personalOpenAIKey: string | null;
  personalSiliconFlowKey: string | null;
  personalCloudflareKey: string | null;
  personalHuggingfaceKey: string | null;
  personalTogetherKey: string | null;
  personalGithubKey: string | null;
  personalCerebrasKey: string | null;
  personalMistralKey: string | null;
}

interface BotState {
  telegramId: string;
  provider: string;
  apiKey: string | null;
  chatState: string;
  tempEmail: string | null;
  tempData: Record<string, unknown> | null;
}

const DEFAULT_KEYS: Record<string, null> = {
  personalGeminiKey: null,
  personalGroqKey: null,
  personalOpenRouterKey: null,
  personalXAIKey: null,
  personalAnthropicKey: null,
  personalOpenAIKey: null,
  personalSiliconFlowKey: null,
  personalCloudflareKey: null,
  personalHuggingfaceKey: null,
  personalTogetherKey: null,
  personalGithubKey: null,
  personalCerebrasKey: null,
  personalMistralKey: null,
};

export function createSql(databaseUrl: string): ReturnType<typeof postgres> {
  return postgres(databaseUrl, { prepare: false, max: 5 });
}

export async function initDb() {
  const sql = getSql();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "TelegramBotState" (
        "telegramId" TEXT PRIMARY KEY,
        "provider" TEXT DEFAULT 'gemini',
        "apiKey" TEXT,
        "chatState" TEXT DEFAULT 'IDLE',
        "tempEmail" TEXT,
        "tempData" JSONB
      );
    `;
    try {
      await sql`ALTER TABLE "TelegramBotState" ADD COLUMN IF NOT EXISTS "tempData" JSONB`;
    } catch (_) {}
  } catch (e) {
    console.error("DB Init error:", e);
  }
}

export async function getBotState(telegramId: string): Promise<BotState> {
  const sql = getSql();
  const [state] = await sql`SELECT * FROM "TelegramBotState" WHERE "telegramId" = ${telegramId}`;
  if (state) return state as unknown as BotState;
  await sql`INSERT INTO "TelegramBotState" ("telegramId") VALUES (${telegramId}) ON CONFLICT DO NOTHING`;
  const [newState] = await sql`SELECT * FROM "TelegramBotState" WHERE "telegramId" = ${telegramId}`;
  return (newState as unknown as BotState) || { telegramId, provider: "gemini", apiKey: null, chatState: "IDLE", tempEmail: null, tempData: null };
}

export async function updateBotState(telegramId: string, updates: Record<string, unknown>) {
  const sql = getSql();
  if (Object.keys(updates).length === 0) return;
  await sql`UPDATE "TelegramBotState" SET ${sql(updates as any)} WHERE "telegramId" = ${telegramId}`;
}

export async function getConversationHistory(telegramId: string): Promise<{ role: string; content: string }[]> {
  const state = await getBotState(telegramId);
  const tempData = state.tempData as any || {};
  return tempData.history || [];
}

export async function addConversationMessage(telegramId: string, role: string, content: string) {
  const state = await getBotState(telegramId);
  const tempData = (state.tempData as any) || {};
  const history: { role: string; content: string }[] = tempData.history || [];
  history.push({ role, content });
  if (history.length > 10) history.splice(0, history.length - 10);
  tempData.history = history;
  await updateBotState(telegramId, { tempData });
}

export async function getLinkedUser(telegramId: string): Promise<LinkedUser | null> {
  const sql = getSql();
  const [user] = await sql`
    SELECT u.id, u.name, u.email, u."telegramId", u."telegramVerified",
      u."semesterId", u."universityId", u.points,
      uni.name as university_name, fac.name as faculty_name,
      sem.name as semester_name, ay."yearNumber" as academic_year
    FROM "User" u
    LEFT JOIN "University" uni ON u."universityId" = uni.id
    LEFT JOIN "Faculty" fac ON u."facultyId" = fac.id
    LEFT JOIN "Semester" sem ON u."semesterId" = sem.id
    LEFT JOIN "AcademicYear" ay ON sem."academicYearId" = ay.id
    WHERE u."telegramId" = ${telegramId.toString()}
    LIMIT 1
  `;
  if (!user) return null;
  return { ...(user as unknown as Omit<LinkedUser, keyof typeof DEFAULT_KEYS>), ...DEFAULT_KEYS };
}

export function getUserApiKeys(user: LinkedUser): Record<ProviderKey, string | null> {
  return {
    gemini: user.personalGeminiKey,
    groq: user.personalGroqKey,
    openrouter: user.personalOpenRouterKey,
    siliconflow: user.personalSiliconFlowKey,
    anthropic: user.personalAnthropicKey,
    openai: user.personalOpenAIKey,
    xai: user.personalXAIKey,
    huggingface: user.personalHuggingfaceKey,
    mistral: user.personalMistralKey,
    together: user.personalTogetherKey,
    cloudflare: user.personalCloudflareKey,
    cerebras: user.personalCerebrasKey,
    github: user.personalGithubKey,
  };
}

export function validateEmail(email: string): boolean {
  return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(email.trim().toLowerCase());
}

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
  pdf: "application/pdf", txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo",
};

export async function downloadTelegramFile(
  botToken: string,
  fileId: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`
    );
    const json: any = await res.json();
    if (!json.ok || !json.result?.file_path) return null;

    const filePath = json.result.file_path;
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    const fileRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
    if (!fileRes.ok) return null;

    const blob = await fileRes.blob();
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    return { data: base64, mimeType };
  } catch (e) {
    console.error("Failed to download Telegram file:", e);
    return null;
  }
}
