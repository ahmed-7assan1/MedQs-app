"use client";

import React, { useState } from "react";
import { 
  X, Key, TextT, Palette, Check, ShieldCheck,
  Lightning, GoogleLogo, OpenAiLogo, Globe, CaretDown,
  Eye, EyeSlash
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { DrQSettings, PROVIDER_CONFIGS, AIProvider } from "@/hooks/useDrQChat";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/store";

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DrQSettings;
  onUpdate: (updated: Partial<DrQSettings>) => void;
}

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22];
const USER_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const AI_COLORS = ["#1e1e2e", "#111827", "#064e3b", "#1e293b", "#2d1b69", "#1a1a2e"];

export function DrQConfigPanel({ isOpen, onClose, settings, onUpdate }: ConfigPanelProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"keys" | "appearance">("keys");
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={cn(
              "relative w-full max-w-xl max-h-[85vh] rounded-3xl overflow-hidden border shadow-2xl flex flex-col",
              isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
            )}
          >
            {/* Header */}
            <div className={cn("flex items-center justify-between p-5 border-b", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-white/10" : "bg-gray-100")}>
                  <Key size={18} weight="bold" className="text-indigo-500" />
                </div>
                <div>
                  <h2 className={cn("text-base font-bold", isDark ? "text-white" : "text-gray-900")}>Settings</h2>
                  <p className={cn("text-[10px] font-medium uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>Personalize your experience</p>
                </div>
              </div>
              <button onClick={onClose} className={cn("p-2 rounded-xl transition-all", isDark ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800")}>
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Tabs */}
            <div className={cn("flex mx-5 mt-4 p-0.5 rounded-xl", isDark ? "bg-white/5" : "bg-gray-100")}>
              {(["keys", "appearance"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all",
                    activeTab === tab
                      ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-white text-gray-900 shadow-sm"
                      : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab === "keys" ? <ShieldCheck size={14} weight="bold" /> : <Palette size={14} weight="bold" />}
                  {tab === "keys" ? "API Keys" : "Appearance"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              {activeTab === "keys" ? (
                <>
                  <div className={cn("p-3 rounded-2xl", isDark ? "bg-indigo-500/5 border border-indigo-500/10" : "bg-indigo-50 border border-indigo-100")}>
                    <p className={cn("text-xs leading-relaxed font-medium flex items-center gap-2", isDark ? "text-indigo-300" : "text-indigo-700")}>
                      <ShieldCheck size={14} weight="bold" className="flex-shrink-0" />
                      Keys are stored locally in your browser. Direct streaming ensures privacy.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map(pid => {
                      const config = PROVIDER_CONFIGS[pid];
                      const key = settings.byokKeys[pid] || "";
                      const isVisible = visibleKeys[pid];
                      return (
                        <div key={pid} className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200")}>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold", isDark ? "bg-white/10" : "bg-white border border-gray-200")}>
                                {config.icon}
                              </div>
                              <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{config.label}</span>
                            </div>
                            {key ? (
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>Connected</span>
                            ) : (
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500")}>No Key</span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type={isVisible ? "text" : "password"}
                              placeholder={`Enter ${config.label} API Key...`}
                              value={key}
                              onChange={(e) => onUpdate({ byokKeys: { ...settings.byokKeys, [pid]: e.target.value } })}
                              className={cn(
                                "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all font-mono",
                                isDark ? "bg-black/40 text-white placeholder-gray-600 border border-white/10 focus:border-indigo-500/50" : "bg-white text-gray-900 placeholder-gray-300 border border-gray-200 focus:border-indigo-400/50"
                              )}
                            />
                            <button
                              onClick={() => setVisibleKeys({ ...visibleKeys, [pid]: !isVisible })}
                              className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition-colors", isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700")}
                            >
                              {isVisible ? <EyeSlash size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Font Size */}
                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-gray-400" : "text-gray-500")}>Font Size</label>
                      <span className="text-sm font-bold text-indigo-500">{settings.fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TextT size={14} className={isDark ? "text-gray-500" : "text-gray-400"} />
                      <input
                        type="range" min="12" max="22" step="1"
                        value={settings.fontSize}
                        onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}
                      />
                      <TextT size={20} className={isDark ? "text-gray-500" : "text-gray-400"} />
                    </div>
                  </div>

                  {/* User Bubble Color */}
                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-200")}>
                    <label className={cn("text-xs font-bold uppercase tracking-wider block mb-3", isDark ? "text-gray-400" : "text-gray-500")}>User Message</label>
                    <div className="flex flex-wrap gap-2.5">
                      {USER_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => onUpdate({ userBubbleColor: color })}
                          className={cn(
                            "w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center",
                            settings.userBubbleColor === color ? "border-indigo-500 scale-110 shadow-md" : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {settings.userBubbleColor === color && <Check size={14} weight="bold" className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Bubble Color */}
                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-200")}>
                    <label className={cn("text-xs font-bold uppercase tracking-wider block mb-3", isDark ? "text-gray-400" : "text-gray-500")}>AI Message</label>
                    <div className="flex flex-wrap gap-2.5">
                      {AI_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => onUpdate({ aiBubbleColor: color })}
                          className={cn(
                            "w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center",
                            settings.aiBubbleColor === color ? "border-indigo-500 scale-110 shadow-md" : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {settings.aiBubbleColor === color && <Check size={14} weight="bold" className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={cn("p-4 border-t flex justify-end", isDark ? "border-white/10 bg-black/20" : "border-gray-200 bg-gray-50")}>
              <button
                onClick={onClose}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                )}
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
