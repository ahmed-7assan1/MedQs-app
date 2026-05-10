"use client";

import React, { useRef, useState } from "react";
import { 
  Paperclip, 
  ArrowUp, 
  X, 
  Globe, 
  Files, 
  MagicWand,
  Stop,
  CaretDown,
  At,
  Sparkle,
  Gear
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

    Array.from(selected).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        setFiles([...files, { data, mimeType: file.type, name: file.name, size: file.size }]);
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
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6">
      <div className="relative bg-[#161523]/80 backdrop-blur-3xl border border-purple-500/20 rounded-[32px] shadow-[0_0_40px_rgba(139,92,246,0.1)] overflow-hidden transition-all focus-within:border-purple-500/40 focus-within:shadow-[0_0_60px_rgba(139,92,246,0.15)]">
        
        {/* Reply Context */}
        <AnimatePresence>
          {replyContext && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 py-3 bg-purple-500/10 border-b border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <At size={16} weight="bold" className="text-purple-400 flex-shrink-0" />
                <p className="text-[12px] text-white/70 truncate font-medium italic">"{replyContext.text}"</p>
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
              className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5"
            >
              {files.map((f, i) => (
                <div key={i} className="relative group flex-shrink-0">
                  <div className="w-24 h-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                    {f.mimeType.startsWith('image/') ? (
                      <img src={f.data} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    ) : (
                      <Files size={20} className="text-purple-400 mb-1" />
                    )}
                    <span className="text-[9px] text-white/50 font-black truncate w-full z-10">{f.name}</span>
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 flex flex-col">
          <div className="flex items-center gap-3 px-4 mb-2">
             <Sparkle size={20} weight="fill" className="text-purple-400 animate-pulse" />
             <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Anything..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-[16px] text-white placeholder:text-white/20 min-h-[40px] max-h-48 no-scrollbar font-medium"
             />
          </div>

          <div className="flex items-center justify-between px-4 pb-1">
            <div className="flex items-center gap-2">
              {/* File Attachment */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all flex items-center gap-2"
              >
                <Paperclip size={18} weight="bold" />
                <span className="text-[12px] font-bold">Attach</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />

              {/* Provider Selector (Settings in design) */}
              <div className="relative">
                <button 
                  onClick={() => setShowProviders(!showProviders)}
                  className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all flex items-center gap-2"
                >
                  <Gear size={18} weight="bold" />
                  <span className="text-[12px] font-bold">Providers</span>
                </button>

                <AnimatePresence>
                  {showProviders && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-0 mb-3 w-56 bg-[#1e1d24] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden p-2 z-[70]"
                    >
                      {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => { onProviderChange(p); setShowProviders(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                            activeProvider === p ? "bg-purple-500/10 text-purple-400" : "text-white/40 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-black", activeProvider === p ? "bg-purple-500 text-white" : "bg-white/5")}>
                            {PROVIDER_CONFIGS[p].icon}
                          </div>
                          <span className="text-[12px] font-bold">{PROVIDER_CONFIGS[p].label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Smart Engine Toggle */}
              <button 
                onClick={onToggleSmartEngine}
                className={cn(
                  "p-2.5 rounded-xl transition-all flex items-center gap-2 group border",
                  smartEngineEnabled 
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                    : "text-white/40 hover:text-white hover:bg-white/5 border-transparent"
                )}
              >
                 <MagicWand size={18} weight={smartEngineEnabled ? "fill" : "bold"} className={cn(smartEngineEnabled && "animate-pulse")} />
                 <span className="text-[12px] font-bold">Smart Engine</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {loading ? (
                <button 
                  onClick={onStop}
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all animate-pulse"
                >
                  <Stop size={20} weight="fill" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={!input.trim() && files.length === 0}
                  className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:grayscale text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-110 active:scale-95 transition-all"
                >
                  <ArrowUp size={20} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
