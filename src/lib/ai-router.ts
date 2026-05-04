import { geminiModelChain } from "./gemini-model-chain";

type ProviderResult = {
  provider: string;
  text: string;
};
export type AIProviderId = "manus" | "gemini" | "openai" | "anthropic" | "deepseek";

export type AIFallbackMeta = {
  provider: string;
  fallbackFrom?: string;
  triedProviders: string[];
};

export type ChatImagePart = { mimeType: string; data: string };
export type ChatPdfPart = { mimeType: "application/pdf"; data: string };

const FETCH_MS = Number(process.env.AI_FETCH_TIMEOUT_MS ?? "") > 0 ? Number(process.env.AI_FETCH_TIMEOUT_MS) : 150_000;

/** In-memory quota exhaustion tracker — key → timestamp of last 429 */
const geminiQuotaExhaustedAt = new Map<string, number>();

/** Mark a key as quota-exhausted now */
function markKeyExhausted(key: string): void {
  geminiQuotaExhaustedAt.set(key, Date.now());
}

/** True if the key is fresh (either never exhausted, or reset period has passed).
 *  Gemini free-tier quotas reset at UTC midnight — we use 24h as a safe window. */
function isKeyFresh(key: string): boolean {
  const t = geminiQuotaExhaustedAt.get(key);
  if (!t) return true;
  const now = Date.now();
  // Check if we've crossed a UTC midnight since exhaustion
  const exhaustedDate = new Date(t);
  const nowDate = new Date(now);
  // Reset if it's been >= 24h OR if UTC day has changed
  const dayChanged =
    exhaustedDate.getUTCFullYear() !== nowDate.getUTCFullYear() ||
    exhaustedDate.getUTCMonth() !== nowDate.getUTCMonth() ||
    exhaustedDate.getUTCDate() !== nowDate.getUTCDate();
  if (dayChanged || now - t > 24 * 60 * 60 * 1000) {
    geminiQuotaExhaustedAt.delete(key);
    return true;
  }
  return false;
}

/** Collect all configured Gemini keys (up to 10), filtering out exhausted ones first.
 *  If all are exhausted, return them all so we can still attempt (they might have reset). */
function getGeminiKeys(personalKey?: string): string[] {
  const envKeys: string[] = [];
  // Check GEMINI_API_KEY (no number suffix — backwards compat)
  const base = process.env.GEMINI_API_KEY?.trim();
  if (base) envKeys.push(base);
  // GEMINI_API_KEY_2 through GEMINI_API_KEY_10
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (k) envKeys.push(k);
  }

  const allKeys: string[] = [];
  if (personalKey?.trim()) allKeys.push(personalKey.trim());
  allKeys.push(...envKeys);

  if (allKeys.length === 0) return [];

  // Prefer fresh keys; if all exhausted, return all (will try anyway)
  const fresh = allKeys.filter((k) => isKeyFresh(k));
  return fresh.length > 0 ? fresh : allKeys;
}

/** Thrown when no provider API keys are set (e.g. missing GEMINI_API_KEY on Vercel). */
export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

function hasAnyAiKey(): boolean {
  return !!(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim() ||
    process.env.DEEPSEEK_API_KEY?.trim()
  );
}

function normalizePreferredProvider(raw: unknown): AIProviderId | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (s === "gemini" || s === "openai" || s === "anthropic" || s === "deepseek") return s;
  return undefined;
}

function hasProviderKey(provider: AIProviderId): boolean {
  if (provider === "manus") return !!process.env.MANUS_API_KEY?.trim();
  if (provider === "gemini") return !!process.env.GEMINI_API_KEY?.trim();
  if (provider === "openai") return !!process.env.OPENAI_API_KEY?.trim();
  if (provider === "anthropic") return !!process.env.ANTHROPIC_API_KEY?.trim();
  return !!process.env.DEEPSEEK_API_KEY?.trim();
}

function providerDisplayName(provider: AIProviderId): string {
  if (provider === "openai") return "OpenAI";
  if (provider === "anthropic") return "Anthropic";
  if (provider === "deepseek") return "DeepSeek";
  return "Gemini";
}

