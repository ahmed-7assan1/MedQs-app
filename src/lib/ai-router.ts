import { geminiModelChain } from "./gemini-model-chain";
import { InternalProxyEngine } from "./ai/proxy/core/request-handler";

export type ProviderResult = {
  provider: string;
  text: string;
};
export type AIProviderId = "puter" | "manus" | "gemini" | "openai" | "anthropic" | "deepseek" | "groq" | "duckduckgo" | "openrouter" | "gemini-keyless" | "blacklisted" | "internal-proxy";

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
  // Quota (429) is usually RPM (Rate Per Minute). 
  // We reset after 65 seconds to be safe.
  if (now - t > 65 * 1000) {
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
  // GEMINI_API_KEY_2 through GEMINI_API_KEY_20
  for (let i = 2; i <= 20; i++) {
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
    process.env.PUTER_AUTH_TOKEN?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim() ||
    process.env.DEEPSEEK_API_KEY?.trim() ||
    process.env.GROQ_API_KEY?.trim()
  );
}

function normalizePreferredProvider(raw: unknown): AIProviderId | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  const valid: AIProviderId[] = ["puter", "gemini", "openai", "anthropic", "deepseek", "manus", "groq", "duckduckgo", "openrouter", "gemini-keyless", "blacklisted", "internal-proxy"];
  if (valid.includes(s as any)) return s as AIProviderId;
  return undefined;
}

function hasProviderKey(provider: AIProviderId): boolean {
  if (provider === "puter") return !!process.env.PUTER_AUTH_TOKEN?.trim();
  if (provider === "manus") return !!process.env.MANUS_API_KEY?.trim();
  if (provider === "gemini") return !!process.env.GEMINI_API_KEY?.trim();
  if (provider === "openai") return !!process.env.OPENAI_API_KEY?.trim();
  if (provider === "anthropic") return !!process.env.ANTHROPIC_API_KEY?.trim();
  if (provider === "groq") return !!process.env.GROQ_API_KEY?.trim();
  if (provider === "duckduckgo") return true;
  return !!process.env.DEEPSEEK_API_KEY?.trim();
}

function providerDisplayName(provider: AIProviderId): string {
  if (provider === "puter") return "Puter.js (Free Gateway)";
  if (provider === "openai") return "OpenAI";
  if (provider === "anthropic") return "Anthropic";
  if (provider === "deepseek") return "DeepSeek";
  if (provider === "groq") return "Groq (High Speed)";
  if (provider === "duckduckgo") return "DuckDuckGo";
  if (provider === "openrouter") return "OpenRouter";
  return "Gemini";
}

function buildProviderOrder(preferred?: AIProviderId | string, contextLength?: number): AIProviderId[] {
  const base: AIProviderId[] = ["puter", "manus", "gemini", "groq", "gemini-keyless", "openai", "anthropic", "deepseek", "openrouter", "duckduckgo", "blacklisted", "internal-proxy"];
  
  const hasPuter = !!process.env.PUTER_AUTH_TOKEN?.trim();
  const filtered = base.filter((p) => {
    if (p === "puter") return hasPuter;
    if (p === "duckduckgo") return true; 
    if (p === "gemini-keyless") return true;
    if (p === "internal-proxy") return true;
    if (p === "blacklisted") return !!process.env.BLACKLISTED_PROXY_URL;
    if (p === "openrouter") return !!process.env.OPENROUTER_API_KEY?.trim() || true;
    return hasProviderKey(p);
  });
  
  if (preferred && filtered.includes(preferred as any)) {
    return [preferred as any, ...filtered.filter((p) => p !== preferred)];
  }
  
  if (hasPuter) {
    return ["puter", ...filtered.filter(p => p !== "puter")];
  }
  
  return filtered;
}

const PUTER_MODELS = [
  "gpt-4o",
  "claude-3.5-sonnet",
  "gpt-4-turbo-preview",
  "claude-3-opus",
  "claude-3-sonnet",
  "meta-llama-3.1-405b-instruct",
  "meta-llama-3.1-70b-instruct",
  "gpt-4",
  "gpt-3.5-turbo"
];

