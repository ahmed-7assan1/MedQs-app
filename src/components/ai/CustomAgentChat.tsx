"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PaperPlaneRight, Spinner, X, Robot, Stop, Check, Copy, BookOpen, Link as LinkIcon } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentData {
  id: string;
  name: string;
  instructions: string;
  files: { name: string; type: string; data: string }[];
  links: string[];
  description: string | null;
}

export function CustomAgentChat({ agent, onClose, isDark }: { agent: AgentData; onClose: () => void; isDark: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [copying, setCopying] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationHistory: [
            { role: "system", content: agent.instructions },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
          stream: true,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const reply = data.reply || "";

      const aiMsg: ChatMessage = { role: "assistant", content: reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = { role: "assistant", content: "Sorry, I encountered an error. Please check your API key and try again." };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setStreaming(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
    toast.success("Copied!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10030] flex flex-col"
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b", isDark ? "bg-[#121212] border-white/10" : "bg-white border-gray-200")}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
            <X size={18} weight="bold" />
          </button>
          <div>
            <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>{agent.name}</h2>
            {agent.description && <p className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{agent.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {agent.files?.length > 0 && (
            <button onClick={() => setShowInfo(!showInfo)} className={cn("p-2 rounded-lg text-xs", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")} title={`${agent.files.length} file(s)`}>
              <BookOpen size={16} />
            </button>
          )}
          {agent.links?.length > 0 && (
            <button onClick={() => setShowInfo(!showInfo)} className={cn("p-2 rounded-lg text-xs", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")} title={`${agent.links.length} link(s)`}>
              <LinkIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden border-b", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50")}>
            <div className="px-4 py-3 space-y-2 text-xs">
              {agent.files?.length > 0 && (
                <div>
                  <p className={cn("font-bold mb-1", isDark ? "text-gray-400" : "text-gray-500")}>Knowledge Files:</p>
                  {agent.files.map((f, i) => <p key={i} className={cn("truncate", isDark ? "text-gray-500" : "text-gray-400")}>📄 {f.name}</p>)}
                </div>
              )}
              {agent.links?.length > 0 && (
                <div>
                  <p className={cn("font-bold mb-1", isDark ? "text-gray-400" : "text-gray-500")}>Reference Links:</p>
                  {agent.links.map((l, i) => <p key={i} className="truncate text-indigo-400">{l}</p>)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4 bg-[#050505]">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-xs">
              <Robot size={40} className="mx-auto mb-3 text-gray-600" />
              <p className="text-sm font-medium text-gray-400">Chat with {agent.name}</p>
              <p className="text-xs text-gray-600 mt-1">Ask anything related to this agent&apos;s expertise.</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", msg.role === "user" ? "bg-indigo-500 text-white rounded-br-md" : isDark ? "bg-[#1a1a1a] text-gray-200 rounded-bl-md" : "bg-gray-100 text-gray-900 rounded-bl-md")}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              <div className="flex justify-end mt-1">
                <button onClick={() => handleCopy(msg.content)} className={cn("p-1 rounded transition-opacity opacity-0 group-hover:opacity-100", msg.role === "user" ? "text-white/60 hover:text-white" : "text-gray-400 hover:text-gray-200")}>
                  {copying ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className={cn("rounded-2xl px-4 py-3 text-sm rounded-bl-md flex items-center gap-2", isDark ? "bg-[#1a1a1a] text-gray-400" : "bg-gray-100 text-gray-500")}>
              <Spinner size={14} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className={cn("px-4 py-3 border-t", isDark ? "bg-[#121212] border-white/10" : "bg-white border-gray-200")}>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder={`Ask ${agent.name}...`}
            className={cn("flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none transition-all", isDark ? "bg-[#0d0d12] border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")}
          />
          <button onClick={handleSend} disabled={!input.trim() || streaming} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", input.trim() ? "bg-indigo-500 text-white hover:bg-indigo-600" : isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400")}>
            {streaming ? <Stop size={14} weight="fill" /> : <PaperPlaneRight size={14} weight="bold" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
