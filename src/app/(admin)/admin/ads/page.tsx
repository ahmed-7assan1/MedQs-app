"use client";
import { useState, useEffect } from "react";
import { 
  ImagePlus, Plus, Calendar, Trash2, Edit3, Loader2, 
  ExternalLink, Eye, EyeOff, LayoutPanelTop, Search, Filter, X, Megaphone, ToggleRight, ToggleLeft
} from "lucide-react";
import { BannerUploader } from "@/components/ui/BannerUploader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

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
      .then((d) => setSemesters(unwrapApiList<SemesterRow>(d)))
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
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-32">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Promotions & Reach</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Ad Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage high-visibility banners and session-based promotional content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-white/[0.02] bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground sm:flex">
            <Megaphone className="h-4 w-4 text-primary" />
            <span>{ads.length} Running Banners</span>
          </div>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow shadow-blue-500/30 hover:opacity-90 transition-all font-display"
          >
            {showForm ? <X className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
            {showForm ? "Cancel" : "New Campaign"}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-white/[0.02] bg-card p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
          <div className="flex items-center gap-2">
             <Plus className="h-4 w-4 text-blue-500" />
             <h2 className="text-sm font-bold tracking-tight">Deployment Config</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Banner Asset *</label>
              {form.imageUrl ? (
                <div className="group relative overflow-hidden rounded-xl border border-white/[0.05] aspect-[21/9] bg-background">
                  <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      className="rounded-xl bg-white/20 backdrop-blur-md px-4 py-2 text-xs font-bold text-white border border-white/[0.02] hover:bg-white/30 transition-all">
                      Repleace Asset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[21/9] overflow-hidden rounded-xl border border-white/[0.02] bg-background/30">
                   <BannerUploader
                     onUpload={(files) => { if (files[0]) setForm((f) => ({ ...f, imageUrl: files[0].url })); }}
                   />
                </div>
              )}
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                 <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Redirect Destination</label>
                 <input type="url" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                   placeholder="https://example.com/promo"
                   className="w-full h-11 rounded-xl border border-white/[0.02] bg-background/50 px-4 text-sm focus:ring-blue-500/40 focus:outline-none" />
               </div>

               <div className="space-y-1.5">
                 <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                   Audience Segmentation
                 </label>
                 <MedqsSelect
                   value={form.semesterId}
                   onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value }))}
                   className="w-full h-11 rounded-xl border border-white/[0.02] bg-background/50 text-sm"
                 >
                   <option value="">Broadcast to All Users</option>
                   {semesters.map((s) => (
                     <option key={s.id} value={s.id}>
                       Target: {s.name}
                     </option>
                   ))}
                 </MedqsSelect>
               </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={createAd} disabled={submitting || !form.imageUrl}
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-sm font-bold text-white shadow shadow-blue-500/20 hover:opacity-90 disabled:opacity-60 transition-all font-display">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              {submitting ? "Engaging…" : "Deploy Campaign"}
            </button>
          </div>
        </div>
      )}

      {/* Ads list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500/20" />
          <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">Querying Marketing Engine…</p>
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/[0.02] py-20 text-center bg-card/10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
             <Megaphone className="h-8 w-8 text-muted-foreground opacity-30" />
          </div>
          <p className="font-display text-lg font-bold">Inert Campaign Status</p>
          <p className="text-sm text-muted-foreground max-w-xs">No active promotions detected. Launch a new campaign to increase user engagement.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {ads.map((ad) => (
            <div key={ad.id} className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
              ad.active ? "border-white/[0.02]" : "border-white/[0.02] opacity-60 grayscale-[0.8]"
            )}>
              <div className="relative aspect-[21/9] overflow-hidden">
                 <img src={ad.imageUrl} alt="Ad banner" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                 
                 <div className="absolute top-3 left-3 flex gap-2">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md",
                      ad.active ? "bg-emerald-500/80 text-white border border-emerald-400/50" : "bg-muted/80 text-muted-foreground border border-white/[0.05]")}>
                      {ad.active ? <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> : null}
                      {ad.active ? "Live" : "Inactive"}
                    </span>
                    {!ad.semesterId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/80 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-md border border-blue-400/50">
                        Global
                      </span>
                    )}
                 </div>

                 <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                       {ad.linkUrl ? (
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/90 truncate">
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{ad.linkUrl}</span>
                         </div>
                       ) : (
                         <span className="text-[10px] font-bold text-white/40 italic">No Redirect</span>
                       )}
                    </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-4">
                <div className="flex flex-col gap-0.5">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Created On</p>
                   <p className="text-xs font-bold">{new Date(ad.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(ad)}
                    className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-all border border-white/[0.05]",
                      ad.active ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white" : "bg-muted text-muted-foreground hover:bg-foreground hover:text-background")}>
                    {ad.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button onClick={() => deleteAd(ad.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] bg-background/50 text-muted-foreground transition-all hover:bg-red-500 hover:text-white hover:border-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {ad.semesterId && (
                <div className="px-4 pb-4">
                   <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 border border-white/[0.05]">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-sm" />
                      <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tighter">Segment: {semesters.find(s => s.id === ad.semesterId)?.name || ad.semesterId}</p>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



