"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, BookMarked, Package, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw";

const LIBRARIES_JSON =
  "https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries.json";

const RAW_BASE =
  "https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries/";

interface LibraryMeta {
  name: string;
  description: string;
  authors: { name: string; url?: string }[];
  source: string;
  preview: string;
  created: string;
  updated: string;
  version: number;
  id: string;
  itemNames?: string[];
}

interface DrawMedLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export function DrawMedLibrary({
  isOpen,
  onClose,
  excalidrawAPI,
}: DrawMedLibraryProps) {
  const [libraries, setLibraries] = useState<LibraryMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen || loaded) return;
    setLoading(true);
    setError(null);
    fetch(LIBRARIES_JSON)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch libraries");
        return r.json();
      })
      .then((data: LibraryMeta[]) => {
        // Remove any excalidraw-libraries help or template files, keep only actual useful shape packages
        setLibraries(data);
        setLoaded(true);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen, loaded]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const filtered = libraries.filter(
    (lib) =>
      lib.name.toLowerCase().includes(search.toLowerCase()) ||
      lib.description.toLowerCase().includes(search.toLowerCase()) ||
      lib.authors.some((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  const handleImport = useCallback(
    async (lib: LibraryMeta) => {
      if (!excalidrawAPI) return;
      setImporting(lib.id);
      try {
        const url = `${RAW_BASE}${lib.source}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch library data");
        const text = await res.text();

        const { loadLibraryFromBlob } = await import("@/vendor/excalidraw/index");
        const blob = new Blob([text], { type: "application/json" });
        const items = await loadLibraryFromBlob(blob);

        if (items.length > 0) {
          excalidrawAPI.updateLibrary({ libraryItems: items, openLibraryMenu: true });
          
          // Close our community browser modal automatically for smooth workflow
          onClose();
        }
      } catch (e) {
        console.error("Import failed", e);
      } finally {
        setImporting(null);
      }
    },
    [excalidrawAPI, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-6xl rounded-[2rem] border border-white/[0.08] bg-[#0d0c16]/85 backdrop-blur-3xl shadow-[0_32px_128px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Background Accent Glow */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                    Library Browser
                  </h2>
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none mt-0.5">
                    Browse & Import Community Shapes
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 border border-white/[0.05] hover:bg-white/5 hover:text-white transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative border-b border-white/[0.08] px-6 py-4 bg-white/[0.01]">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 100+ medical, science & design libraries..."
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-primary/45 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(79,95,255,0.15)] transition-all"
                />
              </div>
            </div>

            {/* Content List */}
            <div className="relative flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest animate-pulse">
                    Connecting to repositories...
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-24">
                  <div className="max-w-md text-center p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
                    <p className="text-sm font-semibold text-red-400">Failed to fetch libraries</p>
                    <p className="text-xs text-white/40 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-2">
                  <Package className="h-10 w-10 text-white/10" />
                  <p className="text-sm font-bold text-white/30 uppercase tracking-wider">
                    No library matches found
                  </p>
                </div>
              )}

              {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((lib) => (
                    <LibraryCard
                      key={lib.id}
                      lib={lib}
                      importing={importing === lib.id}
                      onImport={() => handleImport(lib)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LibraryCard({
  lib,
  importing,
  onImport,
}: {
  lib: LibraryMeta;
  importing: boolean;
  onImport: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const previewUrl = `${RAW_BASE}${lib.preview}`;
  const itemCount = lib.itemNames?.length;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden",
        "hover:border-primary/30 hover:bg-white/[0.05] hover:shadow-[0_8px_24px_rgba(79,95,255,0.06)] transition-all duration-300"
      )}
    >
      {/* Preview Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.03] border-b border-white/[0.05]">
        {!imgError ? (
          <img
            src={previewUrl}
            alt={lib.name}
            className="h-full w-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-white/10" />
          </div>
        )}
        {itemCount && (
          <div className="absolute top-2 right-2 rounded-lg bg-[#0d0c16]/80 px-2 py-0.5 text-[9px] font-black text-primary border border-primary/20 backdrop-blur-sm uppercase tracking-wider">
            {itemCount} Shapes
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c16]/90 via-transparent to-transparent" />
      </div>

      {/* Info details */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <h3 className="text-xs font-black text-white/80 group-hover:text-white transition-colors leading-tight line-clamp-1 uppercase tracking-wider">
          {lib.name}
        </h3>
        {lib.authors.length > 0 && (
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none">
            by {lib.authors.map((a) => a.name).join(", ")}
          </p>
        )}
        <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mt-1">
          {lib.description}
        </p>
      </div>

      {/* Import actions button */}
      <div className="px-4 pb-4">
        <button
          onClick={onImport}
          disabled={importing}
          className={cn(
            "w-full rounded-xl py-2 text-[10px] font-black uppercase tracking-wider transition-all",
            "border border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:border-primary/45 hover:bg-primary/10",
            importing && "opacity-50 pointer-events-none bg-primary/10"
          )}
        >
          {importing ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Importing Shapes...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-accent" />
              Add to Whiteboard
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
