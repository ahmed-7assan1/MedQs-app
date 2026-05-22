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

export type AIProvider = "gemini" | "openai" | "groq" | "xai" | "openrouter" | "anthropic" | "siliconflow";

export type BYOKKeys = {
  gemini?: string;
  openai?: string;
  groq?: string;
  xai?: string;
  openrouter?: string;
  anthropic?: string;
  siliconflow?: string;
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
}> = {
  gemini: {
    label: "Google Gemini",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-thinking-exp"],
    icon: "G",
  },
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o1", "o1-mini", "o3-mini"],
    icon: "⊕",
  },
  groq: {
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
    baseURL: "https://api.groq.com/openai/v1",
    icon: "⚡",
  },
  xai: {
    label: "xAI Grok",
    defaultModel: "grok-3",
    models: ["grok-3", "grok-3-mini", "grok-2", "grok-beta"],
    baseURL: "https://api.x.ai/v1",
    icon: "𝕏",
  },
  openrouter: {
    label: "OpenRouter",
    defaultModel: "anthropic/claude-3.5-sonnet",
    models: ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "google/gemini-2.0-flash", "meta-llama/llama-3.3-70b-instruct"],
    baseURL: "https://openrouter.ai/api/v1",
    icon: "⇌",
  },
  anthropic: {
    label: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    baseURL: "https://api.anthropic.com/v1",
    icon: "◈",
  },
  siliconflow: {
    label: "SiliconFlow (DeepSeek)",
    defaultModel: "deepseek-ai/DeepSeek-R1",
    models: ["deepseek-ai/DeepSeek-R1", "deepseek-ai/DeepSeek-V3", "Qwen/Qwen2.5-72B-Instruct", "Qwen/Qwen2.5-Coder-7B-Instruct"],
    baseURL: "https://api.siliconflow.cn/v1",
    icon: "🌀",
  },
};

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
  onChunk: (text: string) => void
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const mdl = genAI.getGenerativeModel({ model });

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
    if (f.mimeType.startsWith("image/") || f.mimeType === "application/pdf") {
      const base64 = f.data.split(",")[1];
      parts.push({ inlineData: { mimeType: f.mimeType, data: base64 } });
    } else {
      // Treat text files as text parts
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
  onChunk: (text: string) => void
): Promise<string> {
  // Build messages with vision support
  const apiMessages: any[] = messages.map((m, idx) => {
    const isLast = idx === messages.length - 1;
    if (isLast && files.length > 0) {
      const content: any[] = [{ type: "text", text: m.content || " " }];
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
    return { role: m.role, content: m.content };
  });

  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      ...(baseURL.includes("openrouter") ? {
        "HTTP-Referer": window.location.origin,
        "X-Title": "MedQs Dr. Q"
      } : {}),
    },
    body: JSON.stringify({ model, messages: apiMessages, stream: true }),
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

  // Load syllabus context
  useEffect(() => {
    const loadSyllabus = async () => {
      try {
        const res = await fetch("/api/v1/modules-all");
        if (res.ok) {
          const data = await res.json();
          if (data?.result && Array.isArray(data.result)) {
            let ctx = "MedQs Syllabus Context:\n";
            data.result.forEach((mod: any) => {
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
          }
        }
      } catch (err) {
        console.warn("Failed to load syllabus context for DrQ", err);
      }
    };
    loadSyllabus();
  }, []);

  // Load from localStorage initially
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });

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

      try {
        const { activeProvider, activeModel, byokKeys, activePersona } = settings;
        const apiKey = byokKeys[activeProvider] ?? "";

        // 0. Persona & Context Injection
        let systemPrompt = "";
        try {
          const { DRQ_PERSONAS } = require("@/components/ai/DrQPersonas");
          const persona = DRQ_PERSONAS[activePersona] || DRQ_PERSONAS.explainer;
          systemPrompt = persona.systemPrompt;
          
          // User Context
          const userName = (authUser as any)?.user_metadata?.name || "Student";
          const userUni = (authUser as any)?.user_metadata?.universityName || "Medical University";
          const userFaculty = (authUser as any)?.user_metadata?.facultyName || "Faculty of Medicine";
          
          systemPrompt += `\n\nUSER CONTEXT: You are talking to ${userName}, a student at ${userUni}, ${userFaculty}. Use this to personalize the conversation if it feels natural. Always use the user's name at the start of the chat.`;
        } catch (e) {
          systemPrompt = "You are Dr. Q, a helpful medical AI assistant.";
        }

        // Image generation instructions
        systemPrompt += `\n\nIMAGE GENERATION CAPABILITY: If the user asks you to draw, paint, visualize, generate, or create an image/diagram, you MUST output a markdown image tag of format: \`![Image](https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true)\` where \`{encoded_prompt}\` is a detailed description of the image in English, URL-encoded. You must choose to generate detailed, beautiful clinical illustrations or anatomical diagrams. Do not say you cannot draw.`;

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
          const secondaryProvider = availableProviders.find(p => p !== activeProvider);
          
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

        const historyForAPI = enhancedHistory;
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
              provider: activeProvider,
              specializedModel: activeModel,
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
          if (activeProvider === "gemini") {
            finalContent = await streamGemini(apiKey, activeModel, historyForAPI, files, onChunk);
          } else {
            const baseURL = PROVIDER_CONFIGS[activeProvider].baseURL ?? "https://api.openai.com/v1";
            finalContent = await streamOpenAICompat(apiKey, baseURL, activeModel, historyForAPI, files, onChunk);
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
        toast.error(err.message || "Dr. Q encountered an error");
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
