"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Plus, Trash2, Edit3, Save, X, Loader2, Code, Stethoscope, Sparkles, Star, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ImageUploadWithCrop } from "@/components/ui/ImageUploadWithCrop";

const ROLE_OPTIONS = ["Founder", "Co-Founder", "Lead Developer", "Medical Advisor", "Content Manager", "UI/UX Designer", "Other"];
const ICON_OPTIONS = ["Sparkles", "Code", "Stethoscope", "Star", "GraduationCap"];

interface Founder {
  id: string;
  name: string;
  role: string;
  description?: string;
  imageUrl?: string;
  socialUrl?: string;
  order?: number;
}

export default function AdminFoundersPage() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Founder | null>(null);
  const [form, setForm] = useState({
    name: "", role: "Founder", description: "", imageUrl: "", socialUrl: "", order: 0
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/platform-members");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFounders(Array.isArray(data) ? data : data.members ?? []);
    } catch {
      // Fallback: show empty state with instructions
      setFounders([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", role: "Founder", description: "", imageUrl: "", socialUrl: "", order: founders.length });
    setShowForm(true);
  }

  function openEdit(f: Founder) {
    setEditing(f);
    setForm({
      name: f.name, role: f.role, description: f.description ?? "",
      imageUrl: f.imageUrl ?? "", socialUrl: f.socialUrl ?? "", order: f.order ?? 0
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const url = editing ? `/api/v1/platform-members/${editing.id}` : "/api/v1/platform-members";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(editing ? "Member updated!" : "Member added!");
      setShowForm(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this team member?")) return;
    try {
      const res = await fetch(`/api/v1/platform-members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Removed");
      setFounders(f => f.filter(x => x.id !== id));
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Founders & Team
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the MedOneX team members shown on the About page</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Form */}
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
              <h2 className="font-bold">{editing ? "Edit Member" : "Add Team Member"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ahmed Hassan"
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <ImageUploadWithCrop
                  label="Profile Image"
                  value={form.imageUrl}
                  onChange={(url) => setForm(f => ({ ...f, imageUrl: url }))}
                  cropShape="round"
                  aspect={1}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Social / Portfolio URL</label>
                <input
                  value={form.socialUrl}
                  onChange={e => setForm(f => ({ ...f, socialUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Bio / Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short bio shown on the About page..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Display Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Preview */}
            {form.imageUrl && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                   <img 
                     src={form.imageUrl} 
                     alt="" 
                     className="h-full w-full object-cover"
                     onError={(e) => {
                       (e.target as HTMLImageElement).style.display = 'none';
                       (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-muted-foreground/30"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                     }}
                   />
                </div>
                <div>
                  <p className="font-bold text-sm">{form.name || "Name"}</p>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest">{form.role}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editing ? "Update Member" : "Add Member"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Members Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
        </div>
      ) : founders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-4 rounded-2xl border border-dashed border-border bg-muted/10">
          <GraduationCap className="h-12 w-12 text-muted-foreground/30" />
          <div className="text-center">
            <p className="font-bold text-sm text-muted-foreground">No team members yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add founders and team members to display them on the About page</p>
          </div>
          <button onClick={openCreate} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all">
            Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...founders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name} 
                      className="h-full w-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-xl font-black">${member.name.charAt(0)}</div>`;
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-xl font-black">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{member.name}</h3>
                  <p className="text-[11px] font-bold text-primary uppercase tracking-widest mt-0.5">{member.role}</p>
                  {member.order !== undefined && (
                    <span className="text-[10px] text-muted-foreground">Order: #{member.order}</span>
                  )}
                </div>
              </div>

              {member.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{member.description}</p>
              )}

              {member.socialUrl && (
                <a href={member.socialUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline truncate">
                  {member.socialUrl}
                </a>
              )}

              <div className="flex gap-2 pt-2 border-t border-border mt-auto">
                <button onClick={() => openEdit(member)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors">
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(member.id)} className="flex items-center justify-center w-9 h-9 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors">
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
