"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { syncAllThreadsToFirestore, subscribeToThreads, deleteThreadFromFirestore } from "@/lib/firebase/firestore";
import { getAIEndpoint } from "@/lib/api-config";
import { getCachedResponse, setCachedResponse, getDirectReply } from "@/lib/chat-cache";
import {
  assignRoles,
  getRolePrompt,
  getAnalyzerPrompt,
  getSynthesisPrompt,
  createStep,
  SuperExpertProgress,
  SuperExpertStep,
  ProviderAssignment,
  SuperExpertRole,
} from "@/lib/super-expert";
import { checkProviderRate, recordProviderRequest } from "@/lib/rate-limits";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FileAttachment = {
  data: string;       // base64 data URL OR raw text
  mimeType: string;
  name: string;
  size?: number;
  loading?: boolean;  // true while FileReader is processing
};

export type MessageReaction = "like" | "dislike" | null;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: FileAttachment[];
  reaction?: MessageReaction;
  replyTo?: string;   // id of message being replied to
  isStreaming?: boolean;
  timestamp: number;
};

export type Thread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinnedProvider?: string;
};

export type AIProvider = "gemini" | "groq" | "siliconflow" | "cloudflare" | "huggingface" | "together" | "openrouter" | "ovhcloud" | "github" | "cerebras" | "mistral";

export type BYOKKeys = {
  gemini?: string[];
  groq?: string[];
  siliconflow?: string[];
  cloudflare?: string[];
  huggingface?: string[];
  together?: string[];
  openrouter?: string[];
  ovhcloud?: string[];
  github?: string[];
  cerebras?: string[];
  mistral?: string[];
};

export type DrQSettings = {
  byokKeys: BYOKKeys;
  activeProvider: AIProvider;
  activeModels: Partial<Record<AIProvider, string[]>>;
  activePersona: string;
  smartEngineEnabled?: boolean;
  superExpertEnabled?: boolean;
  fontSize: number;
  userBubbleColor: string;
  aiBubbleColor: string;
  bgImage?: string;
  bgBlur?: number;
  bgOpacity?: number;
};

export type UsageLimits = {
  used: number;
  limit: number;
  filesUsed: number;
  fileLimit: number;
  rankLabel: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SETTINGS_KEY = "medqs-drq-settings-v4";
const THREADS_KEY  = "medqs-drq-threads-v4";
const ACTIVE_THREAD_KEY = "medqs-drq-active-thread";
const STREAM_TIMEOUT = 60000;

export const PROVIDER_CONFIGS: Record<AIProvider, {
  label: string;
  defaultModel: string;
  models: string[];
  baseURL?: string;
  icon: string;
  keyUrl: string;
  needsKey?: boolean;
}> = {
  gemini: {
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash-lite",
    models: [
      "gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash",
    ],
    icon: "G",
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  groq: {
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile", "llama-3.1-8b-instant",
      "meta-llama/llama-4-scout-17b-16e-instruct", "qwen/qwen3-32b",
      "openai/gpt-oss-120b", "openai/gpt-oss-20b", "allam-2-7b",
    ],
    baseURL: "https://api.groq.com/openai/v1",
    icon: "⚡",
    keyUrl: "https://console.groq.com/keys",
  },
  siliconflow: {
    label: "SiliconFlow (DeepSeek)",
    defaultModel: "deepseek-ai/DeepSeek-R1",
    models: [
      "deepseek-ai/DeepSeek-R1", "deepseek-ai/DeepSeek-V3",
      "Qwen/Qwen2.5-72B-Instruct", "Qwen/Qwen2.5-32B-Instruct", "Qwen/Qwen2.5-14B-Instruct", "Qwen/Qwen2.5-7B-Instruct",
      "Qwen/Qwen2.5-Coder-32B-Instruct", "Qwen/Qwen2.5-Coder-7B-Instruct",
      "Qwen/Qwen2-VL-72B-Instruct", "Qwen/Qwen2-VL-7B-Instruct",
      "meta-llama/Llama-3.3-70B-Instruct", "meta-llama/Llama-3.1-8B-Instruct",
      "mistralai/Mixtral-8x22B-Instruct-v0.1", "mistralai/Mistral-7B-Instruct-v0.3",
      "THUDM/glm-4-9b-chat", "internlm/internlm2_5-20b-chat",
      "microsoft/Phi-3.5-mini-instruct", "BAAI/bge-large-zh-v1.5",
    ],
    baseURL: "https://api.siliconflow.cn/v1",
    icon: "🌀",
    keyUrl: "https://cloud.siliconflow.cn/",
  },
  cloudflare: {
    label: "Cloudflare Workers AI",
    defaultModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    models: [
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      "@cf/meta/llama-3.1-8b-instruct",
      "@cf/mistral/mistral-7b-instruct-v0.1",
      "@cf/google/gemma-2-27b-it",
      "@hf/nousresearch/hermes-2-pro-llama-3-8b",
    ],
    baseURL: "https://api.cloudflare.com/client/v4/accounts",
    icon: "☁",
    keyUrl: "https://developers.cloudflare.com/workers-ai/get-started/",
  },
  huggingface: {
    label: "Hugging Face",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "google/gemma-2-27b-it",
      "Qwen/Qwen2.5-72B-Instruct",
      "microsoft/Phi-3-medium-4k-instruct",
    ],
    baseURL: "https://api-inference.huggingface.co/v1",
    icon: "🤗",
    keyUrl: "https://huggingface.co/settings/tokens",
  },
  together: {
    label: "Together AI",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "meta-llama/Llama-3.1-8B-Instruct-Turbo",
      "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
      "deepseek-ai/DeepSeek-V3",
    ],
    baseURL: "https://api.together.xyz/v1",
    icon: "◆",
    keyUrl: "https://api.together.ai/settings/api-keys",
  },
  openrouter: {
    label: "OpenRouter",
    defaultModel: "openrouter/free",
    models: [
      "openrouter/free",
      "deepseek/deepseek-v4-flash:free",
      "google/gemma-4-26b-a4b-it:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "minimax/minimax-m2.5:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      "arcee-ai/trinity-large-thinking:free",
      "poolside/laguna-m.1:free",
      "baidu/cobuddy:free",
      "liquid/lfm-2.5-1.2b-thinking:free",
    ],
    baseURL: "https://openrouter.ai/api/v1",
    icon: "⊜",
    keyUrl: "https://openrouter.ai/keys",
  },
  ovhcloud: {
    label: "OVHcloud",
    defaultModel: "Meta-Llama-3_3-70B-Instruct",
    models: [
      "Meta-Llama-3_3-70B-Instruct",
      "gpt-oss-120b",
      "Qwen3-32B",
      "Qwen3.5-397B-A17B",
      "Qwen3-Coder-30B-A3B-Instruct",
      "Mistral-7B-Instruct-v0.3",
      "Mistral-Small-3.2-24B-Instruct-2506",
      "Mistral-Nemo-Instruct-2407",
      "Llama-3.1-8B-Instruct",
      "Qwen2.5-VL-72B-Instruct",
    ],
    baseURL: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
    icon: "☁",
    keyUrl: "https://endpoints.ai.cloud.ovh.net/",
    needsKey: false,
  },
  github: {
    label: "GitHub Models",
    defaultModel: "gpt-4o",
    models: [
      "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "gpt-5",
      "o4-mini",
      "Meta-Llama-3.3-70B-Instruct",
      "Llama-4-Scout-17B-16E",
      "Llama-4-Maverick-17B-128E",
      "DeepSeek-R1",
      "Mistral-Small-3.1-24B-Instruct-2506",
    ],
    baseURL: "https://models.github.ai/inference",
    icon: "◇",
    keyUrl: "https://github.com/settings/tokens",
  },
  cerebras: {
    label: "Cerebras",
    defaultModel: "llama-3.3-70b",
    models: [
      "llama-3.3-70b",
      "gpt-oss-120b",
      "qwen-3-32b",
      "qwen-3-235b-a22b-instruct-2507",
      "llama-4-scout-17b-16e-instruct",
      "zai-glm-4.7",
    ],
    baseURL: "https://api.cerebras.ai/v1",
    icon: "⚙",
    keyUrl: "https://cloud.cerebras.ai/",
  },
  mistral: {
    label: "Mistral AI",
    defaultModel: "mistral-large-latest",
    models: [
      "mistral-large-latest", "mistral-small-latest", "open-mistral-nemo", "codestral-latest",
    ],
    baseURL: "https://api.mistral.ai/v1",
    icon: "◆",
    keyUrl: "https://console.mistral.ai/api-keys/",
  },
};

