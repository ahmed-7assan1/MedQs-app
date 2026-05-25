"use client";

import React, { useState, useEffect } from "react";
import { 
  ThumbsUp, 
  ThumbsDown, 
  ArrowClockwise, 
  Copy, 
  ArrowBendUpLeft,
  ShareNetwork,
  FileText,
  Image as ImageIcon,
  Check,
  CheckCircle,
  WarningCircle,
  Table,
  Lightning,
  Quotes,
  Spinner,
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  X as XIcon
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatMessage, MessageReaction } from "@/hooks/useDrQChat";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
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
  const [selectionRange, setSelectionRange] = useState<{ text: string, top: number, left: number } | null>(null);

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

      <div className={cn("max-w-[90%] md:max-w-[85%] flex flex-col gap-2", !isAI && "items-end")}>
        
        {/* Reply-to header */}
        {message.replyTo && (
           <div className={cn("flex items-center gap-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] mb-1", isAI ? "text-slate-400 dark:text-white/40" : "text-indigo-400/80")}>
              <ArrowBendUpLeft size={12} weight="bold" />
              Replying to quote
           </div>
        )}

        {/* Persona Header for AI (hidden in flat mode — rendered by parent) */}
        {isAI && variant !== "flat" && (
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
        )}

        {message.isStreaming && !message.content ? (
          /* Initial Streaming State */
          <div className="flex items-center gap-3 py-4 text-indigo-500">
             <Spinner size={24} className="animate-spin" />
             <span className="text-[14px] font-bold">MedOneX Expert is thinking...</span>
          </div>
        ) : (
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "relative overflow-hidden transition-all",
                variant === "flat" && isAI 
                  ? "px-4 py-2.5 text-slate-800 dark:text-white/90" 
                  : "px-4 py-2.5 shadow-sm",
                !variant && isAI 
                  ? "rounded-3xl rounded-tl-sm border border-slate-200/60 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none" 
                  : "",
                !isAI 
                  ? "rounded-2xl text-white shadow-sm"
                  : ""
              )}
              style={{ 
                fontSize: `${fontSize}px`,
                backgroundColor: isAI && variant !== "flat" ? aiBubbleColor : !isAI ? userBubbleColor : undefined,
                borderColor: isAI && variant !== "flat" ? undefined : undefined,
              }}
            >
              {/* File/Image Inline Display */}
              {message.files && message.files.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {message.files.map((f, i) => {
                    const isImg = f.mimeType.startsWith("image/");
                    return isImg ? (
                      <div key={i} className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm max-w-md">
                        <img src={f.data} alt={f.name} className="w-full h-auto object-cover max-h-[400px]" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-white truncate block">{f.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl border max-w-xs", isAI ? "bg-slate-50 dark:bg-[#1f222f]/80 border-slate-200 dark:border-white/10" : "bg-white/10 border-white/20")}>
                        <div className="w-10 h-10 rounded-lg bg-white/20 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                          <FileText size={20} className={isAI ? "text-rose-500" : "text-white"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-slate-800 dark:text-white">{f.name}</p>
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-white/50">{isImg ? "Image File" : "PDF Document"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}


              {/* ✦ AI Images Gallery ✦ */}
              {isAI && (() => {
                const directImgRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
                const searchImgRegex = /!\[Search:\s*(.*?)\]\s*\((?:https?:\/\/)?[^\s)]+\)/gi;
                const directMatches = [...message.content.matchAll(directImgRegex)];
                const searchMatches = [...message.content.matchAll(searchImgRegex)];
                if (directMatches.length === 0 && searchMatches.length === 0) return null;
                return (
                  <div className="mb-4">
                    <ImageGallerySection
                      directUrls={directMatches.map(m => m[1])}
                      searchQueries={searchMatches.map(m => m[1].trim())}
                    />
                  </div>
                );
              })()}

              {/* Markdown Content (images stripped) */}
              <div dir="auto" className={cn(
                "prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:border prose-table:border prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2",
                isAI ? "prose-slate dark:prose-invert prose-pre:bg-slate-50 dark:prose-pre:bg-black/30 prose-pre:border-slate-200 dark:prose-pre:border-white/5 prose-table:border-slate-200 dark:prose-table:border-white/10 prose-th:bg-slate-50 dark:prose-th:bg-white/5" : "text-white prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white"
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
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
                          <table className="w-full text-left border-collapse">{children}</table>
                         </div>
                      </div>
                    ),
                    p: ({ children }) => {
                      const content = React.Children.toArray(children).join("");
                      if (content.includes(":::question")) {
                        try {
                          const jsonStr = content.split(":::question")[1].split(":::")[0].trim();
                          const raw = JSON.parse(jsonStr);
                          const q = {
                            question: raw.question || raw.body || "",
                            options: raw.options || (raw.choices ? raw.choices.map((c: any) => c.text || c) : []),
                            answer: raw.answer || "",
                            explanation: raw.explanation || ""
                          };
                          return <QuestionCard q={q} onSave={() => toast.success("Question saved to your library")} onShare={() => toast.success("Copied link to Discuss Forum")} />;
                        } catch { return <p className="mb-2 last:mb-0">{children}</p>; }
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
                      return <code className={cn("px-1.5 py-0.5 rounded font-bold text-[0.9em]", isAI ? "bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-purple-300" : "bg-white/20 text-white")} {...props}>{children}</code>;
                    }
                  }}
                >
                  {message.content.replace(/!\[.*?\]\((?:https?:\/\/)?[^\s)]+\)/g, "").trim()}
                </ReactMarkdown>
              </div>

              {/* Streaming Indicator (Live Typing Orb) */}
              {message.isStreaming && (
                <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 w-fit">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                   <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">MedOneX Expert is thinking...</span>
                </div>
              )}
            </motion.div>

            {/* AI Message Actions */}
            {isAI && !message.isStreaming && (
              <div className={cn(
                "flex items-center gap-1 p-1 rounded-xl z-10",
                variant === "flat" 
                  ? "mt-2 border border-slate-200 dark:border-white/10 bg-transparent w-fit" 
                  : "absolute -bottom-5 right-4 bg-white dark:bg-[#1a1830] border border-slate-200 dark:border-white/10 shadow-lg opacity-0 group-hover/msg:opacity-100"
              )}>
                <button 
                  onClick={() => onReaction(message.id, message.reaction === "like" ? null : "like")}
                  className={cn("p-1.5 rounded-lg transition-all", message.reaction === "like" ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5")}
                >
                  <ThumbsUp size={16} weight={message.reaction === "like" ? "fill" : "bold"} />
                </button>
                <button 
                  onClick={() => onReaction(message.id, message.reaction === "dislike" ? null : "dislike")}
                  className={cn("p-1.5 rounded-lg transition-all", message.reaction === "dislike" ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10" : "text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5")}
                >
                  <ThumbsDown size={16} weight={message.reaction === "dislike" ? "fill" : "bold"} />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                <button onClick={() => {
                  toast.promise(
                    new Promise((resolve) => setTimeout(resolve, 1000)),
                    {
                      loading: 'Saving to Flashcards...',
                      success: 'Successfully added to spaced repetition!',
                      error: 'Failed to save flashcard.',
                    }
                  );
                }} className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all" title="Save to Flashcards">
                  <Lightning size={16} weight="bold" />
                </button>
                <button onClick={handleCopy} className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  {copying ? <Check size={16} weight="bold" className="text-emerald-500" /> : <Copy size={16} weight="bold" />}
                </button>
                <button onClick={onRegenerate} className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <ArrowClockwise size={16} weight="bold" />
                </button>
                <button onClick={() => onShare?.(message.content)} className="p-1.5 rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <ShareNetwork size={16} weight="bold" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const DrQMessage = React.memo(DrQMessageInner);

// ─── Image Gallery Section (handles direct URLs + Search queries) ────────

function ImageGallerySection({ directUrls, searchQueries }: { directUrls: string[]; searchQueries: string[] }) {
  const [galleryImages, setGalleryImages] = useState<string[]>(directUrls);
  const [loading, setLoading] = useState(searchQueries.length > 0);

  useEffect(() => {
    if (searchQueries.length === 0) return;
    let cancelled = false;

    Promise.all(searchQueries.map(async (q) => {
      try {
        const res = await fetch(`/api/v1/images/search?q=${encodeURIComponent(q)}&max=4`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        return (data.images || []).map((img: any) => img.url);
      } catch { return []; }
    })).then((results) => {
      if (cancelled) return;
      setGalleryImages([...directUrls, ...results.flat()].filter(Boolean));
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [searchQueries, directUrls]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
          <Spinner size={14} /> Searching real images...
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Array.from({ length: Math.min(searchQueries.length * 2, 6) }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-200 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (galleryImages.length === 0) return null;
  return <AiImageGallery images={galleryImages} />;
}

// ─── AI Image Gallery ─────────────────────────────────────────────────────

function AiImageGallery({ images }: { images: string[] }) {
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
      />
    </>
  );
}

function Lightbox({ images, activeIdx, isOpen, onClose, onPrev, onNext }: {
  images: string[];
  activeIdx: number;
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
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
    <div className="my-6 p-6 rounded-[24px] bg-white dark:bg-[#0d0c18] border border-emerald-500/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <div className="text-right">
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
              "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group border border-transparent",
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
    <div className="my-6 p-6 rounded-[24px] bg-white dark:bg-[#161523] border border-indigo-200 dark:border-indigo-500/20 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
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
           <button onClick={onSave} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-white/40 hover:text-indigo-500 dark:hover:text-white transition-all"><BookmarkSimple size={18} /></button>
           <button onClick={onShare} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-white/40 hover:text-indigo-500 dark:hover:text-white transition-all"><ShareNetwork size={18} /></button>
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
              "w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center justify-between group",
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
