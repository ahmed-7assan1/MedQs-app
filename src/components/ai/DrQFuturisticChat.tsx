"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDrQChat, PROVIDER_CONFIGS, FileAttachment, AIProvider } from "@/hooks/useDrQChat";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import {
  Plus,
  Sparkle,
  Paperclip,
  ArrowUp,
  Stop,
  X,
  Clock,
  Gear,
  ChatCircle,
  Trash,
  List,
  CaretDown,
  NoteBlank,
  DotsThreeVertical,
  MagnifyingGlass,
  Export,
  CaretLeft,
  CaretRight,
  Stack,
  Student,
  BookOpen,
  Lightning,
  Quotes,
  Check,
  Broom,
  Sun,
  Moon,
  Palette,
  TextT,
  Users,
  CalendarCheck,
  Microphone,
  ClockClockwise,
  GlobeHemisphereWest
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DrQConfigPanel } from "./DrQConfigPanel";
import { DrQMessage } from "./DrQMessage";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
import { DRQ_WORKSPACES, WORKSPACE_IDS, WorkspaceId } from "./DrQWorkspaces";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { icon: Stack, label: "Dashboard", href: "/dashboard-app" },
  { icon: BookOpen, label: "Modules", href: "/modules" },
  { icon: Users, label: "Discuss", href: "/social" },
  { icon: CalendarCheck, label: "Taskat", href: "/taskat" },
];

