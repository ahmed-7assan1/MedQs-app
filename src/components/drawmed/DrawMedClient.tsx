"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw";
import { useThemeStore } from "@/lib/store";
import { DrawMedHeader } from "./DrawMedHeader";
import { DrawMedLibrary } from "./DrawMedLibrary";
import { motion, AnimatePresence } from "framer-motion";
import { useDrQChat } from "@/hooks/useDrQChat";
import {
  Loader2,
  X,
  FilePlus,
  Upload,
  Download,
  Image as ImageIcon,
  FileImage,
  Grid,
  Eye,
  EyeOff,
  Sparkles,
  Settings,
  Palette,
  ZoomIn,
  ZoomOut,
  Bot,
  ArrowUp,
  StopCircle,
} from "lucide-react";
import "./excalidraw-styles.css";
import "./drawmed.css";

const Excalidraw = dynamic(
  () => import("@/vendor/excalidraw/vendor").then((m) => m.Excalidraw),
  { ssr: false, loading: () => <div className="drawmed-loading"><LoadingContent /></div> }
);

const STORAGE_KEY = "drawmed-scene";

function LoadingContent() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="drawmed-topbar__logo h-14 w-14 rounded-2xl shadow-2xl text-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-bold tracking-wider text-white/80 uppercase">
          DrawMed
        </p>
        <p className="text-[10px] font-semibold text-primary uppercase tracking-widest animate-pulse">
          Loading canvas engine…
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="drawmed-loading"><LoadingContent /></div>;
}

