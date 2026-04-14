"use client";

import { useEffect, useState } from "react";
import { CopyX, Trash2, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

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
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <CopyX className="h-8 w-8 text-rose-500" />
            Duplicate Scanner
          </h1>
          <p className="mt-2 text-muted-foreground">
            Detect and merge exact duplicate questions across your entire question bank to keep the database clean.
          </p>
        </div>
        <button
          onClick={loadDuplicates}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Scan Now
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
          <p>Scanning platform database...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
            <CopyX className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Clean Database!</h2>
          <p className="mt-2 text-muted-foreground max-w-md">
            No exact duplicate questions were found across any modules or lectures.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900 p-4">
               <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                 Identified {groups.length} duplicate groups. Review and delete redundant nodes below. Keep at least one question per group.
               </p>
          </div>
          
          {groups.map((group, groupIndex) => (
            <div key={group.normalizedKey} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="border-b border-border bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold line-clamp-2 text-foreground">{group.originalBody}</h3>
                  </div>
                  <div className="flex shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30 px-3 py-1 text-sm font-bold text-rose-600 dark:text-rose-400">
                    {group.count} copies
                  </div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {group.questions.map((q) => (
                  <div key={q.id} className="flex flex-col sm:flex-row items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-4">
                    <div className="flex flex-col text-sm text-muted-foreground w-full">
                       <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-medium text-foreground text-xs bg-muted px-2 py-0.5 rounded uppercase tracking-wider">{q.lecture.subject.module.name}</span>
                          <span className="font-medium text-foreground text-xs bg-muted px-2 py-0.5 rounded uppercase tracking-wider">{q.lecture.subject.name}</span>
                       </div>
                       <p className="text-xs">Location: <span className="font-medium">{q.lecture.title}</span></p>
                       <p className="text-xs mt-0.5 opacity-60">ID: {q.id} • Created: {new Date(q.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-3 sm:mt-0 justify-end">
                       <a href={`/admin/questions?search=${encodeURIComponent(q.id)}`} target="_blank" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition-colors">
                          <ExternalLink className="h-4 w-4" />
                       </a>
                       <button
                         onClick={() => handleDelete(q.id, groupIndex)}
                         disabled={deletingId === q.id}
                         className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                       >
                         {deletingId === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                         Delete
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
