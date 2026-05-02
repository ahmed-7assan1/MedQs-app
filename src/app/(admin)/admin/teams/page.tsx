"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit3, Save, X, Loader2, ImageIcon, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ImageUploadWithCrop } from "@/components/ui/ImageUploadWithCrop";

interface Team {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  faculty?: { name: string };
  followersCount?: number;
  _count?: { followers: number; posts: number };
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/teams");
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : data.teams ?? []);
    } catch { toast.error("Failed to load teams"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", imageUrl: "" });
    setShowForm(true);
  }

  function openEdit(t: Team) {
    setEditing(t);
    setForm({ name: t.name, description: t.description ?? "", imageUrl: t.imageUrl ?? "" });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Team name is required");
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/v1/teams/${editing.id}` : "/api/v1/teams", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(editing ? "Team updated!" : "Team created!");
      setShowForm(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this team? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/v1/teams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Team deleted");
      setTeams(t => t.filter(x => x.id !== id));
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Teams Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage medical study teams</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          New Team
        </button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-base">{editing ? "Edit Team" : "Create New Team"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Team Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cardio Excellence"
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="md:col-span-2">
                <ImageUploadWithCrop
                  label="Team Cover Image"
                  value={form.imageUrl}
                  onChange={(url) => setForm(f => ({ ...f, imageUrl: url }))}
                  cropShape="rect"
                  aspect={16/9}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this team..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editing ? "Update Team" : "Create Team"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/40 gap-3">
          <Users className="h-12 w-12" />
          <p className="font-bold text-sm">No teams yet — create your first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-all"
            >
              {/* Avatar + Name */}
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                  {team.imageUrl ? (
                    <img src={team.imageUrl} alt={team.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{team.name}</h3>
                  {team.faculty?.name && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{team.faculty.name}</p>
                  )}
                </div>
              </div>

              {team.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{team.description}</p>
              )}

              <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground mt-auto">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{team._count?.followers ?? 0} followers</span>
                <span>{team._count?.posts ?? 0} posts</span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => openEdit(team)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
