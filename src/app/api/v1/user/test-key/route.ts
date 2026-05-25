import { NextRequest, NextResponse } from "next/server";

type TestFn = (key: string) => Promise<true>;

const TESTS: Record<string, TestFn> = {
  gemini: async (key) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] }), signal: AbortSignal.timeout(10000) }
    );
    if (res.status === 429) throw new Error("Quota exceeded – key may be valid but rate-limited");
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  openai: async (key) => {
    const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  groq: async (key) => {
    const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  openrouter: async (key) => {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  anthropic: async (key) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "Hi" }] }), signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  xai: async (key) => {
    const res = await fetch("https://api.x.ai/v1/models", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  siliconflow: async (key) => {
    const res = await fetch("https://api.siliconflow.cn/v1/models", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  cloudflare: async (key) => {
    const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  huggingface: async (key) => {
    const res = await fetch("https://huggingface.co/api/whoami-v2", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  together: async (key) => {
    const res = await fetch("https://api.together.xyz/v1/models", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  github: async (key) => {
    const res = await fetch("https://models.inference.ai.azure.com/openai/models", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
  cerebras: async (key) => {
    const res = await fetch("https://api.cerebras.ai/v1/models", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message || `HTTP ${res.status}`);
    return true;
  },
};

export async function POST(req: NextRequest) {
  try {
    const { provider, key } = await req.json();
    if (!provider || !key) {
      return NextResponse.json({ ok: false, error: "provider and key required" }, { status: 400 });
    }
    const test = TESTS[provider as string];
    if (!test) {
      return NextResponse.json({ ok: false, error: `Unknown provider: ${provider}` }, { status: 400 });
    }
    await test(key as string);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Test failed" });
  }
}
