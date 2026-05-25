"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { getAIEndpoint } from "@/lib/api-config";
import { useSession } from "next-auth/react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string; // for generated images
  type?: "text" | "image"; // message type
}

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

// ─── All Puter-available models ─────────────────────────────────────────────
export interface PuterModel {
  id: string;
  label: string;
  provider: string;
  icon: string;
  badge?: string;
}

export const PUTER_MODELS: PuterModel[] = [
  // OpenAI
  { id: "gpt-4o",            label: "GPT-4o",          provider: "OpenAI",    icon: "🟢", badge: "Latest" },
  { id: "gpt-4o-mini",       label: "GPT-4o Mini",     provider: "OpenAI",    icon: "🟢" },
  { id: "o1",                label: "o1",               provider: "OpenAI",    icon: "🟢", badge: "Reasoning" },
  { id: "o1-mini",           label: "o1 Mini",          provider: "OpenAI",    icon: "🟢" },
  { id: "o3-mini",           label: "o3 Mini",          provider: "OpenAI",    icon: "🟢", badge: "Reasoning" },
  { id: "o4-mini",           label: "o4 Mini",          provider: "OpenAI",    icon: "🟢", badge: "New" },
  // Anthropic
  { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet", provider: "Anthropic", icon: "🟠", badge: "Thinking" },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", provider: "Anthropic", icon: "🟠" },
  { id: "claude-3-haiku-20240307",    label: "Claude 3 Haiku",    provider: "Anthropic", icon: "🟠", badge: "Fast" },
  // Google
  { id: "gemini-2.0-flash",           label: "Gemini 2.0 Flash",  provider: "Google",    icon: "🔵", badge: "Fast" },
  { id: "gemini-2.0-flash-lite",      label: "Gemini 2.0 Flash Lite",  provider: "Google",    icon: "🔵", badge: "Lite" },
  // Meta
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B",    provider: "Meta", icon: "⚫" },
  { id: "meta-llama/llama-4-maverick:free",        label: "Llama 4 Maverick", provider: "Meta", icon: "⚫", badge: "New" },
  // DeepSeek
  { id: "deepseek/deepseek-r1:free",  label: "DeepSeek R1",       provider: "DeepSeek",  icon: "🟣", badge: "Reasoning" },
  { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3", provider: "DeepSeek", icon: "🟣" },
  // Mistral
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", label: "Mistral Small 3.1", provider: "Mistral", icon: "🔴" },
  // Qwen
  { id: "qwen/qwq-32b:free",          label: "QwQ 32B",            provider: "Qwen",      icon: "🟡", badge: "Reasoning" },
  { id: "qwen/qwen2.5-vl-72b-instruct:free", label: "Qwen 2.5 VL", provider: "Qwen",     icon: "🟡" },
  // xAI
  { id: "x-ai/grok-2-vision-1212",    label: "Grok 2 Vision",     provider: "xAI",       icon: "🔲" },
  { id: "x-ai/grok-3-mini-beta",      label: "Grok 3 Mini",       provider: "xAI",       icon: "🔲", badge: "New" },
  // Groq (Added)
  { id: "groq:llama-3.3-70b-versatile", label: "Groq: Llama 3.3 70B", provider: "Groq", icon: "⚡", badge: "Super Fast" },
  { id: "groq:llama-3.1-70b-versatile", label: "Groq: Llama 3.1 70B", provider: "Groq", icon: "⚡" },
  { id: "groq:mixtral-8x7b-32768",      label: "Groq: Mixtral 8x7B", provider: "Groq", icon: "⚡" },
  { id: "groq:deepseek-r1-distill-llama-70b", label: "Groq: DeepSeek R1", provider: "Groq", icon: "🟣", badge: "Reasoning" },
];

export const PUTER_AGENTS = [
  { name: "Dr. Q Coach",    subtitle: "Full Medical Tutor",  icon: "🧠", gradClass: "grad-1",
    desc: "Your all-in-one medical tutor — explains, quizzes, and summarizes any topic.",
    systemPrompt: "You are Dr. Q, an expert medical AI tutor helping Egyptian medical students. You explain complex medical topics clearly in the student's preferred language (Arabic or English), give clinical pearls, and adapt your depth to their level." },
  { name: "Quiz Master",    subtitle: "MCQ Practice",         icon: "🎯", gradClass: "grad-2",
    desc: "Focused MCQ practice with instant explanation and feedback after every answer.",
    systemPrompt: "You are Quiz Master, an AI focused exclusively on medical MCQ practice. Generate challenging multiple-choice questions, evaluate the student's answers, explain why each option is right or wrong, and track weak areas." },
  { name: "Flash Coach",    subtitle: "Anki Flashcards",      icon: "⚡", gradClass: "grad-3",
    desc: "Auto-generates Anki-style flashcards from any lecture or topic.",
    systemPrompt: "You are Flash Coach, an AI specialized in creating high-yield Anki-style flashcards for medical students. When given a topic or lecture content, produce concise Question → Answer pairs. Format as: **Q:** ... **A:** ..." },
  { name: "Case Solver",    subtitle: "Clinical Cases",       icon: "🩺", gradClass: "grad-4",
    desc: "Works through clinical scenarios step by step, just like real exam cases.",
    systemPrompt: "You are Case Solver, a clinical reasoning AI. Present and work through clinical cases step by step: History → Examination → Investigations → Diagnosis → Management. Guide the student Socratically, asking questions before revealing answers." },
  { name: "Summarizer",     subtitle: "Smart Notes",          icon: "📋", gradClass: "grad-1",
    desc: "Condenses any lecture or topic into structured, high-yield summary notes.",
    systemPrompt: "You are Summarizer, specialized in creating concise, structured medical notes. Use bullet points, bold key terms, and organize by: Definition → Etiology → Pathophysiology → Clinical Features → Investigations → Treatment → Complications." },
  { name: "Image Analyst",  subtitle: "Medical Images",       icon: "🔬", gradClass: "grad-2",
    desc: "Analyzes medical images, diagrams, and explains radiological findings.",
    systemPrompt: "You are Image Analyst, an AI specialized in interpreting medical images and diagrams. Describe findings systematically, provide differential diagnoses, and explain the pathological basis of visible changes." },
];

const THREADS_KEY = "medqs-dr-q-threads-v2";

// ─── Helper: call Puter.js AI (client-side only) ─────────────────────────────
async function callPuterAI(
  model: string,
  messages: Array<{ role: string; content: string }>,
  stream: boolean = false
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const puter = (window as any).puter;
  if (!puter?.ai?.chat) throw new Error("Puter.js not loaded");

  if (stream) {
    const response = await puter.ai.chat(messages, { model, stream: true });
    let full = "";
    for await (const part of response) {
      full += part?.text ?? "";
    }
    return full;
  } else {
    const response = await puter.ai.chat(messages, { model });
    return typeof response === "string" ? response : (response?.message?.content?.[0]?.text ?? response?.message?.content ?? String(response));
  }
}

// ─── Helper: generate image via Puter.js ─────────────────────────────────────
async function callPuterImage(prompt: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const puter = (window as any).puter;
  if (!puter?.ai?.txt2img) throw new Error("Puter.js not loaded");
  const img = await puter.ai.txt2img(prompt);
  // img is an <img> DOM element — get its src
  return img?.src ?? "";
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useAIChat() {
  const { data: session } = useSession();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // ─ Load threads from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(THREADS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      }
    } catch { }
  }, []);

  // ─ Persist threads
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    }
  }, [threads]);

  const selectThread = useCallback((id: string) => {
    setActiveThreadId(id);
    const t = threads.find((x) => x.id === id);
    setMessages(t?.messages ?? []);
  }, [threads]);

  const newTopic = useCallback(() => {
    const id = `t-${Date.now()}`;
    const nt: Thread = { id, title: "New topic", updatedAt: Date.now(), messages: [] };
    setThreads((prev) => [nt, ...prev]);
    setActiveThreadId(id);
    setMessages([]);
  }, []);

  // ─ Customization
  const [bgImage, setBgImageState] = useState<string | null>(null);
  const [userBubbleColor, setUserBubbleColorState] = useState<string>("grad-1");
  const [puterModel, setPuterModelState] = useState<string>("gpt-4o");
  const [bgBlur, setBgBlurState] = useState<number>(20);
  const [bgOpacity, setBgOpacityState] = useState<number>(10);
  const [activeMode, setActiveMode] = useState<string>("Ask");
  const [activeAgent, setActiveAgent] = useState(PUTER_AGENTS[0]);

  useEffect(() => {
    try {
      const bg = localStorage.getItem("medqs-chat-bg");
      if (bg !== null) setBgImageState(bg);
      const col = localStorage.getItem("medqs-chat-color");
      if (col !== null) setUserBubbleColorState(col);
      const model = localStorage.getItem("medqs-chat-model");
      if (model !== null) setPuterModelState(model);
      const blur = localStorage.getItem("medqs-chat-blur");
      if (blur !== null) setBgBlurState(Number(blur));
      const op = localStorage.getItem("medqs-chat-opacity");
      if (op !== null) setBgOpacityState(Number(op));
      const agentIdx = localStorage.getItem("medqs-chat-agent-idx");
      if (agentIdx !== null) setActiveAgent(PUTER_AGENTS[Number(agentIdx)] ?? PUTER_AGENTS[0]);
    } catch { }
  }, []);

  const setBgBlur = (val: number) => {
    setBgBlurState(val);
    localStorage.setItem("medqs-chat-blur", String(val));
  };
  const setBgOpacity = (val: number) => {
    setBgOpacityState(val);
    localStorage.setItem("medqs-chat-opacity", String(val));
  };

  const setBgImage = (url: string | null) => {
    setBgImageState(url);
    if (url) localStorage.setItem("medqs-chat-bg", url);
    else localStorage.removeItem("medqs-chat-bg");
  };
  const setUserBubbleColor = (col: string) => {
    setUserBubbleColorState(col);
    localStorage.setItem("medqs-chat-color", col);
  };
  const setPuterModel = (mod: string) => {
    setPuterModelState(mod);
    localStorage.setItem("medqs-chat-model", mod);
  };
  const handleSetAgent = (agent: typeof PUTER_AGENTS[0]) => {
    setActiveAgent(agent);
    const idx = PUTER_AGENTS.findIndex(a => a.name === agent.name);
    localStorage.setItem("medqs-chat-agent-idx", String(idx));
  };

  // ─── Direct AI Call Implementation (BioC Style) ──────────────────────────
  const callDirectAI = useCallback(async (provider: string, model: string, messages: any[]) => {
    const apiKey = localStorage.getItem(`medonex-api-key-${provider.toLowerCase()}`);
    if (!apiKey) {
      throw new Error(`API_KEY_MISSING:${provider}`);
    }

    let endpoint = "";
    let headers: any = { "Content-Type": "application/json" };
    let body: any = {};

    if (provider === "OpenAI") {
      endpoint = "https://api.openai.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      body = { model, messages };
    } else if (provider === "Google") {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      body = { contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })) };
    } else if (provider === "Groq") {
      endpoint = "https://api.groq.com/openai/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      body = { model: model.startsWith("groq:") ? model.split(":")[1] : model, messages };
    } else {
      // Fallback to Puter or our proxy
      return null;
    }

    const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Provider Error: ${res.statusText}`);
    const data = await res.json();
    
    if (provider === "Google") return data.candidates?.[0]?.content?.parts?.[0]?.text;
    return data.choices?.[0]?.message?.content;
  }, []);

  // ─── Send a TEXT message ────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;
    if (!session?.user) {
      toast.error("Please login to use Dr. Q");
      return;
    }

    // 1. Activation Command Check
    const isActivation = content.toLowerCase().includes("chat medonex");
    const displayContent = isActivation ? content : content;

    const userMessage: ChatMessage = { role: "user", content: displayContent, type: "text" };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      // 2. Build Rich Context (Student Data + Institutional Knowledge)
      const studentData = `
