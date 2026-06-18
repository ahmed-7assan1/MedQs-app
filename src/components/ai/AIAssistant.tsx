"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  RotateCcw,
  ImagePlus,
  X,
  Plus,
  MessageSquare,
  FileText,
  Paperclip,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Check,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { getAIEndpoint } from "@/lib/api-config";

interface UsageInfo {
  used: number;
  limit: number;
  rankLabel: string;
  isAdmin?: boolean;
}

/** Shown in thread; binary omitted when saving to localStorage */
export type ChatAttachment = {
  kind: "image";
  preview: string;
  name?: string;
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
}

export interface DrQThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

const THREADS_KEY = "medqs-dr-q-threads-v1";
const ACTIVE_THREAD_KEY = "medqs-dr-q-active-thread-v1";

type ChatImage = { mimeType: string; data: string; preview: string };
type PendingPdf = { mimeType: "application/pdf"; data: string; name: string };
type PendingText = { name: string; text: string };

function fileToImagePart(file: File): Promise<ChatImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Images only"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      const m = s.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) {
        reject(new Error("Could not read image"));
        return;
      }
      const approx = (m[2].length * 3) / 4;
      if (approx > 3.5 * 1024 * 1024) {
        reject(new Error("Image too large (max ~3.5MB)"));
        return;
      }
      resolve({ mimeType: m[1], data: m[2], preview: s });
    };
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

function fileToPdfPart(file: File): Promise<PendingPdf> {
  return new Promise((resolve, reject) => {
    if (file.type !== "application/pdf") {
      reject(new Error("PDF only"));
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      reject(new Error("PDF too large (max ~4.5MB)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      const m = s.match(/^data:([^;]+);base64,(.+)$/);
      if (!m || m[1] !== "application/pdf") {
        reject(new Error("Could not read PDF"));
        return;
      }
      resolve({ mimeType: "application/pdf", data: m[2], name: file.name || "document.pdf" });
    };
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

function fileToTextSnippet(file: File): Promise<PendingText> {
  return new Promise((resolve, reject) => {
    const ok =
      file.type === "text/plain" ||
      file.name.toLowerCase().endsWith(".md") ||
      file.name.toLowerCase().endsWith(".txt");
    if (!ok) {
      reject(new Error("Use .txt or .md for text lecture files"));
      return;
    }
    if (file.size > 400 * 1024) {
      reject(new Error("Text file too large (max 400KB)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").trim();
      if (!text) {
        reject(new Error("Empty file"));
        return;
      }
      const cap = 24_000;
      resolve({
        name: file.name || "notes.txt",
        text: text.length > cap ? `${text.slice(0, cap)}\n\n…(truncated)` : text,
      });
    };
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsText(file);
  });
}

function loadThreads(): DrQThread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (t): t is DrQThread =>
        !!t &&
        typeof t === "object" &&
        typeof (t as DrQThread).id === "string" &&
        Array.isArray((t as DrQThread).messages)
    );
  } catch {
    return [];
  }
}

function saveThreads(threads: DrQThread[]) {
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads.slice(0, 80)));
  } catch {
    toast.error("Could not save chat history (storage full). Start a new topic or clear old data.");
  }
}

function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_THREAD_KEY);
  } catch {
    return null;
  }
}

function saveActiveId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_THREAD_KEY, id);
    else localStorage.removeItem(ACTIVE_THREAD_KEY);
  } catch {
    /* ignore */
  }
}

function threadTitleFromMessages(msgs: ChatMessage[]): string {
  const u = msgs.find((m) => m.role === "user" && m.content.trim());
  if (!u) return "New topic";
  const t = u.content.replace(/\s+/g, " ").trim();
  return t.length <= 48 ? t : `${t.slice(0, 46)}…`;
}

export function AIAssistant() {
  return <AIAssistantPanel />;
}