// ─── Smart Model Selector ──────────────────────────────────────────────────────

type ModelTier = "tiny" | "small" | "medium" | "large";

interface ProviderModelTiers {
  tiny: string[];
  small: string[];
  medium: string[];
  large: string[];
}

const MODEL_TIERS: Partial<Record<AIProvider, ProviderModelTiers>> = {
  gemini: {
    tiny: ["gemini-2.5-flash-lite"],
    small: ["gemini-2.5-flash-lite"],
    medium: ["gemini-2.5-flash"],
    large: ["gemini-2.5-flash"],
  },
  groq: {
    tiny: ["allam-2-7b"],
    small: ["openai/gpt-oss-20b", "llama-3.1-8b-instant"],
    medium: ["meta-llama/llama-4-scout-17b-16e-instruct", "qwen/qwen3-32b"],
    large: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"],
  },
  siliconflow: {
    tiny: ["Qwen/Qwen2.5-Coder-7B-Instruct", "microsoft/Phi-3.5-mini-instruct"],
    small: ["Qwen/Qwen2.5-7B-Instruct", "Qwen/Qwen2.5-Coder-7B-Instruct"],
    medium: ["Qwen/Qwen2.5-14B-Instruct", "Qwen/Qwen2.5-32B-Instruct", "Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-V3"],
    large: ["deepseek-ai/DeepSeek-R1", "meta-llama/Llama-3.3-70B-Instruct"],
  },
  cloudflare: {
    tiny: ["@cf/meta/llama-3.1-8b-instruct"],
    small: ["@cf/meta/llama-3.1-8b-instruct", "@hf/nousresearch/hermes-2-pro-llama-3-8b"],
    medium: ["@cf/mistral/mistral-7b-instruct-v0.1", "@cf/google/gemma-2-27b-it"],
    large: ["@cf/meta/llama-3.3-70b-instruct-fp8-fast"],
  },
  huggingface: {
    tiny: ["microsoft/Phi-3-medium-4k-instruct"],
    small: ["mistralai/Mistral-7B-Instruct-v0.3", "microsoft/Phi-3-medium-4k-instruct"],
    medium: ["google/gemma-2-27b-it", "Qwen/Qwen2.5-72B-Instruct"],
    large: ["meta-llama/Llama-3.3-70B-Instruct"],
  },
  together: {
    tiny: ["meta-llama/Llama-3.1-8B-Instruct-Turbo"],
    small: ["meta-llama/Llama-3.1-8B-Instruct-Turbo"],
    medium: ["mistralai/Mixtral-8x22B-Instruct-v0.1", "Qwen/Qwen2.5-72B-Instruct-Turbo", "deepseek-ai/DeepSeek-V3"],
    large: ["meta-llama/Llama-3.3-70B-Instruct-Turbo"],
  },
  openrouter: {
    tiny: ["nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "liquid/lfm-2.5-1.2b-thinking:free", "baidu/cobuddy:free"],
    small: ["poolside/laguna-m.1:free", "arcee-ai/trinity-large-thinking:free"],
    medium: ["google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-3-super-120b-a12b:free", "minimax/minimax-m2.5:free"],
    large: ["deepseek/deepseek-v4-flash:free", "google/gemma-4-31b-it:free", "openrouter/free"],
  },
  ovhcloud: {
    tiny: ["Mistral-7B-Instruct-v0.3"],
    small: ["Llama-3.1-8B-Instruct", "Mistral-Small-3.2-24B-Instruct-2506"],
    medium: ["Qwen3-32B", "gpt-oss-120b"],
    large: ["Meta-Llama-3_3-70B-Instruct", "Qwen3.5-397B-A17B"],
  },
  github: {
    tiny: ["gpt-4.1-mini", "Mistral-Small-3.1-24B-Instruct-2506"],
    small: ["gpt-4.1", "gpt-4o"],
    medium: ["o4-mini", "gpt-5"],
    large: ["gpt-4o", "DeepSeek-R1"],
  },
  cerebras: {
    tiny: ["zai-glm-4.7"],
    small: ["qwen-3-32b"],
    medium: ["llama-4-scout-17b-16e-instruct", "llama-3.3-70b"],
    large: ["gpt-oss-120b", "qwen-3-235b-a22b-instruct-2507"],
  },
  mistral: {
    tiny: ["open-mistral-nemo"],
    small: ["mistral-small-latest"],
    medium: ["mistral-large-latest"],
    large: ["mistral-large-latest"],
  },
};

function selectSmartModel(provider: AIProvider, content: string, persona: string, conversationDepth: number): string {
  const tiers = MODEL_TIERS[provider];
  if (!tiers) return PROVIDER_CONFIGS[provider].defaultModel;

  const lower = content.trim().toLowerCase();
  // Quiz always needs best quality
  if (persona === "quiz") return tiers.large[0] || tiers.medium[0] || PROVIDER_CONFIGS[provider].defaultModel;
  // Greetings / very short
  if (lower.length < 30 || /^(hi|hello|hey|thanks|thx|شكرا|هلا|مرحبا|تمام|ok|okay|yes|no|yep|nope|👍|✅|😊|🙏|good|great|nice|ko|k)$/i.test(lower)) {
    return tiers.tiny[0] || tiers.small[0] || PROVIDER_CONFIGS[provider].defaultModel;
  }
  // Short follow-ups
  if (lower.length < 150 && conversationDepth > 0) return tiers.small[0] || tiers.medium[0] || PROVIDER_CONFIGS[provider].defaultModel;
  // Medium questions
  if (lower.length < 600) return tiers.medium[0] || tiers.large[0] || PROVIDER_CONFIGS[provider].defaultModel;
  // Complex / long
  return tiers.large[0] || PROVIDER_CONFIGS[provider].defaultModel;
}

// ─── Auto-Fallback ──────────────────────────────────────────────────────────

const FALLBACK_ORDER: AIProvider[] = [
  "ovhcloud",
  "openrouter",
  "gemini",
  "groq",
  "github",
  "cerebras",
  "siliconflow",
  "together",
  "cloudflare",
  "huggingface",
  "mistral",
];

export function getFirstKey(byokKeys: BYOKKeys, p: AIProvider): string | undefined {
  const k = byokKeys[p];
  return Array.isArray(k) ? k.find(kk => kk) : (k || undefined);
}

export function getActiveModels(activeModels: Partial<Record<AIProvider, string[]>>, provider: AIProvider): string[] {
  return activeModels[provider]?.length ? activeModels[provider]! : [PROVIDER_CONFIGS[provider]?.defaultModel].filter(Boolean);
}

export function getFirstModel(activeModels: Partial<Record<AIProvider, string[]>>, provider: AIProvider): string {
  const models = getActiveModels(activeModels, provider);
  return models[0] || PROVIDER_CONFIGS[provider]?.defaultModel || "";
}

function findFallbackProvider(byokKeys: BYOKKeys, exclude: AIProvider, prefer?: AIProvider): AIProvider | null {
  const hasKey = (p: AIProvider) => getFirstKey(byokKeys, p) || PROVIDER_CONFIGS[p]?.needsKey === false;
  if (prefer && prefer !== exclude && hasKey(prefer)) return prefer;
  for (const p of FALLBACK_ORDER) {
    if (p !== exclude && hasKey(p)) return p;
  }
  return null;
}

function findFirstAvailableProvider(byokKeys: BYOKKeys): AIProvider | null {
  for (const p of FALLBACK_ORDER) {
    if (getFirstKey(byokKeys, p) || PROVIDER_CONFIGS[p]?.needsKey === false) return p;
  }
  return null;
}

function migrateSettings(parsed: any): DrQSettings {
  // Migrate old single-key format → new array format
  const bk = parsed.byokKeys || {};
  const migrated: any = {};
  for (const p of Object.keys(bk)) {
    const v = bk[p];
    if (typeof v === "string" && v) migrated[p] = [v];
    else if (Array.isArray(v)) migrated[p] = v.filter(Boolean);
  }
  // Migrate old activeModel → activeModels
  let activeModels: Partial<Record<AIProvider, string[]>> = parsed.activeModels || {};
  if (parsed.activeModel && typeof parsed.activeModel === "string") {
    const p = parsed.activeProvider as AIProvider;
    if (!activeModels[p]) {
      activeModels = { ...activeModels, [p]: [parsed.activeModel] };
    }
  }
  // Ensure every provider with keys has at least its default model selected
  for (const p of Object.keys(migrated) as AIProvider[]) {
    if (!activeModels[p]?.length && PROVIDER_CONFIGS[p]) {
      activeModels[p] = [PROVIDER_CONFIGS[p].defaultModel];
    }
  }
  return { ...parsed, byokKeys: migrated, activeModels };
}

const DEFAULT_SETTINGS: DrQSettings = {
  byokKeys: {},
  activeProvider: "gemini",
  activeModels: {},
  activePersona: "explainer",
  fontSize: 15,
  userBubbleColor: "#6d28d9",
  aiBubbleColor: "#1a1830",
  bgImage: "",
  bgBlur: 0,
  bgOpacity: 0.15,
  superExpertEnabled: false,
};

// ─── Streaming Client Helpers ─────────────────────────────────────────────────

type MessageForAPI = { role: "user" | "assistant" | "system"; content: string };

async function streamGemini(
  apiKey: string,
  model: string,
  messages: MessageForAPI[],
  files: FileAttachment[],
  onChunk: (text: string) => void,
  webSearch?: boolean,
  signal?: AbortSignal
): Promise<string> {
  const sysMsg = messages.find(m => m.role === "system");
  const nonSystem = messages.filter(m => m.role !== "system");

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelOpts: any = { model };
  if (sysMsg) modelOpts.systemInstruction = sysMsg.content;
  if (webSearch) modelOpts.tools = [{ googleSearch: {} }];
  const mdl = genAI.getGenerativeModel(modelOpts);

  const history = nonSystem.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = mdl.startChat({ history });

  const lastMsg = nonSystem[nonSystem.length - 1] || messages[messages.length - 1];
  const parts: any[] = [{ text: lastMsg.content || "" }];

  for (const f of files) {
    if (f.mimeType.startsWith("image/") || f.mimeType === "application/pdf" || f.mimeType.includes("presentation")) {
      const base64 = f.data.split(",")[1];
      parts.push({ inlineData: { mimeType: f.mimeType, data: base64 } });
    } else {
      const textContent = atob(f.data.split(",")[1] || f.data);
      parts.push({ text: `\n\n[File: ${f.name}]\n${textContent}` });
    }
  }

  const result = await chat.sendMessageStream(parts, { signal: signal ?? AbortSignal.timeout(STREAM_TIMEOUT) });
  let full = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    full += text;
    onChunk(full);
  }
  return full;
}

