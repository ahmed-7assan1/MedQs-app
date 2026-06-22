"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ArrowPathIcon,
  ClipboardIcon,
  ShareIcon,
  BoltIcon,
  CheckIcon,
} from "@heroicons/react/16/solid";
import { 
  ArrowBendUpLeft,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  WarningCircle,
  Copy,
  Check,
  Lightning,
  ShareNetwork,
  Table,
  Quotes,
  Spinner,
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  X as XIcon,
  BookOpen,
  Link as LinkIcon
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatMessage, MessageReaction } from "@/hooks/useDrQChat";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
import { QuestionsBottomSheet, type QuestionData } from "./QuestionsBottomSheet";
import { FlashcardsBottomSheet, type FlashcardData } from "./FlashcardsBottomSheet";
import { ResourcesBottomSheet, type ResourceItem } from "./ResourcesBottomSheet";
import toast from "react-hot-toast";

interface MessageProps {
  message: ChatMessage;
  fontSize: number;
  userBubbleColor: string;
  aiBubbleColor: string;
  onReaction: (id: string, r: MessageReaction) => void;
  onRegenerate?: () => void;
  onReply?: (id: string, text: string) => void;
  onShare?: (text: string) => void;
  activePersona?: string;
  variant?: "bubble" | "flat";
}

