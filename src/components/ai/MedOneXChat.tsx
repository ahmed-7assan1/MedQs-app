"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useDrQChat, PROVIDER_CONFIGS, FileAttachment, AIProvider } from "@/hooks/useDrQChat";
import {
  Plus, Paperclip, ArrowUp, Stop, X, Trash, ChatDots,
  MagnifyingGlass, Gear, List, NoteBlank, Quotes, BookOpen, Lightning,
  Check, GlobeHemisphereWest, Sparkle, Sun, Moon,
  WarningCircle, Clock, House, ChatCircle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DrQMessage } from "./DrQMessage";
import { DrQConfigPanel } from "./DrQConfigPanel";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
import { DRQ_WORKSPACES, WORKSPACE_IDS } from "./DrQWorkspaces";
import { useThemeStore } from "@/lib/store";
import "./MedOneXChat.css";

const C = {
  surface: "bg-white dark:bg-[#121212]",
  surfaceAlt: "bg-gray-50 dark:bg-[#1e1e1e]",
  surfaceChat: "bg-gray-100 dark:bg-[#2d2d2d]",
  surfaceSecondary: "bg-gray-200 dark:bg-[#3a3a3a]",
  textPrimary: "text-gray-900 dark:text-[#f0f0f0]",
  textSecondary: "text-gray-600 dark:text-[#d0d0d0]",
  textTertiary: "text-gray-400 dark:text-[#a0a0a0]",
  border: "border-gray-200 dark:border-white/10",
  borderLight: "border-gray-100 dark:border-white/5",
};

const THREAD_TABS = [
  { id: "recent", label: "Recent", icon: Clock },
  { id: "pinned", label: "Starred", icon: ChatDots },
  { id: "all", label: "All Chats", icon: List },
];

