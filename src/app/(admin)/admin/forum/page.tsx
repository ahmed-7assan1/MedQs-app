"use client";
import { useState, useEffect } from "react";
import {
  MessageSquare, Plus, Globe, Users, Lock, Unlock,
  Eye, Loader2, Trash2, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";

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
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Forum Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">{forums.length} forums</p>
        </div>
        <button
          onClick={() => setCreating((p) => !p)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Forum
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 animate-fade-in">
          <h2 className="mb-4 font-semibold">Create Forum</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Forum name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Year 2 – Anatomy"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ForumType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="GLOBAL">Global (all users)</option>
                <option value="SEMESTER">Semester (filtered)</option>
              </select>
            </div>
            {newType === "SEMESTER" && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Semester ID (optional)</label>
                <input
                  type="text"
                  value={newSemId}
                  onChange={(e) => setNewSemId(e.target.value)}
                  placeholder="Leave blank to apply to all semesters"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setCreating(false)} className="rounded-lg px-4 py-2 text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={createForum}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
          </div>
        </div>
      )}

      {/* Forum list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {forums.map((forum) => {
            const statusCfg = STATUS_CONFIG[forum.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div key={forum.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {forum.type === "GLOBAL"
                        ? <Globe className="h-5 w-5 text-primary" />
                        : <Users className="h-5 w-5 text-primary" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{forum.name}</h3>
                        <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", statusCfg.color)}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {forum.type === "GLOBAL" ? "Global" : "Semester"} · {forum._count.posts} posts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status quick-change */}
                    <select
                      value={forum.status}
                      onChange={(e) => changeStatus(forum.id, e.target.value as ForumStatus)}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="OPEN">Open</option>
                      <option value="RESTRICTED">Restricted</option>
                      <option value="READ_ONLY">Read-only</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <button
                      onClick={() => deleteForum(forum.id, forum.name)}
                      className="rounded-lg p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