async function streamOpenAICompat(
  apiKey: string,
  baseURL: string,
  model: string,
  messages: MessageForAPI[],
  files: FileAttachment[],
  onChunk: (text: string) => void,
  webSearch?: boolean,
  skipAuth?: boolean,
  signal?: AbortSignal
): Promise<string> {
  let searchContext = "";
  if (webSearch) {
    try {
      const lastMsg = messages[messages.length - 1];
      const searchRes = await fetch("/api/v1/ai/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: lastMsg.content }),
      });
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.results) searchContext = `\n\n[WEB SEARCH RESULTS]\n${data.results}\n[/WEB SEARCH RESULTS]\n`;
      }
    } catch {}
  }

  // Build messages with vision support
  const apiMessages: any[] = messages.map((m, idx) => {
    const isLast = idx === messages.length - 1;
    const text = isLast && searchContext ? m.content + searchContext : m.content;
    if (isLast && files.length > 0) {
      const content: any[] = [{ type: "text", text: text || " " }];
      for (const f of files) {
        if (f.mimeType.startsWith("image/")) {
          content.push({ type: "image_url", image_url: { url: f.data } });
        } else {
          const textContent = (() => {
            try { return atob(f.data.split(",")[1] || ""); } catch { return f.name; }
          })();
          content.push({ type: "text", text: `\n\n[File: ${f.name}]\n${textContent}` });
        }
      }
      return { role: m.role, content };
    }
    return { role: m.role, content: text };
  });

  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(skipAuth ? {} : { "Authorization": `Bearer ${apiKey}` }),
      ...(baseURL.includes("openrouter") || baseURL.includes("ovh") ? {
        "HTTP-Referer": window.location.origin,
        "X-Title": "MedOneX Dr. Q"
      } : {}),
    },
    body: JSON.stringify({ model, messages: apiMessages, stream: true, max_tokens: 4096 }),
    signal: signal ?? AbortSignal.timeout(STREAM_TIMEOUT),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${resp.status}`);
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onChunk(full);
        }
      } catch {}
    }
  }
  return full;
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function useDrQChat() {
  const { user: authUser } = useAuth();
  const userId = authUser?.id;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [deletedThreadIds, setDeletedThreadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<DrQSettings>(DEFAULT_SETTINGS);
  const [limits, setLimits] = useState<UsageLimits>({
    used: 0, limit: 100, filesUsed: 0, fileLimit: 10, rankLabel: "Student"
  });
  const [syllabusContext, setSyllabusContext] = useState<string>("");
  const [superExpertStatus, setSuperExpertStatus] = useState<SuperExpertProgress | null>(null);

  const abortRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const superExpertControllersRef = useRef<AbortController[]>([]);

  // ─── RAF-batched streaming refs ───
  const pendingContentRef = useRef<string>("");
  const rafIdRef = useRef<number>(0);
  const streamingActiveRef = useRef<boolean>(false);

  // Load syllabus context — user-specific modules
  useEffect(() => {
    const loadSyllabus = async () => {
      try {
        const res = await fetch("/api/v1/user/syllabus");
        if (res.ok) {
          const data = await res.json();
          if (data?.modules && Array.isArray(data.modules) && data.modules.length > 0) {
            let ctx = "Your enrolled modules on MedOneX:\n";
            data.modules.forEach((mod: any) => {
              ctx += `- Module: ${mod.name}\n`;
              if (Array.isArray(mod.subjects)) {
                mod.subjects.forEach((sub: any) => {
                  ctx += `  * Subject: ${sub.name}\n`;
                  if (Array.isArray(sub.lectures)) {
                    sub.lectures.forEach((lec: any) => {
                      ctx += `    - Lecture: ${lec.title}\n`;
                    });
                  }
                });
              }
            });
            setSyllabusContext(ctx);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to load user syllabus for DrQ", err);
      }
      // Fallback: minimal context
      setSyllabusContext("");
    };
    loadSyllabus();
  }, []);

  // Load from localStorage initially
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (!PROVIDER_CONFIGS[parsed.activeProvider as AIProvider]) {
          parsed.activeProvider = DEFAULT_SETTINGS.activeProvider;
        }
        setSettings(migrateSettings({ ...DEFAULT_SETTINGS, ...parsed }));
      }

      const storedThreads = localStorage.getItem(THREADS_KEY);
      if (storedThreads) {
        const parsed: Thread[] = JSON.parse(storedThreads);
        setThreads(parsed);
        const lastActiveId = localStorage.getItem(ACTIVE_THREAD_KEY);
        if (lastActiveId && parsed.find(t => t.id === lastActiveId)) {
          setActiveThreadId(lastActiveId);
        } else if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        }
      }

      const storedDeleted = localStorage.getItem("medqs-drq-deleted-threads-v4");
      if (storedDeleted) {
        setDeletedThreadIds(JSON.parse(storedDeleted));
      }
    } catch {}
    fetchLimits();
  }, []);

  // Fetch BYOK keys from server (cross-device sync)
  useEffect(() => {
    if (!userId) return;
    fetch("/api/v1/user/byok-keys").then(r => r.json()).then(data => {
      if (data?.keys) {
        setSettings(prev => {
          const merged = { ...prev, byokKeys: { ...data.keys, ...prev.byokKeys } };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(() => {});
  }, [userId]);

  // Save BYOK keys to server whenever they change
  const saveToServerRef = useRef<((keys: BYOKKeys) => void) | null>(null);
  saveToServerRef.current = (keys: BYOKKeys) => {
    if (!userId) return;
    fetch("/api/v1/user/byok-keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
    }).catch(() => {});
  };


  // Subscribe to Firestore for cross-device sync
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToThreads(userId, (firestoreThreads) => {
      const activeFirestoreThreads = firestoreThreads.filter(t => !deletedThreadIds.includes(t.id));

      setThreads(prev => {
        let changed = false;
        
        // Map over local threads and update if Firestore has a strictly newer version
        const merged = prev.map(lThread => {
          const fThread = activeFirestoreThreads.find(t => t.id === lThread.id);
          if (fThread && fThread.updatedAt > lThread.updatedAt) {
            changed = true;
            return fThread;
          }
          return lThread;
        });

        // Add new threads from Firestore that don't exist locally
        const newFromFirestore = activeFirestoreThreads.filter(fThread => !prev.some(t => t.id === fThread.id));
        if (newFromFirestore.length > 0) {
          if (prev.length === 0) {
            // Initial load from empty state
            changed = true;
            merged.push(...newFromFirestore);
          } else {
            // Only add if they are very recent (e.g. updated in the last 15 minutes) to avoid restoring deleted ones
            const now = Date.now();
            const recent = newFromFirestore.filter(f => (now - f.updatedAt) < 15 * 60 * 1000);
            if (recent.length > 0) {
              changed = true;
              merged.push(...recent);
            }
          }
        }

        if (changed) {
          merged.sort((a, b) => b.updatedAt - a.updatedAt);
          localStorage.setItem(THREADS_KEY, JSON.stringify(merged));
          return merged;
        }
        return prev;
      });
    });
    return () => unsubscribe();
  }, [userId, deletedThreadIds]);

  // Save threads to localStorage & Debounced sync to Firestore
  const saveThreads = useCallback((newThreads: Thread[]) => {
    setThreads(newThreads);
    localStorage.setItem(THREADS_KEY, JSON.stringify(newThreads));
  }, []);

  useEffect(() => {
    if (!userId || threads.length === 0 || loading) return;
    const timeoutId = setTimeout(() => {
      syncAllThreadsToFirestore(userId, threads);
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [threads, userId, loading]);

  // Abort any in-flight generation on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchLimits = async () => {
    try {
      const res = await fetch(getAIEndpoint("/api/v1/ai/chat"));
      if (res.ok) {
        const data = await res.json();
        setLimits({ used: data.used, limit: data.limit, filesUsed: data.filesUsed ?? 0, fileLimit: data.fileLimit ?? 10, rankLabel: data.rankLabel ?? "Student" });
      }
    } catch {}
  };

  // ─── Thread Management ──────────────────────────────────────────────────────

  const activeThread = threads.find(t => t.id === activeThreadId) ?? null;
  const messages = activeThread?.messages ?? [];

  const newThread = useCallback(() => {
    const id = `thread-${Date.now()}`;
    const thread: Thread = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [thread, ...threads];
    saveThreads(updated);
    setActiveThreadId(id);
    localStorage.setItem(ACTIVE_THREAD_KEY, id);
    return id;
  }, [threads, saveThreads]);

  const switchThread = useCallback((id: string) => {
    setActiveThreadId(id);
    localStorage.setItem(ACTIVE_THREAD_KEY, id);
  }, []);

  const deleteThread = useCallback((id: string) => {
    const updated = threads.filter(t => t.id !== id);
    saveThreads(updated);
    setDeletedThreadIds(prev => {
      const next = [...prev, id];
      localStorage.setItem("medqs-drq-deleted-threads-v4", JSON.stringify(next));
      return next;
    });
    if (userId) {
      deleteThreadFromFirestore(userId, id);
    }
    if (activeThreadId === id) {
      const next = updated[0]?.id ?? null;
      setActiveThreadId(next);
      if (next) localStorage.setItem(ACTIVE_THREAD_KEY, next);
    }
  }, [threads, saveThreads, activeThreadId, userId]);

  const renameThread = useCallback((id: string, title: string) => {
    saveThreads(threads.map(t => t.id === id ? { ...t, title } : t));
  }, [threads, saveThreads]);

  const clearThread = useCallback((id?: string) => {
    const target = id ?? activeThreadId;
    if (!target) return;
    saveThreads(threads.map(t => t.id === target ? { ...t, messages: [], updatedAt: Date.now() } : t));
  }, [threads, saveThreads, activeThreadId]);

  // ─── Settings ───────────────────────────────────────────────────────────────

  const updateSettings = useCallback((updated: Partial<DrQSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updated, byokKeys: { ...prev.byokKeys, ...(updated.byokKeys ?? {}) } };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      if (updated.byokKeys) {
        saveToServerRef.current?.(next.byokKeys);
      }
      return next;
    });
  }, []);

  // ─── Message Reactions ──────────────────────────────────────────────────────

  const setReaction = useCallback((msgId: string, reaction: MessageReaction) => {
    if (!activeThreadId) return;
    saveThreads(threads.map(t => t.id === activeThreadId
      ? { ...t, messages: t.messages.map(m => m.id === msgId ? { ...m, reaction } : m) }
      : t
    ));
  }, [threads, saveThreads, activeThreadId]);

  // ─── Export ─────────────────────────────────────────────────────────────────

  const exportThread = useCallback((format: "markdown" | "json" | "txt") => {
    if (!activeThread) return;
    let content = "";
    if (format === "json") {
      content = JSON.stringify(activeThread, null, 2);
    } else {
      content = `# ${activeThread.title}\n\n`;
      for (const m of activeThread.messages) {
        const who = m.role === "user" ? "**You**" : "**Dr. Q**";
        content += `${who}\n\n${m.content}\n\n---\n\n`;
      }
    }
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DrQ_${activeThread.title.replace(/\s+/g, "_")}.${format === "json" ? "json" : "md"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported!");
  }, [activeThread]);

  // ─── Send Message ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string, files: FileAttachment[] = [], replyToId?: string, webSearch?: boolean) => {
      if (!content.trim() && files.length === 0) return;
      if (loading) return;

      // Ensure we have an active thread
      let threadId = activeThreadId;
      if (!threadId) {
        threadId = `thread-${Date.now()}`;
        const thread: Thread = {
          id: threadId,
          title: content.slice(0, 40) || "New Chat",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const updated = [thread, ...threads];
        saveThreads(updated);
        setActiveThreadId(threadId);
        localStorage.setItem(ACTIVE_THREAD_KEY, threadId);
      }

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        files: files.length > 0 ? files : undefined,
        replyTo: replyToId,
        timestamp: Date.now(),
      };

      const aiMsgId = `ai-${Date.now() + 1}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
        timestamp: Date.now() + 1,
      };

      // Update thread with both new messages
      const updateThread = (newMessages: ChatMessage[]) => {
        setThreads(prev => {
          const updated = prev.map(t => t.id === threadId
            ? {
                ...t,
                messages: newMessages,
                updatedAt: Date.now(),
                title: t.title === "New Chat" && content.trim()
                  ? content.slice(0, 45) + (content.length > 45 ? "..." : "")
                  : t.title,
              }
            : t
          );
          localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
          return updated;
        });
      };

      const currentMessages = threads.find(t => t.id === threadId)?.messages ?? [];
      const nextMessages = [...currentMessages, userMsg, aiMsg];
      updateThread(nextMessages);
      setLoading(true);
      setStreamingId(aiMsgId);
      abortRef.current = false;

      const { activeProvider, activeModels, byokKeys, activePersona } = settings;

      // ─── Direct Reply for Greetings ───
      if (!files.length && !replyToId) {
        const directReply = getDirectReply(content);
        if (directReply) {
          setThreads(prev => {
            const updated = prev.map(t => t.id === threadId
              ? { ...t, messages: t.messages.map(m => m.id === aiMsgId ? { ...m, content: directReply, isStreaming: false } : m) }
              : t
            );
            localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
            return updated;
          });
          setLoading(false);
          setStreamingId(null);
          return;
        }

        // ─── IndexedDB Cache Lookup ───
        const cached = await getCachedResponse(content, activePersona, getFirstModel(activeModels, activeProvider));
        if (cached) {
          setThreads(prev => {
            const updated = prev.map(t => t.id === threadId
              ? { ...t, messages: t.messages.map(m => m.id === aiMsgId ? { ...m, content: cached, isStreaming: false } : m) }
              : t
            );
            localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
            return updated;
          });
          setLoading(false);
          setStreamingId(null);
          return;
        }
      }

      let effectiveProvider: AIProvider = activeProvider;
      try {
        effectiveProvider = activeProvider;
        const providerKeys = byokKeys[effectiveProvider];
        let apiKey = Array.isArray(providerKeys) ? (providerKeys.find(k => k) || "") : (typeof providerKeys === "string" ? providerKeys : "");
        const needsKey = PROVIDER_CONFIGS[effectiveProvider]?.needsKey !== false;

        if (!apiKey && needsKey) {
          const fallback = findFirstAvailableProvider(byokKeys);
          if (fallback) {
            const reason = `No API key set for ${PROVIDER_CONFIGS[effectiveProvider].label}`;
            effectiveProvider = fallback;
            const fbKeys = byokKeys[fallback];
            apiKey = Array.isArray(fbKeys) ? (fbKeys.find(k => k) || "") : (typeof fbKeys === "string" ? fbKeys : "");
            const label = PROVIDER_CONFIGS[fallback].label;
            toast.success(`🔄 Auto-switched to ${label}: ${reason}`);
            updateSettings({ activeProvider: fallback, activeModels: { ...settings.activeModels, [fallback]: [PROVIDER_CONFIGS[fallback].defaultModel] } });
          } else {
            toast.error("No API keys configured. Get a free key from OpenRouter (no credit card needed) or add one in Settings.");
            setThreads(prev => {
              const updated = prev.map(t => t.id === threadId
                ? { ...t, messages: t.messages.filter(m => m.id !== aiMsgId) }
                : t
              );
              localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
              return updated;
            });
            setLoading(false);
            setStreamingId(null);
            return;
          }
        }

        // 0. Fetch founder LinkedIn from site data
        let founderLinkedIn = "";
        try {
          const founderRes = await fetch("/api/v1/platform-members");
          if (founderRes.ok) {
            const founders = await founderRes.json();
            // Find the main founder (Dr. Ahmed) — first member or by name
            const drAhmed = Array.isArray(founders) ? founders[0] : null;
            if (drAhmed?.socialUrl) founderLinkedIn = drAhmed.socialUrl;
          }
        } catch {}

        // 1. Persona & Context Injection
        let systemPrompt = "";
        try {
          const { DRQ_PERSONAS } = require("@/components/ai/DrQPersonas");
          const persona = DRQ_PERSONAS[activePersona] || DRQ_PERSONAS.explainer;
          systemPrompt = persona.systemPrompt;
          
          // User Context  
          const userName = (authUser as any)?.user_metadata?.name || "Student";
          const userUni = (authUser as any)?.user_metadata?.universityName || "Medical University";
          const userFaculty = (authUser as any)?.user_metadata?.facultyName || "Faculty of Medicine";
          
          // MedOneX Identity Context (concise for token efficiency)
          systemPrompt = `You are MedOneX Expert AI — a medical AI tutor on medonex.app. Speak in the user's language (Arabic/English). Keep medical terms in English (e.g. "Inflammation في الـ Liver"). Stay on medical topics. Be concise.

