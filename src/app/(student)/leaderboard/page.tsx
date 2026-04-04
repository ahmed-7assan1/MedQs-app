"use client";
import { useState, useEffect } from "react";
import { Trophy, Globe, Users, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string; name: string; nickname?: string;
  image?: string; points: number;
  rank?: { label: string; badge?: string } | null;
  semester?: { name: string } | null;
}

const RANK_COLORS: Record<string, string> = {
  Newbie:       "text-gray-500",
  Active:       "text-blue-500",
  Contributor:  "text-violet-500",
  Expert:       "text-amber-500",
  Elite:        "text-red-500",
};

const MEDAL = ["🥇","🥈","🥉"];

export default function LeaderboardPage() {
  const [scope, setScope] = useState<"global" | "semester">("global");
  const [data, setData] = useState<{ users: LeaderboardUser[]; disabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/leaderboard?scope=${scope}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [scope]);

  if (!loading && data?.disabled) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-display text-xl font-semibold">Leaderboard disabled</p>
        <p className="text-sm text-muted-foreground">The leaderboard has been turned off by your admin.</p>
      </div>
    );
  }

  const users = data?.users ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30 mb-3">
          <Trophy className="h-7 w-7 text-amber-500" />
        </div>
        <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Top students by points earned</p>
      </div>

      {/* Scope toggle */}
      <div className="mb-6 flex justify-center">
        <div className="flex rounded-xl border border-border bg-card p-1 gap-1">
          <button onClick={() => setScope("global")}
            className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              scope === "global" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Globe className="h-4 w-4" /> Global
          </button>
          <button onClick={() => setScope("semester")}
            className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              scope === "semester" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <Users className="h-4 w-4" /> My Semester
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Podium top 3 */}
          {users.length >= 3 && (
            <div className="mb-6 flex items-end justify-center gap-4">
              {[users[1], users[0], users[2]].map((u, podiumIdx) => {
                const realRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                const heights = ["h-24", "h-32", "h-20"];
                const displayName = u.nickname || u.name;
                return (
                  <Link key={u.id} href={`/profile/u/${u.id}`}
                    className={cn("flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5", heights[podiumIdx])}>
                    <span className="text-xl">{MEDAL[realRank - 1]}</span>
                    {u.image
                      ? <img src={u.image} alt={displayName} className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
                      : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{displayName[0]}</div>
                    }
                    <p className="text-xs font-semibold truncate max-w-[80px] text-center">{displayName}</p>
                    <p className="text-[10px] font-bold text-primary">{u.points.toLocaleString()} pts</p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div className="space-y-2">
            {users.map((u, i) => {
              const rankLabel = u.rank?.label ?? "Newbie";
              const displayName = u.nickname || u.name;
              return (
                <Link key={u.id} href={`/profile/u/${u.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/30 hover:bg-muted/30 transition-all">
                  <span className="w-6 text-sm font-bold text-center text-muted-foreground">
                    {i < 3 ? MEDAL[i] : i + 1}
                  </span>
                  {u.image
                    ? <img src={u.image} alt={displayName} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                    : <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{displayName[0]}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className={cn("text-xs font-medium", RANK_COLORS[rankLabel])}>
                      {u.rank?.badge} {rankLabel}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-primary flex-shrink-0">{u.points.toLocaleString()}</p>
                </Link>
              );
            })}
            {users.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Trophy className="mb-3 h-10 w-10 text-muted-foreground opacity-25" />
                <p className="text-sm text-muted-foreground">No students on the leaderboard yet</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
