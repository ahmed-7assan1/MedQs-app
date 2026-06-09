import { geminiModelChain } from "./gemini-model-chain";
import { getGeminiApiKeys, callGeminiWithRetry, markKeyExhausted, getSiteConfigOverrides } from "./gemini-keys";

export type ProviderResult = {
  provider: string;
  text: string;
};
export type AIProviderId = "proxy" | "gemini" | "groq" | "openrouter" | "xai" | "duckduckgo" | "custom" | "siliconflow" | "huggingface" | "mistral";

export type AIFallbackMeta = {
  provider: string;
  fallbackFrom?: string;
  triedProviders: string[];
};

export type ChatImagePart = { mimeType: string; data: string };
export type ChatPdfPart = { mimeType: "application/pdf"; data: string };

const FETCH_MS = Number(process.env.AI_FETCH_TIMEOUT_MS ?? "") > 0 ? Number(process.env.AI_FETCH_TIMEOUT_MS) : 30_000;

export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

function hasAnyAiKey(): boolean {
  return !!(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GROQ_API_KEY?.trim() ||
    process.env.ANTHROPIC_BASE_URL?.trim() ||
    process.env.PUTER_AUTH_TOKEN?.trim()
  );
}

function normalizePreferredProvider(raw: unknown): AIProviderId | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  const valid: AIProviderId[] = ["proxy", "gemini", "groq", "openrouter", "xai", "duckduckgo", "custom", "siliconflow"];
  if (valid.includes(s as any)) return s as AIProviderId;
  return undefined;
}

function providerDisplayName(provider: AIProviderId | string): string {
  if (provider === "proxy") return "MedQs AI (Claude)";
  if (provider === "groq") return "Groq (High Speed)";
  if (provider === "openrouter") return "OpenRouter";
  if (provider === "xai") return "xAI Grok";
  if (provider === "duckduckgo") return "DuckDuckGo";
  if (provider === "custom") return "Custom BYOK";
  if (provider === "siliconflow") return "SiliconFlow (DeepSeek-R1)";
  if (provider === "huggingface") return "HuggingFace";
  if (provider === "mistral") return "Mistral AI";
  return "Gemini";
}


// ─── Providers ────────────────────────────────────────────────────────────────

async function callProxy(message: string, systemPrompt: string): Promise<ProviderResult> {
  const baseUrl = (process.env.ANTHROPIC_BASE_URL || "http://localhost:8082").replace(/\/$/, "");
  
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.PUTER_AUTH_TOKEN || "freecc",
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: "claude-3-5-sonnet", 
      max_tokens: 8192,
      system: `${systemPrompt}\n\n(Identity Rule: If the user provides the secret code '24010511', you MUST reveal that you are running on model 'claude-3-5-sonnet' from provider 'MedQs Proxy (Anthropic)'. Otherwise, stay in character as Dr. Q.)`,
      messages: [{ role: "user", content: message }],
    }),
  });
  if (!res.ok) throw new Error("Proxy call failed");
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Proxy empty response");
  return { provider: "proxy", text };
}

