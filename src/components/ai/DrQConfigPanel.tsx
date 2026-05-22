"use client";

import React from "react";
import { 
  X, 
  Key, 
  TextT, 
  Palette, 
  Check, 
  ShieldCheck,
  Lightning,
  GoogleLogo,
  OpenAiLogo,
  Globe
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { DrQSettings, PROVIDER_CONFIGS, AIProvider } from "@/hooks/useDrQChat";
import { cn } from "@/lib/utils";

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DrQSettings;
  onUpdate: (updated: Partial<DrQSettings>) => void;
}

export function DrQConfigPanel({
  isOpen,
  onClose,
  settings,
  onUpdate
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"keys" | "appearance">("keys");

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

          {/* Panel */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#161523] border-l border-white/10 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Key size={22} weight="bold" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Configuration</h2>
                  <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Personalize your Dr. Q experience</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
                <X size={24} weight="bold" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-black/20 m-6 rounded-2xl">
              <button 
                onClick={() => setActiveTab("keys")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all",
                  activeTab === "keys" ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/50"
                )}
              >
                <ShieldCheck size={18} weight="bold" />
                API Keys
              </button>
              <button 
                onClick={() => setActiveTab("appearance")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all",
                  activeTab === "appearance" ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/50"
                )}
              >
                <Palette size={18} weight="bold" />
                Appearance
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">
              {activeTab === "keys" ? (
                <div className="space-y-8">
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[12px] leading-relaxed text-blue-400 font-medium">
                      <ShieldCheck size={16} className="inline mr-2 mb-0.5" />
                      API Keys are stored <strong>locally in your browser</strong>. They are never sent to our servers. Direct browser-to-AI streaming ensures your privacy and bypasses site limits.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((pid) => {
                      const config = PROVIDER_CONFIGS[pid];
                      return (
                        <div key={pid} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[12px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                              {pid === 'gemini' && <GoogleLogo size={16} />}
                              {pid === 'openai' && <OpenAiLogo size={16} />}
                              {pid === 'siliconflow' && <Globe size={16} />}
                              {config.label}
                            </label>
                            {settings.byokKeys[pid] && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Connected</span>
                            )}
                          </div>
                          <div className="relative group">
                            <input 
                              type="password"
                              placeholder={`Enter ${config.label} API Key...`}
                              value={settings.byokKeys[pid] || ""}
                              onChange={(e) => onUpdate({ byokKeys: { ...settings.byokKeys, [pid]: e.target.value } })}
                              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/10 focus:border-primary/50 outline-none transition-all font-mono"
                            />
                            <Key size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Font Size */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-black text-white/60 uppercase tracking-widest">Chat Font Size</label>
                      <span className="text-[12px] font-bold text-primary">{settings.fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <TextT size={16} className="text-white/20" />
                      <input 
                        type="range" min="12" max="22" step="1"
                        value={settings.fontSize}
                        onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                        className="flex-1 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
                      />
                      <TextT size={24} className="text-white/20" />
                    </div>
                  </div>

                  {/* Bubble Colors */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-white/60 uppercase tracking-widest block">User Message Color</label>
                      <div className="flex flex-wrap gap-3">
                        {['#6d28d9', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#161523'].map(color => (
                          <button 
                            key={color}
                            onClick={() => onUpdate({ userBubbleColor: color })}
                            className={cn(
                              "w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center",
                              settings.userBubbleColor === color ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          >
                            {settings.userBubbleColor === color && <Check size={18} weight="bold" className="text-white shadow-sm" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-white/60 uppercase tracking-widest block">AI Message Color</label>
                      <div className="flex flex-wrap gap-3">
                        {['#1a1830', '#111827', '#064e3b', '#450a0a', '#1e293b', '#000000'].map(color => (
                          <button 
                            key={color}
                            onClick={() => onUpdate({ aiBubbleColor: color })}
                            className={cn(
                              "w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center",
                              settings.aiBubbleColor === color ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          >
                            {settings.aiBubbleColor === color && <Check size={18} weight="bold" className="text-white shadow-sm" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20">
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[13px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
              >
                Apply & Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
