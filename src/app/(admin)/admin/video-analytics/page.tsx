"use client";

import { useEffect, useState } from "react";
import { Film, Eye, Clock, TrendingUp, Users } from "lucide-react";

interface VideoStat {
  id: string; title: string; slug: string; duration?: number | null;
  views: number; uniqueViewers: number; totalWatchTime: number; avgWatchTime: number;
}

export default function VideoAnalyticsPage() {
  const [videos, setVideos] = useState<VideoStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ totalVideos: 0, totalViews: 0, totalWatchTime: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/platform/video-analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setVideos(json.data ?? []);
      setSummary(json.summary ?? { totalVideos: 0, totalViews: 0, totalWatchTime: 0 });
    } catch (err) {
      setError("Failed to load video analytics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Video Analytics</h1>
      </div>

      {error ? (
        <div className="flex h-32 items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <Film className="mb-1.5 h-5 w-5 text-blue-500" />
              <p className="font-display text-2xl font-bold">{loading ? "..." : summary.totalVideos}</p>
              <p className="text-[10px] text-muted-foreground">Total Videos</p>
            </div>
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <Eye className="mb-1.5 h-5 w-5 text-violet-500" />
              <p className="font-display text-2xl font-bold">{loading ? "..." : summary.totalViews.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total Views</p>
            </div>
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <TrendingUp className="mb-1.5 h-5 w-5 text-emerald-500" />
              <p className="font-display text-lg font-bold">{loading ? "..." : summary.totalWatchTime.toLocaleString()}s</p>
              <p className="text-[10px] text-muted-foreground">Total Watch Time</p>
            </div>
            <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
              <Clock className="mb-1.5 h-5 w-5 text-amber-500" />
              <p className="font-display text-lg font-bold">{loading ? "..." : videos.length > 0 ? `${Math.round(summary.totalWatchTime / summary.totalViews)}s` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">Avg Watch Time</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
            <div className="border-b border-white/[0.02] bg-muted/20 px-5 py-3">
              <p className="font-semibold">Video Performance</p>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : videos.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No videos tracked yet</div>
            ) : (
              <div className="divide-y divide-border/40">
                {videos.map((v) => (
                  <div key={v.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/20">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                      <Film className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{v.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{v.slug}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span title="Views"><Eye className="mr-0.5 inline h-3 w-3" />{v.views}</span>
                      <span title="Unique Viewers"><Users className="mr-0.5 inline h-3 w-3" />{v.uniqueViewers}</span>
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