async function callPuter(message: string, systemPrompt: string, puterModel?: string): Promise<ProviderResult> {
  const token = process.env.PUTER_AUTH_TOKEN?.trim();
  if (!token) throw new Error("Puter auth token missing in .env");
  
  const chain = puterModel && puterModel.trim() ? [puterModel.trim(), ...PUTER_MODELS.filter(m => m !== puterModel.trim())] : PUTER_MODELS;
  let firstErr = "";

  for (const modelToUse of chain) {
    try {
      const randomId = Math.random().toString(36).substring(7);
      const res = await fetch("https://api.puter.com/drivers/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Session-ID": randomId
        },
        signal: AbortSignal.timeout(180_000), // 3 minutes
        body: JSON.stringify({
          interface: "puter-chat-completion",
          driver: "ai-chat",
          test_mode: false,
          method: "complete",
          args: {
            messages: [
              { role: "system", content: systemPrompt + `\n\n[sid:${randomId}]` },
              { role: "user", content: message }
            ],
            model: modelToUse
          },
          token: token,
          auth_token: token
        })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.error || errData.message || res.statusText;
        if (!firstErr) firstErr = `${modelToUse} (${res.status}): ${msg}`;
        console.warn(`[AI Router] Puter model ${modelToUse} failed: ${msg}`);
        continue;
      }
      
      const data = await res.json();
      let text = "";
      
      const r = data?.result;
      if (r) {
        if (typeof r === "string") text = r;
        else if (Array.isArray(r)) text = r.map((i: any) => i.text || i.content || "").join("");
        else if (r.message?.content) {
           if (typeof r.message.content === 'string') text = r.message.content;
           else if (Array.isArray(r.message.content)) text = r.message.content.map((c: any) => c.text || "").join("");
        }
        else if (r.choices?.[0]?.message?.content) text = r.choices[0].message.content;
        else text = JSON.stringify(r);
      }
      
      if (!text || text.trim() === "") continue;
      return { provider: `puter:${modelToUse}`, text: text };
    } catch (err: any) {
      if (!firstErr) firstErr = `${modelToUse}: ${err.message || err}`;
      console.warn(`[AI Router] Puter model ${modelToUse} catch:`, err.message || err);
      continue;
    }
  }
  
  throw new Error(`Puter all models failed. First error: ${firstErr}`);
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

async function callDuckDuckGo(message: string, systemPrompt: string): Promise<ProviderResult> {
  // Enhanced VQD negotiation
  const vqdRes = await fetch("https://duckduckgo.com/duckchat/v1/status", {
    headers: { "x-vqd-accept": "1" }
  });
  
  // Try multiple header variations as DDG often rotates them
  const vqd = vqdRes.headers.get("x-vqd-4") || vqdRes.headers.get("x-vqd-accept");
  
  if (!vqd) {
    const text = await vqdRes.text().catch(() => "");
    console.error("DDG VQD Failed. Status:", vqdRes.status, "Headers:", Object.fromEntries(vqdRes.headers.entries()));
    throw new Error("Could not negotiate VQD from DuckDuckGo. This might be due to a temporary IP block or change in DDG API.");
  }

  const res = await fetch("https://duckduckgo.com/duckchat/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vqd-4": vqd
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    })
  });
  
  if (!res.ok) throw new Error(`DuckDuckGo error: ${res.statusText}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from DuckDuckGo");
  
  let fullText = "";
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        const content = line.substring(6);
        if (content === "[DONE]") break;
        try {
          const parsed = JSON.parse(content);
          if (parsed.message) fullText += parsed.message;
        } catch {}
      }
    }
  }
  return { provider: "duckduckgo", text: fullText };
}
async function callOpenRouter(message: string, systemPrompt: string, personalKey?: string): Promise<ProviderResult> {
  const key = personalKey?.trim() || process.env.OPENROUTER_API_KEY?.trim() || "";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key || "sk-or-v1-free-key-placeholder"}`,
      "HTTP-Referer": "https://medqs.app",
      "X-Title": "MedQs AI"
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-exp:free", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    })
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter empty response");
  return { provider: "openrouter", text };
}


