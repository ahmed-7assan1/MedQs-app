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
  BookmarkSimple
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
}

export function DrQMessage({
  message,
  fontSize,
  userBubbleColor,
  aiBubbleColor,
  onReaction,
  onRegenerate,
  onReply,
  onShare,
  activePersona = "explainer"
}: MessageProps) {
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
      
      {/* Floating Selection Reply Button (Image 2 Match) */}
      <AnimatePresence>
        {selectionRange && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[100] px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center gap-2 text-[14px] font-bold transition-colors border border-blue-400/50"
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
           <div className="flex items-center gap-2 px-4 text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">
              <ArrowBendUpLeft size={12} weight="bold" />
              Replying to quote
           </div>
        )}

        {/* Persona Header for AI (Image 2 Match) */}
        {isAI && (
          <div className="flex items-center gap-3 px-1 mb-1">
             <div className={cn(
               "w-8 h-8 rounded-xl flex items-center justify-center shadow-lg",
               `bg-gradient-to-br ${(DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).gradient}`
             )}>
                {React.cloneElement((DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).icon as React.ReactElement, { size: 16, weight: "fill", className: "text-white" })}
             </div>
             <div className="flex flex-col">
                <span className="text-[12px] font-black text-white tracking-tight">{(DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).name}</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Medical Assistant</span>
             </div>
          </div>
        )}

        {message.isStreaming && !message.content ? (
          /* Initial Streaming State (Image 2 Match) */
          <div className="flex items-center gap-3 py-4 text-blue-400">
             <Spinner size={24} className="animate-spin" />
             <span className="text-[14px] font-medium">Getting a detailed report...</span>
          </div>
        ) : (
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "p-4 md:p-6 rounded-[28px] shadow-2xl relative overflow-hidden transition-all backdrop-blur-xl",
                isAI 
                  ? "rounded-tl-lg bg-white/[0.03] border border-white/10" 
                  : "rounded-tr-lg border border-white/20"
              )}
              style={{ 
                backgroundColor: isAI ? aiBubbleColor : `${userBubbleColor}33`, // 33 is ~20% opacity for glass effect
                fontSize: `${fontSize}px`
              }}
            >
              {/* Glass effect gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />

              {/* File Chips */}
              {message.files && message.files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {message.files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-[11px] font-bold text-white/70">
                      {f.mimeType.startsWith("image/") ? <ImageIcon size={16} /> : <FileText size={16} />}
                      {f.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Markdown Content */}
              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/5 prose-table:border prose-table:border-white/10 prose-th:bg-white/5 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="relative group/table overflow-hidden rounded-2xl border border-white/10 my-4">
                         <button 
                           onClick={(e) => {
                             const table = e.currentTarget.nextElementSibling;
                             if (table) navigator.clipboard.writeText(table.textContent || "");
                             toast.success("Table content copied");
                           }}
                           className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/50 opacity-0 group-hover/table:opacity-100 transition-all z-10"
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
                          const q = JSON.parse(jsonStr);
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
                           <div className="relative group/code my-4 overflow-hidden rounded-2xl border border-white/5">
                              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{match[1]}</span>
                                 <button onClick={() => { navigator.clipboard.writeText(String(children)); toast.success("Code copied"); }} className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white">
                                    <Copy size={14} />
                                 </button>
                              </div>
                              <pre className="p-4 overflow-x-auto text-[13px] bg-black/40"><code {...props}>{children}</code></pre>
                           </div>
                         );
                      }
                      return <code className={cn("bg-white/10 px-1.5 py-0.5 rounded text-purple-300 font-bold text-[0.9em]", className)} {...props}>{children}</code>;
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Streaming Indicator (Live Typing Orb) */}
              {message.isStreaming && (
                <div className="flex items-center gap-2 mt-4 px-2 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Dr. Q is thinking...</span>
                </div>
              )}
            </motion.div>

            {/* AI Message Actions */}
            {isAI && !message.isStreaming && (
              <div className="absolute -bottom-4 right-4 flex items-center gap-1 p-1 bg-[#1a1830] border border-white/10 rounded-xl shadow-xl opacity-0 group-hover/msg:opacity-100 transition-all">
                <button 
                  onClick={() => onReaction(message.id, message.reaction === "like" ? null : "like")}
                  className={cn("p-1.5 rounded-lg transition-all", message.reaction === "like" ? "text-emerald-400 bg-emerald-500/10" : "text-white/20 hover:text-white hover:bg-white/5")}
                >
                  <ThumbsUp size={16} weight={message.reaction === "like" ? "fill" : "bold"} />
                </button>
                <button 
                  onClick={() => onReaction(message.id, message.reaction === "dislike" ? null : "dislike")}
                  className={cn("p-1.5 rounded-lg transition-all", message.reaction === "dislike" ? "text-red-400 bg-red-500/10" : "text-white/20 hover:text-white hover:bg-white/5")}
                >
                  <ThumbsDown size={16} weight={message.reaction === "dislike" ? "fill" : "bold"} />
                </button>
                <div className="w-px h-4 bg-white/5 mx-1" />
                <button onClick={() => {
                  toast.promise(
                    new Promise((resolve) => setTimeout(resolve, 1000)),
                    {
                      loading: 'Saving to Flashcards...',
                      success: 'Successfully added to spaced repetition!',
                      error: 'Failed to save flashcard.',
                    }
                  );
                }} className="p-1.5 rounded-lg text-white/20 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Save to Flashcards">
                  <Lightning size={16} weight="bold" />
                </button>
                <button onClick={handleCopy} className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all">
                  {copying ? <Check size={16} weight="bold" className="text-emerald-400" /> : <Copy size={16} weight="bold" />}
                </button>
                <button onClick={onRegenerate} className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all">
                  <ArrowClockwise size={16} weight="bold" />
                </button>
                <button onClick={() => onShare?.(message.content)} className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all">
                  <ShareNetwork size={16} weight="bold" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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
    <div className="my-6 p-6 rounded-[24px] bg-[#0d0c18] border border-emerald-500/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner">
             <CheckCircle size={20} weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">OSCE Evaluation</span>
            <span className="text-[13px] font-black text-white tracking-tight">{c.title}</span>
          </div>
        </div>
        <div className="text-right">
           <span className="text-[14px] font-black text-emerald-400">{progress}%</span>
           <div className="w-20 h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
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
              "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group",
              item.completed ? "bg-emerald-500/5 text-white/90" : "bg-white/[0.02] text-white/40 hover:bg-white/5"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
              item.completed ? "bg-emerald-500 border-emerald-500" : "border-white/10 bg-white/5 group-hover:border-white/20"
            )}>
              {item.completed && <Check size={12} weight="bold" className="text-white" />}
            </div>
            <span className={cn("text-[14px] font-medium transition-all", item.completed && "line-through opacity-50")}>
              {item.text}
            </span>
          </button>
        ))}
      </div>
      
      {progress === 100 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
           <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest">Protocol Fully Completed 🏆</span>
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
    <div className="my-6 p-6 rounded-[24px] bg-[#161523] border border-purple-500/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-inner">
             <Lightning size={20} weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Generated Assessment</span>
            <span className="text-[13px] font-black text-white tracking-tight">Platform Question</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onSave} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><BookmarkSimple size={18} /></button>
           <button onClick={onShare} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><ShareNetwork size={18} /></button>
        </div>
      </div>
      
      <h3 className="text-[16px] font-bold text-white mb-6 leading-relaxed">{q.question}</h3>
      
      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={selected !== null}
            onClick={() => setSelected(opt)}
            className={cn(
              "w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center justify-between group",
              selected === null ? "bg-white/5 border-white/5 hover:border-purple-500/50 hover:bg-purple-500/5" : 
              opt === q.answer ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" :
              selected === opt ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-black/20 border-white/5 opacity-50"
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
            className="mt-6 pt-6 border-t border-white/5"
          >
            <div className={cn(
              "p-4 rounded-2xl border flex flex-col gap-2",
              isCorrect ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"
            )}>
              <div className="flex items-center gap-2">
                {isCorrect ? <CheckCircle size={18} className="text-emerald-500" /> : <WarningCircle size={18} className="text-red-500" />}
                <span className={cn("text-[13px] font-black uppercase tracking-widest", isCorrect ? "text-emerald-500" : "text-red-500")}>
                  {isCorrect ? "Correct!" : "Incorrect"}
                </span>
              </div>
              {q.explanation && (
                <p className="text-[13px] text-white/60 leading-relaxed font-medium mt-1">{q.explanation}</p>
              )}
            </div>
            
            <button 
              onClick={() => { setSelected(null); }}
              className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