Student Profile:
- Name: ${session.user.name}
- Email: ${session.user.email}
- University/Academic Info: ${JSON.stringify(session.user)}
- Status: Authenticated at MedOneX
      `;

      const founderInfo = [
        "MedOneX was founded by Dr. Ahmed Hassan, a visionary in medical education.",
        "The platform is the brainchild of Dr. Ahmed Hassan, aiming to revolutionize how medical students study.",
        "Under the leadership of its founder, Dr. Ahmed Hassan, MedOneX has become the leading medical platform in Egypt."
      ];
      const randomFounder = founderInfo[Math.floor(Math.random() * founderInfo.length)];

      const systemContext = `
${activeAgent.systemPrompt}
IDENTITY: You are Dr. Q, an elite AI from MedOneX Platform.
FOUNDER INFO: ${randomFounder}
STUDENT CONTEXT: ${studentData}
CONSTRAINTS: 
- Respond ONLY to medical or academic topics. 
- Refuse non-medical requests politely.
- If the user hasn't typed "Chat Medonex" at least once in the session, encourage them to join the MedOneX community.
      `;

      const history = [
        { role: "system", content: systemContext },
        ...nextMessages
          .filter(m => m.type !== "image")
          .map(m => ({ role: m.role, content: m.content }))
      ];

      // 3. Try Direct API Call First
      let reply = "";
      const provider = PUTER_MODELS.find(m => m.id === puterModel)?.provider || "OpenAI";
      
      try {
        const directReply = await callDirectAI(provider, puterModel, history);
        if (directReply) reply = directReply;
      } catch (e: any) {
        if (e.message.startsWith("API_KEY_MISSING")) {
          // If key missing, fallback to our secure proxy but notify
          const res = await fetch(getAIEndpoint("/api/v1/ai/chat"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: content, conversationHistory: history }),
          });
          if (!res.ok) throw new Error("Proxy failed");
          const data = await res.json();
          reply = data.reply;
        } else {
          throw e;
        }
      }

      // 4. Logging to "Data Group" for persistence
      fetch("/api/v1/ai/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          message: content,
          reply: reply,
          context: { provider, model: puterModel }
        })
      }).catch(() => {}); // Silent log failure

      const aiMessage: ChatMessage = { role: "assistant", content: reply, type: "text" };
      const finalMessages = [...nextMessages, aiMessage];
      setMessages(finalMessages);

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: finalMessages, updatedAt: Date.now(), title: t.title === "New topic" ? content.slice(0, 40) : t.title }
            : t
        )
      );
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      toast.error(`Dr. Q Error: ${err}`);
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, activeThreadId, puterModel, activeAgent, session, callDirectAI]);

  // ─── Generate IMAGE via Puter.js ─────────────────────────────────────────
  const generateImage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: `🖼️ Generate image: ${prompt}`, type: "text" };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const imageUrl = await callPuterImage(prompt);
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: `Here is the generated image for: **${prompt}**`,
        imageUrl,
        type: "image"
      };
      const finalMessages = [...nextMessages, aiMessage];
      setMessages(finalMessages);

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: finalMessages, updatedAt: Date.now(), title: t.title === "New topic" ? `Image: ${prompt}`.slice(0, 40) : t.title }
            : t
        )
      );
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      toast.error(`Image generation failed: ${err}`);
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, activeThreadId]);

  // ─── Text-to-Speech via Puter.js ─────────────────────────────────────────
  const speakText = useCallback(async (text: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const puter = (window as any).puter;
      if (!puter?.ai?.txt2speech) { toast.error("Speech not available"); return; }
      const audio = await puter.ai.txt2speech(text);
      audio.play();
    } catch (e: unknown) {
      toast.error("TTS Error: " + (e instanceof Error ? e.message : String(e)));
    }
  }, []);

  return {
    threads, activeThreadId, messages, loading,
    sendMessage, generateImage, speakText,
    selectThread, newTopic,
    bgImage, setBgImage,
    userBubbleColor, setUserBubbleColor,
    puterModel, setPuterModel,
    bgBlur, setBgBlur,
    bgOpacity, setBgOpacity,
    activeMode, setActiveMode,
    activeAgent, setActiveAgent: handleSetAgent,
    PUTER_AGENTS, PUTER_MODELS,
  };
}
