"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Megaphone, ExternalLink } from "lucide-react";
import { FileUploader } from "@/components/ui/FileUploader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";

interface AdBanner {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  active: boolean;
  semesterId?: string;
  createdAt: string;
}

interface SemesterRow {
  id: string;
  name: string;
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ imageUrl: "", linkUrl: "", semesterId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [semesters, setSemesters] = useState<SemesterRow[]>([]);

  useEffect(() => {
    fetch("/api/v1/ads")
      .then((r) => r.json())
      .then(setAds)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/v1/semesters")
      .then((r) => r.json())
      .then((d) => setSemesters(Array.isArray(d) ? d : []))
      .catch(() => setSemesters([]));
  }, []);

  async function createAd() {
    if (!form.imageUrl) return toast.error("Upload an image first");
    setSubmitting(true);
    const res = await fetch("/api/v1/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || undefined,
        semesterId: form.semesterId || undefined,
        active: true,
      }),
    });
    if (res.ok) {
      const ad = await res.json();
      setAds((prev) => [ad, ...prev]);
      setForm({ imageUrl: "", linkUrl: "", semesterId: "" });
      setShowForm(false);
      toast.success("Ad created!");
    } else {
      toast.error(await apiErrorMessage(res, "Failed to create ad"));
    }
    setSubmitting(false);
  }

  async function toggleActive(ad: AdBanner) {
    const res = await fetch(`/api/v1/ads/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ad.active }),
    });
    if (res.ok) {
      setAds((prev) => prev.map((a) => a.id === ad.id ? { ...a, active: !a.active } : a));
    } else {
      toast.error(await apiErrorMessage(res, "Failed to update"));
    }
  }

  async function deleteAd(id: string) {
    if (!confirm("Delete this ad?")) return;
    const res = await fetch(`/api/v1/ads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAds((prev) => prev.filter((a) => a.id !== id));
      toast.success("Deleted");
    } else {
      toast.error(await apiErrorMessage(res, "Failed to delete"));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Advertisements</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ads.length} banners · shown once per session</p>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "New Ad"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4 animate-fade-in">
          <h2 className="font-semibold">Create Ad Banner</h2>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Banner image *</label>
            {form.imageUrl ? (
              <div className="relative">
                <img src={form.imageUrl} alt="Preview" className="w-full max-h-48 rounded-lg object-cover" />
                <button onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <FileUploader
                folder="ad"
                accept="image/jpeg,image/png,image/webp"
                maxSizeMB={10}
                onUpload={(files) => { if (files[0]) setForm((f) => ({ ...f, imageUrl: files[0].url })); }}
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Click URL <span className="opacity-60">(optional)</span></label>
            <input type="url" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Target semester <span className="opacity-60">(optional — all students if empty)</span>
            </label>
            <select
              value={form.semesterId}
              onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All students</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button onClick={createAd} disabled={submitting || !form.imageUrl}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              {submitting ? "Creating..." : "Create Ad"}
            </button>
          </div>
        </div>
      )}

      {/* Ads list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Megaphone className="mb-3 h-10 w-10 text-muted-foreground opacity-30" />
          <p className="font-medium">No ads yet</p>
          <p className="text-sm text-muted-foreground">Create an ad banner to promote content to students.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ads.map((ad) => (
            <div key={ad.id} className={cn(
              "rounded-xl border overflow-hidden bg-card transition-all",
              ad.active ? "border-border" : "border-border opacity-60"
            )}>
              <img src={ad.imageUrl} alt="Ad banner" className="w-full max-h-40 object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {ad.linkUrl && (
                      <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline truncate">
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{ad.linkUrl}</span>
                      </a>
                    )}
                    {ad.semesterId && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">Target: {ad.semesterId}</p>
                    )}
                    {!ad.semesterId && <p className="text-xs text-muted-foreground mt-0.5">All students</p>}
                    <p className="text-xs text-muted-foreground">{new Date(ad.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <button onClick={() => toggleActive(ad)}
                      className={cn("rounded-lg p-1.5 transition-colors",
                        ad.active ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : "text-muted-foreground hover:bg-muted")}>
                      {ad.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button onClick={() => deleteAd(ad.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    ad.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                    {ad.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