function buildProviderOrder(preferred?: AIProviderId): AIProviderId[] {
  const base: AIProviderId[] = ["manus", "gemini", "openai", "anthropic", "deepseek"];
  const withKeys = base.filter((p) => hasProviderKey(p));
  
  if (!preferred || !withKeys.includes(preferred)) {
    return withKeys;
  }
  return [preferred, ...withKeys.filter((p) => p !== preferred)];
}

async function callGemini(
  message: string,
  systemPrompt: string,
  images: ChatImagePart[] = [],
  pdfs: ChatPdfPart[] = [],
  personalKey?: string
): Promise<ProviderResult> {
  const textPart = `${systemPrompt}\n\nStudent: ${message}`;
  const parts: Record<string, unknown>[] = [{ text: textPart }];
  for (const img of images) {
    if (!img.data || !img.mimeType) continue;
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
  }
  for (const pdf of pdfs) {
    if (!pdf.data) continue;
    parts.push({ inline_data: { mime_type: "application/pdf", data: pdf.data } });
  }

  const keys = getGeminiKeys(personalKey);
  if (keys.length === 0) throw new Error("No Gemini API keys configured");
  
  console.log(`[AI Router] Attempting Gemini with ${keys.length} keys. First key starts with: ${keys[0].substring(0, 4)}...`);

  const body = JSON.stringify({ contents: [{ parts }] });
  const chain = geminiModelChain();
  let lastErr = "All Gemini keys and models failed";

  for (let k = 0; k < keys.length; k++) {
    const key = keys[k]!;
    const keyLabel = k === 0 && personalKey?.trim() === key ? "PERSONAL" : `KEY_${k + 1}`;
    let keyQuotaExhausted = false;

    for (let i = 0; i < chain.length; i++) {
      const model = chain[i]!;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(FETCH_MS),
          body,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiMsg = typeof data?.error?.message === "string" ? data.error.message : res.statusText;
        console.error(`[AI Router] Gemini failure [${keyLabel}/${model}]: ${res.status} - ${apiMsg}`);
        lastErr = `Gemini error (${res.status}) [${keyLabel}/${model}]: ${apiMsg}`;

        const isQuota = res.status === 429 || /quota|limit:\s*0|free_tier|resource_exhausted/i.test(apiMsg);
        const isModelIssue = res.status === 404 || res.status === 503 || /not found|not supported|overloaded/i.test(apiMsg);

        if (isQuota) {
          markKeyExhausted(key);
          console.warn(`[AI Router] ${keyLabel} quota exhausted, trying next key...`);
          keyQuotaExhausted = true;
          break;
        }
        if (isModelIssue && i < chain.length - 1) continue;
        if (k < keys.length - 1) { keyQuotaExhausted = true; break; }
        throw new Error(lastErr);
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastErr = `Gemini returned no text for [${keyLabel}/${model}] (blocked or empty)`;
        if (i < chain.length - 1) continue;
        if (k < keys.length - 1) { keyQuotaExhausted = true; break; }
        throw new Error(lastErr);
      }
      return { provider: `gemini:${model}:${keyLabel}`, text };
    }

    if (!keyQuotaExhausted) break;
  }

  throw new Error(lastErr);
}


/** MANUS fallback — uses DeepSeek-compatible endpoint style via OpenAI-compatible v1 */
async function callManus(message: string, systemPrompt: string): Promise<ProviderResult> {
  const key = process.env.MANUS_API_KEY?.trim();
  if (!key) throw new Error("MANUS key missing");
  // MANUS exposes an OpenAI-compatible endpoint
  const res = await fetch("https://api.manus.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: "manus-default",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`MANUS call failed (${res.status}): ${errData?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("MANUS empty response");
  return { provider: "manus", text };
}

async function callOpenAI(message: string, systemPrompt: string): Promise<ProviderResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI key missing");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error("OpenAI call failed");
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI empty response");
  return { provider: "openai", text };
}

async function callAnthropic(message: string, systemPrompt: string): Promise<ProviderResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Anthropic key missing");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    }),
  });
  if (!res.ok) throw new Error("Anthropic call failed");
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Anthropic empty response");
  return { provider: "anthropic", text };
}

