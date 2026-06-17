// src/components/community-mobile/FilterPills.tsx
"use client";

import { motion } from "framer-motion";
import type { FeedFilter } from "./types";

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "trending", label: "Trending" },
  { id: "media", label: "Media" },
  { id: "pinned", label: "Pinned" },
];

interface FilterPillsProps {
  active: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}

export default function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5">
      {FILTERS.map((filter) => {
        const isActive = filter.id === active;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className="relative flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200"
          >
            {isActive && (
              <motion.span
                layoutId="filter-pill-bg"
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="absolute inset-0 rounded-full bg-primary"
              />
            )}
            <span className={`relative ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}>
              {filter.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
