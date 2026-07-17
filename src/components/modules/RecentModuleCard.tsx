"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useSyncExternalStore, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toggleSave, isSaved } from "@/lib/local-saved-store";
import type { ModuleWithStats } from "./ModulesGrid";

const CARD_ACCENTS = [
  { ring: "hover:ring-sky-500/30", dot: "bg-sky-500", text: "text-sky-500", bar: "bg-gradient-to-r from-sky-500 to-cyan-400" },
  { ring: "hover:ring-amber-500/30", dot: "bg-amber-500", text: "text-amber-500", bar: "bg-gradient-to-r from-amber-500 to-orange-400" },
  { ring: "hover:ring-emerald-500/30", dot: "bg-emerald-500", text: "text-emerald-500", bar: "bg-gradient-to-r from-emerald-500 to-teal-400" },
  { ring: "hover:ring-violet-500/30", dot: "bg-violet-500", text: "text-violet-500", bar: "bg-gradient-to-r from-violet-500 to-purple-400" },
];

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

interface RecentModuleCardProps {
  module: ModuleWithStats;
  index?: number;
}

export default function RecentModuleCard({ module, index = 0 }: RecentModuleCardProps) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
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
    <Link href={`/modules/${module.id}`} className="block group">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-4 transition-all duration-300",
          "bg-card/70 backdrop-blur-xl ring-1 ring-border/60 shadow-[var(--shadow-card)]",
          accent.ring,
          "hover:shadow-lg hover:-translate-y-0.5"
        )}
      >
        {module.imageUrl && (
          <img
            src={module.imageUrl}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute -right-4 top-1/2 h-[115%] w-auto -translate-y-1/2 object-contain opacity-[0.06] select-none"
          />
        )}

        <button
          onClick={handleBookmark}
          className={cn(
            "absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full backdrop-blur ring-1 transition hover:bg-muted/60",
            saved ? "bg-primary/10 ring-primary/30" : "bg-card ring-border/40"
          )}
        >
          <Bookmark className={cn("h-3 w-3", saved ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>

        <div className="relative z-10">
          <div className={cn("mb-2 h-1.5 w-1.5 rounded-full", accent.dot)} />

          <div className={cn("text-xl font-bold", accent.text)}>
            {getAbbreviation(module.name)}
          </div>
          <div className="mt-0.5 text-xs font-medium text-muted-foreground line-clamp-1">
            {module.name}
          </div>

          <div className="mt-5 flex items-center gap-2.5 text-[11px] font-medium text-muted-foreground">
            <span>{module.lecturesCount} Lectures</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{module.questionsCount} Questions</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-1000", accent.bar)}
                style={{ width: `${module.percentage}%` }}
              />
            </div>
            <span className={cn("text-[10px] font-bold", accent.text)}>{module.percentage}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
