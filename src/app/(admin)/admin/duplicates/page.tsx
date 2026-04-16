"use client";

import { useEffect, useState } from "react";
import { CopyX, Trash2, ExternalLink, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type DuplicateGroup = {
  normalizedKey: string;
  originalBody: string;
  count: number;
  questions: {
    id: string;
    body: string;
    difficulty: string;
    createdAt: string;
    lecture: {
      title: string;
      subject: { name: string; module: { name: string } };
    };
  }[];
};

export default function AdminDuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/questions/duplicates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load duplicates");
      setGroups(data.duplicates || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, []);

  const handleDelete = async (questionId: string, groupIndex: number) => {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) return;
    setDeletingId(questionId);
    try {
      const res = await fetch(`/api/v1/questions/${questionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete question");
      toast.success("Question deleted successfully");

      // Update state locally to remove the deleted query
      setGroups(prev => {
        const next = [...prev];
        const group = next[groupIndex];
        group.questions = group.questions.filter(q => q.id !== questionId);
        group.count = group.questions.length;
        if (group.count <= 1) {
          // Remove the group if it's no longer a duplicate bundle
          next.splice(groupIndex, 1);
        }
        return next;
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-32">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Database Integrity</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Duplicate Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Identify and prune redundant question nodes to maintain high curricular quality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDuplicates}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-card border border-border/60 px-5 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted/50 disabled:opacity-50 transition-all font-display"
          >
            <RefreshCw className={cn("h-4 w-4 text-rose-500", loading && "animate-spin")} />
            {loading ? "Scanning System…" : "Initalize Scan"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
             <div className="h-16 w-16 rounded-full border-4 border-rose-500/10 border-t-rose-500 animate-spin" />
             <CopyX className="absolute inset-0 m-auto h-6 w-6 text-rose-500/40" />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Analyzing Curricular Nodes…</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 py-24 text-center bg-card/10">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 shadow-inner">
            <CopyX className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="font-display text-xl font-bold">Optimized Database</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            Collision detection complete. No exact duplicate questions were found across the platform.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
             </div>
             <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
               Collision Alert: {groups.length} duplicate clusters detected. Please resolve by archiving redundant paths.
             </p>
          </div>
          
          <div className="grid gap-6">
            {groups.map((group, groupIndex) => (
              <div key={group.normalizedKey} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:border-rose-500/30 hover:shadow-xl">
                <div className="border-b border-border/40 bg-muted/20 p-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Common Content Path</p>
                      <h3 className="font-display text-base font-bold text-foreground leading-snug line-clamp-2">{group.originalBody}</h3>
                    </div>
                    <div className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-rose-500/20">
                      {group.count} COLLISIONS
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-border/30">
                  {group.questions.map((q) => (
                    <div key={q.id} className="flex flex-col lg:flex-row items-center justify-between p-5 hover:bg-muted/10 transition-colors gap-5">
                      <div className="flex-1 space-y-3 w-full">
                         <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-blue-600 border border-blue-500/20">{q.lecture.subject.module.name}</span>
                            <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-500/20">{q.lecture.subject.name}</span>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Session: {q.lecture.title}</span>
                         </div>
                         <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono bg-muted/30 w-fit px-2 py-1 rounded">
                            <span className="opacity-40 uppercase font-bold">Node ID</span>
                            <span className="font-bold">{q.id}</span>
                            <span className="h-2 w-[1px] bg-border" />
                            <span className="opacity-40 uppercase font-bold">Injected</span>
                            <span className="font-bold">{new Date(q.createdAt).toLocaleDateString()}</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0 lg:w-auto w-full">
                         <a href={`/admin/questions?search=${encodeURIComponent(q.id)}`} target="_blank" 
                            className="flex-1 lg:flex-none h-11 flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 text-xs font-bold hover:bg-muted transition-all">
                            <ExternalLink className="h-4 w-4 text-blue-500" />
                            View Source
                         </a>
                         <button
                           onClick={() => handleDelete(q.id, groupIndex)}
                           disabled={deletingId === q.id}
                           className="flex-1 lg:flex-none h-11 flex items-center justify-center gap-2 rounded-xl bg-rose-500 text-white px-5 text-xs font-bold shadow shadow-rose-500/20 hover:bg-rose-600 disabled:opacity-40 transition-all active:scale-[0.98]"
                         >
                           {deletingId === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                           Archve Duplicate
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
