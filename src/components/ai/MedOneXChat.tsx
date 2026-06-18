"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useDrQChat, PROVIDER_CONFIGS, FileAttachment, AIProvider } from "@/hooks/useDrQChat";
import {
  Plus, Paperclip, PaperPlaneRight, Stop, X, Trash, ChatDots,
  MagnifyingGlass, Gear, List, NoteBlank, Quotes, BookOpen, Lightning,
  Check, GlobeHemisphereWest, Sparkle, Sun, Moon, Brain,
  WarningCircle, Clock, House, ChatCircle, Key, ArrowBendUpLeft,
  ShieldCheck, ClockCountdown, ChartBar
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { SuperExpertProgress, SuperExpertStep } from "@/lib/super-expert";
import { checkProviderRate } from "@/lib/rate-limits";
import { DrQMessage } from "./DrQMessage";
import { DrQConfigPanel } from "./DrQConfigPanel";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
import { InstallPWA } from "./InstallPWA";
import { DRQ_WORKSPACES, WORKSPACE_IDS } from "./DrQWorkspaces";
import { useThemeStore } from "@/lib/store";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import {
  Bars3Icon, HomeIcon, BookOpenIcon, UserGroupIcon,
  ClipboardDocumentListIcon, Cog6ToothIcon, XMarkIcon, ChevronDoubleRightIcon, ChevronDownIcon,
} from "@heroicons/react/24/solid";
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
  const { siteName, logoUrl } = useSiteConfig();

  const {
    threads, activeThreadId, messages, loading, streamingId,
    settings, limits, superExpertStatus, newThread, switchThread, deleteThread,
    sendMessage, stopGeneration, regenerate, setReaction, updateSettings,
  } = useDrQChat();

  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const hasInitialScrolledRef = useRef(false);
  const prevDesktopHeightRef = useRef(0);
  const prevMobileHeightRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLTextAreaElement>(null);
  const touchStartX = useRef(0);
  const [mobileFocused, setMobileFocused] = useState(false);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recent");
  const [inputFocused, setInputFocused] = useState(false);
  const [showApiAlert, setShowApiAlert] = useState(false);
  const [showModules, setShowModules] = useState(false);
  const [modulesData, setModulesData] = useState<any[]>([]);
  const [modulesSearch, setModulesSearch] = useState("");
  const [replyContext, setReplyContext] = useState<{ id: string; text: string } | null>(null);
  const [showSuperExpertWarning, setShowSuperExpertWarning] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Disable body scroll when sidebar is open
  useEffect(() => {
    if (showSidebar) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showSidebar]);

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 400;
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > threshold);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Track scroll position for scroll-to-bottom button

  // ─── Local input state ───
  const [input, setInput] = useState("");

  // Fetch user modules when the modal opens
  useEffect(() => {
    if (showModules && modulesData.length === 0) {
      fetch("/api/v1/user/syllabus").then(r => r.json()).then(d => {
        if (d?.modules) setModulesData(d.modules);
      }).catch(() => {});
    }
  }, [showModules]);

  // ─── Smart auto-scroll (IntersectionObserver, scroll container directly) ───
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isAtBottomRef.current = entry.isIntersecting;
      },
      { root: el, threshold: 0.01 }
    );
    const sentinel = endRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => { observer.disconnect(); };
  }, []);

  // Force scroll to bottom on initial messages load
  useEffect(() => {
    if (!hasInitialScrolledRef.current && messages.length > 0) {
      hasInitialScrolledRef.current = true;
      const doScroll = () => {
        const el = scrollContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      };
      requestAnimationFrame(doScroll);
      requestAnimationFrame(doScroll);
    }
  }, [messages]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      const el = scrollContainerRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    }
  }, [messages, streamingId]);

  // ─── Auto-resize (desktop only) ───
  useEffect(() => {
    const el = inputRef.current;
    if (!el || window.innerWidth < 768) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 200);
    if (newHeight !== prevDesktopHeightRef.current) {
      el.style.height = newHeight + "px";
      prevDesktopHeightRef.current = newHeight;
    }
  }, [input]);

  // ─── Auto-resize (mobile only) ───
  useEffect(() => {
    const el = mobileInputRef.current;
    if (!el || window.innerWidth >= 768) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 80);
    if (newHeight !== prevMobileHeightRef.current) {
      el.style.height = newHeight + "px";
      prevMobileHeightRef.current = newHeight;
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

  const scrollLastToTop = () => {
    requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const messages = el.querySelectorAll<HTMLElement>("[data-message-id]");
      const lastMsg = messages[messages.length - 1];
      if (lastMsg) {
        lastMsg.scrollIntoView({ block: "start", behavior: "instant" });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    });
  };

  const handleSend = () => {
    if ((!input.trim() && files.length === 0) || loading || files.some(f => f.loading)) return;
    const apiKey = settings.byokKeys[settings.activeProvider];
    if (!apiKey) {
      setShowApiAlert(true);
      return;
    }
    sendMessage(input, files, replyContext?.id, webSearchEnabled);
    setInput("");
    setFiles([]);
    setReplyContext(null);
    scrollLastToTop();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB client-side limit

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    Array.from(selected).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large (max 10MB)`);
        return;
      }
      const placeholder: FileAttachment = { data: "", mimeType: file.type, name: file.name, size: file.size, loading: true };
      setFiles(prev => [...prev, placeholder]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFiles(prev => prev.map(f => f === placeholder ? { ...f, data: ev.target?.result as string, loading: false } : f));
      };
      reader.onerror = () => {
        setFiles(prev => prev.filter(f => f !== placeholder));
        toast.error(`Failed to read "${file.name}"`);
      };
      if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.match(/\.pptx?$/i)) reader.readAsDataURL(file);
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
    <div className={cn("flex flex-col flex-1 w-full overflow-hidden transition-colors duration-300", isDark ? "bg-[#050505]" : "bg-[#FCFCFC]")}>
      <style>{`
        :root { color-scheme: ${isDark ? "dark" : "light"}; }
      `}</style>

      {/* ─── Super Expert Warning Modal ─── */}
      <AnimatePresence>
        {showSuperExpertWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuperExpertWarning(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className={cn(
                "relative w-full max-w-sm rounded-3xl overflow-hidden border shadow-2xl",
                isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
              )}
            >
              {/* Header */}
              <div className={cn("flex items-center justify-between p-5 border-b", isDark ? "border-white/10" : "border-gray-200")}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Lightning size={18} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <h2 className={cn("text-base font-bold", isDark ? "text-white" : "text-gray-900")}>Super Expert</h2>
                    <p className={cn("text-[10px] font-medium uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>Multi-Provider Orchestration</p>
                  </div>
                </div>
                <button onClick={() => setShowSuperExpertWarning(false)} className={cn("p-2 rounded-xl transition-all", isDark ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800")}>
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <p className={cn("text-sm leading-relaxed", isDark ? "text-gray-400" : "text-gray-500")}>
                  Uses <span className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>Gemini</span> to coordinate multiple providers — each plays a distinct role for higher quality responses.
                </p>

                <div className={cn("space-y-1.5 p-4 rounded-2xl", isDark ? "bg-white/[0.03] border border-white/10" : "bg-gray-50 border border-gray-100")}>
                  {/* Item 1: Orchestration */}
                  <div className="super-expert-warning-item">
                    <div className="super-expert-warning-icon bg-indigo-500/10 text-indigo-500">
                      <Brain size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-gray-900")}>Gemini Orchestrates</p>
                      <p className={cn("text-[11px] mt-0.5 leading-relaxed", isDark ? "text-gray-500" : "text-gray-500")}>Analyzes context, assigns roles (Generator → Critic → Formatter), and synthesizes the final response.</p>
                    </div>
                  </div>

                  {/* Item 2: Time */}
                  <div className="super-expert-warning-item">
                    <div className="super-expert-warning-icon bg-amber-500/10 text-amber-500">
                      <ClockCountdown size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-gray-900")}>Increased Response Time</p>
                      <p className={cn("text-[11px] mt-0.5 leading-relaxed", isDark ? "text-gray-500" : "text-gray-500")}>Responses flow through sequential stages — may take longer than a single provider.</p>
                    </div>
                  </div>

                  {/* Item 3: Quota */}
                  <div className="super-expert-warning-item">
                    <div className="super-expert-warning-icon bg-rose-500/10 text-rose-500">
                      <ChartBar size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-gray-900")}>Higher Quota Usage</p>
                      <p className={cn("text-[11px] mt-0.5 leading-relaxed", isDark ? "text-gray-500" : "text-gray-500")}>Uses Gemini (2 requests) + each worker provider — consumes more daily quota.</p>
                    </div>
                  </div>

                  {/* Item 4: Requirement */}
                  <div className="super-expert-warning-item">
                    <div className="super-expert-warning-icon bg-emerald-500/10 text-emerald-500">
                      <ShieldCheck size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-gray-900")}>Gemini Key Required</p>
                      <p className={cn("text-[11px] mt-0.5 leading-relaxed", isDark ? "text-gray-500" : "text-gray-500")}>At least one non-Gemini provider must also be configured for workers.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={cn("p-4 border-t flex justify-end gap-2", isDark ? "border-white/10 bg-black/20" : "border-gray-200 bg-gray-50")}>
                <button
                  onClick={() => setShowSuperExpertWarning(false)}
                  className={cn("px-4 py-2.5 rounded-xl text-sm font-medium transition-all", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateSettings({ superExpertEnabled: true });
                    setShowSuperExpertWarning(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Enable Super Expert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  Set your {PROVIDER_CONFIGS[settings.activeProvider]?.label ?? "Provider"} API key in settings to start chatting.
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
      {false && <div className="fixed inset-x-0 top-0 z-40 flex justify-center items-start px-3 pt-0 pointer-events-none">
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
                      if (ws) updateSettings({ activePersona: pid, activeProvider: ws.defaultProvider, activeModels: { ...settings.activeModels, [ws.defaultProvider]: [ws.defaultModel] } });
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

            {/* Modules Button */}
            <button
              onClick={() => setShowModules(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                isDark ? "text-white/40 hover:bg-white/5 hover:text-white/70" : "text-gray-400 hover:bg-black/5 hover:text-gray-700"
              )}
              title="My Modules"
            >
              <BookOpen size={14} weight="bold" />
              <span className="hidden sm:inline">Modules</span>
            </button>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5">
                {/* Provider Selector — single button opens picker */}
                <button
                  onClick={() => setShowProviderPicker(true)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-all",
                    isDark ? "bg-white/10 text-white shadow-sm hover:bg-white/15" : "bg-black/5 text-gray-900 shadow-sm hover:bg-black/10"
                  )}
                  title={PROVIDER_CONFIGS[settings.activeProvider]?.label}
                >
                  <span className="text-[13px] md:text-[11px] font-bold">{PROVIDER_CONFIGS[settings.activeProvider]?.icon}</span>
                </button>

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
      </div>}

      {/* ─── Swipe Zone (left edge) ─── */}
      {!showSidebar && (
        <div
          className="fixed left-0 top-0 bottom-0 w-6 z-[10008] touch-none"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchMove={(e) => {
            const diff = e.touches[0].clientX - touchStartX.current;
            if (diff > 30) setShowSidebar(true);
          }}
        />
      )}

      {/* ─── Hamburger Button ─── */}
      <button
        onClick={() => setShowSidebar(true)}
        className={cn(
          "fixed top-3 left-3 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all",
          isDark ? "bg-black text-white hover:bg-gray-900 backdrop-blur-xl" : "bg-white text-gray-900 hover:bg-gray-100 backdrop-blur-xl shadow-sm"
        )}
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* ─── Sidebar ─── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10010]"
            onClick={() => setShowSidebar(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "absolute left-0 top-0 bottom-0 w-[85vw] max-w-[85vw] flex flex-col backdrop-blur-lg shadow-[4px_0_32px_rgba(0,0,0,0.4)]",
                isDark ? "bg-[#0a0a0a] border-r border-white/[0.06]" : "bg-white border-r border-gray-200/60"
              )}
              style={{ willChange: "transform" }}
            >
              {/* Extending top edge */}
              <div className={cn(
                "absolute top-0 right-0 h-px pointer-events-none",
                isDark ? "bg-gradient-to-r from-white/10 to-transparent" : "bg-gradient-to-r from-gray-200 to-transparent"
              )} style={{ width: "15vw" }} />
              {/* Extending bottom edge */}
              <div className={cn(
                "absolute bottom-0 right-0 h-px pointer-events-none",
                isDark ? "bg-gradient-to-r from-white/10 to-transparent" : "bg-gradient-to-r from-gray-200 to-transparent"
              )} style={{ width: "15vw" }} />
              {/* Sidebar Header */}
              <div className={cn("flex items-center justify-between px-4 py-3 border-b", isDark ? "border-white/10" : "border-gray-200")}>
                <div className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <img src={logoUrl} alt={siteName} className={cn("h-7 w-7 object-contain", isDark ? "brightness-0 invert" : "brightness-0")} />
                  ) : (
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold", isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900")}>
                      {siteName?.charAt(0) || "M"}
                    </div>
                  )}
                  <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>{siteName}</span>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}
                >
                  <ChevronDoubleRightIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* ─── Navigation Section ─── */}
                <div className="p-3">
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest px-3 mb-2", isDark ? "text-gray-500" : "text-gray-400")}>Navigation</p>
                  <div className="space-y-0.5">
                    {[
                      { icon: HomeIcon, label: "Home", href: "/dashboard-app" },
                      { icon: BookOpenIcon, label: "Modules", href: "/modules" },
                      { icon: UserGroupIcon, label: "Social", href: "/social" },
                      { icon: ClipboardDocumentListIcon, label: "Quizzes", href: "/quiz" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowSidebar(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-900")} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className={cn("mx-4 my-1 h-px", isDark ? "bg-white/10" : "bg-gray-200")} />

                {/* ─── Chats Section ─── */}
                <div className="p-3">
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest px-3 mb-2", isDark ? "text-gray-500" : "text-gray-400")}>Chats</p>
                  <div className={cn("flex items-center gap-0.5 p-0.5 rounded-xl mb-3", isDark ? "bg-white/5" : "bg-gray-100")}>
                    {THREAD_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); }}
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all flex-1",
                          activeTab === tab.id
                            ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-white text-gray-900 shadow-sm"
                            : isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-700"
                        )}
                      >
                        <tab.icon size={14} weight={activeTab === tab.id ? "fill" : "regular"} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative mb-3">
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
                  <div className="space-y-0.5 max-h-[200px] overflow-y-auto no-scrollbar">
                    {filteredThreads.length === 0 ? (
                      <div className={cn("text-xs text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>No conversations</div>
                    ) : (
                      filteredThreads.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { switchThread(t.id); setShowSidebar(false); }}
                          className={cn(
                            "w-full text-start px-3 py-2.5 rounded-xl text-sm transition-all",
                            t.id === activeThreadId
                              ? isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                              : isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <ChatCircle size={14} weight={t.id === activeThreadId ? "fill" : "regular"} className={cn("flex-shrink-0", isDark ? "text-white" : "text-gray-900")} />
                            <span className="truncate">{t.title || "New Chat"}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => { newThread(); setShowSidebar(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-2 transition-all",
                      isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Plus size={16} weight="bold" className={cn(isDark ? "text-white" : "text-gray-900")} />
                    New Chat
                  </button>
                </div>
              </div>

              {/* ─── Settings at Bottom ─── */}
              <div className={cn("border-t p-3 space-y-1", isDark ? "border-white/10" : "border-gray-200")}>
                <button
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all",
                    isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {isDark ? <Sun size={18} className="text-white" /> : <Moon size={18} className="text-gray-900" />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </button>
                <button
                  onClick={() => { setShowConfig(true); setShowSidebar(false); }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all",
                    isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Cog6ToothIcon className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-900")} />
                  Settings
                </button>
                <InstallPWA isDark={isDark} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Threads Container — bottom sheet on mobile ─── */}
      <AnimatePresence>
        {showThreads && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-end md:items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowThreads(false)} />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className={cn(
                "relative w-full md:max-w-lg h-[70vh] md:h-[70vh] rounded-t-3xl md:rounded-3xl overflow-hidden border shadow-2xl md:mx-4 pt-2",
                isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
              )}
            >
              {/* Drag handle */}
              <div className="flex justify-center md:hidden pt-1 pb-2">
                <div className="w-8 h-1 rounded-full bg-white/20" />
              </div>
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

      {/* ─── Modules Widget — bottom sheet on mobile ─── */}
      <AnimatePresence>
        {showModules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-end md:items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModules(false)} />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className={cn(
                "relative w-full md:max-w-lg h-[70vh] md:h-[75vh] rounded-t-3xl md:rounded-3xl overflow-hidden border shadow-2xl md:mx-4 flex flex-col pt-2",
                isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
              )}
            >
              {/* Drag handle */}
              <div className="flex justify-center md:hidden pt-1 pb-2">
                <div className="w-8 h-1 rounded-full bg-white/20" />
              </div>
              {/* Header */}
              <div className={cn("flex items-center justify-between p-4 border-b flex-shrink-0", isDark ? "border-white/10" : "border-gray-200")}>
                <div className="flex items-center gap-3">
                  <BookOpen size={18} weight="fill" className="text-indigo-500" />
                  <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>My Modules</span>
                </div>
                <button onClick={() => setShowModules(false)} className={cn("p-2 rounded-xl transition-colors", isDark ? "text-white/50 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800")}>
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Search */}
              <div className="p-3 flex-shrink-0">
                <div className="relative">
                  <MagnifyingGlass size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-gray-500" : "text-gray-400")} />
                  <input
                    value={modulesSearch}
                    onChange={e => setModulesSearch(e.target.value)}
                    placeholder="Search modules, subjects, lectures..."
                    className={cn(
                      "w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-colors",
                      isDark ? "bg-white/5 text-white placeholder-gray-500 border border-white/10" : "bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200"
                    )}
                  />
                </div>
              </div>

              {/* Module List */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-3 space-y-2">
                {modulesData.length === 0 ? (
                  <div className={cn("flex flex-col items-center justify-center h-48 text-sm gap-3", isDark ? "text-gray-500" : "text-gray-400")}>
                    <BookOpen size={32} weight="thin" />
                    <span>No modules found for your semester</span>
                  </div>
                ) : (
                  modulesData
                    .filter((mod: any) =>
                      !modulesSearch || mod.name.toLowerCase().includes(modulesSearch.toLowerCase()) ||
                      mod.subjects?.some((s: any) =>
                        s.name.toLowerCase().includes(modulesSearch.toLowerCase()) ||
                        s.lectures?.some((l: any) => l.title.toLowerCase().includes(modulesSearch.toLowerCase()))
                      )
                    )
                    .map((mod: any) => (
                      <div key={mod.id} className={cn("rounded-2xl overflow-hidden border transition-all", isDark ? "border-white/10" : "border-gray-200")}>
                        <div className={cn("px-4 py-3 font-bold text-sm flex items-center gap-2", isDark ? "bg-white/5 text-white" : "bg-gray-50 text-gray-900")}>
                          <BookOpen size={14} weight="fill" className="text-indigo-500" />
                          {mod.name}
                        </div>
                        {mod.subjects?.map((sub: any) => (
                          <div key={sub.id} className={cn("border-t", isDark ? "border-white/5" : "border-gray-100")}>
                            <div className={cn("px-4 py-2 text-xs font-semibold", isDark ? "text-gray-300" : "text-gray-600")}>{sub.name}</div>
                            {sub.lectures?.map((lec: any) => (
                              <div key={lec.id} className={cn("px-4 py-1.5 text-[11px] pl-8", isDark ? "text-gray-500" : "text-gray-400")}>
                                {lec.title}
                              </div>
                            ))}
                          </div>
                        ))}
                        {(!mod.subjects || mod.subjects.length === 0) && (
                          <div className={cn("px-4 py-2 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>No subjects</div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          x: showSidebar ? "85vw" : 0,
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn("flex flex-col flex-1 min-h-0", showSidebar && "pointer-events-none overflow-hidden")}
        style={{ willChange: "transform" }}
      >

      {/* ─── Messages Area ─── */}
      <main className={cn("flex flex-col flex-1 min-h-0 relative", isDark ? "bg-[#050505]" : "bg-white")}
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
              backgroundColor: isDark
                ? `rgba(0,0,0,${settings.bgOpacity ?? 0.15})`
                : `rgba(255,255,255,${settings.bgOpacity ?? 0.15})`,
            }}
          />
        )}
        <div ref={scrollContainerRef} className={cn("flex-1 overflow-y-auto scrollbar-hover min-h-0 relative z-10 md:pb-0 pb-24", settings.bgImage && (isDark ? "bg-black/20" : "bg-white/20"))}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center px-6 pt-16 md:pt-24"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="flex items-center justify-center mb-5"
              >
                {logoUrl ? (
                  <div
                    className={cn("h-20 w-20 bg-gradient-to-br", isDark ? "from-blue-400 to-blue-600" : "from-blue-700 to-blue-950")}
                    style={{
                      maskImage: `url(${logoUrl})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskImage: `url(${logoUrl})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                    }}
                  />
                ) : (
                  <div className={cn("h-20 w-20 rounded-2xl flex items-center justify-center text-lg font-bold bg-gradient-to-br bg-clip-text text-transparent", isDark ? "from-blue-400 to-blue-600" : "from-blue-700 to-blue-950")}>
                    {siteName?.charAt(0) || "M"}
                  </div>
                )}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn("text-xl font-bold mb-1 bg-gradient-to-r bg-clip-text text-transparent animate-gradient", isDark ? "from-blue-400 to-blue-600" : "from-blue-700 to-blue-950")}
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
                      "flex items-start gap-3 p-4 rounded-2xl border text-start text-sm transition-all",
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
                  data-message-id={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx < 5 ? idx * 0.03 : 0 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" ? (
                    <div className={cn("w-full max-w-full", m.isStreaming && "stream-cursor")}>
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
                            {PROVIDER_CONFIGS[settings.activeProvider]?.label ?? "Provider"} · MedOneX Expert
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
                      onReply={(id, text) => setReplyContext({ id, text })}
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
                      onReply={(id, text) => setReplyContext({ id, text })}
                      activePersona={settings.activePersona}
                    />
                  )}
                </motion.div>
              ))}
              <div ref={endRef} />

              {/* ─── Super Expert: Expandable Individual Responses ─── */}
              {superExpertStatus?.phase === "done" && superExpertStatus.steps.length > 0 && (
                <div className="mt-6 mb-2">
                  <SuperExpertResults steps={superExpertStatus.steps} isDark={isDark} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Preview Bar */}
        {files.length > 0 && (
          <div className="flex-shrink-0 flex justify-center px-3 md:px-4 pb-1 relative z-10">
            <div className="w-full max-w-3xl flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className={cn(
                    "group relative flex items-center gap-2 px-2 py-1.5 rounded-xl border max-w-[200px]",
                    isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                  )}
                >
                  {f.loading ? (
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", isDark ? "bg-white/10" : "bg-gray-200")}>
                      <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : f.mimeType.startsWith("image/") ? (
                    <img src={f.data} alt={f.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0", isDark ? "bg-white/10 text-gray-300" : "bg-gray-200 text-gray-500")}>
                      {f.name.match(/\.pdf$/i) ? "PDF" : f.name.match(/\.pptx?$/i) ? "PPT" : "📄"}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className={cn("text-xs truncate max-w-[100px]", f.loading && "text-indigo-500")}>{f.name}</span>
                    {f.loading && <span className="text-[9px] text-indigo-400">Reading...</span>}
                  </div>
                  <button
                    onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    className={cn(
                      "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                      isDark ? "bg-gray-700 text-gray-300" : "bg-gray-300 text-gray-600"
                    )}
                  >
                    <X size={10} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Context Bar */}
        {replyContext && (
          <div className={cn("flex-shrink-0 flex justify-center relative z-10", isDark ? "bg-[#050505]" : "bg-white")}>
            <div className="w-full max-w-3xl mx-auto px-3 md:px-4 pb-1">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs",
                isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"
              )}>
                <ArrowBendUpLeft size={14} weight="bold" className="flex-shrink-0" />
                <span className="truncate flex-1">Replying to: "{replyContext.text}"</span>
                <button
                  onClick={() => setReplyContext(null)}
                  className={cn("p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0", isDark ? "hover:text-white" : "hover:text-gray-800")}
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Super Expert Progress Panel ─── */}
        {superExpertStatus && superExpertStatus.phase !== "idle" && superExpertStatus.phase !== "done" && (
          <div className={cn("flex-shrink-0 flex justify-center pt-2 relative z-10", isDark ? "bg-[#050505]" : "bg-white")}>
            <div className={cn(
              "super-expert-panel w-full max-w-3xl mx-auto px-3 md:px-4 pb-2",
              "rounded-2xl border p-3",
              isDark ? "bg-white/[0.03] border-indigo-500/20" : "bg-indigo-50/60 border-indigo-200/40"
            )}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Lightning size={14} weight="fill" className="text-indigo-500" />
                <span className={cn("text-xs font-bold", isDark ? "text-indigo-400" : "text-indigo-700")}>
                  {superExpertStatus.phase === "analyzing" ? "Analyzing Context..." :
                   superExpertStatus.phase === "generating" ? "Generating Drafts..." :
                   superExpertStatus.phase === "critiquing" ? "Reviewing Quality..." :
                   superExpertStatus.phase === "formatting" ? "Formatting Output..." :
                   superExpertStatus.phase === "synthesizing" ? "Synthesizing Response..." : "Processing..."}
                </span>
              </div>
              <div className="space-y-0.5">
                {superExpertStatus.steps.map(step => (
                  <div key={step.id} className={cn(
                    "super-expert-step",
                    step.status === "active" && "super-expert-step-active",
                    step.status === "completed" && "super-expert-step-done",
                    step.status === "failed" && "super-expert-step-failed"
                  )}>
                    <div className={cn(
                      "super-expert-step-icon",
                      step.status === "active" ? "bg-indigo-500/15" :
                      step.status === "completed" ? "bg-emerald-500/15" :
                      step.status === "failed" ? "bg-red-500/15" :
                      isDark ? "bg-white/5" : "bg-gray-100"
                    )}>
                      {step.status === "active" ? (
                        <div className="super-expert-spinner" />
                      ) : step.status === "completed" ? (
                        <Check size={12} weight="bold" className="text-emerald-500" />
                      ) : step.status === "failed" ? (
                        <X size={12} weight="bold" className="text-red-500" />
                      ) : (
                        <span className={isDark ? "text-gray-500" : "text-gray-400"}>{step.icon}</span>
                      )}
                    </div>
                    <span className={cn(
                      "font-semibold text-xs",
                      step.status === "active" ? isDark ? "text-white" : "text-gray-900" :
                      step.status === "completed" ? isDark ? "text-gray-400" : "text-gray-500" :
                      step.status === "failed" ? "text-red-500" :
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}>
                      {step.label}
                    </span>
                    {step.status === "active" && (
                      <span className="text-[10px] text-indigo-500 font-medium ml-auto flex items-center gap-1">
                        <div className="super-expert-spinner inline-block !w-2.5 !h-2.5 !border-[1.5px]" />
                        Working
                      </span>
                    )}
                    {step.status === "completed" && (
                      <span className="text-[10px] text-emerald-500 font-medium ml-auto">✓ Done</span>
                    )}
                    {step.status === "failed" && step.error && (
                      <span className="text-[10px] text-red-400 font-medium ml-auto truncate max-w-[120px]">{step.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Desktop inline chat input (nav handles mobile) */}
      <div className="hidden md:flex flex-shrink-0 pt-4 pb-3 justify-center">
        <div className="w-full max-w-3xl mx-auto px-3 md:px-4">
          <div
            className={cn(
              "rounded-full border transition-all duration-200 shadow-sm",
              inputFocused
                ? isDark ? "border-gray-500" : "border-gray-300"
                : isDark ? "border-white/10" : "border-gray-200/80",
              isDark ? "bg-[#0d0d12]/80 backdrop-blur-2xl" : "bg-white/80 backdrop-blur-xl"
            )}
          >
            <div className="flex items-center gap-0.5 px-1.5 py-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
              >
                {files.some(f => f.loading) ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Paperclip size={16} />
                )}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf,.ppt,.pptx,.pptm" onChange={handleFileChange} />
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Message MedOneX Expert..."
                dir="auto"
                className={cn(
                  "w-full bg-transparent border-none outline-none resize-none py-1.5 px-2 text-sm leading-relaxed no-scrollbar font-arabic",
                  isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                )}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    if (!settings.superExpertEnabled) {
                      setShowSuperExpertWarning(true);
                    } else {
                      updateSettings({ superExpertEnabled: false });
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full transition-all select-none",
                    settings.superExpertEnabled
                      ? "super-expert-pill-active text-indigo-400 bg-indigo-500/10"
                      : isDark
                        ? "text-gray-500 hover:text-gray-300 hover:bg-white/10"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Lightning size={14} weight={settings.superExpertEnabled ? "fill" : "regular"} />
                </button>
                {loading ? (
                  <button onClick={stopGeneration} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    <Stop size={14} weight="fill" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() && files.length === 0}
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
                      input.trim() || files.length > 0
                        ? isDark ? "bg-white text-black hover:bg-gray-200 shadow-md" : "bg-[#141414] text-white hover:bg-gray-800 shadow-md"
                        : isDark ? "bg-white/5 text-gray-500" : "bg-black/5 text-gray-300"
                    )}
                  >
                    <PaperPlaneRight size={16} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>MedOneX Expert</span>
            <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>{limits.used}/{limits.limit}</span>
          </div>
        </div>
      </div>
      </motion.div>

      <DrQConfigPanel isOpen={showConfig} settings={settings} onUpdate={updateSettings} onClose={() => setShowConfig(false)} />

      {/* ─── Provider Picker — bottom sheet on mobile (Img 4), modal on desktop ─── */}
      <AnimatePresence>
        {showProviderPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProviderPicker(false)} />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className={cn(
                "relative w-full md:max-w-sm md:rounded-3xl rounded-t-3xl overflow-hidden border md:border shadow-2xl",
                "md:mx-4 pt-2",
                isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
              )}
            >
              {/* Drag handle */}
              <div className="flex justify-center md:hidden pt-1 pb-2">
                <div className="w-8 h-1 rounded-full bg-white/20" />
              </div>
              <div className={cn("flex items-center justify-between px-5 pb-4 md:pt-5", isDark ? "" : "")}>
                <h2 className={cn("text-base font-bold", isDark ? "text-white" : "text-gray-900")}>Select Provider</h2>
                <button onClick={() => setShowProviderPicker(false)} className={cn("p-2 rounded-xl transition-all", isDark ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800")}>
                  <X size={18} weight="bold" />
                </button>
              </div>
              <div className="px-3 pb-4 max-h-[60vh] md:max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
                  {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map(p => {
                    const isActive = settings.activeProvider === p;
                    const config = PROVIDER_CONFIGS[p];
                    return (
                      <button
                        key={p}
                        onClick={() => { updateSettings({ activeProvider: p }); setShowProviderPicker(false); }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 px-2 py-4 rounded-2xl text-center transition-all active:scale-95",
                          isActive
                            ? isDark ? "bg-white/10 text-white shadow-sm ring-1 ring-indigo-500/40" : "bg-gray-100 text-gray-900 shadow-sm ring-1 ring-indigo-400/30"
                            : isDark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold",
                          isActive
                            ? "bg-indigo-500 text-white"
                            : isDark ? "bg-white/10" : "bg-gray-200"
                        )}>
                          {config.icon}
                        </div>
                        <div className={cn("text-[10px] font-semibold leading-tight", isActive && "text-indigo-400")}>
                          {config.label}
                        </div>
                        {isActive && <Check size={12} weight="bold" className="text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Scroll-to-bottom button ─── */}
      <motion.div
        initial={false}
        animate={{ opacity: showScrollBtn && !showSidebar ? 1 : 0, scale: showScrollBtn && !showSidebar ? 1 : 0.8 }}
        transition={{ duration: 0.15 }}
        className="fixed bottom-24 right-5 z-[10002] md:bottom-20"
      >
        <button
          onClick={() => { const el = scrollContainerRef.current; if (el) el.scrollTop = el.scrollHeight; }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-90",
            isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-gray-900 hover:bg-gray-100"
          )}
        >
          <ChevronDownIcon className="w-5 h-5" />
        </button>
      </motion.div>

      {/* ─── Mobile Floating Input ─── */}
      <motion.div
        animate={{
          x: showSidebar ? "85vw" : 0,
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{ willChange: "transform" }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-[10003] pb-[env(safe-area-inset-bottom,0px)] pointer-events-none"
      >
        <div className="px-2 pb-1 pointer-events-auto">
          <div className={cn(
            "flex items-end gap-1 px-2 py-2 mx-2 mb-1 rounded-2xl border transition-colors shadow-lg",
            isDark
              ? "border-white/10 bg-[#141414]/90 backdrop-blur-xl text-white"
              : "border-[#050505]/10 bg-[#F7F7F7] text-[#050505]"
          )}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-8 h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center transition-colors",
                isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/10"
                  : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5"
              )}
            >
              <Paperclip size={14} />
            </button>
            <textarea
              ref={mobileInputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) { sendMessage(input); setInput(""); scrollLastToTop(); }
                }
              }}
              onFocus={() => setMobileFocused(true)}
              onBlur={() => setMobileFocused(false)}
              placeholder="Message MedOneX Expert..."
              dir="auto"
              className={cn(
                "flex-1 min-w-0 bg-transparent border-none outline-none resize-none py-1.5 px-2 text-sm leading-relaxed no-scrollbar placeholder-gray-400 font-arabic",
                isDark ? "text-white" : "text-[#050505]"
              )}
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  if (!settings.superExpertEnabled) {
                    setShowSuperExpertWarning(true);
                  } else {
                    updateSettings({ superExpertEnabled: false });
                  }
                }}
                className={cn(
                  "flex items-center justify-center w-8 h-8 min-w-8 min-h-8 rounded-full transition-all select-none",
                  settings.superExpertEnabled
                    ? "super-expert-pill-active text-indigo-400 bg-indigo-500/10"
                    : isDark
                      ? "text-gray-400 hover:text-gray-300 hover:bg-white/10"
                      : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5"
                )}
              >
                <Lightning size={13} weight={settings.superExpertEnabled ? "fill" : "regular"} />
              </button>
              <button
                onClick={() => setShowProviderPicker(true)}
                className={cn(
                  "w-8 h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center transition-all text-base",
                  isDark
                    ? "text-gray-400 hover:text-gray-200 hover:bg-white/10"
                    : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5"
                )}
                title={PROVIDER_CONFIGS[settings.activeProvider]?.label}
              >
                <span>{PROVIDER_CONFIGS[settings.activeProvider]?.icon}</span>
              </button>
              {loading ? (
                <button
                  onClick={stopGeneration}
                  className="w-8 h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center transition-all bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <Stop size={13} weight="fill" />
                </button>
              ) : (
                <button
                  onClick={() => { if (input.trim()) { sendMessage(input); setInput(""); scrollLastToTop(); } }}
                  disabled={!input.trim()}
                  className={cn(
                    "w-8 h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
                    input.trim()
                      ? isDark
                        ? "bg-white text-[#141414] hover:bg-gray-200 shadow-md"
                        : "bg-[#050505] text-white hover:bg-gray-800 shadow-md"
                      : isDark
                        ? "bg-white/10 text-gray-500"
                        : "bg-[#050505]/10 text-[#050505]/40"
                  )}
                >
                  <PaperPlaneRight size={14} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Super Expert Results Sub-Component ─── */
function SuperExpertResults({ steps, isDark }: { steps: SuperExpertStep[]; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all",
      isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
    )}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all",
          isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"
        )}
      >
        <div className="flex items-center gap-2">
          <Lightning size={14} weight="fill" className="text-indigo-500" />
          <span>Individual AI Responses ({steps.length})</span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={cn("border-t px-3 py-2 space-y-1", isDark ? "border-white/10" : "border-gray-200")}>
              {steps.map(step => (
                <div key={step.id}>
                  <button
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all",
                      isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
                    )}
                  >
                    <span className="text-sm flex-shrink-0">{step.icon}</span>
                    <span className={cn("font-semibold flex-1 text-left", isDark ? "text-white" : "text-gray-900")}>
                      {step.label}
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      step.status === "completed"
                        ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                        : step.status === "failed"
                        ? "bg-red-500/10 text-red-500"
                        : isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"
                    )}>
                      {step.status === "completed" ? "Done" : step.status === "failed" ? "Failed" : "Pending"}
                    </span>
                    <svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none"
                      className={cn("transition-transform", expandedStep === step.id && "rotate-180")}
                    >
                      <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {expandedStep === step.id && step.content && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className={cn(
                          "super-expert-detail-content mx-3 mb-2",
                          isDark ? "bg-white/5 text-gray-300 border border-white/10" : "bg-white text-gray-700 border border-gray-200"
                        )}>
                          {step.content.length > 800 ? step.content.slice(0, 800) + "..." : step.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ─── Super Expert Results Sub-Component ─── */
