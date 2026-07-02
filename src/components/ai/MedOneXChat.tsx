"use client";

import React, { useState, useRef, useEffect, startTransition, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

import { useDrQChat, PROVIDER_CONFIGS, FileAttachment, AIProvider, DrQSettings } from "@/hooks/useDrQChat";
import {
  Plus, Stop, X, Trash,
  MagnifyingGlass, BookOpen, Check, Brain,
  WarningCircle, ChatCircle, ArrowBendUpLeft,
  ShieldCheck, ClockCountdown, ChartBar, Lightning,
  ArrowUpRight, Eye, EyeSlash, Spinner, TextIndent,
  Quotes, NoteBlank, Sparkle, Microphone,
  SpeakerHigh, SpeakerSlash, SidebarSimple,
  House, BookmarkSimple,
  Books, MagicWand, Gear, Sun, Moon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { SuperExpertStep } from "@/lib/super-expert";
import { DrQMessage } from "./DrQMessage";
import { DrQConfigPanel } from "./DrQConfigPanel";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
import { MobileChatSidebar } from "./MobileChatSidebar";
import { PWAInstallModal } from "./PWAInstallModal";
import { SavedPage } from "./SavedPage";
import { LibraryPage } from "./LibraryPage";
import { CustomAgentGallery } from "./CustomAgentGallery";
import { CustomAgentChat } from "./CustomAgentChat";
import { QuestionsBottomSheet, type QuestionData } from "./QuestionsBottomSheet";
import { FlashcardsBottomSheet, type FlashcardData } from "./FlashcardsBottomSheet";
import { ResourcesBottomSheet, type ResourceItem } from "./ResourcesBottomSheet";
import { DRQ_WORKSPACES } from "./DrQWorkspaces";
import VoicePersonaPicker from "./VoicePersonaPicker";
import { type VoicePersona } from "./voicePersonas";
import { useThemeStore } from "@/lib/store";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import {
  GlobeAltIcon,
} from "@heroicons/react/24/solid";
import "./MedOneXChat.css";
import { edgeTTS } from "@/lib/tts";
import { textSimilarity } from "@/lib/echoUtils";

export function MedOneXChat({
  embedded = false,
  onClose,
  lectureId,
  lectureTitle,
  lectureContent,
  selectedText,
  activeSection,
  onClearSelectedText,
}: {
  embedded?: boolean;
  onClose?: () => void;
  lectureId?: string;
  lectureTitle?: string;
  lectureContent?: string;
  selectedText?: string;
  activeSection?: string;
  onClearSelectedText?: () => void;
}) {
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === "dark";
  const { siteName, logoUrl } = useSiteConfig();

  const {
    threads, activeThreadId, messages, loading, streamingId,
    settings, limits, superExpertStatus, newThread, switchThread, deleteThread,
    sendMessage, stopGeneration, regenerate, setReaction, updateSettings,
    switchToLectureThread, restoreGlobalThread,
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
  const mainRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const prevLectureIdRef = useRef<string | null | undefined>(undefined);
  const lectureContextRef = useRef<{ lectureId?: string; lectureTitle?: string; lectureContent?: string; selectedText?: string }>({});
  lectureContextRef.current = { lectureId, lectureTitle, lectureContent, selectedText };

  // Auto-switch to lecture-scoped thread when entering/exiting lecture mode
  useEffect(() => {
    if (lectureId) {
      switchToLectureThread(lectureId, lectureTitle ?? "");
    } else if (!lectureId && prevLectureIdRef.current) {
      restoreGlobalThread();
    }
    prevLectureIdRef.current = lectureId ?? null;
  }, [lectureId, lectureTitle, switchToLectureThread, restoreGlobalThread]);

  // Restore global thread on unmount (e.g. when sidebar closes on navigation away)
  useEffect(() => {
    return () => {
      if (prevLectureIdRef.current) {
        restoreGlobalThread();
        prevLectureIdRef.current = null;
      }
    };
  }, [restoreGlobalThread]);

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
  const handleReply = useCallback((id: string, text: string) => {
    setReplyContext({ id, text });
  }, []);

  // ─── Voice Chat ───
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voicePersona, setVoicePersona] = useState<VoicePersona | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vadLockRef = useRef(false);
  const lastSpokenMsgIdRef = useRef<string | null>(null);
  const voiceModeRef = useRef(false);
  const loadingRef = useRef(loading);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  const prevVoiceModeRef = useRef(false);
  const pendingEchoClearRef = useRef(false);

  // Sync voiceMode ref
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  // When voice mode first activates, mark the latest assistant message as already spoken
  useEffect(() => {
    if (voiceMode && !prevVoiceModeRef.current) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") lastSpokenMsgIdRef.current = last.id;
    }
    prevVoiceModeRef.current = voiceMode;
  }, [voiceMode, messages]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopRecording = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setLiveTranscript("");
  }, []);

  const startVoiceMode = useCallback((persona: VoicePersona) => {
    voiceModeRef.current = true;
    setVoicePersona(persona);
    setVoiceMode(true);

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Voice recognition not supported in this browser. Try Chrome or Edge.");
      setVoiceMode(false);
      return;
    }

    const startListening = () => {
      if (!voiceModeRef.current) return;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = persona.lang === "ar" ? "ar-SA" : "en-US";

      let utteranceText = "";
      let utteranceFinalized = false;

      recognition.onresult = (e: any) => {
        const lastResult = e.results[e.results.length - 1];
        const transcript = lastResult[0].transcript;
        utteranceText = transcript;
        utteranceFinalized = false;

        const trimmed = transcript.trim();

        // Echo detection: if TTS is playing, check text similarity
        if (trimmed && edgeTTS.isPlaying) {
          const sim = textSimilarity(transcript, edgeTTS.lastSpokenText);
          if (sim > 0.8) {
            clearSilenceTimer();
            return;
          }
        }

        // Barge-in: if AI is speaking, stop it and listen
        if (trimmed) {
          if (edgeTTS.isPlaying) edgeTTS.stop();
          if (loadingRef.current) stopGeneration();
        }

        // Echo buffer cleanup after TTS finishes
        if (pendingEchoClearRef.current && !edgeTTS.isPlaying) {
          pendingEchoClearRef.current = false;
          setLiveTranscript("");
          clearSilenceTimer();
          return;
        }

        setLiveTranscript(transcript);

        // Reset silence timer on each speech
        clearSilenceTimer();
        if (trimmed) {
          silenceTimerRef.current = setTimeout(() => {
            if (!utteranceFinalized && utteranceText.trim()) {
              utteranceFinalized = true;
              setLiveTranscript("");
              sendMessage(utteranceText, [], undefined, false);
            }
          }, 2000);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        // Auto-restart if voice mode is still active
        if (voiceModeRef.current && !vadLockRef.current) {
          startListening();
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
        if (voiceModeRef.current && !vadLockRef.current) {
          startListening();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    };

    startListening();
  }, [sendMessage, stopGeneration]);

  const stopVoiceMode = useCallback(() => {
    vadLockRef.current = true;
    setVoiceMode(false);
    edgeTTS.stop();
    stopRecording();
    setLiveTranscript("");
    setTimeout(() => { vadLockRef.current = false; }, 100);
  }, [stopRecording]);

  const handleVoicePersonaSelect = useCallback((persona: VoicePersona) => {
    setShowVoicePicker(false);
    stopVoiceMode();
    startVoiceMode(persona);
  }, [startVoiceMode, stopVoiceMode]);

  // Toggle voice mode on/off
  const toggleVoiceMode = useCallback(() => {
    if (voiceMode) {
      stopVoiceMode();
    } else {
      setShowVoicePicker(true);
    }
  }, [voiceMode, stopVoiceMode]);

  // Auto-TTS: wait for full assistant response, then read it
  useEffect(() => {
    if (!voicePersona || !voiceMode || voiceMuted || loading) return;
    const last = messages[messages.length - 1];
    if (last?.role !== "assistant" || last.isStreaming) return;
    if (last.id === lastSpokenMsgIdRef.current) return;
    lastSpokenMsgIdRef.current = last.id;

    const personaVoiceMap: Record<string, string> = {
      salem: "ar-SA-HamedNeural",
      layla: "ar-EG-SalmaNeural",
      omar: "ar-AE-HamdanNeural",
      alex: "en-US-GuyNeural",
      sarah: "en-GB-SoniaNeural",
      david: "en-US-GuyNeural",
    };
    const voiceId = personaVoiceMap[voicePersona.id] || (voicePersona.lang === "ar" ? "ar-EG-SalmaNeural" : "en-US-GuyNeural");

    edgeTTS.interruptHandler = null;
    edgeTTS.speak(last.content, voiceId).catch(() => {});
  }, [messages, loading, voicePersona, voiceMode, voiceMuted]);

  // Track TTS state for echo detection
  useEffect(() => {
    edgeTTS.onStateChange = (playing) => {
      if (!playing) pendingEchoClearRef.current = true;
    };
    return () => { edgeTTS.onStateChange = null; };
  }, []);

  const [showSuperExpertWarning, setShowSuperExpertWarning] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAgentGallery, setShowAgentGallery] = useState(false);
  const [activeAgent, setActiveAgent] = useState<any>(null);
  const [showLibraryQuiz, setShowLibraryQuiz] = useState<any>(null);
  const [showGlobalQuestions, setShowGlobalQuestions] = useState(false);
  const [showGlobalFlashcards, setShowGlobalFlashcards] = useState(false);
  const [showGlobalResources, setShowGlobalResources] = useState(false);

  // Prevent main content scroll when sidebar is open (direct DOM, no re-render)
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    if (window.innerWidth < 768) {
      el.style.overflow = showSidebar ? "hidden" : "";
    }
  }, [showSidebar]);

  // Reset initial-scroll flag when switching threads so it scrolls to the last message
  useEffect(() => {
    hasInitialScrolledRef.current = false;
  }, [activeThreadId]);

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(dist > 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);


  // Track scroll position for scroll-to-bottom button

  // ─── Local input state ───
  const [input, setInput] = useState("");

  // ─── Aggregate questions/flashcards/resources from all messages ───
  const isEnglishOnly = (text: string) => !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  const globalQuestions = React.useMemo(() => {
    const qs: QuestionData[] = [];
    if (!messages) return qs;
    const regex = /:::question\s*({[\s\S]*?})\s*:::/g;
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      let m;
      while ((m = regex.exec(msg.content)) !== null) {
        try {
          const raw = JSON.parse(m[1]);
          const qText = raw.question || raw.body || "";
          if (!isEnglishOnly(qText)) continue;
          qs.push({
            question: qText,
            options: raw.options || (raw.choices ? raw.choices.map((c: any) => c.text || c) : []),
            answer: raw.answer || "",
            explanation: raw.explanation || "",
          });
        } catch {}
      }
    }
    return qs;
  }, [messages]);
  const globalFlashcards = React.useMemo(() => {
    const fs: FlashcardData[] = [];
    if (!messages) return fs;
    const regex = /:::flashcard\s*({[\s\S]*?})\s*:::/g;
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      let m;
      while ((m = regex.exec(msg.content)) !== null) {
        try {
          const raw = JSON.parse(m[1]);
          if (!isEnglishOnly(raw.front || "") || !isEnglishOnly(raw.back || "")) continue;
          fs.push({ front: raw.front || "", back: raw.back || "" });
        } catch {}
      }
    }
    return fs;
  }, [messages]);
  const globalResources = React.useMemo(() => {
    const items: ResourceItem[] = [];
    if (!messages) return items;
    const urlRegex = /https?:\/\/[^\s()<>"\]]+/g;
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      let m;
      while ((m = urlRegex.exec(msg.content)) !== null) {
        const url = m[0].replace(/[.,;:!?]+$/, "");
        const title = url.length > 60 ? url.substring(0, 60) + "..." : url;
        if (!items.some(i => i.url === url)) items.push({ url, title });
      }
    }
    return items;
  }, [messages]);
  // ─── End aggregation ───

  // Fetch user modules when the modal opens
  useEffect(() => {
    if (showModules && modulesData.length === 0) {
      fetch("/api/v1/user/syllabus").then(r => r.json()).then((d: any) => {
        if (d?.modules) setModulesData(d.modules);
      }).catch(() => {});
    }
  }, [showModules, modulesData.length]);

  // ─── Smart auto-scroll (IntersectionObserver, scroll container directly) ───
  const hasMessages = messages.length > 0;
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
  }, [hasMessages]);

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
    if (!el || (!embedded && window.innerWidth < 768)) return;
    el.style.height = "0px";
    const newHeight = Math.min(el.scrollHeight, 200);
    if (newHeight !== prevDesktopHeightRef.current) {
      el.style.height = newHeight + "px";
      prevDesktopHeightRef.current = newHeight;
    } else {
      el.style.height = prevDesktopHeightRef.current + "px";
    }
  }, [input]);

  // ─── Auto-resize (mobile only) ───
  useEffect(() => {
    const el = mobileInputRef.current;
    if (!el || window.innerWidth >= 768) return;
    el.style.height = "0px";
    const newHeight = Math.min(el.scrollHeight, 130);
    if (newHeight !== prevMobileHeightRef.current) {
      el.style.height = newHeight + "px";
      prevMobileHeightRef.current = newHeight;
    } else {
      el.style.height = prevMobileHeightRef.current + "px";
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
    sendMessage(input, files, replyContext?.id, webSearchEnabled, {
      lectureId: lectureId!,
      lectureTitle: lectureTitle!,
      lectureContent,
      selectedText,
    });
    setInput("");
    setFiles([]);
    setReplyContext(null);
    scrollLastToTop();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB client-side limit
  const MAX_FILES = 5;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    if (files.length + selected.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
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

  const filteredThreads = React.useMemo(() =>
    threads.filter(t =>
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeTab === "all" || activeTab === "recent" || activeTab === "pinned")
    ),
    [threads, searchQuery, activeTab]
  );

  const apiKeyMissing = !settings.byokKeys[settings.activeProvider];

  const personaList = Object.keys(DRQ_PERSONAS).slice(0, 5) as DrQPersonaId[];

  return (
    <div className={cn("flex flex-col flex-1 w-full overflow-hidden transition-colors duration-200 ease-out", isDark ? "bg-[#050505]" : "bg-[#FCFCFC]")}>
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
            className="fixed inset-0 z-max flex items-center justify-center p-4"
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
            className="fixed top-20 left-1/2 -translate-x-1/2 z-max w-[min(600px,calc(100vw-32px))]"
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

      {/* ─── Swipe Zone (left edge) ─── */}
      {!embedded && !showSidebar && (
        <div
          className="fixed left-0 top-0 bottom-0 w-6 z-[10008] touch-none md:hidden"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchMove={(e) => {
            const diff = e.touches[0].clientX - touchStartX.current;
            if (diff > 30) setShowSidebar(true);
          }}
        />
      )}

      {embedded ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#050505] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkle size={18} weight="fill" className="text-primary shrink-0" />
            <span className="text-sm font-bold truncate text-white">MedOneX Expert</span>
            {lectureId && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary truncate max-w-[120px] border border-primary/20">
                {lectureTitle || "Lecture"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X size={16} weight="bold" />
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* ─── Top Bar (hamburger + questions/flashcards/resources) ─── */}
      {!embedded && <div className={cn(
        "fixed top-0 left-0 right-0 z-50 h-14 md:h-12 flex items-start md:items-center justify-between md:justify-end md:border-b transition-colors duration-200 ease-out",
        isDark
          ? "bg-black md:bg-black/80 md:backdrop-blur-xl md:border-white/[0.06]"
          : "bg-white md:bg-white/80 md:backdrop-blur-xl md:border-gray-100"
      )}>
        {/* Gradient fade — messages fade smoothly behind top bar */}
        <div className="absolute top-full left-0 right-0 pointer-events-none z-[-1]" style={{ height: "20px" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/95 via-60% to-transparent transition-opacity duration-150 ease-out"
               style={{ opacity: isDark ? 1 : 0 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 via-60% to-transparent transition-opacity duration-150 ease-out"
               style={{ opacity: isDark ? 0 : 1 }} />
        </div>
        <button
          onClick={() => setShowSidebar(prev => !prev)}
          className={cn(
            "mt-1.5 md:mt-0 ml-3 w-11 h-11 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all md:hidden",
            isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-100"
          )}
        >
          <TextIndent size={20} className="md:scale-90" />
        </button>
        <div className="flex items-center gap-1.5 mr-4 mt-2 md:mt-0">
          {globalQuestions.length > 0 && (
            <button
              onClick={() => setShowGlobalQuestions(true)}
              className={cn(
                "w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all active:scale-90 text-[#C1C1C1]",
                isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
              )}
            >
              <ChatCircle size={18} weight="fill" className="md:scale-[0.85]" />
            </button>
          )}
          {globalFlashcards.length > 0 && (
            <button
              onClick={() => setShowGlobalFlashcards(true)}
              className={cn(
                "w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all active:scale-90 text-[#C1C1C1]",
                isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
              )}
            >
              <BookOpen size={18} weight="fill" className="md:scale-[0.85]" />
            </button>
          )}
          {globalResources.length > 0 && (
            <button
              onClick={() => setShowGlobalResources(true)}
              className={cn(
                "w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all active:scale-90 text-[#C1C1C1]",
                isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
              )}
            >
              <GlobeAltIcon className="w-[18px] h-[18px] md:w-[15px] md:h-[15px]" />
            </button>
          )}
        </div>
      </div>}

      {!embedded && <MobileChatSidebar
        showSidebar={showSidebar}
        onClose={() => setShowSidebar(false)}
        isDark={isDark}
        siteName={siteName}
        logoUrl={logoUrl}
        filteredThreads={filteredThreads}
        activeThreadId={activeThreadId}
        onSwitchThread={switchThread}
        onNewThread={newThread}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onThemeToggle={() => setTheme(isDark ? "light" : "dark")}
        onOpenConfig={() => setShowConfig(true)}
        onOpenSaved={() => setShowSaved(true)}
        onOpenLibrary={() => setShowLibrary(true)}
        onOpenAgentGallery={() => setShowAgentGallery(true)}
      />}

      {!embedded && <div className="hidden md:block fixed left-0 top-0 bottom-0 z-max">
        <div className={cn(
          "h-full overflow-hidden flex flex-col",
          showSidebar ? "w-[260px]" : "w-[52px]",
          isDark ? "bg-[#0a0a0a] border-r border-white/[0.06]" : "bg-[#F9F9F9] border-r border-gray-200/60"
        )} style={{
          transition: 'width 200ms ease-out, background-color 200ms ease-out, border-color 200ms ease-out'
        }}>
          {showSidebar ? (
            <MobileChatSidebar
              desktop
              showSidebar={true}
              onClose={() => setShowSidebar(false)}
              isDark={isDark}
              siteName={siteName}
              logoUrl={logoUrl}
              filteredThreads={filteredThreads}
              activeThreadId={activeThreadId}
              onSwitchThread={switchThread}
              onNewThread={newThread}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onThemeToggle={() => setTheme(isDark ? "light" : "dark")}
              onOpenConfig={() => setShowConfig(true)}
              onOpenSaved={() => setShowSaved(true)}
              onOpenLibrary={() => setShowLibrary(true)}
              onOpenAgentGallery={() => setShowAgentGallery(true)}
            />
          ) : (
            <div className="flex flex-col items-center h-full transition-colors duration-200 ease-out">
              {/* Logo — click to expand sidebar */}
              <div className="pt-3 pb-2">
                <button
                  onClick={() => setShowSidebar(true)}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all group relative",
                    isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                  )}
                  title="Open sidebar"
                >
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt={siteName}
                        className={cn(
                          "w-7 h-7 object-contain transition-all duration-200 group-hover:opacity-0 group-hover:scale-75",
                          isDark ? "brightness-0 invert opacity-60" : "brightness-0 opacity-40"
                        )}
                      />
                    ) : (
                      <span className={cn(
                        "text-sm font-bold transition-all duration-200 group-hover:opacity-0",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {siteName?.charAt(0) || "M"}
                      </span>
                    )}
                    <SidebarSimple
                      size={22}
                      weight="fill"
                      className={cn(
                        "absolute inset-0 m-auto transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
                        isDark ? "text-white" : "text-gray-900"
                      )}
                    />
                  </div>
                </button>
              </div>

              <div className={cn("w-6 h-px transition-colors duration-200 ease-out", isDark ? "bg-white/10" : "bg-gray-200")} />

              {/* Navigation Icons */}
              <div className="flex flex-col items-center gap-1 flex-1 overflow-y-auto no-scrollbar pt-3">
                <Link href="/dashboard-app" className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200", isDark ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")} title="Home">
                  <House size={20} weight="fill" />
                </Link>
                <button onClick={() => setShowSaved(true)} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200", isDark ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")} title="Saved">
                  <BookmarkSimple size={20} weight="fill" />
                </button>
                <button onClick={() => setShowLibrary(true)} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200", isDark ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")} title="Library">
                  <Books size={20} weight="fill" />
                </button>
                <button onClick={() => setShowAgentGallery(true)} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200", isDark ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")} title="Custom MedOneX">
                  <MagicWand size={20} weight="fill" />
                </button>
              </div>

              {/* Settings Icons */}
              <div className="flex flex-col items-center gap-1 pb-3">
                <div className={cn("w-6 h-px mb-1 transition-colors duration-200 ease-out", isDark ? "bg-white/10" : "bg-gray-200")} />
                <button onClick={() => setTheme(isDark ? "light" : "dark")} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200", isDark ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")} title={isDark ? "Light Mode" : "Dark Mode"}>
                  {isDark ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
                </button>
                <button onClick={() => setShowConfig(true)} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200", isDark ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")} title="Settings">
                  <Gear size={20} weight="fill" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>}

      {/* ─── Threads Container — bottom sheet on mobile ─── */}
      <AnimatePresence>
        {showThreads && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-max flex items-end md:items-center justify-center"
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
            className="fixed inset-0 z-max flex items-end md:items-center justify-center"
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

      <div
        className={cn(
          "flex flex-col flex-1 min-h-0",
          embedded ? "" : "pb-24",
          !embedded && "transition-[margin] duration-200 ease-out",
          !embedded && showSidebar && "translate-x-[85vw]",
          "md:translate-x-0",
          !embedded && (showSidebar ? "md:ml-[260px]" : "md:ml-[52px]")
        )}
        ref={mainRef}
      >

      {/* ─── Messages Area ─── */}
      <main className={cn("flex flex-col flex-1 min-h-0 relative transition-colors duration-200 ease-out", isDark ? "bg-[#050505]" : "bg-white")}
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
        <div ref={scrollContainerRef} className={cn("flex-1 overflow-y-auto scrollbar-hover min-h-0 relative z-10 md:pb-0 pb-[calc(30px+env(safe-area-inset-bottom,0px)+80px)]", settings.bgImage && (isDark ? "bg-black/20" : "bg-white/20"))}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={cn("h-full flex flex-col items-center justify-center", embedded ? "px-4 pt-8" : "px-6 pt-16 md:pt-24")}
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
            <div className={cn("w-full space-y-4", embedded ? "px-3 py-4" : "px-4 sm:px-6 md:px-0 md:max-w-[48rem] md:mx-auto py-6 pb-8 space-y-6")}>
              {messages.map((m, idx) => (
                <motion.div
                  key={m.id}
                  data-message-id={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx < 5 ? idx * 0.03 : 0 }}
                   className={cn("flex", m.role === "user" ? "justify-end md:max-w-none" : "justify-start", m.role === "user" ? "" : "md:max-w-none")}
                >
                  {m.role === "assistant" ? (
                    <div className={cn("w-full", m.isStreaming && "stream-cursor")}>
                      <div className="flex items-center gap-3 px-1 mb-2 mt-6">
                        <div className={cn(
                          "w-8 h-8 md:w-7 md:h-7 rounded-xl flex items-center justify-center shadow-md",
                          `bg-gradient-to-br ${(DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).gradient}`
                        )}>
                          {React.cloneElement(
                            (DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).icon as React.ReactElement,
                            { size: 16, weight: "fill", className: "text-white" }
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={cn("text-sm md:text-[13px] font-bold", isDark ? "text-white" : "text-gray-900")}>
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
                      onReply={handleReply}
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
                      onReply={handleReply}
                      activePersona={settings.activePersona}
                    />
                  )}
                </motion.div>
              ))}

              {isRecording && liveTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-end"
                >
                  <div style={{ fontSize: settings.fontSize + 'px' }} className="max-w-[75%] px-4 py-2.5 rounded-[28px] rounded-br-sm leading-relaxed shadow-sm border border-black/[0.08] dark:border-white/[0.06] md:border-none md:shadow-none bg-[#F7F7F7] dark:bg-white/[0.04] md:bg-gray-100 md:dark:bg-gray-800 text-gray-900 dark:text-white">
                    <span>{liveTranscript}</span>
                  </div>
                </motion.div>
              )}

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

      {/* Shared file input (outside both desktop/mobile sections for reliability) */}
      <input type="file" ref={fileInputRef} className="hidden" multiple accept="*/*" onChange={handleFileChange} />
    </div>
    {/* ^ mainRef closes here */}

      {embedded ? (
        /* ── Embedded capsule input (matches mobile style) ── */
        <div className="flex-shrink-0 border-t border-white/10 bg-[#050505]">
          {selectedText && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10">
              <span className="text-[10px] font-medium text-primary truncate max-w-[250px]">
                &ldquo;{selectedText.slice(0, 80)}...&rdquo;
              </span>
              {onClearSelectedText && (
                <button onClick={onClearSelectedText} className="p-0.5 rounded hover:bg-primary/10">
                  <X size={12} weight="bold" className="text-primary" />
                </button>
              )}
            </div>
          )}
          <div className="px-2 pb-2 pt-2">
            <div
              onClick={() => { if (!inputFocused) inputRef.current?.focus(); }}
              className={cn(
                "flex flex-col rounded-[20px] ring-1 transition-all duration-200 ease-out cursor-text overflow-hidden",
                isDark ? "ring-white/10 bg-[#141414]/90 backdrop-blur-xl text-white" : "ring-gray-200/80 bg-white text-[#050505]"
              )}
            >
              <div className="grid transition-all duration-200 ease-out" style={{ gridTemplateRows: inputFocused ? '1fr' : '0fr' }}>
                <div className="overflow-hidden min-h-0">
                  {files.length > 0 && (
                    <div className={cn(
                      "flex flex-wrap gap-1.5 px-3 pt-2.5 pb-1.5 max-h-[120px] overflow-y-auto border-b",
                      isDark ? "border-white/10" : "border-gray-200/60"
                    )}>
                      {files.map((f, i) => (
                        <div key={i} className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs max-w-[160px] transition-all", isDark ? "bg-white/10" : "bg-gray-100")}>
                          {f.loading ? (
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0">
                              <svg className="animate-spin h-2.5 w-2.5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </div>
                          ) : f.mimeType.startsWith("image/") ? (
                            <Image src={f.data} alt={f.name} width={16} height={16} className="w-4 h-4 rounded object-cover flex-shrink-0" unoptimized />
                          ) : (
                            <span className="text-[10px] flex-shrink-0">{f.name.match(/\.pdf$/i) ? "📄" : f.name.match(/\.pptx?$/i) ? "📊" : "📎"}</span>
                          )}
                          <span className="truncate max-w-[80px]">{f.name}</span>
                          <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="flex-shrink-0 ml-0.5 opacity-60 hover:opacity-100 transition-opacity"><X size={10} weight="bold" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => startTransition(() => setInput(e.target.value))}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder={isRecording ? (voicePersona?.lang === "ar" ? "تسجيل..." : "Recording...") : "Ask about this lecture..."}
                    className={cn(
                      "w-full bg-transparent border-none outline-none resize-none px-3 pt-3 pb-1 text-sm leading-relaxed no-scrollbar",
                      isDark ? "text-white placeholder-gray-400" : "text-[#050505] placeholder-gray-400"
                    )}
                  />
                </div>
              </div>
              <div className={cn("flex items-center justify-between px-2", inputFocused ? "pb-2 pt-0" : "py-2")}>
                {inputFocused ? (
                  <div className="flex items-center gap-0.5">
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const currentIdx = personaList.indexOf(settings.activePersona as DrQPersonaId);
                        const nextPersona = personaList[(currentIdx + 1) % personaList.length];
                        const ws = Object.values(DRQ_WORKSPACES).find(w => w.personaId === nextPersona);
                        if (ws) updateSettings({ activePersona: nextPersona, activeProvider: ws.defaultProvider, activeModels: { ...settings.activeModels, [ws.defaultProvider]: [ws.defaultModel] } });
                        else updateSettings({ activePersona: nextPersona });
                      }}
                      className={cn("flex items-center justify-center w-8 h-8 rounded-full transition-all select-none", isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/10" : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5")}
                      title={(DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).name}
                    >
                      {React.cloneElement((DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).icon as React.ReactElement, { size: 14, weight: "regular" })}
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => setShowProviderPicker(true)} className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all text-base", isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/10" : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5")} title={PROVIDER_CONFIGS[settings.activeProvider]?.label}>
                      <Brain size={14} weight="regular" />
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={toggleVoiceMode} className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", (voiceMode || isRecording) ? "text-red-500 bg-red-500/15" : isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5")} title={voiceMode ? "Voice Mode" : "Voice Chat"}>
                      <Microphone size={14} weight={(voiceMode || isRecording) ? "fill" : "regular"} />
                    </button>
                    {voiceMode && (
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => setVoiceMuted(v => !v)} className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5")} title={voiceMuted ? "Unmute voice" : "Mute voice"}>
                        {voiceMuted ? <SpeakerSlash size={14} weight="fill" /> : <SpeakerHigh size={14} weight="fill" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center w-7 h-7 rounded-full transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn(isDark ? "text-gray-400" : "text-gray-500")}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={toggleVoiceMode} className={cn("flex items-center justify-center w-7 h-7 rounded-full transition-colors", (voiceMode || isRecording) ? "text-red-500" : isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-[#050505]")} title={voiceMode ? "Voice Mode" : "Voice Chat"}>
                      <Microphone size={16} weight={(voiceMode || isRecording) ? "fill" : "regular"} />
                    </button>
                    {voiceMode && (
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => setVoiceMuted(v => !v)} className={cn("flex items-center justify-center w-7 h-7 rounded-full transition-colors", isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-[#050505]")} title={voiceMuted ? "Unmute voice" : "Mute voice"}>
                        {voiceMuted ? <SpeakerSlash size={16} weight="fill" /> : <SpeakerHigh size={16} weight="fill" />}
                      </button>
                    )}
                    <span className={cn("text-sm font-medium truncate", isDark ? "text-gray-300" : "text-gray-600")}>{isRecording ? (voicePersona?.lang === "ar" ? "تسجيل..." : "Recording...") : "MedOneX Expert"}</span>
                  </div>
                )}
                {loading ? (
                  <button onMouseDown={(e) => e.preventDefault()} onClick={stopGeneration} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center leading-none transition-all hover:opacity-80"
                    style={{ backgroundColor: isDark ? "#FFFFFF" : "#000000" }}>
                    <Stop size={13} weight="fill" color={isDark ? "#000000" : "#FFFFFF"} />
                  </button>
                ) : (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSend}
                    disabled={!input.trim() && files.length === 0}
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90",
                      input.trim() || files.length > 0
                        ? isDark ? "bg-white text-black hover:bg-gray-200 shadow-md" : "bg-[#141414] text-white hover:bg-gray-800 shadow-md"
                        : isDark ? "bg-white/5 text-gray-500" : "bg-black/5 text-gray-300"
                    )}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
      /* Desktop fixed input */
      <div className={cn(
        "hidden md:block fixed bottom-0 z-max transition-colors duration-200 ease-out",
        showSidebar ? "left-[260px] right-0" : "left-[52px] right-0"
      )}>
        <div className="flex justify-center relative">
          {/* Gradient backdrop — messages fade smoothly behind input */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[-1]" style={{ height: "60px" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/95 via-60% to-transparent transition-opacity duration-150 ease-out"
                 style={{ opacity: isDark ? 1 : 0 }} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 via-60% to-transparent transition-opacity duration-150 ease-out"
                 style={{ opacity: isDark ? 0 : 1 }} />
          </div>
          {/* Desktop scroll-to-bottom button */}
          <button
            onClick={() => { 
              const el = scrollContainerRef.current; 
              if (el) { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); return; }
              const m = mainRef.current;
              if (m) { m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }
            }}
            className={cn(
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-md active:scale-90 transition-all duration-200 ease-out",
              showScrollBtn ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none",
              isDark
                ? "border-white/[0.12] bg-white/10 text-white hover:bg-white/20"
                : "border-black/[0.08] bg-black/5 text-black hover:bg-black/10"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
          {/* Reply Context Bar (Desktop) */}
          {replyContext && (
            <div className="relative z-10 w-full md:max-w-[48rem] mx-auto px-4 pb-2">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs",
                isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"
              )}>
                <ArrowBendUpLeft size={14} weight="bold" className="flex-shrink-0" />
                <span className="truncate flex-1">Replying to: &ldquo;{replyContext.text}&rdquo;</span>
                <button
                  onClick={() => setReplyContext(null)}
                  className={cn("p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0", isDark ? "hover:text-white" : "hover:text-gray-800")}
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            </div>
          )}
          <div className="w-full md:max-w-[48rem] mx-auto px-4 pb-4 pt-2">
            {files.length > 0 && (
              <div className={cn(
                "flex flex-wrap gap-1.5 px-3 py-2 mb-2 rounded-2xl",
                isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"
              )}>
                {files.map((f, i) => (
                  <div key={i} className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs max-w-[160px] transition-all", isDark ? "bg-white/10" : "bg-gray-100")}>
                    {f.loading ? (
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="animate-spin h-2.5 w-2.5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    ) : f.mimeType.startsWith("image/") ? (
                      <Image src={f.data} alt={f.name} width={16} height={16} className="w-4 h-4 rounded object-cover flex-shrink-0" unoptimized />
                    ) : (
                      <span className="text-[10px] flex-shrink-0">{f.name.match(/\.pdf$/i) ? "📄" : f.name.match(/\.pptx?$/i) ? "📊" : "📎"}</span>
                    )}
                    <span className="truncate max-w-[80px]">{f.name}</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="flex-shrink-0 ml-0.5 opacity-60 hover:opacity-100 transition-opacity"><X size={10} weight="bold" /></button>
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => { if (!inputFocused) inputRef.current?.focus(); }}
              className={cn(
                "flex flex-col rounded-2xl ring-1 transition-all duration-200 ease-out cursor-text",
                inputFocused
                  ? isDark ? "ring-white/25 shadow-lg shadow-black/20" : "ring-black/20 shadow-lg shadow-black/5"
                  : isDark ? "ring-white/10 shadow-sm" : "ring-gray-200/70 shadow-sm",
                isDark ? "bg-[#141414]" : "bg-white"
              )}
            >
              <div className="grid transition-all duration-200 ease-out" style={{ gridTemplateRows: inputFocused ? '1fr' : '0fr' }}>
                <div className="overflow-hidden min-h-0">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => startTransition(() => setInput(e.target.value))}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder={isRecording ? (voicePersona?.lang === "ar" ? "تسجيل..." : "Recording...") : "Ask MedOneX anything..."}
                    dir="auto"
                    className={cn(
                      "w-full bg-transparent border-none outline-none resize-none px-4 pt-3.5 pb-1 text-base leading-relaxed no-scrollbar max-h-[150px]",
                      isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                    )}
                  />
                </div>
              </div>
              <div className={cn("flex items-center justify-between px-2", inputFocused ? "pb-2.5 pt-0" : "py-2.5")}>
                {inputFocused ? (
                  <div className="flex items-center gap-0.5">
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowProviderPicker(true)}
                      className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
                      title={PROVIDER_CONFIGS[settings.activeProvider]?.label}
                    >
                      <Brain size={15} weight="regular" />
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const currentIdx = personaList.indexOf(settings.activePersona as DrQPersonaId);
                        const nextPersona = personaList[(currentIdx + 1) % personaList.length];
                        const ws = Object.values(DRQ_WORKSPACES).find(w => w.personaId === nextPersona);
                        if (ws) updateSettings({ activePersona: nextPersona, activeProvider: ws.defaultProvider, activeModels: { ...settings.activeModels, [ws.defaultProvider]: [ws.defaultModel] } });
                        else updateSettings({ activePersona: nextPersona });
                      }}
                      className={cn("flex items-center justify-center w-8 h-8 rounded-full transition-all select-none", isDark ? "text-gray-500 hover:text-gray-200 hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
                      title={(DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).name}
                    >
                      {React.cloneElement((DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).icon as React.ReactElement, { size: 14, weight: "regular" })}
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={toggleVoiceMode}
                      className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", (voiceMode || isRecording) ? "text-red-500 bg-red-500/15" : isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
                      title={voiceMode ? "Voice Mode" : "Voice Chat"}
                    >
                      <Microphone size={15} weight={(voiceMode || isRecording) ? "fill" : "regular"} />
                    </button>
                    {voiceMode && (
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setVoiceMuted(v => !v)}
                        className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
                        title={voiceMuted ? "Unmute voice" : "Mute voice"}
                      >
                        {voiceMuted ? <SpeakerSlash size={15} weight="fill" /> : <SpeakerHigh size={15} weight="fill" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={toggleVoiceMode} className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", (voiceMode || isRecording) ? "text-red-500 bg-red-500/15" : isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")} title={voiceMode ? "Voice Mode" : "Voice Chat"}>
                      <Microphone size={15} weight={(voiceMode || isRecording) ? "fill" : "regular"} />
                    </button>
                    {voiceMode && (
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setVoiceMuted(v => !v)}
                        className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isDark ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}
                        title={voiceMuted ? "Unmute voice" : "Mute voice"}
                      >
                        {voiceMuted ? <SpeakerSlash size={15} weight="fill" /> : <SpeakerHigh size={15} weight="fill" />}
                      </button>
                    )}
                    <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>{isRecording ? (voicePersona?.lang === "ar" ? "تسجيل..." : "Recording...") : "Ask MedOneX anything..."}</span>
                  </div>
                )}
                {loading ? (
                  <button onMouseDown={(e) => e.preventDefault()} onClick={stopGeneration} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center leading-none transition-all hover:opacity-80"
                    style={{ backgroundColor: isDark ? "#FFFFFF" : "#000000" }}>
                    <Stop size={13} weight="fill" color={isDark ? "#000000" : "#FFFFFF"} />
                  </button>
                ) : (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSend}
                    disabled={!input.trim() && files.length === 0}
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90",
                      input.trim() || files.length > 0
                        ? isDark ? "bg-white text-black hover:bg-gray-200 shadow-md" : "bg-[#141414] text-white hover:bg-gray-800 shadow-md"
                        : isDark ? "bg-white/5 text-gray-500" : "bg-black/5 text-gray-300"
                    )}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center mt-2.5 px-1">
              <span className={cn("text-[10px] opacity-40", isDark ? "text-gray-500" : "text-gray-500")}>MedOneX can make mistakes. Verify important information.</span>
            </div>
          </div>
        </div>
      </div>)}

      {!embedded && <>{/* Solid fill below mobile capsule */}
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-max pointer-events-none transition-colors duration-200 ease-out",
        isDark ? "bg-black" : "bg-white"
      )} style={{ height: "calc(16px + env(safe-area-inset-bottom, 0px))" }} />

      {/* Mobile scroll-to-bottom button (above capsule) */}
      <button
        onClick={() => {
          const el = scrollContainerRef.current;
          if (el) { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); return; }
          const m = mainRef.current;
          if (m) { m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }
        }}
        className={cn(
          "md:hidden fixed left-1/2 -translate-x-1/2 z-[10004] w-11 h-11 rounded-full flex items-center justify-center shadow-2xl border-2 backdrop-blur-md active:scale-90 transition-all duration-200 ease-out",
          showScrollBtn && !showSidebar ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none",
          isDark
            ? "border-white/30 bg-white/25 text-white hover:bg-white/40"
            : "border-black/20 bg-black/15 text-black hover:bg-black/25"
        )}
        style={{ bottom: "calc(16px + env(safe-area-inset-bottom, 0px) + 60px)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </button>

      {/* ─── Mobile Floating Input ─── */}
      <motion.div
        animate={{
          x: showSidebar ? "85vw" : 0,
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{ willChange: "transform" }}
        className="md:hidden fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-[10003] pointer-events-none"
      >
        {/* Gradient backdrop */}
        <div className="absolute inset-0 rounded-t-2xl pointer-events-none">
          <div className="absolute inset-0 rounded-t-2xl bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-150 ease-out"
               style={{ opacity: isDark ? 1 : 0 }} />
          <div className="absolute inset-0 rounded-t-2xl bg-gradient-to-t from-white via-white/80 to-transparent transition-opacity duration-150 ease-out"
               style={{ opacity: isDark ? 0 : 1 }} />
        </div>
        {/* Reply Context Bar (Mobile) */}
        {replyContext && (
          <div className="px-4 pb-1 pointer-events-auto relative">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs",
              isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"
            )}>
              <ArrowBendUpLeft size={14} weight="bold" className="flex-shrink-0" />
              <span className="truncate flex-1">Replying to: &ldquo;{replyContext.text}&rdquo;</span>
              <button
                onClick={() => setReplyContext(null)}
                className={cn("p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0", isDark ? "hover:text-white" : "hover:text-gray-800")}
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          </div>
        )}
        <div className="px-2 pb-1 pointer-events-auto relative">
          <div
            onClick={() => { if (!mobileFocused) mobileInputRef.current?.focus(); }}
            className={cn(
              "flex flex-col mx-2 mb-1 rounded-[20px] ring-1 transition-all duration-200 ease-out shadow-sm cursor-text overflow-hidden",
              mobileFocused && "rounded-[22px]",
              isDark ? "ring-white/10" : "ring-gray-200/80",
              isDark ? "bg-[#141414]/90 backdrop-blur-xl text-white" : "bg-white text-[#050505]"
            )}>
            <div className="grid transition-all duration-200 ease-out" style={{ gridTemplateRows: mobileFocused ? '1fr' : '0fr' }}>
              <div className="overflow-hidden min-h-0">
              {files.length > 0 && (
                <div className={cn(
                  "flex flex-wrap gap-1.5 px-3 pt-2.5 pb-1.5 max-h-[120px] overflow-y-auto border-b",
                  isDark ? "border-white/10" : "border-gray-200/60"
                )}>
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs max-w-[160px] transition-all",
                        isDark ? "bg-white/10" : "bg-gray-100"
                      )}
                    >
                      {f.loading ? (
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="animate-spin h-3 w-3 text-indigo-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      ) : f.mimeType.startsWith("image/") ? (
                        <Image src={f.data} alt={f.name} width={20} height={20} className="w-5 h-5 rounded object-cover flex-shrink-0" unoptimized />
                      ) : (
                        <span className="text-[10px] flex-shrink-0">
                          {f.name.match(/\.pdf$/i) ? "📄" : f.name.match(/\.pptx?$/i) ? "📊" : "📎"}
                        </span>
                      )}
                      <span className="truncate max-w-[80px]">{f.name}</span>
                      <button
                        onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        className="flex-shrink-0 ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X size={10} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                ref={mobileInputRef}
                rows={1}
                value={input}
                onChange={(e) => startTransition(() => setInput(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onFocus={() => setMobileFocused(true)}
                onBlur={() => setMobileFocused(false)}
                placeholder={isRecording ? (voicePersona?.lang === "ar" ? "تسجيل..." : "Recording...") : "MedOneX Expert"}
                dir="auto"
                className={cn(
                  "w-full bg-transparent border-none outline-none resize-none px-3 pt-3 pb-1 text-base leading-relaxed no-scrollbar placeholder-gray-400",
                  isDark ? "text-white" : "text-[#050505]"
                )}
              />
              </div>
            </div>
            <div className={cn("flex items-center justify-between px-2", mobileFocused ? "pb-2 pt-0" : "py-2")}>
              {mobileFocused ? (
              <>
              <div className="flex items-center gap-0.5">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                  isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/10"
                    : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5"
                )}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const currentIdx = personaList.indexOf(settings.activePersona as DrQPersonaId);
                  const nextPersona = personaList[(currentIdx + 1) % personaList.length];
                  const ws = Object.values(DRQ_WORKSPACES).find(w => w.personaId === nextPersona);
                  if (ws) updateSettings({ activePersona: nextPersona, activeProvider: ws.defaultProvider, activeModels: { ...settings.activeModels, [ws.defaultProvider]: [ws.defaultModel] } });
                  else updateSettings({ activePersona: nextPersona });
                }}
                className={cn(
                  "flex items-center justify-center w-9 h-9 min-w-9 min-h-9 rounded-full transition-all select-none",
                  isDark
                    ? "text-gray-400 hover:text-gray-200 hover:bg-white/10"
                    : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5"
                )}
                title={(DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).name}
              >
                {React.cloneElement(
                  (DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).icon as React.ReactElement,
                  { size: 18, weight: "regular" }
                )}
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowProviderPicker(true)}
                className={cn(
                  "w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center transition-all text-base",
                  isDark
                    ? "text-gray-400 hover:text-gray-200 hover:bg-white/10"
                    : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5"
                )}
                title={PROVIDER_CONFIGS[settings.activeProvider]?.label}
              >
                <Brain size={18} weight="regular" />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleVoiceMode}
                className={cn(
                  "w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center transition-all",
                  (voiceMode || isRecording)
                    ? "text-red-500 bg-red-500/15"
                    : isDark
                      ? "text-gray-400 hover:text-gray-200 hover:bg-white/10"
                      : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5"
                )}
                title={voiceMode ? "Voice Mode" : "Voice Chat"}
              >
                <Microphone size={18} weight={(voiceMode || isRecording) ? "fill" : "regular"} />
              </button>
              {voiceMode && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setVoiceMuted(v => !v)}
                  className={cn(
                    "w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center transition-all",
                    isDark
                      ? "text-gray-400 hover:text-gray-200 hover:bg-white/10"
                      : "text-[#050505]/60 hover:text-[#050505] hover:bg-black/5"
                  )}
                  title={voiceMuted ? "Unmute voice" : "Mute voice"}
                >
                  {voiceMuted ? <SpeakerSlash size={18} weight="fill" /> : <SpeakerHigh size={18} weight="fill" />}
                </button>
              )}
              </div>
              {loading ? (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={stopGeneration}
                  className="w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center leading-none transition-all hover:opacity-80"
                  style={{ backgroundColor: isDark ? "#FFFFFF" : "#000000" }}
                >
                  <Stop size={18} weight="fill" color={isDark ? "#000000" : "#FFFFFF"} />
                </button>
              ) : (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSend}
                  disabled={!input.trim() && files.length === 0}
                  className={cn(
                    "w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90",
                    input.trim()
                      ? isDark
                        ? "bg-white text-[#141414] hover:bg-gray-200 shadow-md"
                        : "bg-[#050505] text-white hover:bg-gray-800 shadow-md"
                      : isDark
                        ? "bg-white/10 text-gray-500"
                        : "bg-[#050505]/10 text-[#050505]/40"
                  )}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              )}
              </>
              ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-7 h-7 rounded-full transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn(isDark ? "text-gray-400" : "text-gray-500")}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={toggleVoiceMode}
                    className={cn("flex items-center justify-center w-7 h-7 rounded-full transition-colors", (voiceMode || isRecording) ? "text-red-500" : isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-[#050505]")}
                    title={voiceMode ? "Voice Mode" : "Voice Chat"}
                  >
                    <Microphone size={16} weight={(voiceMode || isRecording) ? "fill" : "regular"} />
                  </button>
                  {voiceMode && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setVoiceMuted(v => !v)}
                      className={cn("flex items-center justify-center w-7 h-7 rounded-full transition-colors", isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-[#050505]")}
                      title={voiceMuted ? "Unmute voice" : "Mute voice"}
                    >
                      {voiceMuted ? <SpeakerSlash size={16} weight="fill" /> : <SpeakerHigh size={16} weight="fill" />}
                    </button>
                  )}
                  <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-600")}>{isRecording ? (voicePersona?.lang === "ar" ? "تسجيل..." : "Recording...") : "MedOneX Expert"}</span>
                </div>
                {!input.trim() && files.length === 0 ? (
                  <button
                    onClick={() => { mobileInputRef.current?.focus(); }}
                    className={cn(
                      "w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center transition-all duration-200 ease-out",
                      isDark
                        ? "bg-white/10 text-gray-400 hover:bg-white/20"
                        : "bg-[#050505]/10 text-[#050505]/40 hover:bg-[#050505]/20"
                    )}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    className={cn(
                      "w-9 h-9 min-w-9 min-h-9 rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90",
                      isDark
                        ? "bg-white text-[#141414] hover:bg-gray-200 shadow-md"
                        : "bg-[#050505] text-white hover:bg-gray-800 shadow-md"
                    )}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </button>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 pb-1 relative z-10 pt-1">
          <span className={cn("block text-[8px] leading-tight text-center", isDark ? "text-gray-500" : "text-gray-500")}>This AI chat is for educational purposes only &bull; Please set your API key for accurate responses</span>
        </div>
      </motion.div>
      </>}

      {/* ─── Global Bottom Sheets (from floating toolbar) ─── */}
      <QuestionsBottomSheet
        isOpen={showGlobalQuestions}
        onClose={() => setShowGlobalQuestions(false)}
        questions={globalQuestions}
        isDark={isDark}
      />
      <FlashcardsBottomSheet
        isOpen={showGlobalFlashcards}
        onClose={() => setShowGlobalFlashcards(false)}
        flashcards={globalFlashcards}
        isDark={isDark}
      />
      <ResourcesBottomSheet
        isOpen={showGlobalResources}
        onClose={() => setShowGlobalResources(false)}
        resources={globalResources}
        isDark={isDark}
      />

      {/* ─── Provider & API Keys Bottom Sheet ─── */}
      <ProviderPickerSheet
        isOpen={showProviderPicker}
        onClose={() => setShowProviderPicker(false)}
        settings={settings}
        onUpdate={updateSettings}
        isDark={isDark}
      />

      <VoicePersonaPicker
        isOpen={showVoicePicker}
        onClose={() => setShowVoicePicker(false)}
        onSelect={handleVoicePersonaSelect}
        isDark={isDark}
      />

      <PWAInstallModal isDark={isDark} />

      {/* ─── Settings / Saved / Library / Agent overlays ─── */}
      <DrQConfigPanel
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        settings={settings}
        onUpdate={updateSettings}
      />
      <SavedPage
        isOpen={showSaved}
        onClose={() => setShowSaved(false)}
        isDark={isDark}
      />
      <LibraryPage
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        isDark={isDark}
        onOpenQuiz={(quiz) => setShowLibraryQuiz(quiz)}
      />
      <CustomAgentGallery
        isOpen={showAgentGallery}
        onClose={() => setShowAgentGallery(false)}
        isDark={isDark}
        onSelectAgent={(agent) => {
          setActiveAgent(agent);
          setShowAgentGallery(false);
        }}
      />
      <AnimatePresence>
        {activeAgent && (
          <CustomAgentChat
            agent={activeAgent}
            onClose={() => setActiveAgent(null)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
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

/* ─── Provider Picker Bottom Sheet ─── */
function getKeysArray(keys: string | string[] | undefined): string[] {
  if (Array.isArray(keys)) return keys;
  if (typeof keys === "string" && keys) return [keys];
  return [];
}

async function testProviderKey(pid: AIProvider, key: string): Promise<{ ok: boolean; error?: string }> {
  const config = PROVIDER_CONFIGS[pid];
  if (config.needsKey === false) return { ok: true };
  if (!key) return { ok: false, error: "No key entered" };
  try {
    if (pid === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true };
      const body: any = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error?.message || `HTTP ${res.status}` };
    }
    if (pid === "mistral") {
      const res = await fetch("https://api.mistral.ai/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true };
      const body: any = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error?.message || `HTTP ${res.status}` };
    }
    const baseURL = config.baseURL || "https://api.openai.com/v1";
    const URL = baseURL.endsWith("/v1") ? `${baseURL}/models` : `${baseURL.replace(/\/+$/, "")}/v1/models`;
    const res = await fetch(URL, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true };
    const body: any = await res.json().catch(() => ({}));
    return { ok: false, error: body?.error?.message || body?.error || `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e.name === "TimeoutError" ? "Timeout (8s)" : e.message || "Unknown error" };
  }
}

function ProviderPickerSheet({ isOpen, onClose, settings, onUpdate, isDark }: {
  isOpen: boolean;
  onClose: () => void;
  settings: DrQSettings;
  onUpdate: (updated: Partial<DrQSettings>) => void;
  isDark: boolean;
}) {
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<Record<string, "idle" | "testing" | "ok" | "fail">>({});
  const [keyError, setKeyError] = useState<Record<string, string>>({});
  const [pickerTab, setPickerTab] = useState<"provider" | "keys">("provider");

  const handleKeyChange = (pid: AIProvider, index: number, value: string) => {
    const current = settings.byokKeys[pid];
    const arr = getKeysArray(current);
    while (arr.length <= index) arr.push("");
    arr[index] = value;
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
    if (arr.length <= 1) { arr = [""]; }
    else { arr = arr.filter((_, i) => i !== index); }
    onUpdate({ byokKeys: { ...settings.byokKeys, [pid]: arr } });
  };

  const handleTest = async (pid: AIProvider, index: number) => {
    const current = settings.byokKeys[pid];
    const arr = getKeysArray(current);
    const key = arr[index];
    const id = `${pid}-${index}`;
    setTestingKey(prev => ({ ...prev, [id]: "testing" }));
    setKeyError(prev => ({ ...prev, [id]: "" }));
    const result = await testProviderKey(pid, key);
    setTestingKey(prev => ({ ...prev, [id]: result.ok ? "ok" : "fail" }));
    if (!result.ok) {
      setKeyError(prev => ({ ...prev, [id]: result.error || "Unknown error" }));
    }
  };

  const keyLabel = (pid: AIProvider): string => {
    if (pid === "gemini") return "Google AI Studio API Key";
    if (pid === "ovhcloud") return "OVHcloud Endpoint";
    if (pid === "github") return "GitHub Personal Access Token";
    return `API Key`;
  };

  const providers = Object.keys(PROVIDER_CONFIGS) as AIProvider[];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-max flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <div className={cn(
            "absolute inset-0",
            isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/40 backdrop-blur-sm"
          )} />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={e => e.stopPropagation()}
            className={cn(
              "relative w-full md:max-w-lg max-h-[88vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden md:mx-4",
              isDark ? "bg-[#050505] border-t md:border border-white/10" : "bg-white border-t md:border border-gray-200"
            )}
            style={settings.bgImage ? {
              backgroundImage: `url(${settings.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : undefined}
          >
            {settings.bgImage && (
              <div
                className="absolute inset-0"
                style={{
                  backdropFilter: `blur(${settings.bgBlur || 0}px)`,
                  backgroundColor: isDark
                    ? `rgba(5,5,5,${settings.bgOpacity ?? 0.85})`
                    : `rgba(255,255,255,${settings.bgOpacity ?? 0.85})`,
                }}
              />
            )}
            <div className="relative z-10 flex flex-col max-h-[88vh]">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-gray-300")} />
              </div>

              {/* Header */}
              <div className={cn(
                "flex items-center justify-between px-5 py-3 border-b flex-shrink-0",
                isDark ? "border-white/10" : "border-gray-200"
              )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-white/10" : "bg-gray-100")}>
                    <Brain size={16} weight="bold" className={isDark ? "text-white" : "text-gray-800"} />
                  </div>
                  <div>
                    <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>Provider & API Keys</h2>
                    <p className={cn("text-[10px] font-medium", isDark ? "text-gray-500" : "text-gray-400")}>Choose model and manage keys</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={cn("p-2 rounded-xl transition-all", isDark ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800")}
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Tabs */}
              <div className={cn("flex gap-1 px-5 pt-3 pb-2 border-b flex-shrink-0", isDark ? "border-white/10" : "border-gray-200")}>
                {[
                  { key: "provider" as const, label: "Provider" },
                  { key: "keys" as const, label: "API Keys" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setPickerTab(tab.key)}
                    className={cn(
                      "relative px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                      pickerTab === tab.key
                        ? isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"
                        : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
                {pickerTab === "provider" ? (
                /* ─── Provider Selection ─── */
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {providers.map(pid => {
                      const config = PROVIDER_CONFIGS[pid];
                      const isActive = settings.activeProvider === pid;
                      return (
                        <button
                          key={pid}
                          onClick={() => onUpdate({ activeProvider: pid })}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left",
                            isActive
                              ? isDark ? "bg-white/10 text-white ring-1 ring-white/20" : "bg-gray-100 text-gray-900 ring-1 ring-gray-300"
                              : isDark ? "bg-white/[0.03] text-gray-400 hover:bg-white/5 hover:text-gray-200" : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          )}
                        >
                          <span className="text-base flex-shrink-0">{config.icon}</span>
                          <span className="truncate flex-1">{config.label}</span>
                          {isActive && <Check size={12} weight="bold" className="flex-shrink-0 text-indigo-500" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className={cn(
                    "mt-2 px-3 py-2 rounded-xl text-[11px] font-medium",
                    isDark ? "bg-white/[0.03] text-gray-500" : "bg-gray-50 text-gray-500"
                  )}>
                    Active model: <span className={isDark ? "text-white" : "text-gray-800"}>{PROVIDER_CONFIGS[settings.activeProvider]?.defaultModel}</span>
                  </div>
                </div>
                ) : (
                /* ─── API Keys ─── */
                <div className="space-y-3">
                  {providers.map(pid => {
                    const config = PROVIDER_CONFIGS[pid];
                    const keys = getKeysArray(settings.byokKeys[pid]);
                    const hasAnyKey = keys.some(k => k);
                    return (
                      <div key={pid} className={cn("p-3 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200")}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold", isDark ? "bg-white/10" : "bg-white border border-gray-200")}>
                              {config.icon}
                            </div>
                            <span className={cn("text-xs font-medium", isDark ? "text-white" : "text-gray-900")}>{config.label}</span>
                            {config.keyUrl && (
                              <a href={config.keyUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className={cn("flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all hover:scale-105", isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")}
                              >
                                Get <ArrowUpRight size={8} weight="bold" />
                              </a>
                            )}
                          </div>
                          {hasAnyKey ? (
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>
                              {keys.filter(k => k).length} key{keys.filter(k => k).length !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500")}>No Key</span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {keys.map((key, idx) => {
                            const id = `${pid}-${idx}`;
                            const testState = testingKey[id];
                            const isVisible = visibleKeys[id];
                            return (
                              <div key={idx} className="flex items-center gap-1.5">
                                <div className="relative flex-1">
                                  <input
                                    type={isVisible ? "text" : "password"}
                                    placeholder={`${config.label} Key ${idx + 1}${idx === 0 ? " (Primary)" : ""}...`}
                                    value={key}
                                    onChange={e => handleKeyChange(pid, idx, e.target.value)}
                                    className={cn(
                                      "w-full rounded-xl px-3 py-2 text-xs outline-none transition-all font-mono",
                                      isDark ? "bg-black/40 text-white placeholder-gray-600 border border-white/10 focus:border-indigo-500/50" : "bg-white text-gray-900 placeholder-gray-300 border border-gray-200 focus:border-indigo-400/50"
                                    )}
                                  />
                                  <button
                                    onClick={() => setVisibleKeys({ ...visibleKeys, [id]: !isVisible })}
                                    className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors", isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700")}
                                  >
                                    {isVisible ? <EyeSlash size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleTest(pid, idx)}
                                  disabled={!key || testState === "testing"}
                                  className={cn(
                                    "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                    testState === "testing" ? (isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400")
                                      : testState === "ok" ? "bg-emerald-500/10 text-emerald-500"
                                      : testState === "fail" ? "bg-red-500/10 text-red-500"
                                      : isDark ? "bg-white/10 text-gray-400 hover:bg-white/20" : "bg-gray-200 text-gray-600 hover:bg-gray-300",
                                    !key ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                  )}
                                  title="Test key"
                                >
                                  {testState === "testing" ? <Spinner size={13} weight="bold" className="animate-spin" />
                                    : testState === "ok" ? <Check size={13} weight="bold" />
                                    : testState === "fail" ? <WarningCircle size={13} weight="bold" />
                                    : <Lightning size={13} weight="bold" />}
                                </button>
                                {keys.length > 1 && (
                                  <button
                                    onClick={() => removeKeyField(pid, idx)}
                                    className={cn("flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all", isDark ? "text-gray-500 hover:bg-white/10 hover:text-red-400" : "text-gray-400 hover:bg-gray-200 hover:text-red-500")}
                                  >
                                    <X size={10} weight="bold" />
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
                              className={cn("flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl transition-all", isDark ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800")}
                            >
                              <Plus size={10} weight="bold" />
                              Add Key ({keys.length}/5)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