// Check if text is English-only (no Arabic/Persian/Urdu chars)
function isEnglishOnly(text: string): boolean {
  return !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

const DrQMessageInner: React.FC<MessageProps> = ({
  message,
  fontSize,
  userBubbleColor,
  aiBubbleColor,
  onReaction,
  onRegenerate,
  onReply,
  onShare,
  activePersona = "explainer",
  variant = "bubble",
}) => {
  const isAI = message.role === "assistant";
  const [copying, setCopying] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ text: string, top: number, left: number } | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [isDark, _setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    _setIsDark(mq.matches || document.documentElement.classList.contains("dark"));
    const handler = () => _setIsDark(mq.matches || document.documentElement.classList.contains("dark"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Extract questions from message content (English-only)
  const parsedQuestions: QuestionData[] = useMemo(() => {
    const qs: QuestionData[] = [];
    const regex = /:::question\s*({[\s\S]*?})\s*:::/g;
    let match;
    while ((match = regex.exec(message.content)) !== null) {
      try {
        const raw = JSON.parse(match[1]);
        const qText = raw.question || raw.body || "";
        if (!isEnglishOnly(qText)) continue;
        qs.push({
          question: qText,
          options: raw.options || (raw.choices ? raw.choices.map((c: any) => c.text || c) : []),
          answer: raw.answer || "",
          explanation: raw.explanation || "",
        });
      } catch {}
    }
    return qs;
  }, [message.content]);

  const cleanContent = useMemo(() => {
    let text = message.content;
    if (parsedQuestions.length > 0) text = text.replace(/:::question\s*({[\s\S]*?})\s*:::/g, "").trim();
    return text;
  }, [message.content, parsedQuestions]);

  // Extract flashcards (English-only)
  const parsedFlashcards: FlashcardData[] = useMemo(() => {
    const fs: FlashcardData[] = [];
    const regex = /:::flashcard\s*({[\s\S]*?})\s*:::/g;
    let match;
    while ((match = regex.exec(message.content)) !== null) {
      try {
        const raw = JSON.parse(match[1]);
        if (!isEnglishOnly(raw.front || "") || !isEnglishOnly(raw.back || "")) continue;
        fs.push({ front: raw.front || "", back: raw.back || "" });
      } catch {}
    }
    return fs;
  }, [message.content]);

  const cleanContent2 = useMemo(() => {
    let text = cleanContent;
    if (parsedFlashcards.length > 0) text = text.replace(/:::flashcard\s*({[\s\S]*?})\s*:::/g, "").trim();
    return text;
  }, [cleanContent, parsedFlashcards]);

  // Extract resource URLs from content
  const parsedResources: ResourceItem[] = useMemo(() => {
    const items: ResourceItem[] = [];
    const urlRegex = /https?:\/\/[^\s()<>"\]]+/g;
    let match;
    while ((match = urlRegex.exec(message.content)) !== null) {
      const url = match[0].replace(/[.,;:!?]+$/, "");
      const title = url.length > 60 ? url.substring(0, 60) + "..." : url;
      if (!items.some((i) => i.url === url)) items.push({ url, title });
    }
    return items;
  }, [message.content]);

  // Handle text selection for Reply
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0 && isAI) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionRange({
          text: selection.toString().trim(),
          top: rect.top + window.scrollY - 48, // slightly higher
          left: rect.left + rect.width / 2
        });
      } else {
        setSelectionRange(null);
      }
    };
    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, [isAI]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopying(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopying(false), 2000);
  };

  const exportAsPdf = async () => {
    const el = contentRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.backgroundColor = "#ffffff";
      clone.style.color = "#1a1a1a";
      clone.style.padding = "28px";
      clone.style.fontFamily = "'Segoe UI', 'Tahoma', 'Noto Sans Arabic', system-ui, -apple-system, sans-serif";
      clone.style.lineHeight = "1.75";
      clone.style.fontSize = "15px";
      clone.style.direction = "auto";
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = el.offsetWidth + "px";
      clone.style.maxWidth = "800px";
      clone.style.zIndex = "-1";
      clone.style.borderRadius = "0";
      clone.style.boxShadow = "none";
      document.body.appendChild(clone);

      clone.querySelectorAll("*").forEach((child) => {
        const c = child as HTMLElement;
        if (c.style.color && c.style.color.includes("fff") || c.className.includes("text-white")) {
          c.style.color = "#1a1a1a";
        }
        if (c.className.includes("dark:")) {
          Array.from(c.classList).forEach((cls) => {
            if (cls.startsWith("dark:")) c.classList.remove(cls);
          });
        }
        if (c.style.backgroundColor && (c.style.backgroundColor === "transparent" || c.style.backgroundColor.includes("0)"))) {
          c.style.backgroundColor = "";
        }
        if (c.tagName === "A") {
          c.style.color = "#4f46e5";
        }
        if (c.tagName === "PRE" || c.tagName === "CODE") {
          c.style.backgroundColor = "#f5f5f5";
          c.style.color = "#1a1a1a";
          c.style.border = "1px solid #e5e7eb";
        }
        if (c.tagName === "TABLE") {
          c.style.borderCollapse = "collapse";
        }
        if (c.tagName === "TD" || c.tagName === "TH") {
          c.style.border = "1px solid #d1d5db";
          c.style.padding = "8px 12px";
        }
        if (c.tagName === "TH") {
          c.style.backgroundColor = "#f9fafb";
        }
        if (c.tagName === "IMG") {
          c.style.maxWidth = "100%";
          c.style.height = "auto";
          c.style.borderRadius = "8px";
        }
      });

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `medonex-response-${message.id.slice(0, 8)}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(clone)
        .save();

      document.body.removeChild(clone);
      toast.success("PDF exported successfully");
    } catch {
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={cn("flex group/msg relative", isAI ? "justify-start" : "justify-end")}>
      
      {/* Floating Selection Reply Button */}
      <AnimatePresence>
        {selectionRange && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[100] px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.4)] flex items-center gap-2 text-[14px] font-bold transition-colors border border-indigo-400/50"
            style={{ top: selectionRange.top, left: selectionRange.left, transform: "translateX(-50%)" }}
            onClick={(e) => {
              e.preventDefault();
              onReply?.(message.id, selectionRange.text);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <Quotes size={16} weight="fill" />
            Reply
          </motion.button>
        )}
      </AnimatePresence>

      <div className={cn("w-full flex flex-col gap-2", !isAI && "items-end")}>
        
        {/* Reply-to header */}
        {message.replyTo && (
           <div className={cn("flex items-center gap-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] mb-1", isAI ? "text-slate-400 dark:text-white/40" : "text-indigo-400/80")}>
              <ArrowBendUpLeft size={12} weight="bold" />
              Replying to quote
           </div>
        )}

        {/* Identity Header */}
        {variant !== "flat" && (
          isAI ? (
            <div className="flex items-center gap-3 px-1 mb-1">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shadow-md",
                `bg-gradient-to-br ${(DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).gradient}`
              )}>
                {React.cloneElement((DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).icon as React.ReactElement, { size: 16, weight: "fill", className: "text-white" })}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-800 dark:text-white tracking-tight">{(DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).name}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Medical Assistant</span>
              </div>
            </div>
          ) : null
        )}

        {message.isStreaming && !message.content ? (
          <div className="flex items-center gap-1.5 py-4">
            <span
              className="text-sm font-bold"
              style={{ color: "#505050" }}
            >
              Thinking
            </span>
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: "#505050" }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Files ABOVE bubble */}
            {message.files && message.files.length > 0 && (
              <div className={cn("flex mb-2", !isAI && "justify-end")}>
                <div className={cn("flex flex-wrap gap-2", !isAI ? "max-w-[75%]" : "max-w-[85%]")}>
                  {message.files.map((f, i) => {
                    const isImg = f.mimeType.startsWith("image/");
                    return isImg ? (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 shadow-md"
                      >
                        <img src={f.data} alt={f.name} className="w-full h-auto object-cover max-h-[260px] min-w-[120px]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-[11px] text-white/95 truncate block font-semibold drop-shadow-sm">{f.name}</span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-2xl border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm min-w-[200px]"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                          {f.name.match(/\.pdf$/i) ? "PDF" : f.name.match(/\.docx?$/i) ? "DOC" : f.name.match(/\.xlsx?$/i) ? "XLS" : f.name.match(/\.pptx?$/i) ? "PPT" : f.name.match(/\.zip$/i) || f.name.match(/\.rar$/i) ? "ZIP" : "FILE"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate text-gray-900 dark:text-white">{f.name}</p>
                          {f.size && (
                            <p className="text-[10px] font-medium text-slate-400 dark:text-white/40">{`${(f.size / 1024 / 1024).toFixed(1)} MB`}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            <motion.div 
              ref={contentRef}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "relative overflow-hidden transition-all",
                variant === "flat" && isAI 
                  ? "px-4 py-2.5 text-gray-900 dark:text-white" 
                  : "px-4 py-2.5 shadow-sm",
                !variant && isAI 
                  ? "rounded-3xl rounded-tl-sm border border-slate-200/60 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none" 
                  : "",
                !isAI 
                  ? "rounded-[28px] rounded-br-sm bg-[#F7F7F7] dark:bg-white/[0.04] text-gray-900 dark:text-white shadow-sm border border-black/[0.08] dark:border-white/[0.06]"
                  : ""
              )}
              style={{ 
                fontSize: `${fontSize}px`,
                backgroundColor: isAI && variant !== "flat" ? aiBubbleColor : undefined,
              }}
            >
              {/* ✦ AI Images Gallery ✦ */}
              {isAI && (() => {
                const directImgRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
                const topicImgRegex = /!\[(.*?)\]\s*\((image:[^\s)]+)\)/gi;
                const directMatches = [...message.content.matchAll(directImgRegex)];
                const topicMatches = [...message.content.matchAll(topicImgRegex)];
                if (directMatches.length === 0 && topicMatches.length === 0) return null;
                return (
                  <div className="mb-4">
                    <ImageGallerySection
                      directUrls={directMatches.map(m => m[1])}
                      searchTopics={topicMatches.map(m => m[1].trim())}
                    />
                  </div>
                );
              })()}

              {/* Markdown Content (images stripped) */}
              <div dir="auto" className={cn(
                "prose prose-base max-w-none ai-chat-prose prose-p:text-[16px] prose-p:font-normal prose-p:leading-[1.75] prose-p:mb-4 prose-headings:mt-8 prose-headings:mb-3 prose-ul:mt-3 prose-ul:mb-4 prose-li:mb-2 prose-ol:mt-3 prose-ol:mb-4 prose-hr:my-8 prose-pre:border prose-table:border prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2",
                isAI ? "prose-slate dark:prose-invert prose-pre:bg-slate-50 dark:prose-pre:bg-black/30 prose-pre:border-slate-200 dark:prose-pre:border-white/5 prose-table:border-slate-200 dark:prose-table:border-white/10 prose-th:bg-slate-50 dark:prose-th:bg-white/5" : "text-gray-900 dark:text-white prose-p:text-gray-900 dark:prose-p:text-white prose-headings:text-gray-900 dark:prose-headings:text-white prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-900 dark:prose-code:text-white"
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-500 underline underline-offset-2 hover:text-indigo-600 transition-colors">
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="relative group/table overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 my-4 bg-white dark:bg-transparent">
                         <button 
                           onClick={(e) => {
                             const table = e.currentTarget.nextElementSibling;
                             if (table) navigator.clipboard.writeText(table.textContent || "");
                             toast.success("Table content copied");
                           }}
                           className="absolute top-2 right-2 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg text-slate-500 dark:text-white/50 opacity-0 group-hover/table:opacity-100 transition-all z-10"
                         >
                           <Copy size={14} />
                         </button>
                         <div className="overflow-x-auto">
                           <table className="w-full text-start border-collapse">{children}</table>
                         </div>
                      </div>
                    ),
                    p: ({ children }) => {
                      const content = React.Children.toArray(children).join("");
                      if (content.includes(":::question")) {
                        return null;
                      }
                      if (content.includes(":::flashcard")) {
                        return null;
                      }
                      if (content.includes(":::checklist")) {
                        try {
                          const jsonStr = content.split(":::checklist")[1].split(":::")[0].trim();
                          const c = JSON.parse(jsonStr);
                          return <ChecklistCard c={c} />;
                        } catch { return <p className="mb-2 last:mb-0">{children}</p>; }
                      }
                      return <p className="mb-2 last:mb-0">{children}</p>;
                    },
                    code: ({ node, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      if (match) {
                         return (
                           <div className="relative group/code my-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{match[1]}</span>
                                 <button onClick={() => { navigator.clipboard.writeText(String(children)); toast.success("Code copied"); }} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white">
                                    <Copy size={14} />
                                 </button>
                              </div>
                              <pre className="p-4 overflow-x-auto text-[13px] bg-slate-50 dark:bg-black/40 text-slate-800 dark:text-white"><code {...props}>{children}</code></pre>
                           </div>
                         );
                      }
                      return <code className={cn("px-1.5 py-0.5 rounded font-bold text-[0.9em]", isAI ? "bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-purple-300" : "bg-black/[0.08] dark:bg-white/20 text-gray-900 dark:text-white")} {...props}>{children}</code>;
                    }
                  }}
                >
                  {cleanContent2.replace(/!\[.*?\]\((?:https?:\/\/)?[^\s)]+\)|!\[.*?\]\s*\(image:[^\s)]+\)/g, "").trim()}
                </ReactMarkdown>
              </div>

              {/* Questions summary card */}
              {isAI && parsedQuestions.length > 0 && !message.isStreaming && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowQuestions(true)}
                  className="mt-4 w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/15"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20">
                    <FileText size={16} weight="bold" className="text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {parsedQuestions.length} Question{parsedQuestions.length > 1 ? "s" : ""} Generated
                    </p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Click to view all questions
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-indigo-500 text-white dark:bg-indigo-500/20 dark:text-indigo-300">
                    View
                  </div>
                </motion.button>
              )}

              {/* Flashcards summary card */}
              {isAI && parsedFlashcards.length > 0 && !message.isStreaming && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowFlashcards(true)}
                  className="mt-3 w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/15"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-500/20">
                    <BookOpen size={16} weight="bold" className="text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {parsedFlashcards.length} Flashcard{parsedFlashcards.length > 1 ? "s" : ""} Generated
                    </p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Tap card to flip, save to spaced repetition
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-amber-500 text-white dark:bg-amber-500/20 dark:text-amber-300">
                    View
                  </div>
                </motion.button>
              )}

              {/* Resources icon */}
              {isAI && parsedResources.length > 0 && !message.isStreaming && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowResources(true)}
                  className={cn(
                    "mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                    isDark
                      ? "border-white/10 text-gray-400 hover:bg-white/5"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <LinkIcon size={14} />
                  {parsedResources.length} Resource{parsedResources.length > 1 ? "s" : ""}
                </motion.button>
              )}

              {/* Streaming Indicator - subtle wave dots */}
              {message.isStreaming && (
                <div className="flex items-center gap-2.5 mt-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* AI Message Actions */}
            {isAI && !message.isStreaming && (
              <div className={cn(
                "flex items-center gap-0.5 z-10",
                variant === "flat" 
                  ? "mt-5"
                  : "absolute -bottom-5 right-4 opacity-0 group-hover/msg:opacity-100"
              )}>
                <button 
                  onClick={() => onReaction(message.id, message.reaction === "like" ? null : "like")}
                  className={cn("p-1.5 rounded-lg transition-all", message.reaction === "like" ? "text-emerald-500" : "text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white")}
                >
                  <HandThumbUpIcon className={cn("w-4 h-4", message.reaction === "like" ? "text-emerald-500" : "")} />
                </button>
                <button 
                  onClick={() => onReaction(message.id, message.reaction === "dislike" ? null : "dislike")}
                  className={cn("p-1.5 rounded-lg transition-all", message.reaction === "dislike" ? "text-rose-500" : "text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white")}
                >
                  <HandThumbDownIcon className={cn("w-4 h-4", message.reaction === "dislike" ? "text-rose-500" : "")} />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                <button onClick={handleCopy} aria-label="Copy message" className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-all">
                  {copying ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <ClipboardIcon className="w-4 h-4" />}
                </button>
                <button onClick={onRegenerate} aria-label="Regenerate response" className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-all">
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onShare?.(message.content)} aria-label="Share message" className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-all">
                  <ShareIcon className="w-4 h-4" />
                </button>
                <button onClick={exportAsPdf} disabled={exporting} aria-label="Export as PDF" className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-all disabled:opacity-50">
                  {exporting ? <Spinner size={14} /> : <FileText size={16} weight="fill" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showQuestions && createPortal(
        <QuestionsBottomSheet
          isOpen={showQuestions}
          onClose={() => setShowQuestions(false)}
          questions={parsedQuestions}
          isDark={isDark}
        />,
        document.body
      )}
      {showFlashcards && createPortal(
        <FlashcardsBottomSheet
          isOpen={showFlashcards}
          onClose={() => setShowFlashcards(false)}
          flashcards={parsedFlashcards}
          isDark={isDark}
        />,
        document.body
      )}
      {showResources && createPortal(
        <ResourcesBottomSheet
          isOpen={showResources}
          onClose={() => setShowResources(false)}
          resources={parsedResources}
          isDark={isDark}
        />,
        document.body
      )}
    </div>
  );
};

export const DrQMessage = React.memo(DrQMessageInner);

// ─── Image Gallery Section (handles direct URLs + Search queries) ────────

function ImageGallerySection({ directUrls, searchTopics }: { directUrls: string[]; searchTopics: string[] }) {
  type GalleryImg = { url: string; fallbacks: string[] };
  const [galleryImages, setGalleryImages] = useState<GalleryImg[]>([]);
  const [loading, setLoading] = useState(searchTopics.length > 0);

  useEffect(() => {
    const direct: GalleryImg[] = directUrls.map(u => ({
      url: u,
      fallbacks: [`/api/v1/images/proxy?url=${encodeURIComponent(u)}`],
    }));

    if (searchTopics.length === 0) {
      setGalleryImages(direct);
      return;
    }

    let cancelled = false;
    Promise.all(searchTopics.map(topic =>
      fetch(`/api/v1/images/search?q=${encodeURIComponent(topic)}&max=4`)
        .then(r => r.json())
        .then(data => (data.images || []).map((img: any) => img.url))
        .catch(() => [])
    )).then((results) => {
      if (cancelled) return;
      const searched: GalleryImg[] = results.flat().filter(Boolean).map(u => ({
        url: u,
        fallbacks: [`/api/v1/images/proxy?url=${encodeURIComponent(u)}`],
      }));
      setGalleryImages([...direct, ...searched]);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [directUrls, searchTopics]);

  const handleImgError = useCallback((_e: React.SyntheticEvent<HTMLImageElement>, idx: number) => {
    setGalleryImages(prev => {
      const img = prev[idx];
      if (!img || img.fallbacks.length === 0) return prev;
      const [nextUrl, ...rest] = img.fallbacks;
      const next = [...prev];
      next[idx] = { url: nextUrl, fallbacks: rest };
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
          <Spinner size={14} /> Searching real images...
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Array.from({ length: Math.min(searchTopics.length * 2, 6) }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-200 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const validImages = galleryImages.map(g => g.url).filter(Boolean);
  if (validImages.length === 0) return null;
  return <AiImageGallery images={validImages} onError={handleImgError} />;
}

// ─── AI Image Gallery ─────────────────────────────────────────────────────

function AiImageGallery({ images, onError }: { images: string[]; onError?: (e: React.SyntheticEvent<HTMLImageElement>, idx: number) => void }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const open = (i: number) => { setActiveIdx(i); setLightboxOpen(true); };

  if (images.length === 1) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg max-w-xl"
        >
          <img
            src={images[0]}
            alt="AI generated image"
            className="w-full h-auto object-cover cursor-pointer transition-transform duration-500 group-hover:scale-[1.02]"
            onClick={() => open(0)}
            loading="lazy"
            onError={(e) => onError?.(e, 0)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
          <button
            onClick={() => open(0)}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/80 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60"
          >
            <ImageIcon size={16} weight="bold" />
          </button>
        </motion.div>
        <Lightbox
          images={images}
          activeIdx={activeIdx}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setActiveIdx(i => Math.max(0, i - 1))}
          onNext={() => setActiveIdx(i => Math.min(images.length - 1, i + 1))}
          onError={onError}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-xl">
        {images.map((url, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 20 }}
            className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-md aspect-square cursor-pointer"
            onClick={() => open(i)}
          >
            <img
              src={url}
              alt={`Generated image ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={(e) => onError?.(e, i)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold">
              {i + 1}/{images.length}
            </div>
          </motion.div>
        ))}
      </div>
      <Lightbox
        images={images}
        activeIdx={activeIdx}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setActiveIdx(i => Math.max(0, i - 1))}
        onNext={() => setActiveIdx(i => Math.min(images.length - 1, i + 1))}
        onError={onError}
      />
    </>
  );
}

