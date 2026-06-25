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
  linkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  order?: number;
}

export default function FoundersClient() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Founder | null>(null);
  const [form, setForm] = useState({
    name: "", role: "Founder", description: "", imageUrl: "", socialUrl: "", linkedinUrl: "", facebookUrl: "", twitterUrl: "", instagramUrl: "", order: 0
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
    setForm({ name: "", role: "Founder", description: "", imageUrl: "", socialUrl: "", linkedinUrl: "", facebookUrl: "", twitterUrl: "", instagramUrl: "", order: founders.length });
    setShowForm(true);
  }

  function openEdit(f: Founder) {
    setEditing(f);
    setForm({
      name: f.name,
      role: f.role,
      description: f.description || "",
      imageUrl: f.imageUrl || "",
      socialUrl: f.socialUrl || "",
      linkedinUrl: f.linkedinUrl || "",
      facebookUrl: f.facebookUrl || "",
      twitterUrl: f.twitterUrl || "",
      instagramUrl: f.instagramUrl || "",
      order: f.order ?? 0
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const url = editing ? `/api/v1/platform-members/${editing.id}` : "/api/v1/platform-members";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(editing ? "Founder updated!" : "Founder added!");
      setShowForm(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save founder");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this founder? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/v1/platform-members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Founder removed");
      setFounders(f => f.filter(x => x.id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
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
          <p className="text-sm text-muted-foreground mt-1">Manage core platform founders, advisors, and contributors</p>
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
              <h2 className="font-bold text-base">{editing ? "Edit Member" : "Add New Member"}</h2>
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
                  placeholder="e.g. Dr. Ahmed Hassan"
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
                  label="Profile Picture"
                  value={form.imageUrl}
                  onChange={(url) => setForm(f => ({ ...f, imageUrl: url }))}
                  cropShape="round"
                  aspect={1}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">LinkedIn URL</label>
                <input
                  value={form.linkedinUrl}
                  onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Facebook URL</label>
                <input
                  value={form.facebookUrl}
                  onChange={e => setForm(f => ({ ...f, facebookUrl: e.target.value }))}
                  placeholder="https://facebook.com/username"
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">X (Twitter) URL</label>
                <input
                  value={form.twitterUrl}
                  onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))}
                  placeholder="https://x.com/username"
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Instagram URL</label>
                <input
                  value={form.instagramUrl}
                  onChange={e => setForm(f => ({ ...f, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/username"
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Display Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Bio / Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of responsibilities or achievements..."
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
                {editing ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
        </div>
      ) : founders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/40 gap-3 border border-dashed border-border rounded-2xl">
          <GraduationCap className="h-12 w-12" />
          <p className="font-bold text-sm">No founders listed yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {founders.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-all relative group"
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{member.name}</h3>
                  <span className="inline-flex rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary mt-1">
                    {member.role}
                  </span>
                </div>
              </div>

              {member.description && (
                <p className="text-xs text-muted-foreground line-clamp-3 mt-2">{member.description}</p>
              )}

              <div className="flex items-center gap-2 pt-2 mt-auto">
                {member.linkedinUrl && <a href={member.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">LinkedIn</a>}
                {member.facebookUrl && <a href={member.facebookUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">Facebook</a>}
                {member.twitterUrl && <a href={member.twitterUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">X</a>}
                {member.instagramUrl && <a href={member.instagramUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">Instagram</a>}
              </div>

              <div className="flex gap-2 pt-3 border-t border-border mt-auto">
                <button
                  onClick={() => openEdit(member)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
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