CREATOR: Dr. Ahmed Mohamed Hassan (أحمد محمد حسان — with alif).${founderLinkedIn ? ` LinkedIn: ${founderLinkedIn}` : ""}

FORMATS:
- MCQ: :::question {"questionType":"MCQ","body":"...","choices":[{"key":"A","text":"..."}],"answer":"A","explanation":"..."} :::
- Flashcard: :::flashcard {"front":"...","back":"..."} :::
- Images: Include ![short English description](image:the-image-topic) — our system will auto-fetch a real image
- Web search available for recent info.

${systemPrompt}`;

          systemPrompt += `\n\nUser: ${userName}, ${userFaculty} student at ${userUni}. Greet them by name.`;
        } catch (e) {
          systemPrompt = "You are Dr. Q, a helpful medical AI assistant.";
        }

        // Inject syllabus context (only on syllabus-related questions)
        if (syllabusContext) {
          const syllabusKeywords = ['module', 'lecture', 'syllabus', 'curriculum', 'subject', 'topic', 'study',
            'منهج', 'محاضرة', 'مادة', 'درس', 'مقرر', 'موديول'];
          const lower = content.toLowerCase();
          if (syllabusKeywords.some(k => lower.includes(k))) {
            systemPrompt += `\n\nSyllabus: ${syllabusContext}`;
          }
        }

        let enhancedHistory: MessageForAPI[] = [
          { role: 'system', content: systemPrompt },
          ...currentMessages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: content }
        ];

        // 1. Site Data Context Injection (Dynamic)
        const lowerContent = content.toLowerCase();
        const dataKeywords = ['course', 'exam', 'score', 'اسئله', 'امتحان', 'منهج', 'درجاتي'];
        if (dataKeywords.some(kw => lowerContent.includes(kw))) {
          enhancedHistory[enhancedHistory.length - 1].content = `[User is a medical student on MedOneX]\n\n` + enhancedHistory[enhancedHistory.length - 1].content;
        }


        // Create AbortController for this generation
        abortRef.current = false;
        const ac = new AbortController();
        abortControllerRef.current = ac;
        const streamSignal = ac.signal;

        // 2. Smart Engine (Multi-Agent Consensus)
        if (settings.smartEngineEnabled) {
          // Find a secondary provider that is configured
          const availableProviders = (Object.keys(byokKeys) as AIProvider[]).filter(k => {
            const v = byokKeys[k];
            return Array.isArray(v) ? v.some(kk => kk) : !!v;
          });
          const secondaryProvider = availableProviders.find(p => p !== effectiveProvider);
          
          if (secondaryProvider) {
            try {
              // Fetch insights from secondary provider
              const secKeys = byokKeys[secondaryProvider];
              const secondaryKey = Array.isArray(secKeys) ? secKeys.find(k => k)! : (secKeys || "");
              if (!secondaryKey) throw new Error("No key");
              const pConfig = PROVIDER_CONFIGS[secondaryProvider];
              const sysPrompt = `You are a researcher AI. Provide a brief, highly accurate 2-paragraph analysis on the user's latest message to help the primary synthesizer AI.`;
              const researchHistory = [{ role: 'system', content: sysPrompt } as MessageForAPI, ...enhancedHistory.slice(-2)]; // only send context + last msg
              
              let insights = "";
              if (secondaryProvider === 'gemini') {
                insights = await streamGemini(secondaryKey, pConfig.defaultModel, researchHistory, [], () => {}, false, streamSignal);
              } else {
                insights = await streamOpenAICompat(secondaryKey, pConfig.baseURL ?? "https://api.openai.com/v1", pConfig.defaultModel, researchHistory, [], () => {}, false, undefined, streamSignal);
              }
              
              // Inject insights into the primary provider's prompt
              const synthesisPrompt = `[SMART ENGINE MULTI-AGENT MODE: Here are insights from ${pConfig.label} model: "${insights}". Synthesize this with your own knowledge to provide the absolute best, most comprehensive answer to the user. Format beautifully.]\n\n`;
              enhancedHistory[enhancedHistory.length - 1].content = synthesisPrompt + enhancedHistory[enhancedHistory.length - 1].content;
            } catch (e) {
              console.warn("Smart Engine secondary fetch failed, falling back to primary only", e);
            }
          } else {
            // Fallback smart prompt if no secondary key
            const smartPrompt = `[SMART ENGINE MODE: Think step-by-step and provide the most comprehensive, expert-level answer possible. If generating questions, use format :::question {"question": "...", "options": ["..."], "answer": "...", "explanation": "..."} :::]\n\n`;
            enhancedHistory[enhancedHistory.length - 1].content = smartPrompt + enhancedHistory[enhancedHistory.length - 1].content;
          }
        }

        let historyForAPI = enhancedHistory;

        // ─── Token Optimization: Smart History Compression ───
        const MAX_HISTORY_TOKENS = 6; // keep last 6 exchanges max (excl. system)
        const MAX_MSG_LENGTH = 3000;   // truncate individual messages over 3K chars
        if (historyForAPI.length > MAX_HISTORY_TOKENS + 1) {
          const sysMsg = historyForAPI[0];
          const recent = historyForAPI.slice(-MAX_HISTORY_TOKENS);
          historyForAPI = [sysMsg, ...recent];
        }
        for (let i = 0; i < historyForAPI.length; i++) {
          if (historyForAPI[i].content.length > MAX_MSG_LENGTH) {
            historyForAPI[i] = { ...historyForAPI[i], content: historyForAPI[i].content.slice(0, MAX_MSG_LENGTH) + "..." };
          }
        }

        let finalContent = "";

        // ─── RAF-batched streaming (max 1 state update per frame) ───
        streamingActiveRef.current = true;
        const flushToState = () => {
          rafIdRef.current = 0;
          const content = pendingContentRef.current;
          if (!content) return;
          setThreads(prev => {
            const updated = prev.map(t => t.id === threadId
              ? { ...t, messages: t.messages.map(m => m.id === aiMsgId ? { ...m, content } : m) }
              : t
            );
            return updated;
          });
        };
        const onChunk = (accumulated: string) => {
          if (abortRef.current) return;
          pendingContentRef.current = accumulated;
          if (!rafIdRef.current) {
            rafIdRef.current = requestAnimationFrame(flushToState);
          }
        };

        // ─── SUPER EXPERT MODE ───
        const geminiKeySE = getFirstKey(byokKeys, "gemini");
        const geminiModelSE = getFirstModel(activeModels, "gemini");

        if (settings.superExpertEnabled && geminiKeySE) {
          // Find workers (non-Gemini providers with keys + active models)
          const workerProviders = (Object.keys(byokKeys) as AIProvider[])
            .filter(p => p !== "gemini" && getFirstKey(byokKeys, p) && getActiveModels(activeModels, p).length > 0);

          if (workerProviders.length >= 1) {
            const workers = workerProviders.map(p => ({
              provider: p,
              apiKey: getFirstKey(byokKeys, p)!,
              model: getFirstModel(activeModels, p),
              baseURL: PROVIDER_CONFIGS[p]?.baseURL ?? "https://api.openai.com/v1",
              skipAuth: PROVIDER_CONFIGS[p]?.needsKey === false,
            }));

            const assignments = assignRoles(workers);
            const steps = assignments.map(a => createStep(a.role, a.provider));
            const progressSteps: SuperExpertStep[] = [...steps];
            const updateProgress = (phase: SuperExpertProgress["phase"], stepUpdates?: (s: SuperExpertStep[]) => SuperExpertStep[]) => {
              const next = stepUpdates ? stepUpdates(progressSteps) : progressSteps;
              setSuperExpertStatus({ phase, steps: next });
            };

            // Track output content per step for expandable results
            const stepOutputs = new Map<string, string>();
            const stepTimings = new Map<string, number>();

            updateProgress("analyzing");

            // Phase 1: Gemini analyzes the full context
            const analyzerMessages: MessageForAPI[] = [
              { role: "system", content: getAnalyzerPrompt(content, currentMessages.slice(-12).map(m => `${m.role}: ${m.content.slice(0, 500)}`).join("\n"), files.map(f => f.name).join(", "), workers.length) },
              { role: "user", content: content },
            ];
            const analysis = await streamGemini(geminiKeySE, geminiModelSE, analyzerMessages, [], () => {}, false, streamSignal);
            if (abortRef.current) throw new Error("_ABORTED_");
            updateProgress("generating", steps => steps.map(s => s.role === "generator" ? { ...s, status: "active" } : s));

            // Phase 2: Run roles sequentially
            let generatorOutput = "";
            let criticOutput = "";
            let formatterOutput = "";
            const taskDescription = analysis.trim() || content;

            // Phase 2a: Generator(s) — run in parallel
            const genAssignments = assignments.filter(a => a.role === "generator");
            const genResults = await Promise.allSettled(
              genAssignments.map(async (a) => {
                const genPrompt = getRolePrompt("generator", taskDescription, "");
                const genMessages: MessageForAPI[] = [
                  { role: "system", content: genPrompt },
                  { role: "user", content },
                ];
                if (a.provider === "gemini") {
                  return await streamGemini(a.apiKey, a.model, genMessages, files, () => {}, false, streamSignal);
                }
                return await streamOpenAICompat(a.apiKey, a.baseURL, a.model, genMessages, files, () => {}, false, a.skipAuth, streamSignal);
              })
            );
            const genTexts = genResults.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<string>).value);
            generatorOutput = genTexts.join("\n\n---\n\n");
            if (!generatorOutput) throw new Error("Generator produced no output");
            if (abortRef.current) throw new Error("_ABORTED_");
            updateProgress("generating", steps => steps.map(s =>
              s.role === "generator" ? { ...s, status: "completed", content: generatorOutput.slice(0, 1000) } : s
            ));

            // Phase 2b: Critic(s) — run in parallel
            const critAssignments = assignments.filter(a => a.role === "critic");
            if (critAssignments.length > 0) {
              updateProgress("critiquing", steps => steps.map(s => s.role === "critic" ? { ...s, status: "active" } : s));
              const critResults = await Promise.allSettled(
                critAssignments.map(async (a) => {
                  const critPrompt = getRolePrompt("critic", taskDescription, "", generatorOutput);
                  const critMessages: MessageForAPI[] = [
                    { role: "system", content: critPrompt },
                    { role: "user", content: "Please review the draft above." },
                  ];
                  if (a.provider === "gemini") {
                    return await streamGemini(a.apiKey, a.model, critMessages, [], () => {}, false, streamSignal);
                  }
                  return await streamOpenAICompat(a.apiKey, a.baseURL, a.model, critMessages, [], () => {}, false, a.skipAuth, streamSignal);
                })
              );
              const critTexts = critResults.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<string>).value);
              criticOutput = critTexts.join("\n\n---\n\n");
              if (abortRef.current) throw new Error("_ABORTED_");
              updateProgress("critiquing", steps => steps.map(s =>
                s.role === "critic" ? { ...s, status: "completed", content: criticOutput.slice(0, 1000) } : s
              ));
            }

            // Phase 2c: Formatter(s) — run in parallel
            const fmtAssignments = assignments.filter(a => a.role === "formatter");
            if (fmtAssignments.length > 0) {
              updateProgress("formatting", steps => steps.map(s => s.role === "formatter" ? { ...s, status: "active" } : s));
              const fmtResults = await Promise.allSettled(
                fmtAssignments.map(async (a) => {
                  const fmtPrompt = getRolePrompt("formatter", taskDescription, "", generatorOutput, criticOutput);
                  const fmtMessages: MessageForAPI[] = [
                    { role: "system", content: fmtPrompt },
                    { role: "user", content: "Please format the reviewed content." },
                  ];
                  if (a.provider === "gemini") {
                    return await streamGemini(a.apiKey, a.model, fmtMessages, [], () => {}, false, streamSignal);
                  }
                  return await streamOpenAICompat(a.apiKey, a.baseURL, a.model, fmtMessages, [], () => {}, false, a.skipAuth, streamSignal);
                })
              );
              const fmtTexts = fmtResults.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<string>).value);
              formatterOutput = fmtTexts.join("\n\n---\n\n");
              if (abortRef.current) throw new Error("_ABORTED_");
              updateProgress("formatting", steps => steps.map(s =>
                s.role === "formatter" ? { ...s, status: "completed", content: formatterOutput.slice(0, 1000) } : s
              ));
            }

            // Phase 3: Gemini synthesizes → stream to chat
            updateProgress("synthesizing");
            const synthesisPrompt = getSynthesisPrompt(taskDescription, generatorOutput, criticOutput, formatterOutput);
            const synthMessages: MessageForAPI[] = [
              { role: "system", content: synthesisPrompt },
              { role: "user", content: `Please synthesize and format the final response for: ${content}` },
            ];
            finalContent = await streamGemini(geminiKeySE, geminiModelSE, synthMessages, files, onChunk, webSearch, streamSignal);
            updateProgress("done");

            // Record rate usage for each provider used
            for (const a of assignments) recordProviderRequest(a.provider);
            recordProviderRequest("gemini"); // for analysis + synthesis
          } else {
            // Super Expert enabled but no workers → fall back to normal
            toast.error("Super Expert needs at least one non-Gemini provider configured.");
            throw new Error("No worker providers available");
          }
        } else {
          // ─── NORMAL MODE ───
          if (!apiKey) {
            const res = await fetch(getAIEndpoint("/api/v1/ai/chat"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: content,
                conversationHistory: historyForAPI.slice(0, -1),
                images: files.filter(f => f.mimeType.startsWith("image/")),
                pdfs: files.filter(f => f.mimeType === "application/pdf"),
                provider: effectiveProvider,
                specializedModel: effectiveProvider === activeProvider ? getFirstModel(activeModels, activeProvider) : PROVIDER_CONFIGS[effectiveProvider].defaultModel,
                web_search: webSearch ?? false,
                stream: true,
              }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || "API error");
            }
            const data = await res.json();
            if (data.reply) {
              const replyText = data.reply as string;
              const chunkSize = Math.max(1, Math.floor(replyText.length / 20));
              for (let i = 0; i < replyText.length; i += chunkSize) {
                if (abortRef.current) break;
                finalContent = replyText.slice(0, i + chunkSize);
                onChunk(finalContent);
                await new Promise(r => setTimeout(r, 20));
              }
              finalContent = replyText;
              onChunk(finalContent);
            } else {
              throw new Error(data.error || "Invalid response format");
            }
          } else {
            const rawKeys = byokKeys[effectiveProvider];
            const keysArray = Array.isArray(rawKeys) ? rawKeys.filter(k => k) : (rawKeys ? [rawKeys] : [apiKey].filter(k => k));
            const modelsArray = getActiveModels(activeModels, effectiveProvider as AIProvider);

            let lastError: any = null;
            let success = false;

            for (const currentKey of keysArray) {
              if (success) break;
              for (const currentModel of modelsArray) {
                if (success) break;
                try {
                  const smartModel = selectSmartModel(effectiveProvider as AIProvider, content, activePersona, currentMessages.length);
                  const finalModel = smartModel || currentModel;

                  if (effectiveProvider === "gemini") {
                    finalContent = await streamGemini(currentKey, finalModel, historyForAPI, files, onChunk, webSearch, streamSignal);
                  } else {
                    const baseURL = PROVIDER_CONFIGS[effectiveProvider].baseURL ?? "https://api.openai.com/v1";
                    const skipAuth = PROVIDER_CONFIGS[effectiveProvider]?.needsKey === false;
                    finalContent = await streamOpenAICompat(currentKey, baseURL, finalModel, historyForAPI, files, onChunk, webSearch, skipAuth, streamSignal);
                  }
                  success = true;
                } catch (byokErr: any) {
                  lastError = byokErr;
                  const msg = byokErr.message || "";
                  if (msg.includes("401") || msg.includes("403") || msg.includes("API_KEY_INVALID")) {
                    break;
                  }
                }
              }
            }

            if (!success) {
              throw lastError || new Error(`All keys/models failed for ${PROVIDER_CONFIGS[effectiveProvider]?.label || effectiveProvider}`);
            }
          }
        }

        // ─── Streaming done: flush final content + persist ───
        streamingActiveRef.current = false;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = 0;
        }
        const finalContentForStorage = pendingContentRef.current || finalContent;
        setThreads(prev => {
          const updated = prev.map(t => t.id === threadId
            ? { ...t, messages: t.messages.map(m => m.id === aiMsgId ? { ...m, content: finalContentForStorage, isStreaming: false } : m) }
            : t
          );
          localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
          return updated;
        });

        // ─── Cache the response ───
        if (finalContent && !replyToId && !webSearch) {
          setCachedResponse(content, activePersona, getFirstModel(activeModels, activeProvider), finalContent).catch(() => {});
        }

        fetchLimits();
      } catch (err: any) {
        const msg = err.message || "";
        const isAborted = abortRef.current || msg === "_ABORTED_" || err.name === "AbortError";

        if (isAborted) {
          // Flush partial content and mark as not streaming
          streamingActiveRef.current = false;
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = 0;
          }
          const partialContent = pendingContentRef.current || "";
          if (aiMsgId) {
            setThreads(prev => {
              const updated = prev.map(t => t.id === threadId
                ? { ...t, messages: t.messages.map(m => m.id === aiMsgId ? { ...m, content: partialContent, isStreaming: false } : m) }
                : t
              );
              localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        } else {
          const failedProvider: AIProvider = effectiveProvider || activeProvider;
          const friendly = msg || `${PROVIDER_CONFIGS[failedProvider]?.label ?? failedProvider} error.`;
          toast.error(friendly);

          // Remove the empty AI message
          setThreads(prev => {
            const updated = prev.map(t => t.id === threadId
              ? { ...t, messages: t.messages.filter(m => m.id !== aiMsgId) }
              : t
            );
            localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
            return updated;
          });
        }

        // Reset super expert status on any error/abort
        setSuperExpertStatus(null);
      } finally {
        setLoading(false);
        setStreamingId(null);
      }
    },
    [messages, loading, settings, threads, activeThreadId, saveThreads]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current = true;
    abortControllerRef.current?.abort();
    setLoading(false);
    setStreamingId(null);
  }, []);

  const regenerate = useCallback(async () => {
    if (!activeThread || activeThread.messages.length < 2) return;
    const msgs = activeThread.messages;
    const lastAiIdx = [...msgs].reverse().findIndex(m => m.role === "assistant");
    if (lastAiIdx === -1) return;
    const lastAiMsg = msgs[msgs.length - 1 - lastAiIdx];
    const lastUserMsg = msgs.slice(0, msgs.length - 1 - lastAiIdx).reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;

    // Remove last AI message and re-send
    const trimmed = msgs.filter(m => m.id !== lastAiMsg.id);
    setThreads(prev => {
      const updated = prev.map(t => t.id === activeThreadId
        ? { ...t, messages: trimmed }
        : t
      );
      localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => sendMessage(lastUserMsg.content, lastUserMsg.files ?? []), 50);
  }, [activeThread, activeThreadId, sendMessage]);

  return {
    threads,
    activeThread,
    activeThreadId,
    messages,
    loading,
    streamingId,
    settings,
    limits,
    superExpertStatus,
    // thread actions
    newThread,
    switchThread,
    deleteThread,
    renameThread,
    clearThread,
    // message actions
    sendMessage,
    stopGeneration,
    regenerate,
    setReaction,
    // settings
    updateSettings,
    // export
    exportThread,
  };
}
