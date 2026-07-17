"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Bookmark, Library, Trash2, ArrowLeft, FolderOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSaved, removeSave, isSaved } from "@/lib/local-saved-store";

interface SavedItem {
  id: string;
  type: "MODULE" | "SUBJECT" | "LECTURE";
  title: string;
  subtitle: string;
  lecturesCount?: number;
}

const tabMeta = {
  MODULE: { icon: Library, label: "Modules", color: "text-sky-500", bg: "bg-sky-500/10" },
  SUBJECT: { icon: FolderOpen, label: "Subjects", color: "text-amber-500", bg: "bg-amber-500/10" },
  LECTURE: { icon: FileText, label: "Lectures", color: "text-emerald-500", bg: "bg-emerald-500/10" },
} as const;

const GRADIENTS = [
  "from-sky-500/20 via-sky-400/5 to-transparent",
  "from-amber-500/20 via-amber-400/5 to-transparent",
  "from-emerald-500/20 via-emerald-400/5 to-transparent",
  "from-violet-500/20 via-violet-400/5 to-transparent",
  "from-rose-500/20 via-rose-400/5 to-transparent",
];

interface SavedViewProps {
  onBack: () => void;
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export default function SavedView({ onBack }: SavedViewProps) {
  const items = useSyncExternalStore(subscribe, () => getSaved() as SavedItem[], () => []);
  const [activeType, setActiveType] = useState<string | null>(null);

  const types = ["MODULE", "SUBJECT", "LECTURE"] as const;
  const filtered = activeType ? items.filter((i) => i.type === activeType) : items;
  const counts = {
    MODULE: items.filter((i) => i.type === "MODULE").length,
    SUBJECT: items.filter((i) => i.type === "SUBJECT").length,
    LECTURE: items.filter((i) => i.type === "LECTURE").length,
  };

  const handleUnsave = (item: SavedItem) => {
    removeSave(item.type, item.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Header ── */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background px-8 py-8 shadow-[var(--shadow-card)] ring-1 ring-border/60">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">
                <Bookmark className="h-4 w-4 text-primary" />
              </span>
              <h1 className="text-2xl font-black tracking-tight">Saved Items</h1>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"} saved for quick access
            </p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl bg-card px-4 py-2 text-xs font-semibold text-muted-foreground shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:bg-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Modules
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveType(null)}
          className={cn(
            "rounded-xl px-4 py-2 text-xs font-semibold transition ring-1",
            !activeType
              ? "bg-primary text-primary-foreground shadow-[var(--shadow-elevated)] ring-primary"
              : "bg-card text-muted-foreground ring-border/60 hover:bg-accent"
          )}
        >
          All ({items.length})
        </button>
        {types.map((t) => {
          const meta = tabMeta[t];
          const Icon = meta.icon;
          return (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ring-1",
                activeType === t
                  ? "bg-card text-foreground shadow-md ring-primary/40"
                  : "bg-card text-muted-foreground ring-border/60 hover:bg-accent"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", meta.color)} />
              {meta.label} ({counts[t]})
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/30 bg-card/20 py-24 text-center"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-card/40">
            <Bookmark className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No saved items yet</h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
            Bookmark modules, subjects, or lectures to find them quickly here.
          </p>
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition hover:opacity-90"
          >
            <BookOpen className="h-3.5 w-3.5" /> Explore Modules
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => {
              const meta = tabMeta[item.type];
              const Icon = meta.icon;
              const gradient = GRADIENTS[i % GRADIENTS.length];
              return (
                <motion.div
                  layout
                  key={`${item.type}-${item.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card/80 to-background p-5 shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className={`grid h-9 w-9 place-items-center rounded-xl ${meta.bg}`}>
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </div>
                      <button
                        onClick={() => handleUnsave(item)}
                        className="grid h-7 w-7 place-items-center rounded-lg bg-card/60 text-muted-foreground opacity-0 ring-1 ring-border/40 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <h3 className="mt-3 text-sm font-bold leading-snug text-foreground line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{item.subtitle}</p>
                    {item.type === "MODULE" && item.lecturesCount != null && (
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                        <FileText className="h-3 w-3" />
                        <span>{item.lecturesCount} lectures</span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wider", meta.color)}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
