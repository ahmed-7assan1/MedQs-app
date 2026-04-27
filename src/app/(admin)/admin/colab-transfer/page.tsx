"use client";

import { useEffect, useState, useRef } from "react";
import {
  Youtube,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Terminal,
  Wifi,
  WifiOff,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Job {
  id: string;
  title?: string;
  sourceUrl: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  newVideoUrl?: string;
  error?: string;
  logs?: string;
  lectureVideoId?: string;
  createdAt: string;
  updatedAt: string;
  colabLastPoll?: string;
}

const STATUS_CONFIG = {
  PENDING:    { color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20",  icon: Clock,        label: "Pending" },
  PROCESSING: { color: "text-blue-500",   bg: "bg-blue-500/10 border-blue-500/20",    icon: Loader2,      label: "Processing" },
  COMPLETED:  { color: "text-emerald-500",bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, label: "Completed" },
  FAILED:     { color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20",       icon: XCircle,      label: "Failed" },
};

function JobCard({ job, onRefresh }: { job: Job; onRefresh: () => void }) {
  const [showLogs, setShowLogs] = useState(false);
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  const logs: string[] = (() => { try { return JSON.parse(job.logs || "[]"); } catch { return []; } })();

  return (
    <div className={cn("rounded-2xl border p-4 transition-all", cfg.bg)}>
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", cfg.color)}>
          <Icon className={cn("h-5 w-5", job.status === "PROCESSING" && "animate-spin")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-foreground truncate max-w-xs">
              {job.title || job.sourceUrl}
            </p>
            <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border", cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{job.sourceUrl}</p>

          {/* Progress bar */}
          {(job.status === "PROCESSING" || job.status === "COMPLETED") && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Progress</span>
                <span className="font-bold">{job.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Result URL */}
          {job.status === "COMPLETED" && job.newVideoUrl && (
            <a
              href={job.newVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Youtube className="h-3 w-3" />
              View uploaded video
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Error */}
          {job.status === "FAILED" && job.error && (
            <p className="mt-1 text-xs text-red-500 font-mono bg-red-500/5 rounded-lg px-2 py-1">{job.error}</p>
          )}

          {/* Logs toggle */}
          {logs.length > 0 && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Terminal className="h-3 w-3" />
              {showLogs ? "Hide" : "Show"} logs ({logs.length})
              {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {showLogs && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-black/80 p-3 font-mono text-[10px] text-green-400 leading-5 whitespace-pre-wrap">
              {logs.join("\n")}
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground shrink-0">
          {new Date(job.updatedAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

export default function ColabTransferPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workerAlive, setWorkerAlive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const COLAB_SECRET = process.env.NEXT_PUBLIC_COLAB_SECRET ?? "medqs-colab-secret-2026-change-this";

  const COLAB_NOTEBOOK_URL = "https://colab.research.google.com/drive/1_vSgEitp7pU_1X7z-nB-Yy7qG8H6QZ9A";
  const SITE_URL = "https://medonex.vercel.app";

  async function fetchJobs() {
    try {
      const res = await fetch("/api/v1/admin/colab/jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setWorkerAlive(data.workerAlive ?? false);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
    pollRef.current = window.setInterval(fetchJobs, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function createJob() {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/colab/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: url.trim(), title: title.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Job queued! Colab will pick it up shortly.");
      setUrl("");
      setTitle("");
      fetchJobs();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function clearDone() {
    await fetch("/api/v1/admin/colab/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearCompleted: true }),
    });
    fetchJobs();
  }

  const pending = jobs.filter((j) => j.status === "PENDING").length;
  const processing = jobs.filter((j) => j.status === "PROCESSING").length;
  const completed = jobs.filter((j) => j.status === "COMPLETED").length;
  const failed = jobs.filter((j) => j.status === "FAILED").length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
            <Youtube className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Colab Transfer</h1>
            <p className="text-sm text-muted-foreground">YouTube video migration — powered by Google Colab servers</p>
          </div>
        </div>
        <button onClick={fetchJobs} className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Worker Status Banner */}
      <div className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 transition-all",
        workerAlive
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-amber-500/20 bg-amber-500/5"
      )}>
        {workerAlive
          ? <Wifi className="h-5 w-5 text-emerald-500 shrink-0" />
          : <WifiOff className="h-5 w-5 text-amber-500 shrink-0" />
        }
        <div className="flex-1">
          <p className={cn("font-bold text-sm", workerAlive ? "text-emerald-500" : "text-amber-500")}>
            {workerAlive ? "🟢 Colab Worker is Running" : "🟡 Colab Worker is Offline"}
          </p>
          <p className="text-xs text-muted-foreground">
            {workerAlive
              ? "Jobs will be processed automatically. The worker polls every 15 seconds."
              : "Start the Colab notebook to begin processing queued jobs."}
          </p>
        </div>
        {!workerAlive && (
          <a
            href={COLAB_NOTEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600 transition-colors shrink-0"
          >
            <Play className="h-3.5 w-3.5" />
            Launch Colab
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending", value: pending, color: "text-amber-500" },
          { label: "Processing", value: processing, color: "text-blue-500" },
          { label: "Completed", value: completed, color: "text-emerald-500" },
          { label: "Failed", value: failed, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className={cn("text-3xl font-black", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Config Box (for Colab setup) */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-black text-primary">Colab Setup Config</p>
          <p className="text-xs text-muted-foreground">— Copy these into your Colab notebook</p>
        </div>
        <div className="font-mono text-xs bg-black/80 text-green-400 rounded-xl p-3 space-y-1">
          <p><span className="text-blue-400">SITE_URL</span> = <span className="text-yellow-300">&quot;{SITE_URL}&quot;</span></p>
          <p><span className="text-blue-400">COLAB_SECRET</span> = <span className="text-yellow-300">&quot;medqs-colab-secret-2026-change-this&quot;</span></p>
          <p className="text-white/30"># Change COLAB_SECRET to match your .env file</p>
        </div>
      </div>

      {/* New Job Form */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Queue New Transfer
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">YouTube URL *</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or playlist"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Label (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cardiology Lecture 3"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={createJob}
              disabled={submitting || !url.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-black text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
              Queue Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg">Transfer Queue</h2>
          {completed + failed > 0 && (
            <button
              onClick={clearDone}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear completed/failed
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading...
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-muted-foreground">
            <Youtube className="h-8 w-8 mb-3 opacity-30" />
            <p className="font-bold text-sm">No transfer jobs yet</p>
            <p className="text-xs mt-1">Queue a YouTube video above to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onRefresh={fetchJobs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
