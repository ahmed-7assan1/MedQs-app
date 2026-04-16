"use client";
import { useState, useEffect } from "react";
import {
  MessageSquare, Plus, Globe, Users, Lock, Unlock,
  Eye, Loader2, Trash2, AlertTriangle, X, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

type ForumStatus = "OPEN" | "RESTRICTED" | "READ_ONLY" | "CLOSED";
type ForumType = "GLOBAL" | "SEMESTER";

interface Forum {
  id: string;
  name: string;
  type: ForumType;
  status: ForumStatus;
  semesterId?: string;
  _count: { posts: number };
}

const STATUS_CONFIG: Record<ForumStatus, { label: string; color: string; icon: React.ElementType }> = {
  OPEN:       { label: "Open",       color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",  icon: Unlock },
  RESTRICTED: { label: "Restricted", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",        icon: AlertTriangle },
  READ_ONLY:  { label: "Read-only",  color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",           icon: Eye },
  CLOSED:     { label: "Closed",     color: "text-red-600 bg-red-50 dark:bg-red-900/20",              icon: Lock },
};

export default function AdminForumPage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ForumType>("GLOBAL");
  const [newSemId, setNewSemId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/v1/forums")
      .then((r) => r.json())
      .then(setForums)
      .finally(() => setLoading(false));
  }, []);

  async function createForum() {
    if (!newName.trim()) return toast.error("Name required");
    setSubmitting(true);
    const res = await fetch("/api/v1/forums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        type: newType,
        status: "OPEN",
        semesterId: newType === "SEMESTER" ? newSemId || undefined : undefined,
      }),
    });
    if (res.ok) {
      const forum = await res.json();
      setForums((f) => [...f, { ...forum, _count: { posts: 0 } }]);
      setCreating(false);
      setNewName(""); setNewSemId("");
      toast.success("Forum created");
    } else {
      toast.error(await apiErrorMessage(res, "Failed to create forum"));
    }
    setSubmitting(false);
  }

  async function changeStatus(forumId: string, status: ForumStatus) {
    const res = await fetch(`/api/v1/forums/${forumId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setForums((ff) => ff.map((f) => f.id === forumId ? { ...f, status } : f));
      toast.success("Status updated");
    } else toast.error(await apiErrorMessage(res, "Failed to update status"));
  }

  async function deleteForum(forumId: string, name: string) {
    if (!confirm(`Delete forum "${name}"? All posts will be lost.`)) return;
    const res = await fetch(`/api/v1/forums/${forumId}`, { method: "DELETE" });
    if (res.ok) {
      setForums((ff) => ff.filter((f) => f.id !== forumId));
      toast.success("Forum deleted");
    } else toast.error(await apiErrorMessage(res, "Failed to delete forum"));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-32">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Community Moderation</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Forum Control</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure discussion spaces and monitor community interactions across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground sm:flex">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>{forums.length} Active Spaces</span>
          </div>
          <button
            onClick={() => setCreating((p) => !p)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow shadow-blue-500/30 hover:opacity-90 transition-all font-display"
          >
            {creating ? <X className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
            {creating ? "Discard" : "New Forum"}
          </button>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 space-y-5">
          <div className="flex items-center gap-2">
             <Plus className="h-4 w-4 text-blue-500" />
             <h2 className="text-sm font-bold tracking-tight">Provision New Board</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Board Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Clinical Medicine Discussions"
                className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm focus:ring-blue-500/40 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Context Type</label>
              <MedqsSelect
                value={newType}
                onChange={(e) => setNewType(e.target.value as ForumType)}
                className="w-full h-11 rounded-xl border border-border/60 bg-background/50 text-sm"
              >
                <option value="GLOBAL">Global Access (All Students)</option>
                <option value="SEMESTER">Semester Scoped (Restricted)</option>
              </MedqsSelect>
            </div>
            {newType === "SEMESTER" && (
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Semester ID</label>
                <input
                  type="text"
                  value={newSemId}
                  onChange={(e) => setNewSemId(e.target.value)}
                  placeholder="Enter specific UUID or leave blank for dynamic matching"
                  className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm focus:ring-blue-500/40 focus:outline-none"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
               onClick={createForum}
               disabled={submitting}
               className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-sm font-bold text-white shadow shadow-blue-500/20 hover:opacity-90 disabled:opacity-50 transition-all font-display"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
              Deploy Board
            </button>
          </div>
        </div>
      )}

      {/* Forum list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500/20" />
          <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">Querying Community Hub…</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forums.map((forum) => {
            const statusCfg = STATUS_CONFIG[forum.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div key={forum.id} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-blue-500/40 hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-border/40 shadow-inner group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all">
                      {forum.type === "GLOBAL"
                        ? <Globe className="h-6 w-6 text-blue-500" />
                        : <Users className="h-6 w-6 text-indigo-500" />
                      }
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold tracking-tight group-hover:text-blue-500 transition-colors line-clamp-1">{forum.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight", statusCfg.color)}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusCfg.label}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{forum._count.posts.toLocaleString()} Posts</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteForum(forum.id, forum.name)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-background/50 text-muted-foreground/40 transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <MedqsSelect
                    value={forum.status}
                    onChange={(e) => changeStatus(forum.id, e.target.value as ForumStatus)}
                    className="h-9 flex-1 rounded-xl border border-border/40 bg-background/30 text-[11px] font-bold focus:ring-blue-500/40"
                  >
                    <option value="OPEN">Unlock (Full Access)</option>
                    <option value="RESTRICTED">Restrict Posting</option>
                    <option value="READ_ONLY">Read Only Mode</option>
                    <option value="CLOSED">Shutdown Board</option>
                  </MedqsSelect>
                  <div className="flex h-9 items-center justify-center rounded-xl bg-muted/20 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                    {forum.type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
