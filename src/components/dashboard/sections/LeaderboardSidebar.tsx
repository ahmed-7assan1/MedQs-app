"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Medal, ArrowRight } from "lucide-react";
import { SidebarLabel } from "@/components/dashboard/shared/SidebarLabel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardUser {
  id: string;
  name: string;
  image: string | null;
  points: number;
  position: number;
}

const MEDAL_COLORS = [
  "text-amber-500 bg-amber-500/10 border-amber-500/20", // Gold
  "text-slate-400 bg-slate-400/10 border-slate-400/20", // Silver
  "text-amber-700 bg-amber-700/10 border-amber-700/20", // Bronze
];

export function LeaderboardSidebar() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/mobile/leaderboard?limit=3")
      .then((res) => res.ok ? res.json() : { leaderboard: [] })
      .then((data) => setUsers(Array.isArray(data.leaderboard) ? data.leaderboard.slice(0, 3) : []))
      .catch(() => setUsers([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SidebarLabel icon={Trophy} label="Top Students" />
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="space-y-3">
        <SidebarLabel icon={Trophy} label="Top Students" />
        <div className="p-4 rounded-xl border border-dashed border-border/40 bg-card/20 text-center">
          <p className="text-[11px] font-bold text-muted-foreground">No student activity logged yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SidebarLabel icon={Trophy} label="Top Students" />
      
      <div className="space-y-2">
        {users.map((u, i) => {
          const medalColor = MEDAL_COLORS[i] || "text-muted-foreground/50 bg-muted/10 border-border/30";
          const initial = u.name.charAt(0).toUpperCase();

          return (
            <Link
              key={u.id}
              href={`/profile/${u.id}`}
              className="group flex items-center justify-between p-2.5 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm hover:border-primary/20 hover:bg-card/65 transition-[transform,opacity,border-color,background-color] duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Ranking Position or Medal Badge */}
                <div className={`flex items-center justify-center w-6 h-6 rounded-lg border text-[10px] font-black shrink-0 ${medalColor}`}>
                  {u.position}
                </div>
                
                {/* Avatar */}
                <Avatar className="h-6 w-6 rounded-full shrink-0 border border-border/30">
                  {u.image ? (
                    <AvatarImage src={u.image} alt={u.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-[9px] font-black bg-primary/10 text-primary">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                
                <span className="text-xs font-bold text-foreground/80 truncate group-hover:text-primary transition-colors leading-none">
                  {u.name}
                </span>
              </div>
              
              <span className="text-[9px] font-black text-muted-foreground/50 shrink-0 tabular-nums">
                {u.points.toLocaleString()} <span className="text-[8px] font-bold uppercase">XP</span>
              </span>
            </Link>
          );
        })}
        
        <Link
          href="/leaderboard"
          className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground/45 hover:text-primary transition-all pt-1 pl-1"
        >
          View leaderboard <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