function Lightbox({ images, activeIdx, isOpen, onClose, onPrev, onNext, onError }: {
  images: string[];
  activeIdx: number;
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>, idx: number) => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <XIcon size={20} weight="bold" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-bold z-10">
            {activeIdx + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                disabled={activeIdx === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CaretLeft size={24} weight="bold" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                disabled={activeIdx === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CaretRight size={24} weight="bold" />
              </button>
            </>
          )}

          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeIdx]}
              alt={`Image ${activeIdx + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              draggable={false}
              onError={(e) => onError?.(e, activeIdx)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Interactive Checklist Component ──────────────────────────────────────

function ChecklistCard({ c }: { c: { title: string, items: { text: string, completed?: boolean }[] } }) {
  const [items, setItems] = useState(c.items.map(item => ({ ...item, completed: !!item.completed })));

  const toggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index].completed = !newItems[index].completed;
    setItems(newItems);
  };

  const progress = Math.round((items.filter(i => i.completed).length / items.length) * 100);

  return (
    <div className="my-6 p-6 rounded-[24px] bg-card border border-emerald-500/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner border border-emerald-100 dark:border-transparent">
             <CheckCircle size={20} weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em]">OSCE Evaluation</span>
            <span className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">{c.title}</span>
          </div>
        </div>
        <div className="text-end">
           <span className="text-[15px] font-black text-emerald-500 dark:text-emerald-400">{progress}%</span>
           <div className="w-20 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full mt-1 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-emerald-500" />
           </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggleItem(i)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-start group border border-transparent",
              item.completed ? "bg-emerald-50 dark:bg-emerald-500/5 text-emerald-700 dark:text-white/90 border-emerald-100 dark:border-transparent" : "bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/5"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
              item.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 group-hover:border-slate-400 dark:group-hover:border-white/30"
            )}>
              {item.completed && <Check size={12} weight="bold" className="text-white" />}
            </div>
            <span className={cn("text-[14px] font-semibold transition-all", item.completed && "line-through opacity-50")}>
              {item.text}
            </span>
          </button>
        ))}
      </div>
      
      {progress === 100 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
           <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Protocol Fully Completed 🏆</span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Practice Question Component ───────────────────────────────────────────

function QuestionCard({ q, onSave, onShare }: { q: { question: string, options: string[], answer: string, explanation?: string }, onSave: () => void, onShare: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const isCorrect = selected === q.answer;

  return (
    <div className="my-6 p-6 rounded-[24px] bg-card border border-indigo-200 dark:border-indigo-500/20 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner border border-indigo-100 dark:border-transparent">
             <Lightning size={20} weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em]">Generated Assessment</span>
            <span className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">Platform Question</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onSave} aria-label="Save question" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-white/40 hover:text-indigo-500 dark:hover:text-white transition-all"><BookmarkSimple size={18} /></button>
           <button onClick={onShare} aria-label="Share question" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-white/40 hover:text-indigo-500 dark:hover:text-white transition-all"><ShareNetwork size={18} /></button>
        </div>
      </div>
      
      <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">{q.question}</h3>
      
      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={selected !== null}
            onClick={() => setSelected(opt)}
            className={cn(
              "w-full text-start px-5 py-4 rounded-2xl border transition-all flex items-center justify-between group",
              selected === null ? "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/5" : 
              opt === q.answer ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-bold" :
              selected === opt ? "bg-rose-50 dark:bg-rose-500/10 border-rose-500/30 dark:border-rose-500/50 text-rose-700 dark:text-rose-400 font-bold" : "bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5 opacity-50"
            )}
          >
            <span className="text-[14px] font-medium leading-normal">{opt}</span>
            {selected !== null && opt === q.answer && <CheckCircle size={20} weight="fill" className="flex-shrink-0" />}
            {selected === opt && opt !== q.answer && <WarningCircle size={20} weight="fill" className="flex-shrink-0" />}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10"
          >
            <div className={cn(
              "p-4 rounded-2xl border flex flex-col gap-2",
              isCorrect ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/10"
            )}>
              <div className="flex items-center gap-2">
                {isCorrect ? <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-500" /> : <WarningCircle size={18} className="text-rose-600 dark:text-rose-500" />}
                <span className={cn("text-[13px] font-black uppercase tracking-widest", isCorrect ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                  {isCorrect ? "Correct!" : "Incorrect"}
                </span>
              </div>
              {q.explanation && (
                <p className="text-[13px] text-slate-600 dark:text-white/70 leading-relaxed font-semibold mt-1">{q.explanation}</p>
              )}
            </div>
            
            <button 
              onClick={() => { setSelected(null); }}
              className="mt-4 w-full py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[12px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
