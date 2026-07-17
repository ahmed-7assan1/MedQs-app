import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  Plus,
  Mic,
  ChevronDown,
  MoreHorizontal,
  Link2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Check,
  X,
  FileText,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";
import {
  createThreadId,
  deriveTitle,
  getThread,
  upsertThread,
} from "@/lib/threads";
import { GrokLogo } from "./grok-logo";
import { cn } from "@/lib/utils";
import { QuizBlock, FlashcardsBlock } from "./quiz-block";

type Props = { threadId: string | null };

type Attachment = { name: string; mediaType: string; url: string };

const SUGGESTIONS = [
  "اشرح لي الحوسبة الكمية ببساطة",
  "اعمل لي اختبار من 5 أسئلة عن التاريخ الإسلامي",
  "اعمل لي فلاش كاردز لتعلم كلمات إنجليزية",
  "اكتب لي قصيدة قصيرة عن البحر",
];

export function ChatView({ threadId }: Props) {
  const [input, setInput] = useState("");
  const [modelLabel] = useState("Fast");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeIdRef = useRef<string | null>(threadId);

  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!threadId) return [];
    return getThread(threadId)?.messages ?? [];
  }, [threadId]);

  const chatId = threadId ?? "new";

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, stop, regenerate } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onError: (err) => console.error(err),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Persist messages after each change
  useEffect(() => {
    const id = activeIdRef.current;
    if (!id || messages.length === 0) return;
    upsertThread({
      id,
      title: deriveTitle(messages),
      updatedAt: Date.now(),
      messages,
    });
    window.dispatchEvent(new Event("threads-updated"));
  }, [messages, status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const empty = messages.length === 0;

  async function readFilesAsAttachments(files: FileList | File[]) {
    const arr = Array.from(files);
    const results: Attachment[] = [];
    for (const f of arr) {
      if (f.size > 15 * 1024 * 1024) {
        console.warn("File too large, skipping:", f.name);
        continue;
      }
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      results.push({ name: f.name, mediaType: f.type || "application/octet-stream", url });
    }
    setAttachments((prev) => [...prev, ...results]);
  }

  function handleSend(text: string) {
    const value = text.trim();
    if ((!value && attachments.length === 0) || isLoading) return;

    if (!activeIdRef.current) {
      const newId = createThreadId();
      activeIdRef.current = newId;
      upsertThread({
        id: newId,
        title: value.length > 40 ? value.slice(0, 40) + "…" : value,
        updatedAt: Date.now(),
        messages: [],
      });
      window.dispatchEvent(new Event("threads-updated"));
      window.history.replaceState(null, "", `/${newId}`);
    }

    sendMessage({
      text: value,
      files: attachments.map((a) => ({
        type: "file" as const,
        mediaType: a.mediaType,
        url: a.url,
        filename: a.name,
      })),
    });
    setInput("");
    setAttachments([]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend(input);
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-start gap-2 px-4 py-3">
        <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent">
          <Link2 className="h-4 w-4" />
        </button>
        <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4">
            <div className="mb-8 flex items-center gap-3">
              <GrokLogo className="h-12 w-12" />
              <span className="text-5xl font-semibold tracking-tight">Grok</span>
            </div>
            <Composer
              input={input}
              setInput={setInput}
              onSubmit={onSubmit}
              isLoading={isLoading}
              onStop={stop}
              modelLabel={modelLabel}
              textareaRef={textareaRef}
              attachments={attachments}
              onAddFiles={readFilesAsAttachments}
              onRemoveAttachment={(i) =>
                setAttachments((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-border bg-card/50 px-3.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 pb-40 pt-4">
            {messages.map((m, idx) => {
              const isLastAssistant =
                m.role === "assistant" && idx === messages.length - 1;
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  canRegenerate={isLastAssistant && !isLoading}
                  onRegenerate={() => regenerate()}
                />
              );
            })}
            {status === "submitted" && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                Thinking…
              </div>
            )}
          </div>
        )}
      </div>

      {!empty && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-6 pt-10">
          <div className="pointer-events-auto mx-auto max-w-3xl">
            <Composer
              input={input}
              setInput={setInput}
              onSubmit={onSubmit}
              isLoading={isLoading}
              onStop={stop}
              modelLabel={modelLabel}
              textareaRef={textareaRef}
              placeholder="Ask anything"
              attachments={attachments}
              onAddFiles={readFilesAsAttachments}
              onRemoveAttachment={(i) =>
                setAttachments((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  pre({ children }) {
    const child = Array.isArray(children) ? children[0] : children;
    const props = (child as { props?: { className?: string; children?: unknown } } | undefined)?.props;
    const className = props?.className ?? "";
    const raw = extractText(props?.children);
    if (className.includes("language-quiz")) return <QuizBlock raw={raw} />;
    if (className.includes("language-flashcards")) return <FlashcardsBlock raw={raw} />;
    return <pre className="overflow-x-auto rounded-xl bg-black/50 p-4 text-sm">{children}</pre>;
  },
  code({ className, children, ...props }) {
    const isInline = !className?.includes("language-");
    return (
      <code
        className={cn(
          isInline
            ? "rounded-md bg-white/10 px-1.5 py-0.5 text-sm"
            : "font-mono text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-accent/60 text-foreground">{children}</thead>;
  },
  th({ children }) {
    return <th className="border-b border-border px-3 py-2 text-start font-semibold">{children}</th>;
  },
  td({ children }) {
    return <td className="border-b border-border px-3 py-2">{children}</td>;
  },
  tr({ children }) {
    return <tr className="last:[&>td]:border-b-0">{children}</tr>;
  },
  ol({ children }) {
    return <ol className="list-decimal space-y-1 ps-5">{children}</ol>;
  },
  ul({ children }) {
    return <ul className="list-disc space-y-1 ps-5">{children}</ul>;
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  h1({ children }) {
    return <h1 className="mb-2 mt-4 text-2xl font-bold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-2 mt-4 text-xl font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-2 mt-3 text-lg font-semibold">{children}</h3>;
  },
  h4({ children }) {
    return <h4 className="mb-1 mt-2 text-base font-semibold">{children}</h4>;
  },
  p({ children }) {
    return <p className="mb-3 last:mb-0">{children}</p>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-s-4 border-muted ps-4 italic text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  hr() {
    return <hr className="my-4 border-border" />;
  },
  a({ children, href }) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">
        {children}
      </a>
    );
  },
  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>;
  },
};

function extractText(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props;
    return extractText(props?.children);
  }
  return "";
}

function MessageBubble({
  message,
  canRegenerate,
  onRegenerate,
}: {
  message: UIMessage;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);

  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  const fileParts = message.parts.filter(
    (p): p is Extract<UIMessage["parts"][number], { type: "file" }> =>
      p.type === "file",
  );
  const isUser = message.role === "user";

  function copyText() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (isUser) {
    return (
    <div className="mb-6 flex justify-start">
        <div className="max-w-[80%] space-y-2">
          {fileParts.length > 0 && (
            <div className="flex flex-wrap justify-start gap-2">
              {fileParts.map((p, i) => (
                <AttachmentPreview
                  key={i}
                  name={p.filename ?? "file"}
                  mediaType={p.mediaType}
                  url={p.url}
                />
              ))}
            </div>
          )}
          {text && (
            <div className="rounded-2xl bg-card px-4 py-2.5 text-card-foreground">
              <div dir="auto" className="whitespace-pre-wrap text-[15px] leading-relaxed">
                {text}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="group mb-6">
      <div dir="auto" className="prose prose-invert max-w-none text-[15px] leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {text}
        </ReactMarkdown>
      </div>
      {text && (
        <div className="mt-2 flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
          <ActionButton onClick={copyText} label="Copy">
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </ActionButton>
          <ActionButton
            onClick={() => setReaction(reaction === "up" ? null : "up")}
            label="Good response"
            active={reaction === "up"}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </ActionButton>
          <ActionButton
            onClick={() => setReaction(reaction === "down" ? null : "down")}
            label="Bad response"
            active={reaction === "down"}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </ActionButton>
          {canRegenerate && (
            <ActionButton onClick={onRegenerate} label="Regenerate">
              <RefreshCw className="h-3.5 w-3.5" />
            </ActionButton>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  active,
  children,
}: {
  onClick?: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function AttachmentPreview({
  name,
  mediaType,
  url,
}: {
  name: string;
  mediaType: string;
  url: string;
}) {
  const isImage = mediaType.startsWith("image/");
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img
          src={url}
          alt={name}
          className="max-h-64 max-w-full rounded-xl border border-border object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      download={name}
      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
    >
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="truncate max-w-[200px]">{name}</span>
    </a>
  );
}

function Composer({
  input,
  setInput,
  onSubmit,
  isLoading,
  onStop,
  modelLabel,
  textareaRef,
  placeholder = "What do you want to know?",
  attachments,
  onAddFiles,
  onRemoveAttachment,
}: {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  modelLabel: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  attachments: Attachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveAttachment: (index: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.files);
    if (items.length > 0) {
      e.preventDefault();
      onAddFiles(items);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) onAddFiles(e.dataTransfer.files);
  }

  return (
    <form
      onSubmit={onSubmit}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "w-full rounded-3xl border border-border bg-card px-3 py-2.5 shadow-lg",
      )}
    >
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div
              key={i}
              className="group/att relative flex items-center gap-2 rounded-lg border border-border bg-background/50 px-2 py-1.5"
            >
              {a.mediaType.startsWith("image/") ? (
                <img
                  src={a.url}
                  alt={a.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-accent">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="max-w-[140px] truncate text-xs">{a.name}</div>
              <button
                type="button"
                onClick={() => onRemoveAttachment(i)}
                className="ms-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            aria-label="Attach"
          >
            <Plus className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute bottom-10 start-0 z-50 w-52 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    imageInputRef.current?.click();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent"
                >
                  <ImageIcon className="h-4 w-4" />
                  Upload photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent"
                >
                  <Paperclip className="h-4 w-4" />
                  Upload file
                </button>
              </div>
            </>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) onAddFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) onAddFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="max-h-40 min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1.5 text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <div className="mb-0.5 flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
        >
          {modelLabel}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Voice"
        >
          <Mic className="h-4 w-4" />
        </button>
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label="Stop"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() && attachments.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
        </div>
      </div>
    </form>
  );
}