"use client";

import { useState, useRef } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function AIChatInput({ onSend, disabled }: AIChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="border-t border-drq-border bg-drq-bg/80 p-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-[680px] items-center gap-3">
        {/* Attach Button */}
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-drq-surface text-drq-purple-light hover:bg-white/10 transition-colors"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Text Input Pill */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Dr. Q anything..."
            className={cn(
              "w-full resize-none rounded-full bg-drq-surface border border-drq-border px-5 py-2.5 text-[13px] text-white",
              "placeholder:text-white/20 focus:outline-none focus:border-drq-primary/50 focus:ring-1 focus:ring-drq-primary/30 transition-all",
              "min-h-[44px] flex items-center"
            )}
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-drq-primary text-white shadow-lg shadow-drq-primary/20 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
