"use client";

import { useEffect, useState } from "react";
import { Brain, TrendingUp, BarChart3 } from "lucide-react";

interface QuizStat {
  paperId: string; paperName: string; totalAttempts: number;
  questionsCount: number; totalParticipants: number;
  avgScore: number; passRate: number;
}

export default function QuizAnalyticsPage() {
  const [data, setData] = useState<QuizStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ totalAttempts: 0, totalParticipants: 0, overallAvgScore: 0, overallPassRate: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/platform/quiz-analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json.data ?? []);
      setSummary(json.summary ?? { totalAttempts: 0, totalParticipants: 0, overallAvgScore: 0, overallPassRate: 0 });
    } catch (err) {
      setError("Failed to load quiz analytics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Quiz Analytics</h1>
      </div>

      {error ? (
        <div className="flex h-32 items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <Brain className="mb-1.5 h-5 w-5 text-blue-500" />
              <p className="font-display text-2xl font-bold">{loading ? "..." : summary.totalAttempts.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total Attempts</p>
            </div>
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <BarChart3 className="mb-1.5 h-5 w-5 text-violet-500" />
              <p className="font-display text-2xl font-bold">{loading ? "..." : summary.totalParticipants.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Participants</p>
            </div>
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <TrendingUp className="mb-1.5 h-5 w-5 text-emerald-500" />
              <p className="font-display text-2xl font-bold">{loading ? "..." : `${Math.round(summary.overallAvgScore)}%`}</p>
              <p className="text-[10px] text-muted-foreground">Avg Score</p>
            </div>
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <Brain className="mb-1.5 h-5 w-5 text-amber-500" />
              <p className="font-display text-2xl font-bold">{loading ? "..." : `${Math.round(summary.overallPassRate)}%`}</p>
              <p className="text-[10px] text-muted-foreground">Pass Rate</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
            <div className="border-b border-white/[0.02] bg-muted/20 px-5 py-3">
              <p className="font-semibold">Quiz Paper Performance</p>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No quiz data available</div>
            ) : (
              <div className="divide-y divide-border/40">
                {data.map((q) => (
                  <div key={q.paperId} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/20">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                      <Brain className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{q.paperName}</p>
                      <p className="text-[10px] text-muted-foreground">{q.totalAttempts} attempts · {q.totalParticipants} participants</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold">{Math.round(q.avgScore)}%</p>
                      <p className="text-muted-foreground">{Math.round(q.passRate)}% pass</p>
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
