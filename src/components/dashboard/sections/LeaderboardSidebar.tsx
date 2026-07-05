"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";

interface LeaderboardUser {
  id: string;
  name: string;
  image: string | null;
  points: number;
  position: number;
}

export function LeaderboardSidebar() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    fetch("/api/mobile/leaderboard?limit=3")
      .then((res) => res.ok ? res.json() : { leaderboard: [] })
      .then((data) => setUsers(Array.isArray(data.leaderboard) ? data.leaderboard.slice(0, 3) : []))
      .catch(() => setUsers([]));
  }, []);

  if (users.length === 0) return null;

  const ringColors = [
    "ring-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.3)]",
    "ring-amber-600/60 shadow-[0_0_6px_rgba(217,119,6,0.2)]",
    "ring-gray-300 dark:ring-gray-500 shadow-[0_0_6px_rgba(156,163,175,0.2)]",
  ];

  return (
    <div>
      <SectionHeader icon={Trophy} title="Top Students" />
      <div className="flex gap-3 mt-2">
        {users.map((u, i) => (
          <Link
            key={u.id}
            href={`/profile/${u.id}`}
            className="flex flex-col items-center gap-1 shrink-0 flex-1 min-w-0"
          >
            <div className={cn(
              "h-10 w-10 rounded-full overflow-hidden bg-muted/30 border border-border/40 ring-2 shrink-0",
              ringColors[i]
            )}>
              {u.image ? (
                <img src={u.image} alt={u.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {u.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-[9px] font-medium text-muted-foreground/70 truncate max-w-16 text-center leading-tight">
              {u.name}
            </span>
            <span className={cn(
              "text-[8px] font-black",
              i === 0 && "text-yellow-600 dark:text-yellow-400",
              i === 1 && "text-amber-600/80 dark:text-amber-500/80",
              i === 2 && "text-gray-400 dark:text-gray-400",
            )}>
              #{u.position}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/leaderboard"
        className="text-[9px] font-medium text-muted-foreground/50 hover:text-primary transition-colors mt-1 inline-block"
      >
        View full leaderboard →
      </Link>
    </div>
  );
}
