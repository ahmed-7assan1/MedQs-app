import { decryptKey } from "@/lib/encryption";
import { PROVIDERS } from "@/lib/providers";

const WORKER_URL = process.env.WORKER_URL || "";
const WORKER_JWT_SECRET = process.env.WORKER_JWT_SECRET || "";

export interface WorkerPayload {
  provider: string;
  model: string;
  messages: { role: string; content: string }[];
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface WorkerResponse {
  content?: string;
  error?: string;
}

export async function forwardToWorker(
  endpoint: string,
  payload: WorkerPayload,
  jwtToken?: string
): Promise<WorkerResponse> {
  if (!WORKER_URL) {
    throw new Error("WORKER_URL not configured");
  }

  let token = jwtToken;
  if (!token && WORKER_JWT_SECRET) {
    const crypto = require("crypto");
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "medonex-server", iat: Math.floor(Date.now() / 1000) })).toString("base64url");
    const data = header + "." + payload;
    const sig = crypto.createHmac("sha256", WORKER_JWT_SECRET).update(data).digest("base64url");
    token = data + "." + sig;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${WORKER_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (res.status === 502 || res.status === 503) {
      console.warn(`Worker unavailable (${res.status}), falling back to direct call for provider: ${payload.provider}`);
      throw new Error("Worker unavailable");
    }

    const data: WorkerResponse = await res.json();
    return data;
  } catch (e: any) {
    if (e.name === "AbortError") {
      throw new Error("Worker request timed out");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callAIDirectly(
  provider: string,
  model: string,
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  const config = PROVIDERS[provider as keyof typeof PROVIDERS];
  if (!config || !config.baseURL) {
    throw new Error(`No baseURL configured for provider: ${provider}`);
  }

  if (provider === "gemini") {
    const url = `${config.baseURL}/models/${model}:generateContent?key=${apiKey}`;
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Gemini error");
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  const url = `${config.baseURL.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "API error");
  return data?.choices?.[0]?.message?.content || "";
}

export async function fetchWithFallback(
  userId: string,
  provider: string,
  model: string,
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  const start = Date.now();
  let success = false;
  let method = "worker";
  try {
    const result = await forwardToWorker("/v1/generate", {
      provider,
      model,
      messages,
      apiKey,
    });
    if (result.content) {
      success = true;
      return result.content;
    }
    throw new Error(result.error || "Empty response from worker");
  } catch (e: any) {
    method = "direct";
    console.warn(`Worker unavailable for ${provider}, using direct connection`, e.message);
    const text = await callAIDirectly(provider, model, messages, apiKey);
    success = true;
    return text;
  } finally {
    const duration = Date.now() - start;
    console.log(`[AI] userId=${userId} provider=${provider} model=${model} method=${method} duration=${duration}ms success=${success}`);
  }
}
