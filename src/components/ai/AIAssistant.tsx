"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UsageInfo {
  used: number;
  limit: number;
  rankLabel: string;
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
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  async function postChat(text: string) {
    const res = await fetch("/api/v1/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
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
      throw new Error(typeof data.error === "string" ? data.error : "Request failed");
    }

    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    if (data.used !== undefined) {
      setUsage((u) => (u ? { ...u, used: data.used } : null));
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    setLastFailedMessage(null);
    try {
      await postChat(text);
    } catch {
      setLastFailedMessage(text);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "We could not reach the AI service. Check your connection, then tap **Retry** below or try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function retryLast() {
    if (!lastFailedMessage || loading) return;
    setMessages((m) => (m[m.length - 1]?.role === "assistant" ? m.slice(0, -1) : m));
    setLoading(true);
    try {
      await postChat(lastFailedMessage);
      setLastFailedMessage(null);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Still having trouble. Wait a few seconds and tap **Retry** again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const remaining = usage ? (usage.limit === -1 ? "∞" : Math.max(0, usage.limit - usage.used)) : null;
  const limitReached = usage && usage.limit !== -1 && usage.used >= usage.limit;

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
                  Explain questions, simplify concepts, mnemonics, lecture summaries, and quiz ideas.
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

          {lastFailedMessage && !loading && (
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
            <div className="flex items-end gap-2">
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
                onClick={send}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                aria-label="Send message"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
