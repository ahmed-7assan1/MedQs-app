"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  type?: "text" | "image";
}

import { Copy, Check, ThumbsUp, RefreshCw, Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ActiveAgent {
  name: string;
  subtitle: string;
  icon: string;
  gradClass: string;
}

export function AIChatBubble({ 
  message, 
  userBubbleColor = "grad-1",
  activeAgent
}: { 
  message: ChatMessage; 
  userBubbleColor?: string;
  activeAgent?: ActiveAgent;
}) {
  const isAI = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn("flex gap-4 max-w-[85%] animate-fade-up", isAI ? "self-start" : "self-end flex-row-reverse")}>
      
      {/* Avatar */}
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0", 
        isAI ? (activeAgent?.gradClass || "grad-1") : "bg-drq-surface border border-drq-border"
      )}>
        {isAI ? (activeAgent?.icon || "🧠") : <div className="text-white/60">A</div>}
      </div>

      <div className={cn("flex flex-col gap-1 w-full relative group", !isAI && "items-end")}>
        
        {/* Bubble */}
        <div
          className={cn(
            "px-6 py-4 text-[16px] leading-relaxed w-full font-dm-sans",
            isAI
              ? "bg-drq-panel border border-white/5 text-white rounded-[24px] rounded-tl-sm shadow-xl"
              : cn("text-white rounded-[24px] rounded-tr-sm shadow-[0_8px_24px_rgba(0,0,0,0.3)]", userBubbleColor)
          )}
          style={{ textAlign: "inherit" }}
        >
          {message.imageUrl ? (
            <div className="flex flex-col gap-3">
              <img 
                src={message.imageUrl} 
                alt="AI Generated Image" 
                className="rounded-2xl max-w-full border border-white/10 shadow-2xl"
              />
              <ReactMarkdown className="prose-drq text-sm max-w-none opacity-80 italic">
                {message.content}
              </ReactMarkdown>
            </div>
          ) : isAI ? (
            <ReactMarkdown
              className="prose-drq max-w-none"
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-white/90">{children}</p>,
                strong: ({ children }) => <strong className="font-extrabold text-drq-primary bg-drq-primary/10 px-1 rounded-sm">{children}</strong>,
                h1: ({ children }) => <h1 className="font-syne text-[20px] font-bold text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="font-syne text-[18px] font-bold text-drq-primary mb-3 mt-4">{children}</h2>,
                h3: ({ children }) => <h3 className="font-syne text-[16px] font-bold text-emerald-400 mb-2 mt-4">{children}</h3>,
                ul: ({ children }) => <ul className="my-4 space-y-2.5">{children}</ul>,
                li: ({ children }) => (
                  <li className="flex items-start gap-3">
                     <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-drq-primary shadow-[0_0_8px_rgba(124,110,250,0.6)]" />
                     <span className="text-white/80">{children}</span>
                  </li>
                ),
                code: ({ children }) => <code className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md text-drq-primary font-mono text-[14px]">{children}</code>
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap font-medium">{message.content}</p>
          )}
        </div>
        
        {/* Meta / Actions */}
        <div className="text-[10px] font-bold text-drq-secondary flex items-center gap-4 mt-2 px-1">
          <span className="uppercase tracking-widest opacity-50">{time}</span>
          <div className="flex gap-2.5">
            <button 
              onClick={handleCopy}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-drq-secondary hover:text-white transition-all shadow-sm"
              title="Copy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            {isAI && (
              <>
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-drq-secondary hover:text-white transition-all shadow-sm" title="Regenerate">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-drq-secondary hover:text-white transition-all shadow-sm" title="Helpful">
                  <ThumbsUp className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