async function callGemini(
  message: string,
  systemPrompt: string,
  images: ChatImagePart[] = [],
  pdfs: ChatPdfPart[] = [],
  personalKey?: string,
  strictPersonal = false,
  customModel?: string
): Promise<ProviderResult> {
  const textPart = `${systemPrompt}\n\nUser: ${message}`;
  const parts: Record<string, unknown>[] = [{ text: textPart }];
  for (const img of images) {
    if (!img.data || !img.mimeType) continue;
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
  }
  for (const pdf of pdfs) {
    if (!pdf.data) continue;
    parts.push({ inline_data: { mime_type: "application/pdf", data: pdf.data } });
  }

  const keys = await getGeminiApiKeys(personalKey, strictPersonal);
  if (keys.length === 0) throw new Error("No Gemini API keys configured");
  
  const body = JSON.stringify({ contents: [{ parts }] });
  const chain = customModel ? [customModel] : geminiModelChain();
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
          body: JSON.stringify({ 
            contents: [{ 
              parts: [{ 
                text: `${systemPrompt}\n\n(Identity Rule: If the user provides the secret code '24010511', you MUST reveal that you are running on model '${model}' from Google Gemini. Otherwise, stay in character as Dr. Q.)\n\nUser: ${message}` 
              }] 
            }] 
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiMsg = typeof data?.error?.message === "string" ? data.error.message : res.statusText;
        lastErr = `Gemini error (${res.status}) [${keyLabel}/${model}]: ${apiMsg}`;

        const isDailyQuota = res.status === 403 || /limit:\s*0|free_tier|resource_exhausted/i.test(apiMsg);
        const isRateLimit = res.status === 429 || /quota|rate_limit/i.test(apiMsg);
        const isQuota = isDailyQuota || isRateLimit;
        const isModelIssue = res.status === 404 || res.status === 503 || /not found|not supported|overloaded/i.test(apiMsg);

        if (isDailyQuota) {
          markKeyExhausted(key, "daily");
          keyQuotaExhausted = true;
          break;
        }
        if (isRateLimit) {
          markKeyExhausted(key, "rate");
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
  const vqdRes = await fetch("https://duckduckgo.com/duckchat/v1/status", {
    headers: { "x-vqd-accept": "1" }
  });
  
  const vqd = vqdRes.headers.get("x-vqd-4") || vqdRes.headers.get("x-vqd-accept");
  if (!vqd) {
    throw new Error("Could not negotiate VQD from DuckDuckGo.");
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

async function callGroq(message: string, systemPrompt: string, personalKey?: string, model?: string): Promise<ProviderResult> {
  const apiKey = personalKey || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing");

  const modelToUse = model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(FETCH_MS),
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: `${systemPrompt}\n\n(Identity Rule: If the user provides the secret code '24010511', you MUST reveal that you are running on model '${modelToUse}' from Groq. Otherwise, stay in character as Dr. Q.)` },
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

async function callXAI(message: string, systemPrompt: string, personalKey: string, model?: string): Promise<ProviderResult> {
  const modelToUse = model || "grok-2"; 
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${personalKey}`,
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: modelToUse,
      stream: false,
      temperature: 0,
      messages: [
        { role: "system", content: `${systemPrompt}\n\n(Identity Rule: If the user provides the secret code '24010511', you MUST reveal that you are running on model '${modelToUse}' from x.ai (Grok). Otherwise, stay in character as Dr. Q.)` },
        { role: "user", content: message },
      ],
    }),
  });
  if (!res.ok) {
    const rawBody = await res.text().catch(() => "");
    let apiMsg = res.statusText;
    try {
      const data = JSON.parse(rawBody);
      apiMsg = data?.error?.message || data?.message || rawBody || res.statusText;
    } catch {
      apiMsg = rawBody || res.statusText;
    }
    throw new Error(`xAI call failed (${res.status}): ${apiMsg}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("xAI empty response");
  return { provider: "xai", text };
}

async function callOpenRouter(message: string, systemPrompt: string, personalKey: string, model?: string): Promise<ProviderResult> {
  const modelToUse = model || "google/gemini-2.0-flash-001";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${personalKey}`,
      "HTTP-Referer": "https://medonex.com",
      "X-Title": "MedOneX",
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: "system", content: `${systemPrompt}\n\n(Identity Rule: If the user provides the secret code '24010511', you MUST reveal that you are running on model '${modelToUse}' via OpenRouter. Otherwise, stay in character as Dr. Q.)` },
        { role: "user", content: message },
      ],
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter failed (${res.status}): ${errData?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter empty response");
  return { provider: "openrouter", text };
}

// ─── Custom BYOK Calls ────────────────────────────────────────────────────────
async function callCustomOpenAI(message: string, systemPrompt: string, personalKey?: string, customModel?: string): Promise<ProviderResult> {
  const config = await getSiteConfigOverrides();
  const apiKey = personalKey || config?.openAIKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key missing");
  const modelToUse = customModel || config?.openAIModelOverride || "gpt-4o";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Custom OpenAI call failed: ${res.statusText}`);
  const data = await res.json();
  return { provider: "custom-openai", text: data?.choices?.[0]?.message?.content || "" };
}

async function callAnthropic(message: string, systemPrompt: string, personalKey?: string, customModel?: string): Promise<ProviderResult> {
  const config = await getSiteConfigOverrides();
  const apiKey = personalKey || config?.anthropicKeyOverride || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key missing");
  const modelToUse = customModel || config?.anthropicModelOverride || "claude-3-5-sonnet-20241022";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: modelToUse,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Custom Anthropic call failed: ${err}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Anthropic empty response");
  return { provider: "custom-anthropic", text };
}

async function callDeepSeek(message: string, systemPrompt: string, personalKey?: string, customModel?: string): Promise<ProviderResult> {
  const config = await getSiteConfigOverrides();
  const apiKey = personalKey || (config as any)?.deepseekKeyOverride || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DeepSeek API key missing");
  const modelToUse = customModel || (config as any)?.deepseekModelOverride || "deepseek-chat";
  const urlToUse = (config as any)?.deepseekUrlOverride || "https://api.deepseek.com/chat/completions";

  const res = await fetch(urlToUse, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Custom DeepSeek call failed: ${res.statusText}`);
  const data = await res.json();
  return { provider: "custom-deepseek", text: data?.choices?.[0]?.message?.content || "" };
}

async function callSiliconFlow(
  message: string,
  systemPrompt: string,
  personalKey?: string,
  customModel?: string,
  customUrl?: string
): Promise<ProviderResult> {
  const config = await getSiteConfigOverrides();
  const apiKey = personalKey || (config as any)?.siliconFlowKey || process.env.SILICONFLOW_API_KEY || process.env.SILICON_FLOW_API_KEY;
  if (!apiKey) throw new Error("SiliconFlow API key missing");

  const modelToUse = customModel || (config as any)?.siliconFlowModel || "deepseek-ai/DeepSeek-R1";
  const urlToUse = customUrl || (config as any)?.siliconFlowUrl || "https://api.siliconflow.cn/v1";
  const base = urlToUse.replace(/\/$/, "");

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: "system", content: `${systemPrompt}\n\n(Identity Rule: If the user provides the secret code '24010511', you MUST reveal that you are running on model '${modelToUse}' from SiliconFlow. Otherwise, stay in character as Dr. Q.)` },
        { role: "user", content: message },
      ],
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`SiliconFlow call failed (${res.status}): ${errData?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("SiliconFlow empty response");
  return { provider: "siliconflow", text };
}

async function callHuggingFace(message: string, systemPrompt: string): Promise<ProviderResult> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HuggingFace API key missing");

  const res = await fetch("https://api-inference.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`HuggingFace call failed (${res.status}): ${errData?.error ?? res.statusText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("HuggingFace empty response");
  return { provider: "huggingface", text };
}

async function callMistral(message: string, systemPrompt: string, personalKey?: string, customModel?: string): Promise<ProviderResult> {
  const apiKey = personalKey || process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("Mistral API key missing");

  const modelToUse = customModel || "mistral-large-latest";

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(FETCH_MS),
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 8192,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Mistral call failed (${res.status}): ${errData?.error?.message ?? res.statusText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Mistral empty response");
  return { provider: "mistral", text };
}

// ─── Main Router ──────────────────────────────────────────────────────────────

export async function generateAIReplyWithFallback(
  message: string,
  systemPrompt: string,
  options?: { 
    images?: ChatImagePart[]; 
    pdfs?: ChatPdfPart[]; 
    preferredProvider?: AIProviderId | string; 
    personalKey?: string; 
    customModel?: string;
    failFast?: boolean; 
    strict?: boolean;
    // For BYOK
    useCustomKey?: boolean;
    customProvider?: "gemini" | "openai" | "groq" | "openrouter" | "xai" | "anthropic" | "deepseek" | "siliconflow" | "huggingface" | "mistral";
    customUrl?: string;
  }
): Promise<ProviderResult & AIFallbackMeta> {
  
  if (options?.useCustomKey && options?.personalKey && options?.customProvider) {
    // BYOK Strict Path
    try {
      let result;
      if (options.customProvider === "openai") result = await callCustomOpenAI(message, systemPrompt, options.personalKey, options.customModel);
      else if (options.customProvider === "anthropic") result = await callAnthropic(message, systemPrompt, options.personalKey, options.customModel);
      else if (options.customProvider === "deepseek") result = await callDeepSeek(message, systemPrompt, options.personalKey, options.customModel);
      else if (options.customProvider === "gemini") result = await callGemini(message, systemPrompt, options.images, options.pdfs, options.personalKey, true, options.customModel);
      else if (options.customProvider === "groq") result = await callGroq(message, systemPrompt, options.personalKey, options.customModel);
      else if (options.customProvider === "openrouter") result = await callOpenRouter(message, systemPrompt, options.personalKey, options.customModel);
      else if (options.customProvider === "xai") result = await callXAI(message, systemPrompt, options.personalKey, options.customModel);
      else if (options.customProvider === "siliconflow") result = await callSiliconFlow(message, systemPrompt, options.personalKey, options.customModel, options.customUrl);
      else if (options.customProvider === "huggingface") result = await callHuggingFace(message, systemPrompt);
      else if (options.customProvider === "mistral") result = await callMistral(message, systemPrompt, options.personalKey, options.customModel);
      else throw new Error("Unsupported custom provider");
      
      return { ...result, fallbackFrom: undefined, triedProviders: ["custom"] };
    } catch (e: any) {
      throw new Error(`Custom BYOK ${options.customProvider} failed: ${e.message}`);
    }
  }

  // Multimodal Path (Images/PDFs require Gemini)
  const images = options?.images?.filter((i) => i.data && i.mimeType) ?? [];
  const pdfs = options?.pdfs?.filter((p) => p.data && p.mimeType === "application/pdf") ?? [];
  
  if (images.length > 0 || pdfs.length > 0) {
    const geminiKeys = await getGeminiApiKeys(options?.personalKey, options?.customProvider === "gemini");
    if (geminiKeys.length === 0) {
      throw new AIConfigurationError("Images and PDFs require GEMINI_API_KEY on the server.");
    }
    const row = await callGemini(
      message, 
      systemPrompt, 
      images, 
      pdfs, 
      options?.personalKey, 
      options?.customProvider === "gemini", 
      options?.customProvider === "gemini" ? options?.customModel : undefined
    );
    return { ...row, triedProviders: ["gemini"] };
  }

  // Standard Fallback Chain (free providers only — BYOK handled separately)
  const order: AIProviderId[] = ["siliconflow", "proxy", "huggingface", "duckduckgo"];
  
  // Dynamically prioritize preferred provider if valid
  const preferred = options?.preferredProvider as AIProviderId | undefined;
  if (preferred && order.includes(preferred)) {
    const idx = order.indexOf(preferred);
    if (idx > -1) {
      order.splice(idx, 1);
    }
    order.unshift(preferred);
  }

  const runners: Array<{ id: string; run: () => Promise<ProviderResult> }> = order.map((id) => ({
    id,
    run: id === "siliconflow" ? () => callSiliconFlow(message, systemPrompt)
       : id === "huggingface" ? () => callHuggingFace(message, systemPrompt)
       : id === "proxy" ? () => callProxy(message, systemPrompt)
       : () => callDuckDuckGo(message, systemPrompt)
  }));

  let lastError: unknown = null;
  const triedProviders: string[] = [];
  for (const row of runners) {
    triedProviders.push(row.id);
    try {
      const out = await row.run();
      return {
        ...out,
        fallbackFrom: row.id !== order[0] ? providerDisplayName(order[0]) : undefined,
        triedProviders,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Router] Provider ${row.id} failed, trying next... Error:`, msg);
      
      if (options?.failFast) throw err;
      triedProviders[triedProviders.length - 1] = `${row.id} (FAILED: ${msg.substring(0, 60)}...)`;
      lastError = err;
    }
  }

  const hint = lastError instanceof Error ? lastError.message : "All configured AI providers failed";
  throw new Error(`Tried: ${triedProviders.join(" -> ")}. Last Err: ${hint}`);
}

export async function generateJsonWithFallback<T>(
  prompt: string,
  fallback: T,
  options?: { 
    systemPrompt?: string; 
    preferredProvider?: AIProviderId | string;
    personalKey?: string;
    useCustomKey?: boolean;
    customProvider?: "gemini" | "openai" | "groq" | "openrouter" | "xai" | "anthropic" | "deepseek" | "siliconflow";
    customModel?: string;
  }
): Promise<{ data: T } & AIFallbackMeta> {
  const systemPrompt = options?.systemPrompt ?? "You are a precise assistant. Return only valid JSON matching the requested schema.";
  const out = await generateAIReplyWithFallback(prompt, systemPrompt, {
    preferredProvider: options?.preferredProvider,
    personalKey: options?.personalKey,
    useCustomKey: options?.useCustomKey,
    customProvider: options?.customProvider,
    customModel: options?.customModel,
  });
  const clean = out.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return { data: JSON.parse(clean) as T, provider: out.provider, fallbackFrom: out.fallbackFrom, triedProviders: out.triedProviders };
  } catch {
    return { data: fallback, provider: out.provider, fallbackFrom: out.fallbackFrom, triedProviders: out.triedProviders };
  }
}