const SUGGESTIONS = [
  "Explain this topic in simple terms",
  "Give me a mnemonic for cranial nerves",
  "Summarize key points from my last lecture",
  "Suggest a 10-question quiz on cardiology",
];

export function AIAssistantPanel({
  embedded = false,
  fullPage = false,
  lectureId,
  lectureTitle,
}: {
  embedded?: boolean;
  fullPage?: boolean;
  lectureId?: string;
  lectureTitle?: string;
}) {
  const [open, setOpen] = useState(embedded);
  const [threads, setThreads] = useState<DrQThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [specializedModel, setSpecializedModel] = useState<string>("general");
  const [lastFailedPayload, setLastFailedPayload] = useState<{
    message: string;
    images: { mimeType: string; data: string }[];
    pdfs: { mimeType: "application/pdf"; data: string }[];
    history: { role: string; content: string }[];
  } | null>(null);
  const [attachImages, setAttachImages] = useState<ChatImage[]>([]);
  const [attachPdf, setAttachPdf] = useState<PendingPdf | null>(null);
  const [attachTexts, setAttachTexts] = useState<PendingText[]>([]);
  const [lang, setLang] = useState<"en" | "ar">(() => {
    try { return (typeof localStorage !== "undefined" && localStorage.getItem("medqs-lang") === "ar") ? "ar" : "en"; }
    catch { return "en"; }
  });
  
  // Customization & Admin State
  const [showSettings, setShowSettings] = useState(false);
  const [puterModel, setPuterModel] = useState<string>("gpt-4o");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [userBubbleColor, setUserBubbleColor] = useState<string>("bg-primary");

  useEffect(() => {
    try {
      const storedBg = localStorage.getItem("medqs-chat-bg");
      if (storedBg !== null) setBgImage(storedBg);
      const storedColor = localStorage.getItem("medqs-chat-color");
      if (storedColor !== null) setUserBubbleColor(storedColor);
      const storedPuter = localStorage.getItem("medqs-chat-puter-model");
      if (storedPuter !== null) setPuterModel(storedPuter);
    } catch {}
  }, []);

  const handleSetBg = (url: string | null) => {
    setBgImage(url);
    if (url) localStorage.setItem("medqs-chat-bg", url);
    else localStorage.removeItem("medqs-chat-bg");
  };

  const handleSetColor = (col: string) => {
    setUserBubbleColor(col);
    localStorage.setItem("medqs-chat-color", col);
  };

  const handleSetPuterModel = (mod: string) => {
    setPuterModel(mod);
    localStorage.setItem("medqs-chat-puter-model", mod);
  };

  const labels = {
    en: {
      drq: "MedOneX Expert",
      placeholder: "Ask a medical question...",
      thinking: "Thinking...",
      newTopic: "New topic",
      disclaimer: "Study aid only — not diagnosis or treatment.",
      storageNote: "Topics are stored on this device only",
      suggestions: SUGGESTIONS,
      retry: "Retry last message",
      limitReached: "Daily limit reached. Earn more points to unlock more messages.",
      rankPrefix: "messages today",
      unlimited: "Unlimited",
      howHelp: "How can I help you today?",
      medicalTutor: "Medical-only tutor. Attach images, a PDF (slides), or text notes. Your conversation topics are saved in this browser — not on our servers.",
      showTopics: "Show topics",
      hideTopics: "Hide topics",
      close: "Close assistant",
      context: "Lecture Context",
      model: "Expertise",
      models: {
        general: "MedOneX Expert",
        internal_medicine: "Internal Medicine",
        surgery: "Surgery",
        pediatrics: "Pediatrics",
        usmle: "USMLE / Boards"
      }
    },
    ar: {
      drq: "د. كيو",
      placeholder: "اسأل سؤالاً طبياً...",
      thinking: "جاري التفكير...",
      newTopic: "موضوع جديد",
      disclaimer: "وسيلة مساعدة للدراسة فقط - وليس للتشخيص أو العلاج.",
      storageNote: "يتم تخزين المحادثات على هذا الجهاز فقط",
      suggestions: [
        "اشرح هذا الموضوع بأسلوب مبسط",
        "أعطني طريقة لحفظ الأعصاب القحفية",
        "لخص النقاط الرئيسية من آخر محاضرة",
        "اقترح اختباراً من 10 أسئلة في الكارديو"
      ],
      retry: "إعادة محاولة إرسال الرسالة",
      limitReached: "تم الوصول للحد اليومي. احصل على نقاط أكثر لفتح المزيد من الرسائل.",
      rankPrefix: "رسالة اليوم",
      unlimited: "غير محدود",
      howHelp: "كيف يمكنني مساعدتك اليوم؟",
      medicalTutor: "مساعد طبي ذكي. يمكنك إرفاق صور، ملفات PDF، أو ملاحظات نصية. محادثاتك تُحفظ على متصفحك فقط وليس على خوادمنا.",
      showTopics: "عرض المواضيع",
      hideTopics: "إخفاء المواضيع",
      close: "إغلاق المساعد",
      context: "سياق المحاضرة",
      model: "التخصص",
      models: {
        general: "د. كيو العام",
        internal_medicine: "باطنة (Internal)",
        surgery: "جراحة (Surgery)",
        pediatrics: "أطفال (Pediatrics)",
        usmle: "معادلة (USMLE)"
      }
    }
  };

  const t = labels[lang];

  useLayoutEffect(() => {
    if (!fullPage || !embedded) return;
    if (typeof window === "undefined") return;
    setSidebarOpen(window.matchMedia("(min-width: 768px)").matches);
  }, [fullPage, embedded]);

  useEffect(() => {
    if (!fullPage || !embedded) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const fn = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [fullPage, embedded]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hydrateThreads = useCallback(() => {
    let list = loadThreads();
    if (list.length === 0) {
      const id = `t-${Date.now()}`;
      const row: DrQThread = { id, title: "New topic", updatedAt: Date.now(), messages: [] };
      list = [row];
      saveThreads(list);
      saveActiveId(id);
    }
    setThreads(list);
    const active = loadActiveId();
    const pick = active && list.some((t) => t.id === active) ? active : list[0]?.id ?? null;
    setActiveThreadId(pick);
    const cur = list.find((t) => t.id === pick);
    setMessages(cur?.messages ?? []);
  }, []);

  useEffect(() => {
    hydrateThreads();
  }, [hydrateThreads]);

  useEffect(() => {
    if (open && usage === null) {
      fetch(getAIEndpoint("/api/v1/ai/chat"))
        .then((r) => r.json())
        .then(setUsage)
        .catch(() => {});
    }
  }, [open, usage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
  }, [messages, loading]);

  const persistCurrentThread = useCallback(
    (nextMessages: ChatMessage[], tid: string | null) => {
      if (!tid) return;
      const list = loadThreads();
      const title = threadTitleFromMessages(nextMessages);
      const updatedAt = Date.now();
      const others = list.filter((t) => t.id !== tid);
      const row: DrQThread = { id: tid, title, updatedAt, messages: nextMessages };
      const merged = [row, ...others].sort((a, b) => b.updatedAt - a.updatedAt);
      saveThreads(merged);
      setThreads(merged);
    },
    []
  );

  useEffect(() => {
    if (!activeThreadId) return;
    const t = window.setTimeout(() => persistCurrentThread(messages, activeThreadId), 400);
    return () => clearTimeout(t);
  }, [messages, activeThreadId, persistCurrentThread]);

  const postChat = useCallback(
    async (
      text: string,
      images: { mimeType: string; data: string }[],
      pdfs: { mimeType: "application/pdf"; data: string }[],
      history: { role: string; content: string }[],
      currentLectureId?: string,
      currentModel?: string,
      currentPuterModel?: string
    ) => {
      const res = await fetch(getAIEndpoint("/api/v1/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          images: images.length ? images : undefined,
          pdfs: pdfs.length ? pdfs : undefined,
          conversationHistory: history.length ? history : undefined,
          lectureId: currentLectureId,
          specializedModel: currentModel !== "general" ? currentModel : undefined,
          puterModel: currentPuterModel,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content: `You've reached your daily limit of ${data.limit} messages for your rank (${data.rankLabel}).\n\nEarn more points to reach a higher rank and unlock more messages.`,
            },
          ]);
          return;
        }
        const errText =
          typeof data.error === "string" ? data.error : `Request failed (${res.status})`;
        throw new Error(errText);
      }

      const fallbackNote =
        typeof data.fallbackFrom === "string" && data.fallbackFrom
          ? `\n\n_Provider switched automatically: ${data.fallbackFrom} -> ${data.provider}_`
          : "";
      setMessages((m) => [...m, { role: "assistant", content: `${data.reply}${fallbackNote}` }]);
      if (data.used !== undefined) {
        setUsage((u) => (u ? { ...u, used: data.used } : null));
      }
    },
    []
  );

  function newThread() {
    const id = `t-${Date.now()}`;
    const row: DrQThread = { id, title: "New topic", updatedAt: Date.now(), messages: [] };
    const list = [row, ...loadThreads()];
    saveThreads(list);
    setThreads(list);
    setActiveThreadId(id);
    saveActiveId(id);
    setMessages([]);
    setInput("");
    setAttachImages([]);
    setAttachPdf(null);
    setAttachTexts([]);
    setLastFailedPayload(null);
  }

  function selectThread(id: string) {
    setActiveThreadId(id);
    saveActiveId(id);
    const list = loadThreads();
    setThreads(list);
    const t = list.find((x) => x.id === id);
    setMessages(t?.messages ?? []);
    setLastFailedPayload(null);
  }

  async function send() {
    const text = input.trim();
    const imgs = attachImages.map(({ mimeType, data }) => ({ mimeType, data }));
    const pdfs = attachPdf ? [{ mimeType: attachPdf.mimeType, data: attachPdf.data }] : [];
    const textExtras = attachTexts.map((t) => `_[File: ${t.name}]_\n${t.text}`).join("\n\n---\n\n");
    const combined = [text, textExtras].filter(Boolean).join("\n\n");
    if ((!combined && imgs.length === 0 && pdfs.length === 0) || loading) return;

    const userAttachments: ChatAttachment[] = attachImages.map((im) => ({
      kind: "image" as const,
      preview: im.preview,
    }));

    const userLine =
      combined +
      (attachPdf ? `\n_[PDF: ${attachPdf.name}]_` : "") +
      (imgs.length ? `\n_[${imgs.length} image${imgs.length > 1 ? "s" : ""}]_` : "");

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setInput("");
    setAttachImages([]);
    setAttachPdf(null);
    setAttachTexts([]);
    setMessages((m) => [...m, { role: "user", content: userLine, attachments: userAttachments }]);
    setLoading(true);
    setLastFailedPayload(null);
    try {
      await postChat(combined || "(See attached materials.)", imgs, pdfs, history, lectureId, specializedModel, puterModel);
    } catch (err) {
      setLastFailedPayload({
        message: combined || "(See attached materials.)",
        images: imgs,
        pdfs,
        history,
      });
      const detail =
        err instanceof Error && err.message && err.message !== "Request failed"
          ? err.message
          : null;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            detail ??
            "We could not reach the AI service. Check your connection, then tap **Retry** below or try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function retryLast() {
    if (!lastFailedPayload || loading) return;
    const { message, images, pdfs, history } = lastFailedPayload;
    setMessages((m) => (m[m.length - 1]?.role === "assistant" ? m.slice(0, -1) : m));
    setLoading(true);
    try {
      await postChat(message, images, pdfs, history);
      setLastFailedPayload(null);
    } catch (err) {
      const detail = err instanceof Error && err.message ? err.message : null;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            detail ??
            "Still having trouble. Wait a few seconds and tap **Retry** again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const remaining = usage ? (usage.limit === -1 ? "∞" : Math.max(0, usage.limit - usage.used)) : null;
  const limitReached = usage && usage.limit !== -1 && usage.used >= usage.limit;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const part = await fileToImagePart(file);
      setAttachImages((prev) => (prev.length >= 2 ? prev : [...prev, part]));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add image");
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.type === "application/pdf") {
        const p = await fileToPdfPart(file);
        setAttachPdf(p);
        toast.success("PDF attached (sent with Gemini)");
        return;
      }
      const t = await fileToTextSnippet(file);
      setAttachTexts((prev) => [...prev, t].slice(0, 3));
      toast.success("Text file added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read file");
    }
  }

  const panelShell = (inner: React.ReactNode) => (
    <div
      id="medqs-ai-panel"
      className={cn(
        "ai-glass-panel flex flex-col overflow-hidden transition-all duration-300",
        embedded
          ? fullPage
            ? "min-h-0 flex-1 border-0 bg-transparent shadow-none"
            : "rounded-2xl border border-primary/20 shadow-sm"
          : "fixed bottom-6 right-6 z-50 origin-bottom-right rounded-2xl border border-primary/20 shadow-2xl",
        !embedded && (open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"),
        lang === "ar" && "font-arabic"
      )}
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={
        embedded
          ? fullPage
            ? { width: "100%", height: "100%", minHeight: 0 }
            : { width: "100%", height: 640 }
          : { width: "min(calc(100vw - 2rem), 480px)", height: "min(calc(100dvh - 4rem), 680px)" }
      }
      role="dialog"
      aria-label={t.drq}
    >
      {inner}
    </div>
  );

  const header = (
    <div className="flex flex-col border-b border-primary/10 bg-primary/5">
      <div className="flex items-center gap-2.5 px-4 py-3">
        {fullPage && embedded ? (
          <button
            type="button"
            onClick={() => setSidebarOpen((s) => !s)}
            className="rounded-lg border border-primary/10 p-2 text-primary hover:bg-primary/10"
            aria-label={sidebarOpen ? t.hideTopics : t.showTopics}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
        ) : null}
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <div className="ai-glow-orb absolute" />
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-tight">{t.drq}</p>
          <div className="flex items-center gap-2">
            {usage && (
              <p className="text-[10px] text-muted-foreground">
                {usage.limit === -1
                  ? `${usage.rankLabel} · ${t.unlimited}`
                  : `${usage.used}/${usage.limit} ${t.rankPrefix} · ${usage.rankLabel}`}
              </p>
            )}
            <button
              onClick={() => setLang(l => {
                const next = l === "en" ? "ar" : "en";
                try {
                  localStorage.setItem("medqs-lang", next);
                  window.dispatchEvent(new StorageEvent("storage", { key: "medqs-lang" }));
                } catch {}
                return next;
              })}
              className="text-[9px] font-bold text-primary hover:underline uppercase"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>
        {fullPage && embedded ? (
          <button
            type="button"
            onClick={newThread}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.newTopic}
          </button>
        ) : null}
        
        <button
          type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn("rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors hover:bg-primary/10", showSettings ? "bg-primary/20 text-primary" : "text-muted-foreground")}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </button>

        {!embedded && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10"
            aria-label={t.close}
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {showSettings && (
        <div className="border-b border-primary/10 bg-black/40 p-3 space-y-4 animate-in fade-in slide-in-from-top-2">
          {usage?.isAdmin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin: Puter Model</label>
              <div className="flex flex-wrap gap-1.5">
                {["gpt-4o", "claude-3-7-sonnet-20250219", "gemini-2.5-pro", "deepseek-chat", "o3-mini", "llama-3.3-70b-versatile"].map(m => (
                  <button
                    key={m}
                    onClick={() => handleSetPuterModel(m)}
                    className={cn(
                      "px-2 py-1 rounded border text-[10px] font-bold transition-all",
                      puterModel === m ? "bg-primary text-primary-foreground border-transparent" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customization</label>
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleSetBg(bgImage ? null : "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop")}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {bgImage ? "Remove Background" : "Set Background"}
              </button>
              <div className="flex items-center gap-2">
                {["bg-primary", "bg-emerald-600", "bg-slate-800"].map(col => (
                  <button
                    key={col}
                    onClick={() => handleSetColor(col)}
                    className={cn("w-10 h-10 min-w-[44px] min-h-[44px] rounded-full border-2 border-white/30", col, userBubbleColor === col && "ring-2 ring-white")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 pb-3 gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <label className="text-[10px] font-bold text-muted-foreground/60 uppercase shrink-0">{t.model}:</label>
          <select
            value={specializedModel}
            onChange={(e) => setSpecializedModel(e.target.value)}
            className="flex-1 bg-white/50 dark:bg-black/20 border border-primary/10 rounded-lg px-2 py-1 text-[11px] font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {Object.keys(t.models).map((m) => (
              <option key={m} value={m}>{(t.models as any)[m]}</option>
            ))}
          </select>
        </div>
        {lectureId && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[10px] font-bold text-primary animate-in fade-in slide-in-from-top-1">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <span className="truncate max-w-[120px]">{lectureTitle || t.context}</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-2">
        <p className="line-clamp-2 text-[9px] leading-snug font-medium text-amber-600 dark:text-amber-400">
          {t.disclaimer}
        </p>
      </div>
    </div>
  );


  const messagesArea = (
    <div 
      className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 relative"
    >
      {bgImage && (
        <div 
          className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
        />
      )}
      <div className="relative z-10 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center mt-12">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 transition-transform hover:scale-110">
              <div className="ai-glow-orb absolute h-8 w-8" />
              <Sparkles className="h-8 w-8 text-primary" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold tracking-tight text-foreground">{t.howHelp}</p>
              <p className="mx-auto max-w-[320px] text-xs leading-relaxed text-muted-foreground font-medium">
                {t.medicalTutor}
              </p>
            </div>
            <div className="flex max-w-full flex-wrap justify-center gap-2 px-1">
              {t.suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="rounded-xl border border-primary/10 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary transition-all hover:bg-primary/10 hover:shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className="flex flex-col gap-1 max-w-[min(100%,520px)]">
              <div
                className={cn(
                  "rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? cn("rounded-br-sm text-primary-foreground", userBubbleColor)
                    : "rounded-bl-sm bg-muted/80 backdrop-blur-sm border border-white/5 text-foreground"
                )}
              >
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {m.attachments.map((a, j) =>
                      a.kind === "image" ? (
                        <div
                          key={j}
                          className="overflow-hidden rounded-lg border border-white/[0.02] bg-black/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.preview} alt="" className="max-h-40 max-w-[200px] object-contain" />
                        </div>
                      ) : null
                    )}
                  </div>
                )}
                {m.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                      ul: ({ children }) => <ul className="my-1 list-inside list-disc space-y-0.5">{children}</ul>,
                      li: ({ children }) => <li className="text-[13px]">{children}</li>,
                      code: ({ children }) => <code className="bg-black/30 px-1 py-0.5 rounded text-primary/90 text-xs">{children}</code>
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}
              </div>
              {m.role === "assistant" && (
                <div className="flex justify-start px-1">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      toast.success("Copied to clipboard");
                    }}
                    className="p-1 rounded hover:bg-white/5 text-muted-foreground transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-2.5 border" style={{ borderColor: "#50505020", backgroundColor: "#50505008" }}>
            <span className="text-sm font-bold" style={{ color: "#505050" }}>Thinking</span>
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: "#505050", animation: `pulse 1.2s ease-in-out ${i * 0.25}s infinite` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {lastFailedPayload && !loading && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={retryLast}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/10"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {t.retry}
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );

  const composer = (
    <div className="border-t border-border p-3">
      {limitReached ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-center text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          {t.limitReached}
        </div>
      ) : (
        <div className="space-y-2">
          {(attachImages.length > 0 || attachPdf || attachTexts.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {attachImages.map((im, idx) => (
                <div key={idx} className="relative h-14 w-14 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => setAttachImages((p) => p.filter((_, i) => i !== idx))}
                    className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {attachPdf ? (
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1 text-xs">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-[140px] truncate">{attachPdf.name}</span>
                  <button
                    type="button"
                    aria-label="Remove PDF"
                    onClick={() => setAttachPdf(null)}
                    className="rounded p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}
              {attachTexts.map((t, idx) => (
                <div
                  key={`${t.name}-${idx}`}
                  className="flex max-w-[200px] items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1 text-xs"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachTexts((p) => p.filter((_, i) => i !== idx))}
                    className="rounded p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onPickImage}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.md,.txt"
              className="hidden"
              onChange={onPickFile}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={attachImages.length >= 2 || loading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40"
              aria-label="Attach image"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40"
              aria-label="Attach file"
              title="PDF or text file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t.placeholder}
              rows={fullPage ? 2 : 1}
              aria-label={t.placeholder}
              className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-primary/10 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={
                loading ||
                (!input.trim() && attachImages.length === 0 && !attachPdf && attachTexts.length === 0)
              }
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              aria-label="Send message"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  function closeTopicsMobile() {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
  }

  function renderTopicsScrollArea() {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">No saved topics yet</p>
        ) : (
          threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                selectThread(t.id);
                closeTopicsMobile();
              }}
              className={cn(
                "mb-1 flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
                t.id === activeThreadId ? "bg-primary/15 text-foreground" : "hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="line-clamp-3">{t.title}</span>
            </button>
          ))
        )}
      </div>
    );
  }

  const topicsBottomSafe = "max-md:bottom-[max(1rem,env(safe-area-inset-bottom,0px))]";

  const sidebarDesktop =
    fullPage && embedded && sidebarOpen ? (
      <aside className="hidden min-h-0 w-60 min-w-[220px] flex-col border-r border-border bg-muted/20 md:flex">
        <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Your topics
        </div>
        {renderTopicsScrollArea()}
      </aside>
    ) : null;

  const sidebarMobileOverlay =
    fullPage && embedded && sidebarOpen ? (
      <>
        <button
          type="button"
          className={cn(
            "fixed inset-x-0 top-14 z-[138] bg-black/45 backdrop-blur-[1px] md:hidden",
            topicsBottomSafe
          )}
          aria-label="Close topics"
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={cn(
            "fixed left-0 top-14 z-[139] flex w-[min(300px,90vw)] flex-col border-r border-border bg-card shadow-2xl md:hidden",
            topicsBottomSafe
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold text-foreground">Topics</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              aria-label="Close topics"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {renderTopicsScrollArea()}
        </aside>
      </>
    ) : null;

  const mainColumn = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {header}
      {messagesArea}
      {composer}
    </div>
  );

  return (
    <>
      {!embedded && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300",
            open ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100 hover:scale-110"
          )}
          style={{ background: "hsl(var(--primary))" }}
          aria-expanded={open}
          aria-controls="medqs-ai-panel"
          title="Open study assistant"
        >
          <Sparkles className="h-6 w-6 text-white" aria-hidden />
          {usage && usage.used > 0 && usage.limit !== -1 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
              {remaining}
            </span>
          )}
        </button>
      )}

      {panelShell(
        fullPage && embedded ? (
          <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
            {sidebarMobileOverlay}
            {sidebarDesktop}
            {mainColumn}
          </div>
        ) : (
          mainColumn
        )
      )}
    </>
  );
}


