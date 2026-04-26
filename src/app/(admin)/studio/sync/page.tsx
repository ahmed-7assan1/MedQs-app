"use client";

import { useState, useEffect } from "react";
import { 
  Youtube, 
  ArrowRightLeft, 
  PlayCircle, 
  History, 
  Settings2, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  ExternalLink,
  Trash2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncTask {
  id: string;
  sourceUrl: string;
  targetPlaylistId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  createdAt: string;
  totalVideos: number;
  syncedVideos: number;
}

export default function YouTubeSyncPage() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [targetId, setTargetId] = useState("");
  const [tasks, setTasks] = useState<SyncTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoQueueLoading, setAutoQueueLoading] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/admin/youtube-sync");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/youtube-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl, targetPlaylistId: targetId }),
      });
      
      if (res.ok) {
        setSourceUrl("");
        setTargetId("");
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to create task", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoQueue = async () => {
    setAutoQueueLoading(true);
    try {
      const res = await fetch("/api/admin/youtube-sync/auto-queue", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`Queued ${data.queuedCount} external videos out of ${data.totalExternal} total.`);
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to auto-queue", error);
    } finally {
      setAutoQueueLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-xl">
            <Youtube className="w-8 h-8 text-red-500" />
          </div>
          YouTube Sync Studio
        </h1>
        <p className="text-muted-foreground text-sm">
          Automate video transfers between playlists directly to MedOnex Channel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sync Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm uppercase tracking-wider">New Sync Task</h2>
            </div>

            <form onSubmit={handleStartSync} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Source Playlist URL</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/playlist?list=..."
                  className="w-full bg-background/50 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground ml-1">Target Playlist ID (On MedOnex)</label>
                <input
                  type="text"
                  placeholder="PLxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-background/50 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  required
                />
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                <div className="flex items-center gap-2 text-xs text-primary font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  AUTOMATION INFO
                </div>
                <p className="text-[11px] text-primary/70 leading-relaxed">
                  Videos will be synced as <span className="font-bold underline">Unlisted</span> with original titles and thumbnails. 
                  Quota resets daily at midnight.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                Start Automation Sync
              </button>

              <button
                type="button"
                onClick={handleAutoQueue}
                disabled={autoQueueLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {autoQueueLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Auto-Migrate External Videos (AI Mode)
              </button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card/50 border border-white/5 rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Total Synced</p>
              <p className="text-2xl font-display font-bold text-white">
                {tasks.reduce((sum, t) => sum + (t.syncedVideos || 0), 0)}
              </p>
            </div>
            <div className="bg-card/50 border border-white/5 rounded-3xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Active Tasks</p>
              <p className="text-2xl font-display font-bold text-primary">
                {tasks.filter(t => t.status === "PROCESSING" || t.status === "PENDING").length}
              </p>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-2">
          <div className="bg-card/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-sm uppercase tracking-wider">Sync History & Status</h2>
              </div>
              <button className="text-xs text-muted-foreground hover:text-white transition-colors">Clear All</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className="bg-background/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 group hover:border-primary/20 transition-all"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    task.status === "COMPLETED" ? "bg-green-500/10 text-green-500" : 
                    task.status === "PROCESSING" ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                  )}>
                    {task.status === "COMPLETED" ? <CheckCircle2 className="w-6 h-6" /> : 
                     task.status === "PROCESSING" ? <Loader2 className="w-6 h-6 animate-spin" /> : <AlertCircle className="w-6 h-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                        task.status === "COMPLETED" ? "bg-green-500/20 text-green-500" : 
                        task.status === "PROCESSING" ? "bg-blue-500/20 text-blue-500" : 
                        task.status === "FAILED" ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground"
                      )}>
                        {task.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium truncate text-white/80">{task.sourceUrl}</p>
                    {task.targetPlaylistId && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[11px] text-muted-foreground">Target: {task.targetPlaylistId}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full sm:w-32">
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", task.status === "COMPLETED" ? "bg-green-500" : "bg-primary")}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-bold">
                      {task.syncedVideos}/{task.totalVideos} <span className="text-muted-foreground font-normal ml-1">Videos</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