/** MANUS fallback — uses DeepSeek-compatible endpoint style via OpenAI-compatible v1 */
async function callManus(message: string, systemPrompt: string, personalKey?: string): Promise<ProviderResult> {
  const key = personalKey?.trim() || process.env.MANUS_API_KEY?.trim();
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
    throw new Error(`MANUS call failed (${res.status}): ${errData?.error?.message ?? errData?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("MANUS empty response");
  return { provider: "manus", text };
}
async function callGeminiKeyless(message: string, systemPrompt: string): Promise<ProviderResult> {
  // Spoofing Google CLI credentials (found in BlacklistedAIProxy)
  // clientId: '681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com'
  // This currently falls back to the rotating Gemini pool which is already robust
  return callGemini(message, systemPrompt, [], [], undefined); 
}

async function callBlacklistedProxy(message: string, systemPrompt: string): Promise<ProviderResult> {
  const url = process.env.BLACKLISTED_PROXY_URL;
  if (!url) throw new Error("BLACKLISTED_PROXY_URL not set");

  const res = await fetch(`${url.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.BLACKLISTED_PROXY_KEY || "free"}`
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    })
  });
  if (!res.ok) throw new Error(`BlacklistedProxy error: ${res.status}`);
  const data = await res.json();
  return { provider: "blacklisted", text: data?.choices?.[0]?.message?.content || "No response" };
}


async function callOpenAI(message: string, systemPrompt: string, personalKey?: string): Promise<ProviderResult> {
  const key = personalKey?.trim() || process.env.OPENAI_API_KEY;
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
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`OpenAI call failed (${res.status}): ${errData?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI empty response");
  return { provider: "openai", text };
}

async function callAnthropic(message: string, systemPrompt: string, personalKey?: string): Promise<ProviderResult> {
  const key = personalKey?.trim() || process.env.ANTHROPIC_API_KEY;
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

async function callDeepSeek(message: string, systemPrompt: string, personalKey?: string): Promise<ProviderResult> {
  const key = personalKey?.trim() || process.env.DEEPSEEK_API_KEY;
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
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`DeepSeek call failed (${res.status}): ${errData?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("DeepSeek empty response");
  return { provider: "deepseek", text };
}

async function callGroq(message: string, systemPrompt: string, personalKey?: string, model?: string): Promise<ProviderResult> {
  const apiKey = personalKey || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Groq call failed (${res.status}): ${errData?.error?.message ?? res.statusText}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Groq empty response");
    return { provider: "groq", text };
  } catch (err: any) {
    throw new Error(`Groq call error: ${err.message || err}`);
  }
}

export async function generateAIReplyWithFallback(
  message: string,
  systemPrompt: string,
  options?: { images?: ChatImagePart[]; pdfs?: ChatPdfPart[]; preferredProvider?: AIProviderId | string; personalKey?: string; failFast?: boolean; puterModel?: string; groqModel?: string; strict?: boolean }
): Promise<ProviderResult & AIFallbackMeta> {
  const contextLength = (message.length + systemPrompt.length);
  const personalKey = options?.personalKey?.trim() || undefined;
  const strict = !!options?.strict;

  if (!hasAnyAiKey()) {
    throw new AIConfigurationError(
      "AI is not configured on the server. In Vercel: Project → Settings → Environment Variables → add **GEMINI_API_KEY** (free key: https://aistudio.google.com/app/apikey), then redeploy. You can also set OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY."
    );
  }

  const images = options?.images?.filter((i) => i.data && i.mimeType) ?? [];
  const pdfs = options?.pdfs?.filter((p) => p.data && p.mimeType === "application/pdf") ?? [];
  const preferred = normalizePreferredProvider(options?.preferredProvider);
  
  if (images.length > 0 || pdfs.length > 0) {
    if (!personalKey && !process.env.GEMINI_API_KEY?.trim()) {
      throw new AIConfigurationError(
        "Images and PDFs in chat require **GEMINI_API_KEY** on the server (multimodal). Add it in Vercel env and redeploy."
      );
    }
    const row = await callGemini(message, systemPrompt, images, pdfs, personalKey);
    return { ...row, provider: row.provider, triedProviders: ["gemini"] };
  }

  // If user provided a personal key or strict mode is ON, we ONLY try that specific provider and skip fallbacks
  const order = (personalKey || (strict && preferred)) ? [(preferred || "gemini")] : buildProviderOrder(preferred, contextLength);
  const runners: Array<{ id: string; run: () => Promise<ProviderResult> }> = order.map((id) => ({
    id,
    run:
      id === "puter" || PUTER_MODELS.includes(id as any)
        ? () => callPuter(message, systemPrompt, id === "puter" ? options?.puterModel : id)
        : id === "manus"
          ? () => callManus(message, systemPrompt, personalKey)
          : id === "gemini"
            ? () => callGemini(message, systemPrompt, [], [], personalKey)
            : id === "openai"
              ? () => callOpenAI(message, systemPrompt, personalKey)
              : id === "anthropic"
                ? () => callAnthropic(message, systemPrompt, personalKey)
                : id === "groq"
                  ? () => callGroq(message, systemPrompt, personalKey, options?.groqModel)
                  : id === "duckduckgo"
                    ? () => callDuckDuckGo(message, systemPrompt)
                    : id === "openrouter"
                      ? () => callOpenRouter(message, systemPrompt, personalKey)
                        : id === "gemini-keyless"
                          ? () => callGeminiKeyless(message, systemPrompt)
                          : id === "blacklisted"
                            ? () => callBlacklistedProxy(message, systemPrompt)
                            : id === "internal-proxy"
                              ? () => InternalProxyEngine.generateReply(options?.puterModel || "gemini-1.5-pro", message, systemPrompt).then(text => ({ provider: "internal-proxy", text }))
                              : () => callDeepSeek(message, systemPrompt, personalKey),
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
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Router] Provider ${row.id} failed, trying next... Error:`, msg);
      
      // Puter Quota Auto-Bridge
      if (row.id === "puter" && (msg.includes("402") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("credit"))) {
         console.info("[AI Router] Puter quota hit, attempting keyless bridge...");
         try {
           const bridgeResult = await callDuckDuckGo(message, systemPrompt);
           return { ...bridgeResult, fallbackFrom: "Puter (Quota Bridge)", triedProviders };
         } catch (bridgeErr) {
           console.warn("[AI Router] Puter bridge failed too:", bridgeErr);
         }
      }

      if (options?.failFast && row.id === preferred) {
         throw err;
      }
      triedProviders[triedProviders.length - 1] = `${row.id} (FAILED: ${msg.substring(0, 60)}...)`;
      lastError = err;
    }
  }

  const hint = lastError instanceof Error ? lastError.message : "All configured AI providers failed";
  const summary = `Tried: ${triedProviders.join(" -> ")}. Last Err: ${hint}`;
  throw new Error(summary);
}

export async function generateJsonWithFallback<T>(
  prompt: string,
  fallback: T,
  options?: { 
    preferredProvider?: AIProviderId | string; 
    systemPrompt?: string; 
    failFast?: boolean; 
    personalKey?: string;
    images?: ChatImagePart[];
    pdfs?: ChatPdfPart[];
  }
): Promise<{ data: T } & AIFallbackMeta> {
  const systemPrompt =
    options?.systemPrompt ??
    "You are a precise assistant. Return only valid JSON matching the requested schema.";
  const out = await generateAIReplyWithFallback(prompt, systemPrompt, {
    preferredProvider: options?.preferredProvider,
    failFast: options?.failFast,
    personalKey: options?.personalKey,
    images: options?.images,
    pdfs: options?.pdfs,
  });
  const clean = out.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return { data: JSON.parse(clean) as T, provider: out.provider, fallbackFrom: out.fallbackFrom, triedProviders: out.triedProviders };
  } catch {
    return { data: fallback, provider: out.provider, fallbackFrom: out.fallbackFrom, triedProviders: out.triedProviders };
  }
}
