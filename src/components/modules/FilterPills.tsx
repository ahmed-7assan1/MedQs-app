"use client";


import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = [
  "All Modules",
  "In Progress",
  "Completed",
  "Basic Sciences",
  "Clinical Sciences",
  "Electives",
] as const;

export type FilterValue = (typeof FILTERS)[number];

interface FilterPillsProps {
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
}

export default function FilterPills({ activeFilter, onFilterChange }: FilterPillsProps) {
  return (
    <section className="flex flex-wrap items-center gap-2">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onFilterChange(f)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium transition",
            f === activeFilter
              ? "bg-accent text-accent-foreground ring-1 ring-primary/30"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {f}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs ring-1 ring-border/60">
          <span className="text-muted-foreground">Sort by</span>
          <span className="font-medium">Latest</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-card ring-1 ring-border/60 transition hover:bg-accent">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
