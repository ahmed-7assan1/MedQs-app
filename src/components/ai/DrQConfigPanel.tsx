"use client";

import React, { useState, useEffect } from "react";
import {
  X, Key, TextT, Palette, Check, ShieldCheck,
  Lightning, Eye, EyeSlash, ArrowUpRight, ImageSquare,
  Plus, Spinner, WarningCircle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { DrQSettings, PROVIDER_CONFIGS, AIProvider } from "@/hooks/useDrQChat";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/store";
import { QuotaRing } from "@/components/ui/QuotaRing";
import { getProviderUsage } from "@/lib/rate-limits";

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DrQSettings;
  onUpdate: (updated: Partial<DrQSettings>) => void;
}

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22];
const USER_COLORS = ["#6d28d9", "#7c3aed", "#4f46e5", "#3b82f6", "#0891b2", "#059669"];
const AI_COLORS = ["#1a1830", "#1e1b4b", "#172554", "#0c4a6e", "#022c22", "#1c1917"];

function getKeysArray(keys: string | string[] | undefined): string[] {
  if (Array.isArray(keys)) return keys;
  if (typeof keys === "string" && keys) return [keys];
  return [];
}

function keyLabel(pid: AIProvider): string {
  if (pid === "gemini") return "Google AI Studio API Key";
  if (pid === "ovhcloud") return "OVHcloud Endpoint";
  if (pid === "github") return "GitHub Personal Access Token";
  return `API Key`;
}

