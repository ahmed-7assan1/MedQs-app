"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, Loader2, ChevronDown, RotateCcw, ImagePlus, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UsageInfo {
  used: number;
  limit: number;
  rankLabel: string;
}

type ChatImage = { mimeType: string; data: string; preview: string };

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

export function AIAssistant() {
  return <AIAssistantPanel />;
}

const SUGGESTIONS = [
  "Explain this question in simple terms",
  "Give me a mnemonic for cranial nerves",
  "Summarize key points from my last lecture",
  "Suggest a 10-question quiz on cardiology",
];

export function AIAssistantPanel({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [lastFailedPayload, setLastFailedPayload] = useState<{
    message: string;
    images: { mimeType: string; data: string }[];
  } | null>(null);
  const [attachImages, setAttachImages] = useState<ChatImage[]>([]);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (open && usage === null) {
      fetch("/api/v1/ai/chat")
        .then((r) => r.json())
        .then(setUsage)
        .catch(() => {});
    }
  }, [open, usage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const postChat = useCallback(
    async (text: string, images: { mimeType: string; data: string }[]) => {
    const res = await fetch("/api/v1/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, images: images.length ? images : undefined }),
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
        typeof data.error === "string"
          ? data.error
          : `Request failed (${res.status})`;
      throw new Error(errText);
    }

    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    if (data.used !== undefined) {
      setUsage((u) => (u ? { ...u, used: data.used } : null));
    }
  },
  []
  );

  async function send() {
    const text = input.trim();
    const imgs = attachImages.map(({ mimeType, data }) => ({ mimeType, data }));
    if ((!text && imgs.length === 0) || loading) return;

    const userLine =
      text +
      (imgs.length ? `\n_[${imgs.length} image${imgs.length > 1 ? "s" : ""} attached]_` : "");
    setInput("");
    setAttachImages([]);
    setMessages((m) => [...m, { role: "user", content: userLine }]);
    setLoading(true);
    setLastFailedPayload(null);
    try {
      await postChat(text, imgs);
    } catch (err) {
      setLastFailedPayload({ message: text, images: imgs });
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
    const { message, images } = lastFailedPayload;
    setMessages((m) => (m[m.length - 1]?.role === "assistant" ? m.slice(0, -1) : m));
    setLoading(true);
    try {
      await postChat(message, images);
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

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop();
      recRef.current = null;
      setListening(false);
      return;
    }
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        start: () => void;
        stop: () => void;
        onresult: ((ev: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
      webkitSpeechRecognition?: new () => InstanceType<NonNullable<(typeof w)["SpeechRecognition"]>>;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice typing needs Chrome or Edge (Web Speech API).");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript?.trim();
      if (said) setInput((v) => (v ? `${v} ${said}` : said));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
    recRef.current = { stop: () => recognition.stop() };
  }

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

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

      <div
        id="medqs-ai-panel"
        className={cn(
          embedded
            ? "flex flex-col rounded-2xl border border-border bg-card shadow-sm"
            : "fixed bottom-6 right-6 z-50 flex origin-bottom-right flex-col rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        )}
        style={{ width: embedded ? "100%" : 360, height: embedded ? 640 : 520 }}
        role="dialog"
        aria-label="AI study assistant"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Dr. Q</p>
            {usage && (
              <p className="text-[10px] text-muted-foreground">
                {usage.limit === -1
                  ? `${usage.rankLabel} · Unlimited`
                  : `${usage.used}/${usage.limit} messages today · ${usage.rankLabel}`}
              </p>
            )}
          </div>
          {!embedded && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Close assistant"
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold">Study assistant</p>
                <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
                  Medical-only tutor. Attach up to 2 images or use the mic (Chrome/Edge) to dictate.
                </p>
              </div>
              <div className="flex max-w-full flex-wrap justify-center gap-1.5 px-1">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setInput(q);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground"
                )}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="my-1 list-inside list-disc space-y-0.5">{children}</ul>,
                      li: ({ children }) => <li className="text-[13px]">{children}</li>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
                <span className="text-xs text-muted-foreground">Thinking…</span>
              </div>
            </div>
          )}

          {lastFailedPayload && !loading && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={retryLast}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-primary transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Retry last message
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3">
          {limitReached ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-center text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              Daily limit reached. Earn more points to unlock more messages.
            </div>
          ) : (
            <div className="space-y-2">
              {attachImages.length > 0 && (
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
                </div>
              )}
              <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onPickImage} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={attachImages.length >= 2 || loading}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40"
                aria-label="Attach image"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleVoice}
                disabled={loading}
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-muted-foreground hover:bg-muted disabled:opacity-40",
                  listening ? "border-red-300 bg-red-50 text-red-600" : "border-border bg-background"
                )}
                aria-label={listening ? "Stop voice input" : "Voice input"}
              >
                <Mic className={cn("h-4 w-4", listening && "animate-pulse")} />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask a medical question…"
                rows={1}
                aria-label="Message to assistant"
                className="max-h-24 min-h-[42px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || (!input.trim() && attachImages.length === 0)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                aria-label="Send message"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