export function DrQFuturisticChat() {
  const {
    threads, activeThread, activeThreadId, messages, loading, streamingId,
    settings, limits, newThread, switchThread, deleteThread, renameThread,
    clearThread, sendMessage, stopGeneration, regenerate, setReaction,
    updateSettings, exportThread,
  } = useDrQChat();
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || "Raf";
  const userAvatar = user?.user_metadata?.avatar_url || "";
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [replyContext, setReplyContext] = useState<{ id: string; text: string } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<AIProvider | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activePersonaObj = DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer;
  const activeWorkspace = (Object.entries(DRQ_WORKSPACES).find(
    ([, ws]) => ws.personaId === settings.activePersona
  )?.[0] as WorkspaceId) || "general";
  const [showNavMenu, setShowNavMenu] = useState(false);
  const { isRecording: isVoiceRecording, startRecording, stopRecording } = useVoiceRecorder();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingId]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && files.length === 0) || loading) return;
    sendMessage(input, files, replyContext?.id, webSearchEnabled);
    setReplyContext(null);
    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: FileAttachment[] = [];
    let count = 0;
    Array.from(selected).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newFiles.push({ data: ev.target?.result as string, mimeType: file.type, name: file.name, size: file.size });
        count++;
        if (count === selected.length) setFiles([...files, ...newFiles]);
      };
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredThreads = threads.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SUGGESTIONS = [
    { icon: Lightning, label: "Summarize last lecture", prompt: "Can you summarize my last lecture in 3 bullet points?" },
    { icon: NoteBlank, label: "Explain a concept", prompt: "Explain the pathophysiology of diabetes mellitus type 2 in simple terms." },
    { icon: Quotes, label: "Quiz me", prompt: "Generate 3 multiple choice questions on cardiology." },
    { icon: BookOpen, label: "Study plan", prompt: "Create a 1-week study plan for pharmacology." },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09080F] dark:bg-[#09080F] text-white selection:bg-indigo-500/30 selection:text-white">
      {/* Mobile cinematic background */}
      <div className="md:hidden fixed inset-0 cinematic-bg -z-10" />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── Ambient Background ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[55%] rounded-full bg-gradient-to-br from-cyan-600/8 via-teal-600/5 to-transparent blur-[150px] animate-pulse" style={{ animationDuration: '14s', animationDelay: '2s' }} />
        <div className="absolute -bottom-[15%] left-[15%] w-[50%] h-[40%] rounded-full bg-gradient-to-br from-purple-600/8 via-indigo-600/5 to-transparent blur-[150px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg5OSwgMTAyLCAyNDEsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
      </div>

      {/* ─── LEFT NAV (compact dropdown instead of rail) ─── */}
      <div className="hidden md:flex w-12 flex-shrink-0 flex-col items-center py-4 justify-between relative z-40 bg-[#0a0b14]/60 backdrop-blur-xl border-r border-white/[0.04]">
        <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 group cursor-pointer hover:scale-105 transition-all" onClick={newThread}>
          <Plus size={18} weight="bold" className="text-white" />
        </div>
        <div className="relative">
          <button onClick={() => setShowNavMenu(!showNavMenu)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white/30 hover:text-indigo-300 hover:bg-white/5 transition-all border border-transparent hover:border-white/[0.06]"
            title="Navigation">
            <List size={18} weight="bold" />
          </button>
          <AnimatePresence>
            {showNavMenu && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                className="absolute left-full top-0 ml-2 w-40 bg-[#0a0b14]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-[70]">
                {NAV_ITEMS.map((item, idx) => (
                  <a key={idx} href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-white/50 hover:text-indigo-300 transition-all text-[10px] font-bold uppercase tracking-wider">
                    <item.icon size={16} />
                    {item.label}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => setShowHistory(!showHistory)}
            className={cn("w-9 h-9 rounded-2xl flex items-center justify-center transition-all border", showHistory ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "text-white/30 hover:text-indigo-300 hover:bg-white/5 border-transparent")}
            title="Chat History">
            <Clock size={16} />
          </button>
          <button onClick={() => setShowConfig(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white/30 hover:text-indigo-300 hover:bg-white/5 transition-all border border-transparent hover:border-white/[0.06]"
            title="Settings">
            <Gear size={16} />
          </button>
          <button
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white/30 hover:text-indigo-300 hover:bg-white/5 transition-all border border-transparent hover:border-white/[0.06]"
            title="Profile">
            <img src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&bold=true`} alt="" className="w-6 h-6 rounded-xl object-cover ring-1 ring-white/10" />
          </button>
        </div>
      </div>

      {/* ─── CHAT HISTORY SIDEBAR ─── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col h-full bg-[#0a0b14]/40 backdrop-blur-2xl border-r border-white/[0.04] overflow-hidden flex-shrink-0"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/[0.04] h-16">
              <span className="text-xs font-bold text-white/50 uppercase tracking-[0.15em]">Conversations</span>
              <button onClick={newThread}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-indigo-400 hover:text-indigo-300 transition-all active:scale-95">
                <Plus size={14} weight="bold" />
              </button>
            </div>
            <div className="px-3 pt-3">
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-9 pr-3 py-2 text-xs text-white/70 placeholder:text-white/20 outline-none focus:border-indigo-500/30 focus:bg-white/5 transition-all" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
              {filteredThreads.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-center p-6">
                  <p className="text-xs text-white/15 font-medium">No conversations yet.<br />Start a new chat!</p>
                </div>
              ) : (
                filteredThreads.map(t => (
                  <div key={t.id}
                    className={cn(
                      "group w-full flex items-center justify-between p-2.5 rounded-2xl transition-all text-left",
                      activeThreadId === t.id ? "bg-white/8 border border-white/[0.06] shadow-sm" : "text-white/30 hover:text-white/70 hover:bg-white/[0.02] border border-transparent"
                    )}>
                    <button onClick={() => switchThread(t.id)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                      <ChatCircle size={14} className={cn("flex-shrink-0", activeThreadId === t.id ? "text-indigo-400" : "text-white/15 group-hover:text-white/30")} />
                      <span className="text-xs font-medium truncate">{t.title || "New Chat"}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg text-white/30 hover:text-red-400 transition-all ml-1">
                      <Trash size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-white/[0.04] bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-2xl flex items-center justify-center text-white shadow-inner", `bg-gradient-to-br ${activePersonaObj.gradient}`)}>
                  {React.cloneElement(activePersonaObj.icon as React.ReactElement, { size: 14, weight: "bold" })}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-white/70 truncate">{activePersonaObj.name}</span>
                  <span className="text-[7px] text-indigo-400 uppercase tracking-[0.2em] font-semibold">{PROVIDER_CONFIGS[settings.activeProvider].label}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CHAT AREA ─── */}
      <main className="flex-1 flex flex-col relative min-w-0 z-10">
        {/* ── Header with Workspace Tabs ── */}
        <header className="h-14 flex items-center justify-between px-2 md:px-4 border-b border-white/[0.04] bg-[#07080f]/40 backdrop-blur-2xl relative z-30">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <button onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all active:scale-95">
              <List size={18} weight="bold" />
            </button>
            <div className="hidden md:flex items-center gap-0.5 overflow-x-auto no-scrollbar">
              {WORKSPACE_IDS.map((wsId) => {
                const ws = DRQ_WORKSPACES[wsId];
                const isActive = activeWorkspace === wsId;
                return (
                  <button key={wsId} onClick={() => {
                    if (wsId === activeWorkspace) return;
                    updateSettings({
                      activePersona: ws.personaId,
                      activeProvider: ws.defaultProvider,
                      activeModel: ws.defaultModel,
                    });
                    toast.success(`Switched to ${ws.name}`);
                  }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                      isActive
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-sm"
                        : "text-white/30 hover:text-white/70 border border-transparent hover:bg-white/5"
                    )}>
                    <span className={cn("w-3.5 h-3.5 rounded-md flex items-center justify-center text-[8px]", isActive ? "text-indigo-300" : "text-white/30")}>
                      {React.cloneElement(ws.icon as React.ReactElement, { size: 12, weight: isActive ? "fill" : "regular" })}
                    </span>
                    <span className="hidden sm:inline">{ws.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="md:hidden flex items-center gap-2 ml-1">
              <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10", `bg-gradient-to-br ${activePersonaObj.gradient}`)}>
                {React.cloneElement(activePersonaObj.icon as React.ReactElement, { size: 12, weight: "fill" })}
              </div>
              <span className="text-xs font-bold text-white/70 truncate max-w-[100px]">{activeThread?.title || "MedOneX Expert"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowRightPanel(!showRightPanel)}
              className={cn("hidden lg:flex p-2 rounded-2xl border transition-all", showRightPanel ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-white/5 border-white/10 text-white/40 hover:text-indigo-300")}>
              <DotsThreeVertical size={15} weight="bold" />
            </button>
            <button onClick={() => setShowConfig(true)}
              className="p-2 rounded-2xl text-white/40 hover:text-indigo-300 hover:bg-white/5 transition-all">
              <Gear size={15} weight="bold" />
            </button>
            <button onClick={() => exportThread("markdown")}
              className="p-2 rounded-2xl text-white/40 hover:text-indigo-300 hover:bg-white/5 transition-all">
              <Export size={15} weight="bold" />
            </button>
            <div className="flex items-center gap-1.5 pl-1">
              <img src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&bold=true`} alt="" className="w-6 h-6 rounded-xl ring-1 ring-indigo-500/30 object-cover" />
              <span className="hidden sm:inline text-[9px] font-bold text-white/50 truncate max-w-[50px]">{userName.split(" ")[0]}</span>
            </div>
          </div>
        </header>

        {/* ── Messages ── */}
        <div className="flex-1 relative overflow-hidden"
          style={{
            ...(settings.bgImage ? {
              backgroundImage: `url(${settings.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            } : {}),
          }}
        >
          {settings.bgImage && (
            <div className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backdropFilter: `blur(${settings.bgBlur || 0}px)`,
                backgroundColor: `rgba(0,0,0,${settings.bgOpacity ?? 0.15})`,
              }}
            />
          )}
          <div className="absolute inset-0 z-10 overflow-y-auto no-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative mb-10">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-400/20 blur-2xl animate-pulse" style={{ animationDuration: '6s' }} />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-cyan-400/10 blur-xl" />
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                      <Sparkle size={36} weight="fill" className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 text-white">Hey, <span className="text-gradient-primary">{userName.split(" ")[0]}</span></h2>
                <p className="text-lg md:text-xl text-white/40 font-medium">What can I help with today?</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
                {[
                  { label: "Summarize", desc: "Condense lectures into key points", icon: NoteBlank },
                  { label: "Quiz Me", desc: "Generate practice questions", icon: Quotes },
                  { label: "Explain", desc: "Simplify complex concepts", icon: BookOpen },
                  { label: "Study Plan", desc: "Optimize your schedule", icon: Lightning },
                ].map((item, i) => (
                  <button key={i} onClick={() => setInput(item.desc)}
                    className="glass-card-premium group relative p-5 text-left overflow-hidden hover:border-indigo-500/20 transition-all duration-300">
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                      <item.icon size={16} className="text-indigo-400" />
                    </div>
                    <h4 className="text-sm font-bold text-white/80 mb-1 group-hover:text-indigo-300 transition-colors">{item.label}</h4>
                    <p className="text-[11px] text-white/30 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex flex-wrap justify-center gap-2 max-w-xl">
                {Object.values(DRQ_PERSONAS).map((p) => (
                  <button key={p.id} onClick={() => { updateSettings({ activePersona: p.id }); toast.success(`Switched to ${p.name}`); }}
                    className={cn("px-3 py-1.5 rounded-full border text-[9px] font-semibold uppercase tracking-wider transition-all", settings.activePersona === p.id ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-white/5 border-white/5 text-white/30 hover:text-white/70 hover:bg-white/10")}>
                    {p.name}
                  </button>
                ))}
              </motion.div>
              {/* ── Recent Prompts ── */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full max-w-2xl mt-8">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <ClockClockwise size={12} className="text-white/30" />
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Recent Prompts</span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {[
                    "Explain cellular respiration",
                    "Quiz me on anatomy",
                    "Summarize last lecture",
                    "Create study plan",
                  ].map((prompt, i) => (
                    <button key={i} onClick={() => setInput(prompt)}
                      className="flex-shrink-0 px-3.5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-[10px] font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all whitespace-nowrap">
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-44 space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className={cn(m.role === "user" && "flex justify-end")}>
                    <DrQMessage
                      message={m}
                      fontSize={settings.fontSize}
                      userBubbleColor={settings.userBubbleColor}
                      aiBubbleColor={settings.aiBubbleColor}
                      onReaction={setReaction}
                      onRegenerate={m.role === 'assistant' ? regenerate : undefined}
                      onReply={(id, text) => setReplyContext({ id, text })}
                      activePersona={settings.activePersona}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={endRef} className="h-4" />
            </div>
          )}
        </div>
        </div>

        {/* ── Suggestions & Recent Prompts (when chat is active) ── */}
        {messages.length > 0 && (
          <div className="absolute bottom-36 left-0 right-0 z-30 pointer-events-none">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pointer-events-auto">
                <span className="flex-shrink-0 text-[8px] font-bold text-white/25 uppercase tracking-[0.2em]">Suggestions</span>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => setInput(s.prompt)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-[10px] font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all whitespace-nowrap flex-shrink-0">
                    <s.icon size={12} className="text-indigo-400" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Input Area ── */}
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#07080f] via-[#07080f]/95 to-transparent pt-20 pb-5 md:pb-6 px-4 md:px-8 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {/* Main Input */}
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-[0_0_60px_rgba(99,102,241,0.03)] overflow-hidden transition-all duration-300 focus-within:border-indigo-500/30 focus-within:shadow-[0_0_50px_rgba(99,102,241,0.08)]">
              {/* Reply Context */}
              <AnimatePresence>
                {replyContext && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 py-3 bg-indigo-500/5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Quotes size={12} className="text-indigo-400/60" />
                      <p className="text-xs text-white/60 truncate font-medium">"{replyContext.text}"</p>
                    </div>
                    <button onClick={() => setReplyContext(null)} className="p-1 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-colors">
                      <X size={12} weight="bold" />
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
                    className="px-5 py-3 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5">
                    {files.map((f, i) => (
                      <div key={i} className="relative group flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-2 overflow-hidden">
                          {f.mimeType.startsWith('image/') ? (
                            <img src={f.data} alt="Attached image" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <NoteBlank size={16} className="text-white/30" />
                          )}
                          <span className="text-[7px] text-white font-semibold truncate w-full z-10 absolute bottom-1 px-1.5 bg-black/60 py-0.5 rounded-full text-center">{f.name}</span>
                        </div>
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                          <X size={8} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Row */}
              <div className="flex items-end gap-2 px-4 py-3 min-h-[56px]">
                <div className="flex items-center gap-1 pb-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-2xl text-white/30 hover:text-indigo-300 hover:bg-white/5 transition-all active:scale-95"
                    title="Attach files">
                    <Paperclip size={18} weight="bold" />
                  </button>
                  <button type="button"
                    className={cn("p-2 rounded-2xl transition-all active:scale-95",
                      webSearchEnabled
                        ? "text-indigo-400 bg-indigo-500/10"
                        : "text-white/30 hover:text-indigo-300 hover:bg-white/5"
                    )}
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    title="Web search">
                    <GlobeHemisphereWest size={18} weight="bold" />
                  </button>
                  <button type="button"
                    className={cn("p-2 rounded-2xl transition-all active:scale-95",
                      isVoiceRecording
                        ? "text-red-400 bg-red-500/10 animate-pulse"
                        : "text-white/30 hover:text-indigo-300 hover:bg-white/5"
                    )}
                    onClick={async () => {
                      if (isVoiceRecording) {
                        stopRecording();
                        return;
                      }
                      try {
                        const text = await startRecording();
                        if (text) setInput(prev => prev ? `${prev} ${text}` : text);
                      } catch (e: any) {
                        toast.error(e.message || "Voice input failed");
                      }
                    }}
                    title={isVoiceRecording ? "Stop recording" : "Voice input"}>
                    <Microphone size={18} weight={isVoiceRecording ? "fill" : "bold"} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf,.ppt,.pptx,.pptm" onChange={handleFileChange} />
                  {/* Model Picker */}
                  <div className="relative ml-1">
                    <button onClick={() => {
                      const opening = !showModelPicker;
                      setShowModelPicker(opening);
                      if (opening) setExpandedProvider(settings.activeProvider);
                    }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-semibold uppercase tracking-wider text-white/50 hover:text-indigo-300 transition-all whitespace-nowrap">
                      <span className="text-[10px]">{PROVIDER_CONFIGS[settings.activeProvider].icon}</span>
                      <span className="hidden sm:inline max-w-[100px] truncate">{settings.activeModel}</span>
                      <span className="sm:hidden">{PROVIDER_CONFIGS[settings.activeProvider].label}</span>
                      <CaretDown size={8} className="text-white/20 ml-0.5" />
                    </button>
                    <AnimatePresence>
                      {showModelPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-2 w-64 bg-[#0a0b14]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-[70] max-h-80 overflow-y-auto no-scrollbar">
                          {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((p) => (
                            <div key={p}>
                              <button onClick={() => setExpandedProvider(expandedProvider === p ? null : p)}
                                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                  settings.activeProvider === p ? "bg-indigo-500/10 text-indigo-400" : "text-white/40 hover:text-white hover:bg-white/5")}>
                                <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black",
                                  settings.activeProvider === p ? "bg-indigo-500 text-white" : "bg-white/5 text-white/50")}>
                                  {PROVIDER_CONFIGS[p].icon}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider flex-1">{PROVIDER_CONFIGS[p].label}</span>
                                <motion.div animate={{ rotate: expandedProvider === p ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                  <CaretDown size={10} className="text-white/20" />
                                </motion.div>
                              </button>
                              <AnimatePresence>
                                {expandedProvider === p && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden">
                                    <div className="pl-10 pr-2 pb-1 space-y-0.5">
                                      {PROVIDER_CONFIGS[p].models.map((m) => (
                                        <button key={m}
                                          onClick={() => {
                                            updateSettings({ activeProvider: p, activeModel: m });
                                            setShowModelPicker(false);
                                            setExpandedProvider(null);
                                          }}
                                          className={cn("w-full text-left px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all",
                                            settings.activeProvider === p && settings.activeModel === m
                                              ? "bg-indigo-500/10 text-indigo-300"
                                              : "text-white/30 hover:text-white/70 hover:bg-white/5")}>
                                          <div className="flex items-center gap-2">
                                            <span className="truncate">{m}</span>
                                            {settings.activeProvider === p && settings.activeModel === m && (
                                              <Check size={10} weight="bold" className="text-indigo-400 flex-shrink-0" />
                                            )}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask MedOneX Expert anything..."
                  className="flex-1 bg-transparent border-none outline-none resize-none py-2 text-sm text-white/90 placeholder-white/20 max-h-44 no-scrollbar font-medium leading-relaxed"
                />
                {loading ? (
                  <button onClick={stopGeneration}
                    className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-400 flex items-center justify-center transition-all border border-red-500/20">
                    <Stop size={16} weight="fill" />
                  </button>
                ) : (
                  <button onClick={handleSend}
                    disabled={!input.trim() && files.length === 0}
                    className={cn(
                      "flex-shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-90",
                      input.trim() || files.length > 0
                        ? "btn-primary-gradient !p-0 w-10 h-10"
                        : "bg-white/5 text-white/20 scale-95 cursor-not-allowed w-10 h-10"
                    )}>
                    <ArrowUp size={18} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2.5 px-1">
              <span className="text-[8px] font-bold text-white/15 uppercase tracking-[0.25em]">MedOneX Expert AI · AI Can Make Mistakes</span>
              <span className="text-[8px] text-white/15 font-medium">
                {limits.used}/{limits.limit}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ─── RIGHT PANEL ─── */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden lg:flex flex-col h-full bg-[#0a0b14]/40 backdrop-blur-2xl border-l border-white/[0.04] overflow-hidden flex-shrink-0"
          >
            <div className="p-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg", `bg-gradient-to-br ${activePersonaObj.gradient}`)}>
                  {React.cloneElement(activePersonaObj.icon as React.ReactElement, { size: 18, weight: "fill" })}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gradient-primary">{activePersonaObj.name}</h3>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider font-medium">{activePersonaObj.shortName}</p>
                </div>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">{activePersonaObj.description}</p>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
              <div>
                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  {activePersonaObj.suggestedPrompts.slice(0, 3).map((prompt, i) => (
                    <button key={i} onClick={() => setInput(prompt)}
                      className="w-full text-left p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/50 hover:text-white/80 transition-all">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">AI Provider</h4>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm font-black">
                      {PROVIDER_CONFIGS[settings.activeProvider].icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/80">{PROVIDER_CONFIGS[settings.activeProvider].label}</p>
                      <p className="text-[9px] text-white/30">{settings.activeModel}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Usage Today</h4>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-white/50">Messages</span>
                    <span className="text-xs font-bold text-white/80">{limits.used} / {limits.limit}</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((limits.used / limits.limit) * 100, 100)}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    />
                  </div>
                  <p className="text-[9px] text-white/25 mt-2 font-medium">{limits.rankLabel}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─── MOBILE SIDEBAR ─── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden" />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-full max-w-[320px] bg-[#0a0b14]/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl z-[101] flex flex-col md:hidden"
            >
              <div className="p-5 flex items-center justify-between border-b border-white/[0.04]">
                <span className="text-sm font-bold text-gradient-primary">MedOneX Expert</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-2xl text-white/40">
                  <X size={18} weight="bold" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
                <div>
                  <h4 className="text-[9px] font-bold text-white/30 mb-3 pl-1 uppercase tracking-[0.2em]">AI Assistants</h4>
                  <div className="space-y-1">
                    {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((key) => (
                      <button key={key} onClick={() => { updateSettings({ activeProvider: key as any }); setMobileSidebarOpen(false); }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
                        <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                          <span className="text-sm font-black">{PROVIDER_CONFIGS[key].icon}</span>
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-xs font-bold text-white/70">{PROVIDER_CONFIGS[key].label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-white/30 mb-3 pl-1 uppercase tracking-[0.2em]">Conversations</h4>
                  <div className="space-y-1">
                    {threads.map(t => (
                      <button key={t.id} onClick={() => { switchThread(t.id); setMobileSidebarOpen(false); }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all text-left group">
                        <div className="flex items-center gap-3 min-w-0">
                          <ChatCircle size={16} className="text-white/20 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                          <span className="text-xs font-medium text-white/50 group-hover:text-white/80 truncate">{t.title || "New Chat"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-white/[0.04] flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                  <img src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&bold=true`} alt="" className="w-9 h-9 rounded-2xl object-cover ring-1 ring-white/10" />
                  <span className="text-xs font-bold text-white/70">{userName.split(" ")[0]}</span>
                </div>
                <button onClick={() => { newThread(); setMobileSidebarOpen(false); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-[11px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20">
                  <Plus size={14} weight="bold" />
                  New
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── CONFIG PANEL ─── */}
      <DrQConfigPanel isOpen={showConfig} settings={settings} onUpdate={updateSettings} onClose={() => setShowConfig(false)} />
    </div>
  );
}
