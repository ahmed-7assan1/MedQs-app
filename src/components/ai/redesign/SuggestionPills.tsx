"use client";

import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Summarize last lecture",
  "Quiz me on CNS",
  "Explain a concept",
  "Mnemonic for cranial nerves",
];

export function SuggestionPills({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 px-4 scrollbar-hide no-scrollbar">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full border border-drq-primary/30 bg-drq-primary/10 text-[12px] font-bold text-drq-purple-light",
            "hover:bg-drq-primary/20 hover:border-drq-primary/50 transition-all active:scale-95"
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
