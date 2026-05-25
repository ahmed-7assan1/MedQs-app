"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  Paperclip, 
  ArrowUp, 
  X, 
  Files, 
  MagicWand,
  Stop,
  Gear,
  Plus,
  Microphone,
  Sparkle,
  CaretDown
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AIProvider, PROVIDER_CONFIGS, FileAttachment } from "@/hooks/useDrQChat";

interface ComposerProps {
  input: string;
  setInput: (v: string) => void;
  files: FileAttachment[];
  setFiles: (f: FileAttachment[]) => void;
  onSend: (text: string, files: FileAttachment[], replyToId?: string) => void;
  onStop?: () => void;
  loading: boolean;
  activeProvider: AIProvider;
  onProviderChange: (p: AIProvider) => void;
  replyContext?: { id: string; text: string } | null;
  onClearReply?: () => void;
  smartEngineEnabled?: boolean;
  onToggleSmartEngine?: () => void;
}

export function DrQComposer({
  input,
  setInput,
  files,
  setFiles,
  onSend,
  onStop,
  loading,
  activeProvider,
  onProviderChange,
  replyContext,
  onClearReply,
  smartEngineEnabled,
  onToggleSmartEngine
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showProviders, setShowProviders] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: FileAttachment[] = [];
    let count = 0;
    Array.from(selected).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        newFiles.push({ data, mimeType: file.type, name: file.name, size: file.size });
        count++;
        if (count === selected.length) {
          setFiles([...files, ...newFiles]);
        }
      };
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if ((!input.trim() && files.length === 0) || loading) return;
    onSend(input, files, replyContext?.id);
    onClearReply?.();
    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  return (
    <div className="w-full relative z-30">
      
      {/* ── Auxiliary Action Badges (Floating above composer) ── */}
      <div className="flex flex-wrap items-center gap-2 mb-3 px-2">
        {/* Active Provider Badge */}
        <div className="relative">
          <button 
            onClick={() => setShowProviders(!showProviders)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-semibold uppercase tracking-wider text-white/60 hover:text-cyan-400 transition-all shadow-sm"
          >
            <span className="text-[12px]">{PROVIDER_CONFIGS[activeProvider].icon}</span>
            <span>{PROVIDER_CONFIGS[activeProvider].label}</span>
            <CaretDown size={10} className="text-white/30 ml-0.5" />
          </button>

          <AnimatePresence>
            {showProviders && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-3 w-56 bg-[#0d0d12]/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-[70] backdrop-blur-3xl"
              >
                {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => { onProviderChange(p); setShowProviders(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left",
                      activeProvider === p 
                        ? "bg-cyan-500/10 text-cyan-400" 
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-black shadow-sm", activeProvider === p ? "bg-cyan-500 text-black" : "bg-white/5 text-white/60")}>
                      {PROVIDER_CONFIGS[p].icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{PROVIDER_CONFIGS[p].label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Smart Reasoning Mode Badge */}
        {onToggleSmartEngine && (
          <button 
            onClick={onToggleSmartEngine}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider transition-all shadow-sm",
              smartEngineEnabled 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-cyan-400 hover:bg-white/10"
            )}
          >
            <MagicWand size={12} weight={smartEngineEnabled ? "fill" : "bold"} />
            <span>Reasoning Engine</span>
          </button>
        )}
      </div>

      {/* ── Main Input Capsule ── */}
      <div className="relative bg-[#0d0d12]/50 backdrop-blur-3xl border border-white/10 rounded-[28px] shadow-[0_0_50px_rgba(6,182,212,0.02)] overflow-hidden transition-all focus-within:border-cyan-500/40 focus-within:shadow-[0_0_40px_rgba(6,182,212,0.1)] focus-within:bg-[#0d0d12]/80">
        
        {/* Reply Context */}
        <AnimatePresence>
          {replyContext && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-cyan-500/5 border-b border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-cyan-400/60 text-[9px] font-bold uppercase tracking-wider">Replying to:</span>
                <p className="text-xs text-white/80 truncate font-medium italic">"{replyContext.text}"</p>
              </div>
              <button onClick={onClearReply} className="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
                <X size={14} weight="bold" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Files Preview */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5"
            >
              {files.map((f, i) => (
                <div key={i} className="relative group flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-2 text-center overflow-hidden shadow-inner">
                    {f.mimeType.startsWith('image/') ? (
                      <img src={f.data} alt="Attached image" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Files size={20} className="text-white/40 mb-1" />
                    )}
                    <span className="text-[9px] text-white font-semibold truncate w-full z-10 drop-shadow-md absolute bottom-1.5 px-2 bg-black/60 py-0.5 rounded-full">{f.name}</span>
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-20"
                  >
                    <X size={10} weight="bold" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Input Row */}
        <div className="px-4 py-3 flex items-end gap-3 min-h-[56px]">
          
          {/* Sparkling Icon Decoration */}
          <Sparkle size={18} className="text-cyan-400 animate-pulse self-center mb-2.5 ml-1 flex-shrink-0" weight="fill" />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask MedOneX Expert anything..."
            className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none resize-none py-2 text-[14px] text-white placeholder-white/20 max-h-48 no-scrollbar font-medium"
          />

          {/* Pill-shaped File Attachment Button */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 mb-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-white/70 hover:text-white transition-all active:scale-95 text-xs font-semibold shadow-sm select-none cursor-pointer"
            title="Attach image or PDF"
          >
            <Plus size={12} weight="bold" className="text-cyan-400 animate-pulse" />
            <span>Attach file</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange} />

          {/* Right Action Button (Send / Stop) */}
          <div className="flex-shrink-0 mb-1 flex items-center gap-2">
            {loading ? (
              <button 
                type="button"
                onClick={onStop}
                className="w-10 h-10 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 flex items-center justify-center transition-all border border-cyan-500/30"
                title="Stop generation"
              >
                <Stop size={16} weight="fill" className="animate-pulse" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() && files.length === 0}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90",
                  input.trim() || files.length > 0 
                    ? "bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-100" 
                    : "bg-white/5 text-white/20 scale-95 cursor-not-allowed"
                )}
                title="Send message"
              >
                <ArrowUp size={18} weight="bold" className={input.trim() || files.length > 0 ? "text-black" : "text-white/20"} />
              </button>
            )}
          </div>

        </div>
      </div>
      
      <div className="text-center mt-3">
         <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] select-none">MedOneX Expert AI • Medical AI Can Make Mistakes</span>
      </div>
    </div>
  );
}