async function callDeepSeek(message: string, systemPrompt: string): Promise<ProviderResult> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DeepSeek key missing");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    }),
  });
  if (!res.ok) throw new Error("DeepSeek call failed");
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("DeepSeek empty response");
  return { provider: "deepseek", text };
}

  message: string,
  systemPrompt: string,
  options?: { images?: ChatImagePart[]; pdfs?: ChatPdfPart[]; preferredProvider?: AIProviderId | string; personalGeminiKey?: string; failFast?: boolean }
): Promise<ProviderResult & AIFallbackMeta> {
  if (!hasAnyAiKey()) {
    throw new AIConfigurationError(
      "AI is not configured on the server. In Vercel: Project → Settings → Environment Variables → add **GEMINI_API_KEY** (free key: https://aistudio.google.com/app/apikey), then redeploy. You can also set OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY."
    );
  }

  const images = options?.images?.filter((i) => i.data && i.mimeType) ?? [];
  const pdfs = options?.pdfs?.filter((p) => p.data && p.mimeType === "application/pdf") ?? [];
  const preferred = normalizePreferredProvider(options?.preferredProvider);
  const personalGeminiKey = options?.personalGeminiKey?.trim() || undefined;

  if (images.length > 0 || pdfs.length > 0) {
    if (!personalGeminiKey && !process.env.GEMINI_API_KEY?.trim()) {
      throw new AIConfigurationError(
        "Images and PDFs in chat require **GEMINI_API_KEY** on the server (multimodal). Add it in Vercel env and redeploy."
      );
    }
    const row = await callGemini(message, systemPrompt, images, pdfs, personalGeminiKey);
    return { ...row, provider: row.provider, triedProviders: ["gemini"] };
  }

  const order = buildProviderOrder(preferred);
  const runners: Array<{ id: string; run: () => Promise<ProviderResult> }> = order.map((id) => ({
    id,
    run:
      id === "manus"
        ? () => callManus(message, systemPrompt)
        : id === "gemini"
          ? () => callGemini(message, systemPrompt, [], [], personalGeminiKey)
          : id === "openai"
            ? () => callOpenAI(message, systemPrompt)
            : id === "anthropic"
              ? () => callAnthropic(message, systemPrompt)
              : () => callDeepSeek(message, systemPrompt),
  }));

  if (runners.length === 0) {
    throw new AIConfigurationError(
      "No AI provider keys are set. Add **GEMINI_API_KEY** (recommended) in `.env` locally or in Vercel env, then restart the dev server / redeploy."
    );
  }

  let lastError: unknown = null;
  const triedProviders: string[] = [];
  for (const row of runners) {
    triedProviders.push(row.id);
    try {
      const out = await row.run();
      return {
        ...out,
        fallbackFrom: preferred && preferred !== row.id ? providerDisplayName(preferred) : undefined,
        triedProviders,
      };
    } catch (err) {
      console.warn(`[AI Router] Provider ${row.id} failed, trying next... Error:`, err instanceof Error ? err.message : err);
      if (options?.failFast && row.id === preferred) {
         throw err;
      }
      lastError = err;
    }
  }

  const hint = lastError instanceof Error ? lastError.message : "All configured AI providers failed";
  throw new Error(hint);
}

export async function generateJsonWithFallback<T>(
  prompt: string,
  fallback: T,
  options?: { preferredProvider?: AIProviderId | string; systemPrompt?: string; failFast?: boolean }
): Promise<{ data: T } & AIFallbackMeta> {
  const systemPrompt =
    options?.systemPrompt ??
    "You are a precise assistant. Return only valid JSON matching the requested schema.";
  const out = await generateAIReplyWithFallback(prompt, systemPrompt, {
    preferredProvider: options?.preferredProvider,
    failFast: options?.failFast,
  });
  const clean = out.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return { data: JSON.parse(clean) as T, provider: out.provider, fallbackFrom: out.fallbackFrom, triedProviders: out.triedProviders };
  } catch {
    return { data: fallback, provider: out.provider, fallbackFrom: out.fallbackFrom, triedProviders: out.triedProviders };
  }
}
