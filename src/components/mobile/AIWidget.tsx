"use client";
import { motion } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AIWidgetProps {
  placeholder?: string;
  gradient?: boolean;
}

export function AIWidget({ placeholder = "Ask Dr. Q anything...", gradient = true }: AIWidgetProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/ai-chat?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] p-4"
    >
      {gradient && (
        <>
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-[60px]" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-[60px]" />
        </>
      )}
      <div className="relative flex items-center gap-3 mb-3">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md animate-pulse" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-white">AI Study Assistant</p>
          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Clinical reasoning & recall</p>
        </div>
      </div>
      <div className="relative flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-10 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/25 text-[11px] focus:outline-none focus:border-primary/50 transition-colors"
        />
        <button
          type="submit"
          className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/80 text-white flex items-center justify-center shrink-0 transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.form>
  );
}
