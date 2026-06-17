// src/components/community-mobile/TopBar.tsx
"use client";

import type { Forum, FeedFilter } from "./types";
import { useCommunityStore } from "./store";
import FilterPills from "./FilterPills";

interface TopBarProps {
  forums: Forum[];
  activeFilter?: FeedFilter;
  onFilterChange?: (filter: FeedFilter) => void;
}

export default function TopBar({ forums, activeFilter, onFilterChange }: TopBarProps) {
  const activeForumId = useCommunityStore((s) => s.activeForumId);
  const setActiveForum = useCommunityStore((s) => s.setActiveForum);

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      {/* Forum tabs */}
      <div className="flex items-center gap-1 px-4 pb-1 pt-2">
        {forums.map((forum) => {
          const isActive = forum.id === activeForumId;
          return (
            <button
              key={forum.id}
              type="button"
              onClick={() => setActiveForum(forum.id)}
              className={`relative flex-1 rounded-xl py-2 text-center text-xs font-medium transition-colors duration-200 ${
                isActive ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              {forumTypeLabel(forum.type)}
              {Boolean(forum.unreadCount) && (
                <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter pills */}
      {activeFilter !== undefined && onFilterChange && (
        <FilterPills active={activeFilter} onChange={onFilterChange} />
      )}
    </div>
  );
}

function forumTypeLabel(type: Forum["type"]): string {
  switch (type) {
    case "GLOBAL":
      return "Global";
    case "SEMESTER":
      return "Semester";
    case "PRIVATE":
      return "Private";
    default:
      return type;
  }
}