export function DrawMedClient() {
  const { theme: appTheme } = useThemeStore();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [mounted, setMounted] = useState(false);

  const [initialData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.appState && !Array.isArray(parsed.appState.collaborators)) {
          parsed.appState.collaborators = [];
        }
        return parsed;
      }
    } catch {}
    return null;
  });

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zoomValue, setZoomValue] = useState(1);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  const { settings, loading: aiGlobalLoading } = useDrQChat();

  // Make the Excalidraw shapes toolbar draggable once the API is ready
  useEffect(() => {
    if (!apiReady) return;

    const findToolbar = (): HTMLElement | null =>
      document.querySelector(".excalidraw .App-toolbar-container");

    let cleanup: (() => void) | null = null;
    const interval = setInterval(() => {
      const toolbar = findToolbar();
      if (toolbar && toolbar.getBoundingClientRect().width > 0) {
        clearInterval(interval);
        
        const rect = toolbar.getBoundingClientRect();
        
        toolbar.style.position = "fixed";
        toolbar.style.left = `${rect.left}px`;
        toolbar.style.top = `${rect.top}px`;
        toolbar.style.cursor = "grab";
        toolbar.style.zIndex = "50";
        toolbar.style.touchAction = "none";

        let dragging = false;
        let startX = 0, startY = 0;
        let origLeft = 0, origTop = 0;

        const onDown = (clientX: number, clientY: number) => {
          dragging = true;
          toolbar.style.cursor = "grabbing";
          startX = clientX;
          startY = clientY;
          const currentRect = toolbar.getBoundingClientRect();
          origLeft = currentRect.left;
          origTop = currentRect.top;
        };
        const onMove = (clientX: number, clientY: number) => {
          if (!dragging) return;
          toolbar.style.left = `${origLeft + clientX - startX}px`;
          toolbar.style.top = `${origTop + clientY - startY}px`;
        };
        const onUp = () => {
          dragging = false;
          toolbar.style.cursor = "grab";
        };

        const handleMouseDown = (e: MouseEvent) => { e.preventDefault(); onDown(e.clientX, e.clientY); };
        const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
        const handleMouseUp = () => onUp();
        const handleTouchStart = (e: TouchEvent) => { if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY); };
        const handleTouchMove = (e: TouchEvent) => { if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY); };
        const handleTouchEnd = () => onUp();

        toolbar.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        toolbar.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("touchend", handleTouchEnd);

        cleanup = () => {
          toolbar.removeEventListener("mousedown", handleMouseDown);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          toolbar.removeEventListener("touchstart", handleTouchStart);
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
        };
      }
    }, 500);

    return () => {
      clearInterval(interval);
      cleanup?.();
    };
  }, [apiReady]);

  useEffect(() => { setMounted(true); }, []);

  const onChange = useCallback(
    (_elements: readonly { id: string; type: string }[], appState: Record<string, unknown>) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ elements: _elements, appState }));
        if (appState.gridSize !== undefined) setGridEnabled(!!appState.gridSize);
        if (appState.viewModeEnabled !== undefined) setViewModeEnabled(!!appState.viewModeEnabled);
        if (appState.zoom) {
          const z = appState.zoom as { value: number };
          if (typeof z.value === "number") setZoomValue(z.value);
        }
      } catch {}
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    if (!apiRef.current) return;
    const appState = apiRef.current.getAppState();
    apiRef.current.updateScene({
      appState: { zoom: { value: Math.min(appState.zoom.value * 1.25, 5) as any } },
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!apiRef.current) return;
    const appState = apiRef.current.getAppState();
    apiRef.current.updateScene({
      appState: { zoom: { value: Math.max(appState.zoom.value / 1.25, 0.1) as any } },
    });
  }, []);

  const handleExport = useCallback(async (format: "png" | "svg") => {
    if (!apiRef.current) return;
    const { exportToBlob, exportToSvg } = await import("@/vendor/excalidraw/vendor");
    try {
      const elements = apiRef.current.getSceneElements();
      const appState = apiRef.current.getAppState();
      const files = apiRef.current.getFiles();
      if (format === "png") {
        const blob = await exportToBlob({ elements, appState, files, exportBackground: appState.viewBackgroundColor !== "transparent" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `drawmed-${Date.now()}.png`; a.click();
        URL.revokeObjectURL(url);
      } else {
        const svg = await exportToSvg({ elements, appState, files });
        const svgBlob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        const a = document.createElement("a"); a.href = url; a.download = `drawmed-${Date.now()}.svg`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  }, []);

  const handleNew = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.updateScene({ elements: [], appState: { viewBackgroundColor: "#ffffff" } });
    }
    localStorage.removeItem(STORAGE_KEY);
    setLeftMenuOpen(false);
  }, []);

  const handleSaveFile = useCallback(async () => {
    if (!apiRef.current) return;
    try {
      const elements = apiRef.current.getSceneElements();
      const appState = apiRef.current.getAppState();
      const jsonStr = JSON.stringify({ elements, appState }, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `drawmed-${Date.now()}.excalidraw`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, []);

  const handleLoad = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".excalidraw,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (apiRef.current) {
          apiRef.current.updateScene({ elements: data.elements || [], appState: data.appState || {} });
        }
        localStorage.setItem(STORAGE_KEY, text);
        setLeftMenuOpen(false);
      } catch {}
    };
    input.click();
  }, []);

  const handleToggleLibrarySidebar = useCallback(() => {
    apiRef.current?.toggleSidebar({ name: "library" });
  }, []);

  const handleToggleGrid = useCallback(() => {
    if (!apiRef.current) return;
    const appState = apiRef.current.getAppState();
    apiRef.current.updateScene({
      appState: { gridSize: appState.gridSize ? (null as unknown as number) : 20 },
    });
  }, []);

  const handleToggleViewMode = useCallback(() => {
    if (!apiRef.current) return;
    const appState = apiRef.current.getAppState();
    apiRef.current.updateScene({ appState: { viewModeEnabled: !appState.viewModeEnabled } });
  }, []);

  const handleSetBgColor = useCallback((color: string) => {
    apiRef.current?.updateScene({ appState: { viewBackgroundColor: color } });
  }, []);

  const aiMessageRef = useRef(aiMessage);
  aiMessageRef.current = aiMessage;
  const abortRef = useRef<AbortController | null>(null);

  const handleAiSend = useCallback(async () => {
    const msg = aiMessageRef.current;
    if (!msg.trim() || aiLoading) return;
    const apiKey = settings.byokKeys[settings.activeProvider];
    if (!apiKey) {
      setAiResponse("⚠️ Please set your API key in AI Chat settings first.");
      return;
    }
    setAiLoading(true);
    setAiResponse("");
    setAiMessage("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const baseURL = (await import("@/hooks/useDrQChat")).PROVIDER_CONFIGS[settings.activeProvider].baseURL || `https://api.${settings.activeProvider}.com/v1`;
      const model = settings.activeModel;
      const resp = await fetch(`${baseURL}/chat/completions`, {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a helpful drawing assistant. Help the user create and describe drawings for their medical whiteboard." },
            { role: "user", content: msg }
          ],
          stream: true,
          max_tokens: 1024,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${resp.status}`);
      }
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              setAiResponse(full);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setAiResponse(`❌ Error: ${err.message}`);
      }
    } finally {
      setAiLoading(false);
      abortRef.current = null;
    }
  }, [aiLoading, settings]);

  const handleAiStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setAiLoading(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        setLeftMenuOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const aliasArabicFonts = async () => {
      const tajawalFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-tajawal").trim();
      if (!tajawalFamily) return;

      const arabicRange = "U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF";
      const excalidrawFonts = [
        "Virgil", "Helvetica", "Cascadia", "Excalifont", "Nunito",
        "Lilita One", "Comic Shanns", "Liberation Sans", "Xiaolai",
      ];

      let fontSrc = "";
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const rules = document.styleSheets[i].cssRules;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (!(rule instanceof CSSFontFaceRule)) continue;
            const ff = rule.style.getPropertyValue("font-family").replace(/["']/g, "");
            if (ff === tajawalFamily) {
              fontSrc = rule.style.getPropertyValue("src") || "";
              break;
            }
          }
        } catch {}
        if (fontSrc) break;
      }

      if (!fontSrc) {
        try {
          const res = await fetch("https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap");
          const css = await res.text();
          const m = css.match(/url\(([^)]+)\)/);
          if (m) fontSrc = `url(${m[1]})`;
        } catch {}
      }

      if (!fontSrc) return;

      const style = document.createElement("style");
      style.textContent = excalidrawFonts
        .map((name) => `@font-face{font-family:"${name}";src:${fontSrc};unicode-range:${arabicRange};font-display:swap}`)
        .join("");
      document.head.appendChild(style);
    };
    aliasArabicFonts();
  }, []);

  const isDark =
    appTheme === "dark" ||
    (appTheme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (!mounted) return <LoadingState />;

  const zoomPercent = Math.round(zoomValue * 100);

  return (
    <div className="drawmed-workspace overflow-hidden select-none">
      <div className="drawmed-orb drawmed-orb--1" aria-hidden />
      <div className="drawmed-orb drawmed-orb--2" aria-hidden />
      <div className="drawmed-orb drawmed-orb--3" aria-hidden />
      <div className="drawmed-grid-overlay" aria-hidden />

      <DrawMedHeader
        onToggleLeftMenu={() => setLeftMenuOpen(true)}
        onToggleLibrary={handleToggleLibrarySidebar}
        onOpenCommunityLibraries={() => setLibraryOpen(true)}
        onClearCanvas={handleNew}
      />

      <div className="relative flex-1 z-10 overflow-hidden">
        <AnimatePresence>
          {leftMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setLeftMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="drawmed-slide-menu absolute left-0 top-0 bottom-0 w-80 z-50 flex flex-col text-white overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/20">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white/90">Scene Settings</h3>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Canvas & File Options</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLeftMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition-all active:scale-95 border border-white/[0.05]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">File Operations</h4>
                    <button onClick={handleNew} className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                          <FilePlus className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/80 group-hover:text-white">New Whiteboard</p>
                          <p className="text-[9px] font-semibold text-white/30">Clear everything and start fresh</p>
                        </div>
                      </div>
                    </button>
                    <button onClick={handleLoad} className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                          <Upload className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/80 group-hover:text-white">Open File</p>
                          <p className="text-[9px] font-semibold text-white/30">Load .excalidraw JSON file</p>
                        </div>
                      </div>
                    </button>
                    <button onClick={handleSaveFile} className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                          <Download className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/80 group-hover:text-white">Save File</p>
                          <p className="text-[9px] font-semibold text-white/30">Download scene as JSON</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">Export</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { handleExport("png"); setLeftMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-105 transition-transform">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">PNG</span>
                      </button>
                      <button onClick={() => { handleExport("svg"); setLeftMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                          <FileImage className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">SVG</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">Canvas</h4>
                    <button onClick={handleToggleGrid} className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Grid className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/80 group-hover:text-white">Grid</p>
                          <p className="text-[9px] font-semibold text-white/30">Alignment grid overlay</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${gridEnabled ? "bg-primary/20 border-primary text-primary" : "bg-white/[0.02] border-white/[0.06] text-white/30"}`}>
                        {gridEnabled ? "ON" : "OFF"}
                      </span>
                    </button>
                    <button onClick={handleToggleViewMode} className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {viewModeEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/80 group-hover:text-white">View Only</p>
                          <p className="text-[9px] font-semibold text-white/30">Lock editing tools</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${viewModeEnabled ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-white/[0.02] border-white/[0.06] text-white/30"}`}>
                        {viewModeEnabled ? "Lock" : "Free"}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">Background</h4>
                    <div className="flex items-center justify-between gap-1 border border-white/[0.06] bg-white/[0.01] p-2 rounded-xl">
                      <div className="flex items-center gap-1.5 pl-1.5 text-white/40">
                        <Palette className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Presets</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleSetBgColor("#ffffff")} className="h-6 w-6 rounded-lg bg-white border border-white/20 active:scale-90 transition-transform shadow" title="White" />
                        <button onClick={() => handleSetBgColor("#f3f4f6")} className="h-6 w-6 rounded-lg bg-gray-100 border border-black/10 active:scale-90 transition-transform shadow" title="Light Gray" />
                        <button onClick={() => handleSetBgColor("#0d0c16")} className="h-6 w-6 rounded-lg bg-[#0d0c16] border border-white/10 active:scale-90 transition-transform shadow" title="Dark" />
                        <button onClick={() => handleSetBgColor("#05070f")} className="h-6 w-6 rounded-lg bg-[#05070f] border border-white/10 active:scale-90 transition-transform shadow" title="Cinema" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-white/[0.08] flex items-center justify-center">
                  <button onClick={() => { setLibraryOpen(true); setLeftMenuOpen(false); }} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 text-xs font-semibold text-white/60 hover:text-white hover:border-primary/40 hover:bg-primary/10 transition-all">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span>Browse Community Libraries</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 h-full w-full overflow-hidden">
          <Excalidraw
            excalidrawAPI={(api: ExcalidrawImperativeAPI) => { apiRef.current = api; setApiReady(true); }}
            initialData={initialData}
            onChange={onChange as any}
            theme={isDark ? "dark" : "light"}
            UIOptions={{ canvasActions: { toggleTheme: false } }}
            name="DrawMed"
          />
        </div>
      </div>

      <div className="drawmed-bottom-bar drawmed-glass drawmed-fade-in drawmed-fade-in--delay-1">
        <div className="drawmed-bottom-bar__group">
          <button className="drawmed-bottom-bar__btn" title="Zoom Out" onClick={handleZoomOut}>
            <ZoomOut />
          </button>
          <span className="drawmed-bottom-bar__zoom">{zoomPercent}%</span>
          <button className="drawmed-bottom-bar__btn" title="Zoom In" onClick={handleZoomIn}>
            <ZoomIn />
          </button>
        </div>
      </div>

      <div
        className={`drawmed-ai-assistant drawmed-glass drawmed-fade-in drawmed-fade-in--delay-2 ${!aiExpanded ? 'drawmed-ai-assistant--collapsed' : ''}`}
        onClick={!aiExpanded ? () => setAiExpanded(true) : undefined}
      >
        {aiExpanded ? (
          <>
            <div className="drawmed-ai-assistant__header">
              <div className="drawmed-ai-assistant__icon"><Bot /></div>
              <span className="drawmed-ai-assistant__label">AI Assistant</span>
              <button className="drawmed-topbar__btn" onClick={(e) => { e.stopPropagation(); setAiExpanded(false); }}>
                <X />
              </button>
            </div>
            {aiResponse && (
              <div className="drawmed-ai-assistant__response">
                {aiResponse}
              </div>
            )}
            {aiLoading && (
              <div className="drawmed-ai-assistant__loading">
                <span className="drawmed-ai-assistant__typing-dot" />
                <span className="drawmed-ai-assistant__typing-dot" />
                <span className="drawmed-ai-assistant__typing-dot" />
              </div>
            )}
            <div className="drawmed-ai-assistant__input">
              <input
                placeholder="Describe what you'd like to draw…"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSend();
                  }
                }}
                disabled={aiLoading}
              />
              {aiLoading ? (
                <button className="drawmed-ai-assistant__send" onClick={handleAiStop} title="Stop">
                  <StopCircle />
                </button>
              ) : (
                <button
                  className="drawmed-ai-assistant__send"
                  onClick={handleAiSend}
                  disabled={!aiMessage.trim()}
                >
                  <ArrowUp />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="drawmed-ai-assistant__icon" style={{ width: 24, height: 24 }}>
            <Bot />
          </div>
        )}
      </div>

      <DrawMedLibrary
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        excalidrawAPI={apiRef.current}
      />
    </div>
  );
}
