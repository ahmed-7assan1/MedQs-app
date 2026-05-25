"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { syncAllThreadsToFirestore, subscribeToThreads, deleteThreadFromFirestore } from "@/lib/firebase/firestore";
import { getAIEndpoint } from "@/lib/api-config";

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

export type AIProvider = "gemini" | "groq" | "siliconflow" | "cloudflare" | "huggingface" | "together" | "openrouter" | "ovhcloud" | "github" | "cerebras";

export type BYOKKeys = {
  gemini?: string;
  groq?: string;
  siliconflow?: string;
  cloudflare?: string;
  huggingface?: string;
  together?: string;
  openrouter?: string;
  ovhcloud?: string;
  github?: string;
  cerebras?: string;
};

export type DrQSettings = {
  // per-provider API keys (stored in localStorage, never sent to server)
  byokKeys: BYOKKeys;
  activeProvider: AIProvider;
  activeModel: string;
  activePersona: string; // "quiz", "explainer", etc.
  smartEngineEnabled?: boolean; // Multi-agent & deep reasoning mode
  // appearance
  fontSize: number;
  userBubbleColor: string;
  aiBubbleColor: string;
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
    defaultModel: "gemini-2.0-flash",
    models: [
      "gemini-2.0-flash", "gemini-2.0-flash-lite",
      "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3-flash-preview", "gemini-3-pro-preview",
      "gemini-3.1-pro-preview", "gemini-3.1-flash-lite",
      "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-pro-latest",
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
    tiny: ["gemini-2.0-flash-lite"],
    small: ["gemini-2.0-flash"],
    medium: ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"],
    large: ["gemini-2.5-pro", "gemini-3.5-flash", "gemini-3-pro-preview", "gemini-3.1-pro-preview", "gemini-pro-latest"],
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
];

function findFallbackProvider(byokKeys: BYOKKeys, exclude: AIProvider, prefer?: AIProvider): AIProvider | null {
  const hasKey = (p: AIProvider) => byokKeys[p] || PROVIDER_CONFIGS[p]?.needsKey === false;
  if (prefer && prefer !== exclude && hasKey(prefer)) return prefer;
  for (const p of FALLBACK_ORDER) {
    if (p !== exclude && hasKey(p)) return p;
  }
  return null;
}

function findFirstAvailableProvider(byokKeys: BYOKKeys): AIProvider | null {
  for (const p of FALLBACK_ORDER) {
    if (byokKeys[p] || PROVIDER_CONFIGS[p]?.needsKey === false) return p;
  }
  return null;
}

const DEFAULT_SETTINGS: DrQSettings = {
  byokKeys: {},
  activeProvider: "gemini",
  activeModel: "gemini-2.0-flash",
  activePersona: "explainer",
  fontSize: 15,
  userBubbleColor: "#6d28d9",
  aiBubbleColor: "#1a1830",
};

// ─── Streaming Client Helpers ─────────────────────────────────────────────────

type MessageForAPI = { role: "user" | "assistant" | "system"; content: string };

async function streamGemini(
  apiKey: string,
  model: string,
  messages: MessageForAPI[],
  files: FileAttachment[],
  onChunk: (text: string) => void,
  webSearch?: boolean
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const mdl = genAI.getGenerativeModel({
    model,
    ...(webSearch ? { tools: [{ googleSearch: {} }] } : {}),
  });

  // Build Gemini history (all but last)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = mdl.startChat({ history });

  // Build the user turn parts
  const lastMsg = messages[messages.length - 1];
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

  const result = await chat.sendMessageStream(parts);
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
  skipAuth?: boolean
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
        "X-Title": "MedQs Dr. Q"
      } : {}),
    },
    body: JSON.stringify({ model, messages: apiMessages, stream: true, max_tokens: 4096 }),
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

  const abortRef = useRef<boolean>(false);

  // Load syllabus context — user-specific modules
  useEffect(() => {
    const loadSyllabus = async () => {
      try {
        const res = await fetch("/api/v1/user/syllabus");
        if (res.ok) {
          const data = await res.json();
          if (data?.modules && Array.isArray(data.modules) && data.modules.length > 0) {
            let ctx = "Your enrolled modules on MedQs:\n";
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
        // Validate activeProvider — it may be stale from a previous version
        if (!PROVIDER_CONFIGS[parsed.activeProvider as AIProvider]) {
          parsed.activeProvider = DEFAULT_SETTINGS.activeProvider;
          parsed.activeModel = DEFAULT_SETTINGS.activeModel;
        }
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
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

      const { activeProvider, activeModel, byokKeys, activePersona } = settings;
      let effectiveProvider: AIProvider = activeProvider;
      try {
        effectiveProvider = activeProvider;
        let apiKey = byokKeys[effectiveProvider] ?? "";
        const needsKey = PROVIDER_CONFIGS[effectiveProvider]?.needsKey !== false;

        if (!apiKey && needsKey) {
          const fallback = findFirstAvailableProvider(byokKeys);
          if (fallback) {
            const reason = `No API key set for ${PROVIDER_CONFIGS[effectiveProvider].label}`;
            effectiveProvider = fallback;
            apiKey = byokKeys[fallback] ?? "";
            const label = PROVIDER_CONFIGS[fallback].label;
            toast.success(`🔄 Auto-switched to ${label}: ${reason}`);
            updateSettings({ activeProvider: fallback, activeModel: PROVIDER_CONFIGS[fallback].defaultModel });
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
          
          // MedOneX Identity Context
          systemPrompt = `You are MedOneX Expert AI, the intelligent medical AI assistant of MedOneX (also known as MedQs) — a premium medical education platform at medonex.app. You are an expert medical tutor with deep knowledge across all medical specialties.

CREATOR INFO:
You were created by Dr. Ahmed Mohamed Hassan (دكتور أحمد محمد حسان) — make sure to write it as "حسان" with an alif after the seen, NOT "حسن" without alif. He is the founder of MedOneX and the creator of MedVibes on Instagram. If the user asks "Who made you?", "Who is the founder?", or anything similar, proudly tell them about Dr. Ahmed — the visionary founder of MedOneX and MedVibes.${founderLinkedIn ? ` Include his LinkedIn profile as a professional markdown link: [Dr. Ahmed Mohamed Hassan](${founderLinkedIn}).` : ""}

GLOBAL RULES:
1. **Medical terminology must ALWAYS be in English** — even if the rest of the response is in Arabic. For example: "يسبب الـ Inflammation في الـ Liver" not "يسبب الالتهاب في الكبد".
2. **Stay on medical topic** — if the user's query is not medically related, politely respond that you specialize in medical education and redirect to a medical topic. Do not engage deeply with non-medical subjects.
3. **Response language** — respond in the same language the user writes in (Arabic or English). You may use emojis naturally (Apple-style) to make responses friendly and engaging.
4. **MCQ format** — when generating questions, always use 5 multiple-choice options in the following exact JSON format wrapped between ":::question" and ":::" delimiters:
   :::question
   {"questionType":"MCQ","body":"Question stem","choices":[{"key":"A","text":"Option A"},{"key":"B","text":"Option B"},{"key":"C","text":"Option C"},{"key":"D","text":"Option D"},{"key":"E","text":"Option E"}],"answer":"A","explanation":"Why this is correct","difficulty":"MEDIUM"}
   :::
5. **Flashcard format** — when generating flashcards, use this JSON format wrapped between ":::flashcard" and ":::" delimiters:
   :::flashcard
   {"front":"Question or term","back":"Answer or definition"}
   :::
   For multiple flashcards, use ":::flashcards" wrapping a JSON array.
6. **IMAGE GENERATION** — if the user asks you to draw, paint, visualize, or create an image, output an inline markdown image tag: ![Image](https://image.pollinations.ai/prompt/ENCODED_PROMPT?width=1024&height=1024&nologo=true). Make the prompt detailed and clinical. Render the image at full width in the chat.
7. **WEB SEARCH** — you have web search capability. When the user asks for recent information, news, or anything requiring up-to-date data, use the web search tool.
8. **Be helpful, accurate, and concise.

\t
${systemPrompt}`;
          
          systemPrompt += `\n\nUSER CONTEXT: You are talking to ${userName}, a ${userFaculty} student at ${userUni}. Use this information to personalize your responses. Always greet the user by their name (${userName}) at the start of the conversation. You have full access to their academic data including enrolled courses, past exam scores, syllabus, and study progress on MedOneX.`;
        } catch (e) {
          systemPrompt = "You are Dr. Q, a helpful medical AI assistant.";
        }

        // Inject syllabus context
        if (syllabusContext) {
          systemPrompt += `\n\nHere is the student's actual syllabus context on MedQs:\n${syllabusContext}\n\nUse this context to answer academic syllabus questions accurately (e.g. what lectures are in a module, or what subjects they study). Do not repeat this context verbatim unless asked.`;
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
          const siteContext = `[SYSTEM CONTEXT: The user is a medical student on the MedQs platform. Current context: They are enrolled in "Internal Medicine" and their last mock exam score was 85%. Use this data to personalize your response if relevant. Do not mention this system context explicitly.]\n\n`;
          enhancedHistory[enhancedHistory.length - 1].content = siteContext + enhancedHistory[enhancedHistory.length - 1].content;
        }


        // 2. Smart Engine (Multi-Agent Consensus)
        if (settings.smartEngineEnabled) {
          // Find a secondary provider that is configured
          const availableProviders = Object.keys(byokKeys).filter(k => byokKeys[k as AIProvider]) as AIProvider[];
          const secondaryProvider = availableProviders.find(p => p !== effectiveProvider);
          
          if (secondaryProvider) {
            try {
              // Fetch insights from secondary provider
              const secondaryKey = byokKeys[secondaryProvider]!;
              const pConfig = PROVIDER_CONFIGS[secondaryProvider];
              const sysPrompt = `You are a researcher AI. Provide a brief, highly accurate 2-paragraph analysis on the user's latest message to help the primary synthesizer AI.`;
              const researchHistory = [{ role: 'system', content: sysPrompt } as MessageForAPI, ...enhancedHistory.slice(-2)]; // only send context + last msg
              
              let insights = "";
              if (secondaryProvider === 'gemini') {
                insights = await streamGemini(secondaryKey, pConfig.defaultModel, researchHistory, [], () => {});
              } else {
                insights = await streamOpenAICompat(secondaryKey, pConfig.baseURL ?? "https://api.openai.com/v1", pConfig.defaultModel, researchHistory, [], () => {});
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
        const MAX_HISTORY_TOKENS = 12; // keep last 12 exchanges max (excl. system)
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

        const onChunk = (accumulated: string) => {
          if (abortRef.current) return;
          setThreads(prev => {
            const updated = prev.map(t => t.id === threadId
              ? { ...t, messages: t.messages.map(m => m.id === aiMsgId ? { ...m, content: accumulated } : m) }
              : t
            );
            localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
            return updated;
          });
        };

        if (!apiKey) {
          // Use site's API if no BYOK key
          const res = await fetch(getAIEndpoint("/api/v1/ai/chat"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: content,
              conversationHistory: historyForAPI.slice(0, -1),
              images: files.filter(f => f.mimeType.startsWith("image/")),
              pdfs: files.filter(f => f.mimeType === "application/pdf"),
              provider: effectiveProvider,
              specializedModel: effectiveProvider === activeProvider ? activeModel : PROVIDER_CONFIGS[effectiveProvider].defaultModel,
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
            // Simulate a smooth typing effect since the backend doesn't stream natively
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
          const smartModel = selectSmartModel(effectiveProvider as AIProvider, content, activePersona, currentMessages.length);
          const useModel = (effectiveProvider === "openrouter" && !activeModel.includes(":free") && !activeModel.includes("/free"))
            ? "openrouter/free"
            : (effectiveProvider === activeProvider ? activeModel : PROVIDER_CONFIGS[effectiveProvider].defaultModel);
          const finalModel = smartModel || useModel;
          if (effectiveProvider === "gemini") {
            finalContent = await streamGemini(apiKey, finalModel, historyForAPI, files, onChunk, webSearch);
          } else {
            const baseURL = PROVIDER_CONFIGS[effectiveProvider].baseURL ?? "https://api.openai.com/v1";
            const skipAuth = PROVIDER_CONFIGS[effectiveProvider]?.needsKey === false;
            finalContent = await streamOpenAICompat(apiKey, baseURL, finalModel, historyForAPI, files, onChunk, webSearch, skipAuth);
          }
        }

        // Mark streaming done
        setThreads(prev => {
          const updated = prev.map(t => t.id === threadId
            ? { ...t, messages: t.messages.map(m => m.id === aiMsgId ? { ...m, content: finalContent, isStreaming: false } : m) }
            : t
          );
          localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
          return updated;
        });

        fetchLimits();
      } catch (err: any) {
        const msg = err.message || "";
        const failedProvider: AIProvider = effectiveProvider || activeProvider;
        let friendly = "";
        if (msg.includes("429") || msg.includes("quota") || msg.includes("Quota") || msg.includes("exhausted") || msg.includes("rate_limit")) {
          friendly = `${PROVIDER_CONFIGS[failedProvider].label}: ${msg}`;
        } else if (msg.includes("401") || msg.includes("403") || msg.includes("API_KEY_INVALID") || msg.includes("not valid") || msg.includes("unauthorized")) {
          friendly = `Invalid ${PROVIDER_CONFIGS[failedProvider].label} API key. Update it in Settings.`;
        } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("Network") || msg.includes("ENOTFOUND")) {
          friendly = `Network error connecting to ${PROVIDER_CONFIGS[failedProvider].label}. Check your connection.`;
        } else if (msg.includes("500") || msg.includes("502") || msg.includes("503")) {
          friendly = `${PROVIDER_CONFIGS[failedProvider].label} server error. Try again later.`;
        } else {
          friendly = msg.split(". ").slice(0, 2).join(". ") || `${PROVIDER_CONFIGS[failedProvider].label} error. Try again.`;
        }

        // ─── Auto-Fallback on Provider Error ───
        const fallback = findFallbackProvider(byokKeys, failedProvider);
        if (fallback) {
          const label = PROVIDER_CONFIGS[fallback].label;
          const failedLabel = PROVIDER_CONFIGS[failedProvider].label;
          toast.success(`🔄 Auto-switched to ${label}: ${failedLabel} failed — ${friendly}`);
          updateSettings({ activeProvider: fallback, activeModel: PROVIDER_CONFIGS[fallback].defaultModel });
        } else {
          toast.error(friendly);
        }

        // Remove the empty AI message
        setThreads(prev => {
          const updated = prev.map(t => t.id === threadId
            ? { ...t, messages: t.messages.filter(m => m.id !== aiMsgId) }
            : t
          );
          localStorage.setItem(THREADS_KEY, JSON.stringify(updated));
          return updated;
        });
      } finally {
        setLoading(false);
        setStreamingId(null);
      }
    },
    [messages, loading, settings, threads, activeThreadId, saveThreads]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current = true;
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
