"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { useSyncExternalStore, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toggleSave, isSaved } from "@/lib/local-saved-store";
import type { ModuleWithStats } from "./ModulesGrid";

export interface ModuleStyle {
  progressText: string;
  bar: string;
}

function getAbbreviation(name: string): string {
  const abbreviation = name
    .split(" ")
    .filter((w) => w.length > 2 && w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .join("")
    .slice(0, 4);
  return abbreviation || name.slice(0, 3).toUpperCase();
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

interface ModuleCardProps {
  module: ModuleWithStats;
  moduleStyle: ModuleStyle;
  index: number;
  isGuest: boolean;
}

export default function ModuleCard({ module, moduleStyle, index, isGuest }: ModuleCardProps) {
  const getSnapshot = useCallback(() => isSaved("MODULE", module.id), [module.id]);
  const saved = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave({
      type: "MODULE",
      id: module.id,
      title: module.name,
      subtitle: `${module.lecturesCount} lectures · ${module.questionsCount} questions`,
      lecturesCount: module.lecturesCount,
    });
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
    >
      <Link
        href={isGuest ? "/login" : `/modules/${module.id}`}
        className="block group"
      >
        <div className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]">
          {module.imageUrl && (
            <img
              src={module.imageUrl}
              alt=""
              loading="lazy"
              className="pointer-events-none absolute right-0 top-0 h-full w-1/2 object-cover opacity-80 transition duration-500 group-hover:scale-105"
              style={{
                maskImage: "linear-gradient(to left, black 30%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to left, black 30%, transparent 100%)",
              }}
            />
          )}
          {/* Bookmark button */}
          <button
            onClick={handleBookmark}
            className={cn(
              "absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-lg ring-1 backdrop-blur-sm transition hover:bg-muted/50",
              saved ? "bg-primary/10 ring-primary/30 text-primary" : "bg-card/60 ring-border/40 text-muted-foreground"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
          </button>

          <div className="relative">
            <div className={cn("text-xl font-bold", moduleStyle.progressText)}>
              {getAbbreviation(module.name)}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{module.name}</div>
            <div className="mt-8 text-[11px] text-muted-foreground">
              {module.lecturesCount} Lectures &nbsp;·&nbsp; {module.questionsCount} Questions
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000", moduleStyle.bar)}
                  style={{ width: `${module.percentage}%` }}
                />
              </div>
              <span className={cn("text-[11px] font-semibold", moduleStyle.progressText)}>
                {module.percentage}%
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
