import { geminiModelChain } from "./gemini-model-chain";

type ProviderResult = {
  provider: string;
  text: string;
};
export type AIProviderId = "gemini" | "openai" | "anthropic" | "deepseek";

export type AIFallbackMeta = {
  provider: string;
  fallbackFrom?: string;
  triedProviders: string[];
};

export type ChatImagePart = { mimeType: string; data: string };
export type ChatPdfPart = { mimeType: "application/pdf"; data: string };

const FETCH_MS = Number(process.env.AI_FETCH_TIMEOUT_MS ?? "") > 0 ? Number(process.env.AI_FETCH_TIMEOUT_MS) : 75_000;

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
  const base: AIProviderId[] = ["gemini", "openai", "anthropic", "deepseek"];
  const withKeys = base.filter((p) => hasProviderKey(p));
  if (!preferred) return withKeys;
  if (!withKeys.includes(preferred)) return withKeys;
  return [preferred, ...withKeys.filter((p) => p !== preferred)];
}

async function callGemini(
  message: string,
  systemPrompt: string,
  images: ChatImagePart[] = [],
  pdfs: ChatPdfPart[] = []
): Promise<ProviderResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("Gemini key missing");

  const textPart = `${systemPrompt}\n\nStudent: ${message}`;
  const parts: Record<string, unknown>[] = [{ text: textPart }];
  for (const img of images) {
    if (!img.data || !img.mimeType) continue;
    parts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.data,
      },
    });
  }
  for (const pdf of pdfs) {
    if (!pdf.data) continue;
    parts.push({
      inline_data: {
        mime_type: "application/pdf",
        data: pdf.data,
      },
    });
  }

  const body = JSON.stringify({ contents: [{ parts }] });
  const chain = geminiModelChain();
  let lastErr = "All Gemini models failed";

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
      lastErr = `Gemini error (${res.status}) [${model}]: ${apiMsg}`;
      // Wrong model / no free quota on this model / overloaded — try next (not for bad key)
      const tryNext =
        i < chain.length - 1 &&
        (res.status === 404 ||
          res.status === 429 ||
          res.status === 503 ||
          /not found|not supported|quota|limit:\s*0|free_tier/i.test(apiMsg));
      if (tryNext) continue;
      throw new Error(lastErr);
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      lastErr = `Gemini returned no text for ${model} (blocked or empty)`;
      if (i < chain.length - 1) continue;
      throw new Error(lastErr);
    }
    return { provider: `gemini:${model}`, text };
  }

  throw new Error(lastErr);
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
      model: "gpt-4o-mini",
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

export async function generateAIReplyWithFallback(
  message: string,
  systemPrompt: string,
  options?: { images?: ChatImagePart[]; pdfs?: ChatPdfPart[]; preferredProvider?: AIProviderId | string }
): Promise<ProviderResult & AIFallbackMeta> {
  if (!hasAnyAiKey()) {
    throw new AIConfigurationError(
      "AI is not configured on the server. In Vercel: Project → Settings → Environment Variables → add **GEMINI_API_KEY** (free key: https://aistudio.google.com/app/apikey), then redeploy. You can also set OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY."
    );
  }

  const images = options?.images?.filter((i) => i.data && i.mimeType) ?? [];
  const pdfs = options?.pdfs?.filter((p) => p.data && p.mimeType === "application/pdf") ?? [];
  const preferred = normalizePreferredProvider(options?.preferredProvider);

  if (images.length > 0 || pdfs.length > 0) {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      throw new AIConfigurationError(
        "Images and PDFs in chat require **GEMINI_API_KEY** on the server (multimodal). Add it in Vercel env and redeploy."
      );
    }
    const row = await callGemini(message, systemPrompt, images, pdfs);
    return { ...row, provider: row.provider, triedProviders: ["gemini"] };
  }

  const order = buildProviderOrder(preferred);
  const runners: Array<{ id: AIProviderId; run: () => Promise<ProviderResult> }> = order.map((id) => ({
    id,
    run:
      id === "gemini"
        ? () => callGemini(message, systemPrompt, [], [])
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
      lastError = err;
    }
  }

  const hint = lastError instanceof Error ? lastError.message : "All configured AI providers failed";
  throw new Error(hint);
}

export async function generateJsonWithFallback<T>(
  prompt: string,
  fallback: T,
  options?: { preferredProvider?: AIProviderId | string; systemPrompt?: string }
): Promise<{ data: T } & AIFallbackMeta> {
  const systemPrompt =
    options?.systemPrompt ??
    "You are a precise assistant. Return only valid JSON matching the requested schema.";
  const out = await generateAIReplyWithFallback(prompt, systemPrompt, {
    preferredProvider: options?.preferredProvider,
  });
  const clean = out.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return { data: JSON.parse(clean) as T, provider: out.provider, fallbackFrom: out.fallbackFrom, triedProviders: out.triedProviders };
  } catch {
    return { data: fallback, provider: out.provider, fallbackFrom: out.fallbackFrom, triedProviders: out.triedProviders };
  }
}
