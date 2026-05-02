"use client";

import { useEffect, useState, useRef } from "react";
import {
  Youtube, Play, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, 
  Terminal, Wifi, WifiOff, ExternalLink, Plus, ChevronDown, ChevronUp, Sparkles, 
  FileText, Upload, AlertCircle, Edit2, Search
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

interface AIItem {
  id: string;
  type: "video" | "file";
  title: string;
  sourceUrl: string;
  duplicate?: boolean;
  existingLocation?: string;
  scope: {
     course: string | null;
     subject: string | null;
     module: string | null;
     lecture: string | null;
  };
  targetLectureId?: string;
  actionType: "ADD" | "REPLACE";
  selected: boolean;
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

          {job.status === "COMPLETED" && job.newVideoUrl && (
            <a
              href={job.newVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Youtube className="h-3 w-3" /> View Source <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {job.status === "FAILED" && job.error && (
            <p className="mt-1 text-xs text-red-500 font-mono bg-red-500/5 rounded-lg px-2 py-1">{job.error}</p>
          )}

          {logs.length > 0 && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Terminal className="h-3 w-3" /> {showLogs ? "Hide" : "Show"} logs ({logs.length})
              {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          {showLogs && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-black/80 p-3 font-mono text-[10px] text-green-400 leading-5 whitespace-pre-wrap">
              {logs.join("\n")}
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground shrink-0">{new Date(job.updatedAt).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

export default function ColabTransferPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workerAlive, setWorkerAlive] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // AI State
  const [aiInput, setAiInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiItems, setAiItems] = useState<AIItem[]>([]);
  const [dispatching, setDispatching] = useState(false);
  
  // Lectures for Search
  const [lectures, setLectures] = useState<any[]>([]);

  const pollRef = useRef<number | null>(null);
  const COLAB_NOTEBOOK_URL = "https://colab.research.google.com/drive/1_vSgEitp7pU_1X7z-nB-Yy7qG8H6QZ9A";

  async function fetchJobs() {
    try {
      const res = await fetch("/api/v1/admin/colab/jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setWorkerAlive(data.workerAlive ?? false);
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => {
    fetchJobs();
    pollRef.current = window.setInterval(fetchJobs, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function searchLectures(query: string) {
    if (!query) return;
    try {
      const res = await fetch(`/api/v1/admin/lectures-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setLectures(data.lectures || []);
    } catch { }
  }

  async function analyzeInput() {
    if (!aiInput.trim()) return;
    setAnalyzing(true);
    setAiItems([]);
    try {
      const res = await fetch("/api/v1/admin/colab/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: aiInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze");
      
      const mapped = (data.items || []).map((item: any, i: number) => ({
         ...item,
         id: `ai-${i}`,
         selected: true,
         actionType: "ADD",
         targetLectureId: ""
      }));
      setAiItems(mapped);
      toast.success(`Extracted ${mapped.length} resources`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function dispatchSelected() {
    const selected = aiItems.filter(i => i.selected);
    if (selected.length === 0) return;
    
    setDispatching(true);
    try {
      for (const item of selected) {
         await fetch("/api/v1/admin/colab/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
             sourceUrl: item.sourceUrl, 
             title: item.title,
             // Optional: send metadata so backend handles DB updates later
             metadata: { action: item.actionType, targetLectureId: item.targetLectureId, type: item.type }
          }),
        });
      }
      toast.success(`Queued ${selected.length} jobs!`);
      setAiItems([]);
      setAiInput("");
      fetchJobs();
    } catch (e: any) {
      toast.error("Failed to queue some jobs");
    } finally {
      setDispatching(false);
    }
  }

  async function clearDone() {
    await fetch("/api/v1/admin/colab/jobs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clearCompleted: true }) });
    fetchJobs();
  }

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const pending = jobs.filter((j) => j.status === "PENDING").length;
  const processing = jobs.filter((j) => j.status === "PROCESSING").length;
  const completed = jobs.filter((j) => j.status === "COMPLETED").length;
  const failed = jobs.filter((j) => j.status === "FAILED").length;
  const filteredJobs = jobs.filter(j => statusFilter === "ALL" || j.status === statusFilter);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 shadow-inner">
            <Sparkles className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">AI Media Pipeline</h1>
            <p className="text-sm text-muted-foreground font-medium">Extract, analyze, and sync Telegram & YouTube content instantly.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={fetchJobs} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-all active:scale-95">
             <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
           </button>
        </div>
      </div>

      {/* AI Analyzer Box */}
      <div className="rounded-[2rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-4 w-4 text-white" />
           </div>
           <h2 className="font-black text-lg text-indigo-500">AI Analyzer</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest ml-1">Paste Telegram Message Link or Text</label>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="e.g. https://t.me/channel/123 or raw message text..."
              rows={3}
              className="mt-1 w-full rounded-2xl border border-indigo-500/20 bg-background/50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none backdrop-blur-sm"
            />
          </div>
          <button
            onClick={analyzeInput}
            disabled={analyzing || !aiInput.trim()}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 font-black text-sm text-white hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {analyzing ? "Analyzing context..." : "Extract Resources"}
          </button>
        </div>

        {/* AI Preview List */}
        {aiItems.length > 0 && (
          <div className="pt-6 border-t border-indigo-500/10 space-y-4">
             <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Extracted Resources ({aiItems.length})</h3>
             <div className="space-y-3">
               {aiItems.map((item, idx) => (
                 <div key={item.id} className={cn("rounded-2xl border p-4 transition-all", item.selected ? "border-indigo-500/50 bg-indigo-500/5" : "border-border bg-card/50 opacity-60")}>
                    <div className="flex gap-4">
                      <div className="pt-1">
                        <input type="checkbox" checked={item.selected} onChange={e => {
                          const n = [...aiItems]; n[idx].selected = e.target.checked; setAiItems(n);
                        }} className="h-4 w-4 rounded border-indigo-500 text-indigo-600 focus:ring-indigo-500" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                           {item.type === 'video' ? <Youtube className="h-5 w-5 text-red-500" /> : <FileText className="h-5 w-5 text-blue-500" />}
                           <div className="flex-1">
                             <input value={item.title} onChange={e => {
                               const n = [...aiItems]; n[idx].title = e.target.value; setAiItems(n);
                             }} className="w-full font-bold text-sm bg-transparent border-b border-transparent hover:border-border focus:border-indigo-500 focus:outline-none transition-all px-1 -ml-1" />
                             <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[300px]">{item.sourceUrl}</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <select value={item.actionType} onChange={e => {
                               const n = [...aiItems]; n[idx].actionType = e.target.value as any; setAiItems(n);
                             }} className="text-xs font-bold bg-background rounded-lg border px-2 py-1">
                                <option value="ADD">Add</option>
                                <option value="REPLACE">Replace</option>
                             </select>
                           </div>
                        </div>

                        {item.duplicate && (
                          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-500">
                             <AlertCircle className="h-4 w-4" />
                             <span className="font-bold">Duplicate Detected:</span> Already assigned to "{item.existingLocation}"
                          </div>
                        )}

                        <div className="rounded-xl bg-background border p-3">
                           <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                              <span className="text-xs font-bold text-indigo-500">AI Suggested Scope:</span>
                              <span className="text-xs text-muted-foreground">
                                {item.scope.subject || "Unknown Subject"} → {item.scope.lecture || "Unknown Lecture"}
                              </span>
                           </div>
                           <div className="flex items-center gap-2">
                              <input 
                                placeholder="Search & bind to existing lecture..." 
                                onChange={(e) => searchLectures(e.target.value)}
                                className="flex-1 text-xs bg-muted/50 rounded-lg px-3 py-2 border-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                              />
                              <select 
                                onChange={(e) => {
                                  const n = [...aiItems]; n[idx].targetLectureId = e.target.value; setAiItems(n);
                                }}
                                className="flex-1 text-xs bg-muted/50 rounded-lg px-3 py-2 border-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px]"
                              >
                                <option value="">-- Select Target Lecture --</option>
                                {lectures.map(l => (
                                  <option key={l.id} value={l.id}>{l.module?.subject?.title} - {l.title}</option>
                                ))}
                              </select>
                           </div>
                        </div>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
             
             <div className="flex justify-end pt-4">
                <button
                  onClick={dispatchSelected}
                  disabled={dispatching || !aiItems.some(i => i.selected)}
                  className="h-12 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-8 font-black text-sm text-white hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {dispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Dispatch {aiItems.filter(i => i.selected).length} Items to Colab
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Worker Status Banner */}
      <div className={cn(
        "flex items-center gap-4 rounded-[1.5rem] border p-5 transition-all shadow-sm",
        workerAlive
          ? "border-emerald-500/20 bg-emerald-500/5 ring-1 ring-emerald-500/10"
          : "border-amber-500/20 bg-amber-500/5 ring-1 ring-amber-500/10"
      )}>
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", workerAlive ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
           {workerAlive ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
             <p className={cn("font-black text-sm", workerAlive ? "text-emerald-500" : "text-amber-500")}>
               {workerAlive ? "PIPELINE ACTIVE" : "PIPELINE OFFLINE"}
             </p>
             {workerAlive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-0.5 leading-relaxed">
            {workerAlive
              ? "The Colab worker is polling for tasks. It will upload to Telegram Group and YouTube automatically."
              : "Launch the Colab notebook to start processing the queue."}
          </p>
        </div>
        {!workerAlive && (
          <a
            href={COLAB_NOTEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-white hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 shrink-0"
          >
            <Play className="h-3.5 w-3.5" /> Launch Worker
          </a>
        )}
      </div>

      {/* Stats & Filter */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { id: "PENDING", label: "Pending", value: pending, color: "text-amber-500", bg: "bg-amber-500/5" },
          { id: "PROCESSING", label: "Running", value: processing, color: "text-blue-500", bg: "bg-blue-500/5" },
          { id: "COMPLETED", label: "Finished", value: completed, color: "text-emerald-500", bg: "bg-emerald-500/5" },
          { id: "FAILED", label: "Failed", value: failed, color: "text-red-500", bg: "bg-red-500/5" },
        ].map((s) => (
          <button 
            key={s.id} 
            onClick={() => setStatusFilter(statusFilter === s.id ? "ALL" : s.id)}
            className={cn(
              "group relative rounded-2xl border p-4 text-center transition-all hover:scale-[1.02] active:scale-95",
              statusFilter === s.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card",
              s.bg
            )}
          >
            <p className={cn("text-3xl font-black tracking-tight", s.color)}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{s.label}</p>
            {statusFilter === s.id && <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background"><CheckCircle2 className="h-2.5 w-2.5" /></div>}
          </button>
        ))}
      </div>

      {/* Job List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-black text-xl tracking-tight">Job Queue</h2>
          {completed + failed > 0 && (
            <button
              onClick={clearDone}
              className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Purge History
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-3xl border border-dashed">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/40" />
            <p className="font-bold text-sm tracking-widest uppercase">Synchronizing Jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border py-20 text-muted-foreground bg-card/50">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
               <Clock className="h-8 w-8 opacity-20" />
            </div>
            <p className="font-black text-sm uppercase tracking-widest">No active jobs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} onRefresh={fetchJobs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
