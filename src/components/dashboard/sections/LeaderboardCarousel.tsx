"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LeaderboardUser {
  id: string;
  name: string;
  image: string | null;
  points: number;
  position: number;
}

const FALLBACK_GRADIENTS = [
  "from-blue-500/20 to-blue-600/20",
  "from-violet-500/20 to-violet-600/20",
  "from-emerald-500/20 to-emerald-600/20",
  "from-rose-500/20 to-rose-600/20",
  "from-amber-500/20 to-amber-600/20",
  "from-cyan-500/20 to-cyan-600/20",
];


const BORDER_COLORS = [
  "border-amber-500",
  "border-slate-400",
  "border-amber-700",
];

const BADGE_COLORS = [
  "bg-amber-500 text-white",
  "bg-slate-400 text-white",
  "bg-amber-700 text-white",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");
}

const MEDAL_STYLES = [
  "text-amber-500",
  "text-slate-300",
  "text-amber-700",
];

function UserCard({ user, index, isPodium = false }: { user: LeaderboardUser; index: number; isPodium?: boolean }) {
  const firstLetter = user.name.charAt(0).toUpperCase();
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const borderColor = BORDER_COLORS[index] ?? "dark:border-white/[0.05] border-slate-200";
  const badgeColor = BADGE_COLORS[index] ?? "bg-gray-900/70 text-white/80";
  const isMedal = index < 3;

  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
    >
      <div className={cn(
        "rounded-3xl border-2 p-1 group-hover:rotate-3 transition-all duration-500 overflow-hidden shadow-sm",
        isPodium
          ? "h-20 w-20 sm:h-24 sm:w-24 border-[3px] ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 group-hover:scale-105 group-hover:-rotate-2"
          : "sm:h-20 sm:w-20 h-16 w-16 group-hover:rotate-3",
        borderColor
      )}>
        <div className="relative h-full w-full rounded-2xl overflow-hidden dark:bg-[#1a1a1a] bg-slate-100">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={cn("h-full w-full flex items-center justify-center bg-gradient-to-br", gradient)}>
              <span className={cn("font-black text-foreground/80", isPodium ? "text-xl" : "text-lg")}>{firstLetter}</span>
            </div>
          )}
          {isMedal ? (
            <span className={cn(
              "absolute bottom-0 right-0 px-1.5 py-0.5 text-[9px] font-black leading-none rounded-tl-lg rounded-br-[11px]",
              badgeColor,
              index === 0 && "shadow-lg shadow-amber-500/50 ring-1 ring-amber-400/30",
              index === 1 && "shadow-lg shadow-slate-300/40 ring-1 ring-slate-300/20",
              index === 2 && "shadow-lg shadow-amber-700/40 ring-1 ring-amber-700/20",
            )}>
              #{user.position}
            </span>
          ) : (
            <span className={cn(
              "absolute bottom-0 right-0 px-1.5 py-0.5 text-[9px] font-black leading-none rounded-tl-lg rounded-br-[11px]",
              badgeColor
            )}>
              #{user.position}
            </span>
          )}
        </div>
      </div>

      <span className="text-[10px] font-black uppercase tracking-widest dark:text-white/30 text-slate-400 group-hover:text-primary transition-colors text-center px-1 truncate max-w-[90px]">
        {user.name}
      </span>

      <span className="text-[9px] font-bold text-muted-foreground -mt-0.5">
        {user.points.toLocaleString()} XP
      </span>
    </Link>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-4 w-4 rounded bg-muted/40" />
        <div className="h-3 w-20 rounded bg-muted/40" />
      </div>
      <div className="flex items-center gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="sm:h-20 sm:w-20 h-16 w-16 rounded-3xl bg-muted/20" />
            <div className="h-2.5 w-16 rounded bg-muted/30" />
            <div className="h-2 w-12 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export const LeaderboardCarousel = memo(function LeaderboardCarousel() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ position: number; points: number; name: string; image: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mobile/leaderboard?limit=8")
      .then((res) => res.ok ? res.json() : { leaderboard: [], currentUser: null })
      .then((data) => {
        setUsers(Array.isArray(data.leaderboard) ? data.leaderboard : []);
        setCurrentUser(data.currentUser ?? null);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LeaderboardSkeleton />;

  return (
    <div>
      {/* Section Header — Apple-style */}
      <div className="flex justify-center mb-7">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-primary leading-none">Top Learners</span>
        </div>
      </div>

      {!users.length ? (
        <Button variant="outline" asChild className="w-full p-0 h-auto rounded-xl border-dashed bg-card/30 hover:bg-card/50">
          <Link href="/leaderboard" className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-bold text-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground">Complete quizzes and tasks to earn XP and climb the ranks</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Button>
      ) : (
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2 pl-5">
          {users.map((user, idx) => (
            <UserCard key={user.id} user={user} index={idx} isPodium={idx === 0} />
          ))}

          {/* Your rank card — if outside top 4 */}
          {currentUser && currentUser.position > 4 && users.length >= 4 && (
            <Link href="/leaderboard" className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer">
              <div className="h-16 w-16 rounded-3xl border-2 border-dashed border-primary/30 p-1 group-hover:scale-105 transition-all duration-500">
                <div className="relative h-full w-full rounded-2xl overflow-hidden dark:bg-[#1a1a1a] bg-slate-100 flex items-center justify-center">
                  <span className="text-xs font-black text-primary">#{currentUser.position}</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary group-hover:text-primary/80 transition-colors text-center">You</span>
              <span className="text-[9px] font-bold text-muted-foreground -mt-0.5">{Math.max(0, users[3].points - currentUser.points)} XP to top 4</span>
            </Link>
          )}

          {/* See all CTA */}
          <Link href="/leaderboard" className="flex flex-col items-center justify-center gap-1 shrink-0 group cursor-pointer">
            <div className="h-16 w-16 rounded-3xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center group-hover:border-primary/40 transition-all duration-500">
              <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 group-hover:text-primary transition-colors text-center">See all</span>
          </Link>
        </div>
      )}
    </div>
  );
});
