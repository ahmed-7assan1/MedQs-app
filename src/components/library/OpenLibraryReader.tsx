"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, ArrowUpFromLine, BookOpen, ChevronLeft, ChevronRight,
  Expand, Minimize, Moon, Sun, Search, ZoomIn, ZoomOut, Loader2, Info,
  BookMarked, RefreshCw
} from "lucide-react";

interface ReaderProps {
  iaId: string;
  bookKey: string;
  title: string;
}

interface IAMetadata {
  imagecount: number;
  title?: string;
}

const STORAGE_KEY_PREFIX = "medqs-reader-";
const ZOOM_LEVELS = [25, 33, 50, 67, 75, 90, 100, 125, 150, 175, 200];

type ThemeMode = "light" | "sepia" | "dark";

const IA_BASE = "https://archive.org/download";

export function OpenLibraryReader({ iaId, bookKey, title }: ReaderProps) {
  const router = useRouter();

  const [metadata, setMetadata] = useState<IAMetadata | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(100);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [fullscreen, setFullscreen] = useState(false);
  const [jumpInput, setJumpInput] = useState("");
  const [showJump, setShowJump] = useState(false);
  const [preloaded, setPreloaded] = useState<Set<number>>(new Set());
  const [imageLoaded, setImageLoaded] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const jumpInputRef = useRef<HTMLInputElement>(null);

  const progressKey = `${STORAGE_KEY_PREFIX}${iaId || bookKey}`;

  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch(`https://archive.org/metadata/${iaId}.json`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error("Failed to load book metadata");
        const data = await res.json();
        const count = data?.metadata?.imagecount || data?.item?.imagecount || 0;
        if (count === 0) throw new Error("No readable pages found");
        setMetadata(data.metadata);
        setTotalPages(count);

        const saved = localStorage.getItem(progressKey);
        if (saved) {
          const p = parseInt(saved, 10);
          if (p >= 1 && p <= count) setPage(p);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load book");
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, [iaId, progressKey]);

  useEffect(() => {
    if (totalPages > 0) {
      localStorage.setItem(progressKey, page.toString());
    }
  }, [page, totalPages, progressKey]);

  useEffect(() => {
    if (!totalPages) return;
    const toPreload = [page - 2, page - 1, page + 1, page + 2, page + 3].filter(
      (p) => p >= 1 && p <= totalPages && !preloaded.has(p)
    );
    if (toPreload.length === 0) return;
    const next = new Set(preloaded);
    toPreload.forEach((p) => next.add(p));
    setPreloaded(next);

    toPreload.forEach((p) => {
      const img = new Image();
      img.src = `${IA_BASE}/${iaId}/page/n${p - 1}.jpg`;
    });
  }, [page, totalPages, preloaded, iaId]);

  function handlePageImgLoaded(p: number) {
    setImageLoaded((prev) => new Set(prev).add(p));
  }

  const goTo = useCallback((p: number) => {
    if (p < 1) setPage(1);
    else if (p > totalPages) setPage(totalPages);
    else setPage(p);
    setImageLoaded((prev) => {
      const next = new Set(prev);
      next.delete(p);
      return next;
    });
  }, [totalPages]);

  function handlePrev() { goTo(page - 1); }
  function handleNext() { goTo(page + 1); }

  function handleZoomIn() {
    setZoom((z) => {
      const idx = ZOOM_LEVELS.findIndex((l) => l > z);
      return idx >= 0 ? ZOOM_LEVELS[idx] : z;
    });
  }

  function handleZoomOut() {
    setZoom((z) => {
      const idx = [...ZOOM_LEVELS].reverse().findIndex((l) => l < z);
      return idx >= 0 ? ZOOM_LEVELS[ZOOM_LEVELS.length - 1 - idx] : z;
    });
  }

  function handleZoomFit() {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth - 64;
    const fitZoom = Math.round((cw / 800) * 100);
    const closest = ZOOM_LEVELS.reduce((a, b) =>
      Math.abs(b - fitZoom) < Math.abs(a - fitZoom) ? b : a
    );
    setZoom(closest);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "sepia" : t === "sepia" ? "dark" : "light"));
  }

  function handleJumpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (p >= 1 && p <= totalPages) {
      goTo(p);
      setShowJump(false);
      setJumpInput("");
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); handlePrev(); }
      else if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); handleNext(); }
      else if (e.key === "f" || e.key === "F") { toggleFullscreen(); }
      else if (e.key === "+" || e.key === "=") { handleZoomIn(); }
      else if (e.key === "-") { handleZoomOut(); }
      else if (e.key === "0") { setZoom(100); }
      else if (e.key === "g") { setShowJump((s) => !s); }
      else if (e.key === "t" || e.key === "T") { toggleTheme(); }
      else if (e.key === "Escape" && !fullscreen) { router.back(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, totalPages, fullscreen]);

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (showJump && jumpInputRef.current) jumpInputRef.current.focus();
  }, [showJump]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-muted-foreground">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="text-sm font-medium">Loading book...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-muted-foreground px-4">
        <BookOpen size={48} className="mb-4 opacity-30" />
        <p className="text-sm font-medium text-red-500 mb-2">{error}</p>
        <p className="text-xs opacity-60 mb-6">This book may not be available for direct reading</p>
        <a
          href={`https://openlibrary.org${bookKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <ExternalLinkIcon size={16} />
          View on Open Library
        </a>
        <button
          onClick={() => router.back()}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground underline"
        >
          Back to search
        </button>
      </div>
    );
  }

  const pageUrl = `${IA_BASE}/${iaId}/page/n${page - 1}.jpg`;

  const themeStyles: Record<string, string> = {
    light: "bg-[#f5f0eb] text-gray-900",
    sepia: "bg-[#f4ecd8] text-[#5c3e1f]",
    dark: "bg-[#0a0a0a] text-gray-200",
  };

  const controlTheme = theme === "dark"
    ? "bg-gray-900/95 border-gray-800 text-gray-200"
    : "bg-white/95 border-gray-200 text-gray-900";

  const progressPct = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${themeStyles[theme]} transition-colors duration-300`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 h-12 border-b ${theme === "dark" ? "border-gray-800 bg-gray-900/90" : "border-gray-200 bg-white/90"} backdrop-blur-md flex-shrink-0 z-10`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold truncate max-w-[200px] md:max-w-md">
            {metadata?.title || title || "Book Reader"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label={`Switch to ${theme === "light" ? "sepia" : theme === "sepia" ? "dark" : "light"} mode`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => router.push(`/medical-books?ia=${iaId}`)}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Book info"
          >
            <Info size={16} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize size={16} /> : <Expand size={16} />}
          </button>
        </div>
      </div>

      {/* Reader area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-auto relative select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleNext();
        }}
      >
        {totalPages > 0 && (
          <>
            {/* Previous page button */}
            <button
              onClick={handlePrev}
              disabled={page <= 1}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white disabled:opacity-20 transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Image */}
            <div
              className="flex items-center justify-center min-h-0 px-16 py-4"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <img
                ref={imgRef}
                src={pageUrl}
                alt={`Page ${page}`}
                onLoad={() => handlePageImgLoaded(page)}
                onError={() => setImageLoaded((prev) => {
                  const next = new Set(prev);
                  next.delete(page);
                  return next;
                })}
                className={`max-w-full max-h-[calc(100vh-10rem)] object-contain rounded-sm shadow-2xl transition-opacity duration-300 ${imageLoaded.has(page) ? "opacity-100" : "opacity-0"}`}
                draggable={false}
              />
              {!imageLoaded.has(page) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Next page button */}
            <button
              onClick={handleNext}
              disabled={page >= totalPages}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white disabled:opacity-20 transition-all"
              aria-label="Next page"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Bottom controls */}
      <div className={`flex-shrink-0 border-t ${theme === "dark" ? "border-gray-800 bg-gray-900/90" : "border-gray-200 bg-white/90"} backdrop-blur-md`}>
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-4 h-12 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            {showJump ? (
              <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
                <input
                  ref={jumpInputRef}
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowJump(false), 200)}
                  className="w-16 h-7 px-1.5 text-xs text-center rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">/ {totalPages}</span>
              </form>
            ) : (
              <button
                onClick={() => setShowJump(true)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap"
              >
                Page <span className="font-bold text-foreground">{page}</span> of {totalPages}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= ZOOM_LEVELS[0]}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleZoomFit}
              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[40px] text-center"
              title="Fit to width"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExternalLinkIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
