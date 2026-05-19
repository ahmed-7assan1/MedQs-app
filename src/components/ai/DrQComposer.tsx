"use client";

import React, { useRef, useState } from "react";
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
  Sparkle
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 pb-6 relative z-30">
      
      {/* ── Auxiliary Action Badges (Floating above composer) ── */}
      <div className="flex flex-wrap items-center gap-2 mb-3 px-3">
        {/* Active Provider Badge */}
        <div className="relative">
          <button 
            onClick={() => setShowProviders(!showProviders)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all"
          >
            <span className="text-[10px]">{PROVIDER_CONFIGS[activeProvider].icon}</span>
            <span>{PROVIDER_CONFIGS[activeProvider].label}</span>
            <Gear size={12} className="text-white/20" />
          </button>

          <AnimatePresence>
            {showProviders && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 w-56 bg-[#161523] border border-white/10 rounded-[24px] shadow-2xl p-2 z-[70]"
              >
                {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => { onProviderChange(p); setShowProviders(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                      activeProvider === p ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-black", activeProvider === p ? "bg-white text-black" : "bg-white/5")}>
                      {PROVIDER_CONFIGS[p].icon}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{PROVIDER_CONFIGS[p].label}</span>
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
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all",
              smartEngineEnabled 
                ? "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]" 
                : "bg-white/[0.04] border-white/[0.05] text-white/40 hover:text-white/60"
            )}
          >
            <MagicWand size={12} weight={smartEngineEnabled ? "fill" : "bold"} />
            <span>Reasoning Engine</span>
          </button>
        )}
      </div>

      {/* ── Main Input Capsule ── */}
      <div className="relative bg-[#11121d] border border-white/[0.06] rounded-[32px] shadow-2xl overflow-hidden transition-all focus-within:border-white/15 focus-within:shadow-[0_0_50px_rgba(255,255,255,0.03)]">
        
        {/* Reply Context */}
        <AnimatePresence>
          {replyContext && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-2.5 bg-white/5 border-b border-white/[0.05] flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white/30 text-[11px] font-black uppercase">Replying:</span>
                <p className="text-[12px] text-white/60 truncate font-semibold italic">"{replyContext.text}"</p>
              </div>
              <button onClick={onClearReply} className="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white">
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
              className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/[0.05]"
            >
              {files.map((f, i) => (
                <div key={i} className="relative group flex-shrink-0">
                  <div className="w-24 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                    {f.mimeType.startsWith('image/') ? (
                      <img src={f.data} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    ) : (
                      <Files size={20} className="text-white/40 mb-1" />
                    )}
                    <span className="text-[9px] text-white/50 font-black truncate w-full z-10">{f.name}</span>
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                  >
                    <X size={10} weight="bold" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Input Row */}
        <div className="px-4 py-2.5 flex items-center gap-3">
          
          {/* File Attachment Plus Button */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90"
            title="Attach image or PDF"
          >
            <Plus size={16} weight="bold" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange} />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Dr. Q anything..."
            className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none resize-none py-2 text-[15px] text-white placeholder-white/20 min-h-[40px] max-h-48 no-scrollbar font-medium"
          />

          {/* Right Action Button (Send / Stop) */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {loading ? (
              <button 
                type="button"
                onClick={onStop}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all animate-pulse"
                title="Stop generation"
              >
                <Stop size={16} weight="fill" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() && files.length === 0}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90",
                  input.trim() || files.length > 0 
                    ? "bg-white text-black hover:bg-white/90 scale-100" 
                    : "bg-white/5 text-white/20 scale-95"
                )}
                title="Send message"
              >
                <ArrowUp size={16} weight="bold" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
