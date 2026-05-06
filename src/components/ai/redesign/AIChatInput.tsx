"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, SendHorizontal, Image, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface AIChatInputProps {
  onSend: (text: string) => void;
  onGenerateImage?: (prompt: string) => void;
  disabled?: boolean;
  activeMode: string;
  setActiveMode: (mode: string) => void;
}

export function AIChatInput({ onSend, onGenerateImage, disabled, activeMode, setActiveMode }: AIChatInputProps) {
  const [input, setInput] = useState("");
  const [imgMode, setImgMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    if (imgMode && onGenerateImage) {
      onGenerateImage(input);
    } else {
      onSend(input);
    }
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const modes = ["Ask", "Quiz me", "Explain", "Summarize", "Flashcards"];

  return (
    <div className="max-w-[800px] mx-auto w-full">
      {/* Mode Toolbar */}
      <div className="flex items-center gap-2 mb-3 px-2 flex-wrap">
        {modes.map(mode => (
          <button
            key={mode}
            onClick={() => { setActiveMode(mode); setImgMode(false); }}
            className={cn(
              "px-4 py-1.5 rounded-full text-[12px] font-bold transition-all",
              !imgMode && activeMode === mode 
                ? "bg-drq-primary text-white border border-drq-primary" 
                : "bg-drq-surface border border-drq-border text-drq-secondary hover:text-white hover:border-drq-secondary"
            )}
          >
            {mode}
          </button>
        ))}
        {/* Image Mode Button */}
        <button
          onClick={() => setImgMode(v => !v)}
          className={cn(
            "px-4 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5",
            imgMode
              ? "bg-emerald-500 text-white border border-emerald-500"
              : "bg-drq-surface border border-drq-border text-drq-secondary hover:text-white hover:border-emerald-500"
          )}
        >
          <Image className="w-3.5 h-3.5" />
          Image Gen
        </button>
      </div>

      {/* Input Box */}
      <div className="bg-drq-surface border border-drq-border rounded-2xl p-2 flex items-end gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all focus-within:border-drq-primary focus-within:shadow-[0_10px_40px_rgba(124,110,250,0.2)]">
        
        {/* Attachment Button */}
        <div className="relative group">
          <input 
            type="file" 
            id="chat-file-upload" 
            className="hidden" 
            onChange={(e) => {
              // handle file upload logic here or via props
              toast.success("File selected: " + e.target.files?.[0]?.name);
            }} 
          />
          <button
            type="button"
            onClick={() => document.getElementById('chat-file-upload')?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-drq-secondary hover:bg-drq-primary/20 hover:text-drq-primary transition-all duration-300 mb-0.5 border border-white/5"
          >
            <Paperclip className="h-5 w-5" />
          </button>
        </div>

        {/* Text Area */}
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
          placeholder={imgMode ? "Describe your vision..." : "Message Dr. Q..."}
          className="flex-1 resize-none bg-transparent border-none text-[16px] text-white placeholder:text-drq-secondary focus:outline-none focus:ring-0 py-3.5 min-h-[50px] max-h-[150px] scrollbar-none font-medium"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-0.5 shrink-0 px-1">
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 shadow-lg",
              input.trim() && !disabled
                ? "bg-drq-primary text-white hover:scale-105 hover:shadow-drq-primary/30"
                : "bg-white/5 text-drq-secondary opacity-50"
            )}
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