export function MedOneXChat() {
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === "dark";

  const {
    threads, activeThreadId, messages, loading, streamingId,
    settings, limits, newThread, switchThread, deleteThread,
    sendMessage, stopGeneration, regenerate, setReaction, updateSettings,
  } = useDrQChat();

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [modelPickerProvider, setModelPickerProvider] = useState<AIProvider | null>(null);
  const [showThreads, setShowThreads] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recent");
  const [inputFocused, setInputFocused] = useState(false);
  const [showApiAlert, setShowApiAlert] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingId]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  useEffect(() => {
    const apiKey = settings.byokKeys[settings.activeProvider];
    if (!apiKey && messages.length > 0) {
      setShowApiAlert(true);
    } else {
      setShowApiAlert(false);
    }
  }, [settings.byokKeys, settings.activeProvider, messages.length]);

  const handleSend = () => {
    if ((!input.trim() && files.length === 0) || loading) return;
    const apiKey = settings.byokKeys[settings.activeProvider];
    if (!apiKey) {
      setShowApiAlert(true);
      return;
    }
    sendMessage(input, files, undefined, webSearchEnabled);
    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    setFileUploading(true);
    const newFiles: FileAttachment[] = [];
    let count = 0;
    Array.from(selected).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newFiles.push({ data: ev.target?.result as string, mimeType: file.type, name: file.name, size: file.size });
        count++;
        if (count === selected.length) { setFiles([...files, ...newFiles]); setFileUploading(false); }
      };
      reader.onerror = () => setFileUploading(false);
      if (file.type.startsWith('image/') || file.type === 'application/pdf') reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredThreads = threads.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (activeTab === "all" || (activeTab === "recent" && true))
  );

  const activePersonaObj = DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer;
  const apiKeyMissing = !settings.byokKeys[settings.activeProvider];

  const personaList = Object.keys(DRQ_PERSONAS).slice(0, 5) as DrQPersonaId[];

  return (
    <div className={cn("flex flex-col h-screen w-screen overflow-hidden transition-colors duration-300", isDark ? "bg-black" : "bg-white")}>
      <style>{`
        :root { color-scheme: ${isDark ? "dark" : "light"}; }
      `}</style>

      {/* ─── API Key Alert ─── */}
      <AnimatePresence>
        {showApiAlert && apiKeyMissing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[min(600px,calc(100vw-32px))]"
          >
            <div className={cn(
              "rounded-2xl border shadow-2xl p-4 flex items-start gap-3 backdrop-blur-xl",
              isDark ? "bg-red-950/90 border-red-500/30" : "bg-red-50 border-red-200"
            )}>
              <WarningCircle size={20} weight="fill" className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold", isDark ? "text-red-300" : "text-red-800")}>API Key Required</p>
                <p className={cn("text-xs mt-1", isDark ? "text-red-400/80" : "text-red-600")}>
                  Set your {PROVIDER_CONFIGS[settings.activeProvider].label} API key in settings to start chatting.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setShowConfig(true)} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-colors", isDark ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-red-100 text-red-700 hover:bg-red-200")}>
                  Set Key
                </button>
                <button onClick={() => setShowApiAlert(false)} className={cn("p-1.5 rounded-lg transition-colors", isDark ? "hover:bg-white/10 text-red-400" : "hover:bg-red-100 text-red-500")}>
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top Island Bar ─── */}
      <div className="fixed inset-x-0 top-0 z-40 flex justify-center items-start px-3 pt-0 pointer-events-none">
        <div className={cn(
          "pointer-events-auto relative flex flex-col items-center overflow-hidden",
          "rounded-b-[32px] rounded-t-none border-x border-b",
          isDark ? "border-white/10 bg-black/80" : "border-black/5 bg-white/90",
          "backdrop-blur-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.25)]",
          "w-[min(1400px,calc(100vw-24px))] transition-all duration-300 ease-out"
        )}>
          {/* Main Island Row */}
          <div className="flex w-full items-center justify-between gap-2 h-[60px] px-3">
            {/* Left: Home + Personas */}
            <div className="flex items-center gap-1.5">
              <Link
                href="/dashboard-app"
                className={cn(
                  "p-2 rounded-xl transition-all flex-shrink-0",
                  isDark ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-gray-400 hover:bg-black/5 hover:text-gray-800"
                )}
                title="Home"
              >
                <House size={18} weight="bold" />
              </Link>
              <div className={cn("w-px h-5 mx-1", isDark ? "bg-white/10" : "bg-gray-200")} />
              {personaList.map(pid => {
                const p = DRQ_PERSONAS[pid];
                const isActive = settings.activePersona === pid;
                return (
                  <button
                    key={pid}
                    onClick={() => {
                      const ws = Object.values(DRQ_WORKSPACES).find(w => w.personaId === pid);
                      if (ws) updateSettings({ activePersona: pid, activeProvider: ws.defaultProvider, activeModel: ws.defaultModel });
                      else updateSettings({ activePersona: pid });
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                      isActive
                        ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-black/5 text-gray-900 shadow-sm"
                        : isDark ? "text-white/50 hover:bg-white/5 hover:text-white/80" : "text-gray-500 hover:bg-black/5 hover:text-gray-800"
                    )}
                  >
                    <span className="text-sm">{p.icon as any}</span>
                    <span className="hidden sm:inline">{p.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Center: Thread Tabs */}
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-white/5 rounded-xl p-0.5">
              {THREAD_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowThreads(true); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all",
                    activeTab === tab.id && showThreads
                      ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-white text-gray-900 shadow-sm"
                      : isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-700"
                  )}
                >
                  <tab.icon size={14} weight={activeTab === tab.id && showThreads ? "fill" : "regular"} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              {/* Model Selector Widget — always visible chips */}
              <div className="flex items-center gap-0.5">
                {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map(p => {
                  const isActive = settings.activeProvider === p;
                  return (
                    <div key={p} className="relative">
                      <button
                        onClick={() => {
                          if (isActive) {
                            setModelPickerProvider(modelPickerProvider === p ? null : p);
                          } else {
                            updateSettings({ activeProvider: p, activeModel: PROVIDER_CONFIGS[p].defaultModel });
                            setModelPickerProvider(null);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-all",
                          isActive
                            ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-black/5 text-gray-900 shadow-sm"
                            : isDark ? "text-white/40 hover:bg-white/5 hover:text-white/70" : "text-gray-400 hover:bg-black/5 hover:text-gray-700"
                        )}
                        title={PROVIDER_CONFIGS[p].label}
                      >
                        <span className="text-[11px] font-bold">{PROVIDER_CONFIGS[p].icon}</span>
                        {isActive && (
                          <span className="hidden sm:inline truncate max-w-[80px] text-[11px]">{settings.activeModel}</span>
                        )}
                      </button>
                      <AnimatePresence>
                        {modelPickerProvider === p && (
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.97 }}
                            className={cn(
                              "absolute top-full right-0 mt-1 w-52 rounded-2xl shadow-2xl border overflow-hidden z-50",
                              isDark ? "bg-[#1e1e1e] border-white/10" : "bg-white border-gray-200"
                            )}
                          >
                            <div className={cn("px-3 py-2 text-[10px] font-bold uppercase tracking-wider", isDark ? "text-white/30" : "text-gray-400")}>
                              {PROVIDER_CONFIGS[p].label}
                            </div>
                            {PROVIDER_CONFIGS[p].models.map(m => (
                              <button
                                key={m}
                                onClick={() => { updateSettings({ activeProvider: p, activeModel: m }); setModelPickerProvider(null); }}
                                className={cn(
                                  "w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2",
                                  settings.activeModel === m
                                    ? isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"
                                    : isDark ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-50"
                                )}
                              >
                                <span className="truncate">{m}</span>
                                {settings.activeModel === m && (
                                  <Check size={12} weight="bold" className="flex-shrink-0 text-indigo-400" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className={cn("w-px h-5", isDark ? "bg-white/10" : "bg-gray-200")} />

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={cn("p-2 rounded-xl transition-all", isDark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-gray-500 hover:bg-black/5 hover:text-gray-800")}
              >
                {isDark ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
              </button>

              {/* Config Gear */}
              <button
                onClick={() => setShowConfig(true)}
                className={cn("p-2 rounded-xl transition-all", isDark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-gray-500 hover:bg-black/5 hover:text-gray-800")}
              >
                <Gear size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Threads Container ─── */}
      <AnimatePresence>
        {showThreads && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowThreads(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "relative w-full max-w-lg h-[70vh] rounded-3xl overflow-hidden border shadow-2xl",
                isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
              )}
            >
              <div className={cn("flex items-center justify-between p-4 border-b", isDark ? "border-white/10" : "border-gray-200")}>
                <div className="flex items-center gap-3">
                  <ChatCircle size={18} weight="fill" className="text-indigo-500" />
                  <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {activeTab === "recent" ? "Recent Chats" : activeTab === "pinned" ? "Starred Chats" : "All Chats"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={newThread} className={cn("p-2 rounded-xl transition-colors", isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800")}>
                    <Plus size={16} weight="bold" />
                  </button>
                  <button onClick={() => setShowThreads(false)} className={cn("p-2 rounded-xl transition-colors", isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800")}>
                    <X size={16} weight="bold" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="relative">
                  <MagnifyingGlass size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-gray-500" : "text-gray-400")} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className={cn(
                      "w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-colors",
                      isDark ? "bg-white/5 text-white placeholder-gray-500 border border-white/10" : "bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200"
                    )}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-3 space-y-1">
                {filteredThreads.length === 0 ? (
                  <div className={cn("flex flex-col items-center justify-center h-48 text-sm gap-3", isDark ? "text-gray-500" : "text-gray-400")}>
                    <ChatCircle size={32} weight="thin" />
                    <span>No conversations found</span>
                    <button onClick={() => { newThread(); setShowThreads(false); }} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-colors", isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-800 hover:bg-gray-200")}>
                      Start New Chat
                    </button>
                  </div>
                ) : (
                  filteredThreads.map(t => (
                    <div
                      key={t.id}
                      onClick={() => { switchThread(t.id); setShowThreads(false); }}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm",
                        activeThreadId === t.id
                          ? isDark ? "bg-white/10" : "bg-gray-100"
                          : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                      )}
                    >
                      <ChatCircle size={16} weight={activeThreadId === t.id ? "fill" : "regular"} className={cn("flex-shrink-0", activeThreadId === t.id ? "text-indigo-500" : isDark ? "text-gray-500" : "text-gray-400")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("truncate font-medium", isDark ? "text-white" : "text-gray-900")}>{t.title || "New Chat"}</p>
                        <p className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{new Date(t.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                        className={cn("opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all", isDark ? "hover:bg-white/10 text-gray-400 hover:text-red-400" : "hover:bg-gray-200 text-gray-500 hover:text-red-500")}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Messages Area ─── */}
      <main className={cn("flex flex-col flex-1 min-h-0 pt-[60px]", isDark ? "bg-black" : "bg-white")}>
        <div className="flex-1 overflow-y-auto scrollbar-hover min-h-0">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
                  isDark ? "bg-white/10" : "bg-gray-100"
                )}
              >
                <Lightning size={28} weight="fill" className={isDark ? "text-indigo-400" : "text-indigo-500"} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn("text-2xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}
              >
                MedOneX Expert
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={cn("text-sm mb-6", isDark ? "text-gray-400" : "text-gray-500")}
              >
                How can I help you today?
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl"
              >
                {[
                  { icon: BookOpen, text: "Summarize my last lecture in 3 bullet points" },
                  { icon: Quotes, text: "Generate 3 MCQs on cardiology" },
                  { icon: NoteBlank, text: "Explain diabetes pathophysiology simply" },
                  { icon: Sparkle, text: "Create a 1-week study plan for pharmacology" },
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-2xl border text-left text-sm transition-all",
                      isDark
                        ? "border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    )}
                  >
                    <s.icon size={18} className="flex-shrink-0 mt-0.5 text-indigo-500" />
                    <span>{s.text}</span>
                  </button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 pb-8 space-y-1">
              {messages.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" ? (
                    <div className="w-full max-w-full">
                      <div className="flex items-center gap-3 px-1 mb-2 mt-6">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shadow-md",
                          `bg-gradient-to-br ${(DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).gradient}`
                        )}>
                          {React.cloneElement(
                            (DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).icon as React.ReactElement,
                            { size: 16, weight: "fill", className: "text-white" }
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                            {(DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).name}
                          </span>
                          <span className={cn("text-[10px] font-semibold uppercase tracking-widest", isDark ? "text-gray-500" : "text-gray-400")}>
                            {PROVIDER_CONFIGS[settings.activeProvider].label} · MedOneX Expert
                          </span>
                        </div>
                      </div>
                      <DrQMessage
                        message={m}
                        fontSize={settings.fontSize}
                        userBubbleColor={settings.userBubbleColor}
                        aiBubbleColor={settings.aiBubbleColor}
                        onReaction={setReaction}
                        onRegenerate={regenerate}
                        onReply={() => {}}
                        activePersona={settings.activePersona}
                        variant="flat"
                      />
                    </div>
                  ) : (
                    <DrQMessage
                      message={m}
                      fontSize={settings.fontSize}
                      userBubbleColor={settings.userBubbleColor}
                      aiBubbleColor={settings.aiBubbleColor}
                      onReaction={setReaction}
                      onRegenerate={undefined}
                      onReply={() => {}}
                      activePersona={settings.activePersona}
                    />
                  )}
                </motion.div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Floating Input Island - Fixed Bottom */}
        <div className={cn("flex-shrink-0 pb-2 md:pb-3 pt-4 flex justify-center", isDark ? "bg-black" : "bg-white")}>
          <div className="w-full max-w-3xl mx-auto px-3 md:px-4">
            <div
              className={cn(
                "rounded-[28px] border transition-all duration-200",
                inputFocused
                  ? isDark ? "border-gray-500" : "border-gray-300"
                  : isDark ? "border-white/20" : "border-gray-200/80",
                isDark ? "bg-black" : "bg-white",
                "shadow-sm"
              )}
            >
              <div className="flex items-center gap-1 px-2 py-1">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn("p-1.5 rounded-lg transition-colors flex items-center justify-center", isDark ? "text-gray-300 hover:bg-white/10 hover:text-white" : "text-gray-400 hover:bg-gray-100")}
                  >
                    {fileUploading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <Paperclip size={16} />
                    )}
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange} />
                  <button
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors flex items-center justify-center",
                      webSearchEnabled
                        ? "bg-indigo-500/20 text-indigo-500"
                        : isDark ? "text-gray-300 hover:bg-white/10 hover:text-white" : "text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <GlobeHemisphereWest size={16} />
                  </button>
                </div>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Message MedOneX Expert..."
                  className={cn(
                    "w-full bg-transparent border-none outline-none resize-none py-1.5 px-1 text-sm leading-relaxed no-scrollbar",
                    isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                  )}
                />
                {loading ? (
                  <button
                    onClick={stopGeneration}
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all",
                      isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <Stop size={14} weight="fill" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() && files.length === 0}
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200",
                      input.trim() || files.length > 0
                        ? "bg-indigo-500 text-white hover:bg-indigo-600"
                        : isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <ArrowUp size={14} weight="bold" />
                  </button>
                )}
              </div>
              {files.length > 0 && (
                <div className={cn("flex gap-1.5 px-3 pb-2.5 overflow-x-auto no-scrollbar", isDark ? "border-t border-white/5" : "border-t border-gray-100")}>
                  {files.map((f, i) => (
                    <div key={i} className="relative flex-shrink-0 mt-2">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden",
                        isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"
                      )}>
                        {f.mimeType.startsWith('image/') ? (
                          <img src={f.data} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-1">
                            <NoteBlank size={14} className={isDark ? "text-gray-400" : "text-gray-500"} />
                            <span className={cn("text-[8px] mt-0.5 text-center truncate max-w-[60px]", isDark ? "text-gray-500" : "text-gray-400")}>{f.name}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setFiles(files.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                      >
                        <X size={8} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>MedOneX Expert</span>
              <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>{limits.used}/{limits.limit}</span>
            </div>
          </div>
        </div>
      </main>

      <DrQConfigPanel isOpen={showConfig} settings={settings} onUpdate={updateSettings} onClose={() => setShowConfig(false)} />
    </div>
  );
}
