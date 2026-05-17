"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, BrainCircuit, Activity, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "ai";
  content: string;
};

type AtlasAIDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  structureId?: string;
  structureName?: string;
  systemId?: string;
  systemLabel?: string;
};

export default function AtlasAIDrawer({ isOpen, onClose, structureId, structureName, systemId, systemLabel }: AtlasAIDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when context changes
  useEffect(() => {
    if (isOpen) {
      const target = structureName ? `the **${structureName}**` : systemLabel ? `the **${systemLabel} System**` : "Human Anatomy";
      setMessages([
        {
          role: "ai",
          content: `Hello! I am your AI Anatomy Tutor. 🎓\n\nI see you are studying ${target}. Ask me anything about its spatial relations, neurovascular supply, clinical importance, or ask for high-yield mnemonics to help you memorize it!`
        }
      ]);
    }
  }, [isOpen, structureName, systemLabel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      // Build history for context
      const history = messages.slice(1).map(m => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content
      }));

      const res = await fetch("/api/v1/bot-chat/atlas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history,
          structureId,
          systemId
        })
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setMessages(prev => [...prev, { role: "ai", content: data.reply || "No reply from AI." }]);
    } catch (e: any) {
      console.error("[ATLAS_CHAT_ERROR]", e);
      setMessages(prev => [...prev, { role: "ai", content: "⚠️ Sorry, I encountered an issue connecting to my pedagogical brain. Please ensure your API key is correctly configured." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0f0f11]/95 border-l border-white/10 z-[101] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#16161a] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight text-white">Anatomy AI Tutor</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-500" /> Clinical Mode
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((m, idx) => (
                <div key={idx} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role !== "user" && (
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-md",
                    m.role === "user"
                      ? "bg-cyan-500 text-white font-medium"
                      : "bg-[#18181c] border border-white/5 text-white/90"
                  )}>
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="bg-[#18181c] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white/40 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-white/5 bg-[#16161a] shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Ask about relations, nerve supply, clinical test..."
                  className="flex-1 h-11 bg-[#222226] border border-white/5 rounded-xl px-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="h-11 w-11 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow-md shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[9px] text-white/20 text-center mt-2 font-medium">AI can generate errors. Cross-reference with clinical notes.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
