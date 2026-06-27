"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  userId: string; name: string; email: string; image?: string;
  totalPoints: number;
  quizScore: number; videoScore: number; pointsScore: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [summary, setSummary] = useState({ totalUsers: 0, avgPoints: 0, topScore: 0 });

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (dateFilter !== "all") params.set("days", dateFilter);
      const res = await fetch(`/api/v1/admin/platform/leaderboard?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setEntries(json.data ?? []);
      setSummary(json.summary ?? { totalUsers: 0, avgPoints: 0, topScore: 0 });
    } catch (err) {
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Leaderboard</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "All Time", value: "all" },
          { label: "7 Days", value: "7" },
          { label: "30 Days", value: "30" },
        ].map((o) => (
          <button key={o.value} onClick={() => setDateFilter(o.value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              dateFilter === o.value ? "bg-blue-500/20 text-blue-500" : "bg-card text-muted-foreground hover:bg-muted/40"
            }`}>{o.label}</button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{summary.totalUsers} users</span>
      </div>

      {error ? (
        <div className="flex h-48 items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <Trophy className="mb-1.5 h-5 w-5 text-yellow-500" />
              <p className="font-display text-lg font-bold">{loading ? "..." : summary.topScore.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Top Score</p>
            </div>
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <TrendingUp className="mb-1.5 h-5 w-5 text-blue-500" />
              <p className="font-display text-lg font-bold">{loading ? "..." : Math.round(summary.avgPoints).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Avg Points</p>
            </div>
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <Medal className="mb-1.5 h-5 w-5 text-emerald-500" />
              <p className="font-display text-lg font-bold">{loading ? "..." : entries.length}</p>
              <p className="text-[10px] text-muted-foreground">Ranked Users</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                <Trophy className="h-8 w-8" />
                <p className="text-sm">No leaderboard data</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {entries.map((e) => (
                  <div key={e.userId} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20">
                    <div className="flex w-8 items-center justify-center">
                      {rankIcon(e.rank) ?? <span className="text-xs text-muted-foreground">#{e.rank}</span>}
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-xs font-bold text-blue-500">
                      {e.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{e.name}</p>
                      <p className="text-[10px] text-muted-foreground">{e.email}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold">{e.totalPoints.toLocaleString()}</p>
                      <p className="text-muted-foreground">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