async function testKey(pid: AIProvider, key: string): Promise<{ ok: boolean; error?: string }> {
  const config = PROVIDER_CONFIGS[pid];
  if (config.needsKey === false) return { ok: true };
  if (!key) return { ok: false, error: "No key entered" };
  try {
    if (pid === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true };
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error?.message || `HTTP ${res.status}` };
    }
    // Mistral
    if (pid === "mistral") {
      const res = await fetch("https://api.mistral.ai/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true };
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error?.message || `HTTP ${res.status}` };
    }
    // Generic OpenAI-compatible
    const baseURL = config.baseURL || "https://api.openai.com/v1";
    const URL = baseURL.endsWith("/v1") ? `${baseURL}/models` : `${baseURL.replace(/\/+$/, "")}/v1/models`;
    const res = await fetch(URL, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body?.error?.message || body?.error || `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e.name === "TimeoutError" ? "Timeout (8s)" : e.message || "Unknown error" };
  }
}

export function DrQConfigPanel({ isOpen, onClose, settings, onUpdate }: ConfigPanelProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"keys" | "models" | "appearance">("keys");
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<Record<string, "idle" | "testing" | "ok" | "fail">>({});
  const [keyError, setKeyError] = useState<Record<string, string>>({});
  const [quotaUsage, setQuotaUsage] = useState<Record<string, { used: number; limit: number; percentage: number }>>({});

  // Refresh quota usage on mount and every 10s while panel is open
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const all: Record<string, any> = {};
      for (const p of Object.keys(PROVIDER_CONFIGS)) {
        all[p] = getProviderUsage(p);
      }
      setQuotaUsage(all);
    };
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleKeyChange = (pid: AIProvider, index: number, value: string) => {
    const current = settings.byokKeys[pid];
    const arr = getKeysArray(current);
    while (arr.length <= index) arr.push("");
    arr[index] = value;
    // Remove trailing empties except keep at least one
    const cleaned = arr.length > 1 ? arr.filter((k, i) => i === 0 || k || i < arr.length - 1) : arr;
    onUpdate({ byokKeys: { ...settings.byokKeys, [pid]: cleaned } });
  };

  const addKeyField = (pid: AIProvider) => {
    const current = settings.byokKeys[pid];
    const arr = getKeysArray(current);
    if (arr.length >= 5) return;
    arr.push("");
    onUpdate({ byokKeys: { ...settings.byokKeys, [pid]: arr } });
  };

  const removeKeyField = (pid: AIProvider, index: number) => {
    const current = settings.byokKeys[pid];
    let arr = getKeysArray(current);
    if (arr.length <= 1) {
      arr = [""];
    } else {
      arr = arr.filter((_, i) => i !== index);
    }
    onUpdate({ byokKeys: { ...settings.byokKeys, [pid]: arr } });
  };

  const handleTest = async (pid: AIProvider, index: number) => {
    const current = settings.byokKeys[pid];
    const arr = getKeysArray(current);
    const key = arr[index];
    const id = `${pid}-${index}`;
    setTestingKey(prev => ({ ...prev, [id]: "testing" }));
    setKeyError(prev => ({ ...prev, [id]: "" }));
    const result = await testKey(pid, key);
    setTestingKey(prev => ({ ...prev, [id]: result.ok ? "ok" : "fail" }));
    if (!result.ok) {
      setKeyError(prev => ({ ...prev, [id]: result.error || "Unknown error" }));
    }
  };

  const toggleModel = (pid: AIProvider, model: string) => {
    const current = settings.activeModels?.[pid] || [PROVIDER_CONFIGS[pid]?.defaultModel].filter(Boolean);
    const isSelected = current.includes(model);
    let updated: string[];
    if (isSelected) {
      if (current.length <= 1) return; // must keep at least one
      updated = current.filter(m => m !== model);
    } else {
      updated = [...current, model];
    }
    onUpdate({ activeModels: { ...settings.activeModels, [pid]: updated } });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10030] flex items-center justify-center p-4"
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
              {(["keys", "models", "appearance"] as const).map(tab => (
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
                  {tab === "keys" ? <ShieldCheck size={14} weight="bold" /> : tab === "models" ? <Lightning size={14} weight="bold" /> : <Palette size={14} weight="bold" />}
                  {tab === "keys" ? "API Keys" : tab === "models" ? "Models" : "Appearance"}
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
                      Keys are stored locally in your browser. Add up to 5 keys per provider for automatic rotation on quota exhaustion.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map(pid => {
                      const config = PROVIDER_CONFIGS[pid];
                      const keys = getKeysArray(settings.byokKeys[pid]);
                      const hasAnyKey = keys.some(k => k);
                      return (
                        <div key={pid} className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200")}>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold", isDark ? "bg-white/10" : "bg-white border border-gray-200")}>
                                {config.icon}
                              </div>
                              <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{config.label}</span>
                              {config.keyUrl && (
                                <a
                                  href={config.keyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={cn(
                                    "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105",
                                    isDark ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                  )}
                                >
                                  Get
                                  <ArrowUpRight size={10} weight="bold" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5">
                              {quotaUsage[pid] && quotaUsage[pid].limit > 0 && (
                                <QuotaRing
                                  used={quotaUsage[pid].used}
                                  limit={quotaUsage[pid].limit}
                                  size={24}
                                  strokeWidth={2.5}
                                />
                              )}
                              {hasAnyKey ? (
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>
                                  {keys.filter(k => k).length} key{keys.filter(k => k).length !== 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500")}>No Key</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {keys.map((key, idx) => {
                              const id = `${pid}-${idx}`;
                              const testState = testingKey[id];
                              const isVisible = visibleKeys[id];
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <input
                                      type={isVisible ? "text" : "password"}
                                      placeholder={`${config.label} Key ${idx + 1}${idx === 0 ? " (Primary)" : ""}...`}
                                      value={key}
                                      onChange={(e) => handleKeyChange(pid, idx, e.target.value)}
                                      className={cn(
                                        "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all font-mono",
                                        isDark ? "bg-black/40 text-white placeholder-gray-600 border border-white/10 focus:border-indigo-500/50" : "bg-white text-gray-900 placeholder-gray-300 border border-gray-200 focus:border-indigo-400/50"
                                      )}
                                    />
                                    <button
                                      onClick={() => setVisibleKeys({ ...visibleKeys, [id]: !isVisible })}
                                      className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition-colors", isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700")}
                                    >
                                      {isVisible ? <EyeSlash size={16} /> : <Eye size={16} />}
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleTest(pid, idx)}
                                    disabled={!key || testState === "testing"}
                                    className={cn(
                                      "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                      testState === "testing"
                                        ? isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"
                                        : testState === "ok"
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : testState === "fail"
                                        ? "bg-red-500/10 text-red-500"
                                        : isDark ? "bg-white/10 text-gray-400 hover:bg-white/20" : "bg-gray-200 text-gray-600 hover:bg-gray-300",
                                      !key ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                    )}
                                    title="Test key"
                                  >
                                    {testState === "testing" ? (
                                      <Spinner size={14} weight="bold" className="animate-spin" />
                                    ) : testState === "ok" ? (
                                      <Check size={14} weight="bold" />
                                    ) : testState === "fail" ? (
                                      <WarningCircle size={14} weight="bold" />
                                    ) : (
                                      <Lightning size={14} weight="bold" />
                                    )}
                                  </button>
                                  {keys.length > 1 && (
                                    <button
                                      onClick={() => removeKeyField(pid, idx)}
                                      className={cn("flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all", isDark ? "text-gray-500 hover:bg-white/10 hover:text-red-400" : "text-gray-400 hover:bg-gray-200 hover:text-red-500")}
                                      title="Remove key"
                                    >
                                      <X size={12} weight="bold" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            {keyError[`${pid}-${keys.length - 1}`] && (
                              <p className="text-[10px] text-red-400 pl-1">{keyError[`${pid}-${keys.length - 1}`]}</p>
                            )}
                            {keys.length < 5 && (
                              <button
                                onClick={() => addKeyField(pid)}
                                className={cn(
                                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all",
                                  isDark ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                )}
                              >
                                <Plus size={12} weight="bold" />
                                Add Key ({keys.length}/5)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : activeTab === "models" ? (
                <div className="space-y-3">
                  <div className={cn("p-3 rounded-2xl", isDark ? "bg-indigo-500/5 border border-indigo-500/10" : "bg-indigo-50 border border-indigo-100")}>
                    <p className={cn("text-xs leading-relaxed font-medium flex items-center gap-2", isDark ? "text-indigo-300" : "text-indigo-700")}>
                      <Lightning size={14} weight="bold" className="flex-shrink-0" />
                      Select which models to use per provider. The system will auto-fallback between selected models on failure. At least one model required per provider.
                    </p>
                  </div>
                  {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map(pid => {
                    const config = PROVIDER_CONFIGS[pid];
                    const selected = settings.activeModels?.[pid] || [config.defaultModel].filter(Boolean);
                    const allModels = config.models || [];
                    return (
                      <div key={pid} className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200")}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold", isDark ? "bg-white/10" : "bg-white border border-gray-200")}>
                            {config.icon}
                          </div>
                          <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{config.label}</span>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500")}>
                            {selected.length}/{allModels.length}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {allModels.map(model => {
                            const isSelected = selected.includes(model);
                            return (
                              <button
                                key={model}
                                onClick={() => toggleModel(pid, model)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all text-left",
                                  isSelected
                                    ? isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"
                                    : isDark ? "text-white/40 hover:bg-white/5 hover:text-white/60" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                )}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all",
                                  isSelected
                                    ? "bg-indigo-500 border-indigo-500"
                                    : isDark ? "border-white/20" : "border-gray-300"
                                )}>
                                  {isSelected && <Check size={10} weight="bold" className="text-white" />}
                                </div>
                                <span className="truncate font-mono text-[11px]">{model}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

                  {/* Background Image */}
                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-200")}>
                    <label className={cn("text-xs font-bold uppercase tracking-wider block mb-3", isDark ? "text-gray-400" : "text-gray-500")}>Chat Background</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Paste image URL or upload..."
                          value={settings.bgImage || ""}
                          onChange={(e) => onUpdate({ bgImage: e.target.value })}
                          className={cn(
                            "flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all",
                            isDark ? "bg-black/40 text-white placeholder-gray-600 border border-white/10 focus:border-indigo-500/50" : "bg-white text-gray-900 placeholder-gray-300 border border-gray-200 focus:border-indigo-400/50"
                          )}
                        />
                        <button
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => onUpdate({ bgImage: ev.target?.result as string });
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          className={cn(
                            "flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all whitespace-nowrap",
                            isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          )}
                        >
                          <ImageSquare size={16} weight="bold" />
                          Upload
                        </button>
                        {settings.bgImage && (
                          <button
                            onClick={() => onUpdate({ bgImage: "" })}
                            className={cn("p-2.5 rounded-xl transition-all", isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50")}
                          >
                            <X size={16} weight="bold" />
                          </button>
                        )}
                      </div>
                      {settings.bgImage && (
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl border overflow-hidden flex-shrink-0"
                            style={{ backgroundImage: `url(${settings.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
                          />
                          <span className={cn("text-[10px] font-medium truncate flex-1", isDark ? "text-gray-500" : "text-gray-400")}>
                            {settings.bgImage.length > 60 ? settings.bgImage.slice(0, 60) + "..." : settings.bgImage}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blur & Opacity */}
                  {settings.bgImage && (
                    <>
                      <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-200")}>
                        <div className="flex items-center justify-between mb-3">
                          <label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-gray-400" : "text-gray-500")}>
                            <ImageSquare size={14} weight="bold" />
                            Blur
                          </label>
                          <span className="text-sm font-bold text-indigo-500">{settings.bgBlur || 0}px</span>
                        </div>
                        <input
                          type="range" min="0" max="20" step="1"
                          value={settings.bgBlur || 0}
                          onChange={(e) => onUpdate({ bgBlur: parseInt(e.target.value) })}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}
                        />
                      </div>
                      <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-200")}>
                        <div className="flex items-center justify-between mb-3">
                          <label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-gray-400" : "text-gray-500")}>Opacity</label>
                          <span className="text-sm font-bold text-indigo-500">{Math.round((settings.bgOpacity || 0.15) * 100)}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" step="1"
                          value={Math.round((settings.bgOpacity || 0.15) * 100)}
                          onChange={(e) => onUpdate({ bgOpacity: parseInt(e.target.value) / 100 })}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}
                        />
                      </div>
                    </>
                  )}
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
