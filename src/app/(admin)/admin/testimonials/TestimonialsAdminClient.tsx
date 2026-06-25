"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Check, X, Trash2, Loader2, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface Testimonial {
  id: string;
  content: string;
  rating: number;
  authorName: string;
  userId?: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export function TestimonialsAdminClient() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/testimonials");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: "APPROVED" | "REJECTED") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/v1/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) throw new Error();
      if (action === "REJECTED") {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        toast.success("Testimonial deleted");
      } else {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "APPROVED" } : t))
        );
        toast.success("Testimonial approved");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial permanently?")) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/v1/admin/testimonials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      toast.success("Testimonial deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <p className="text-sm text-muted-foreground">Manage user reviews and testimonials</p>
      </div>

      {testimonials.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No testimonials yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{t.authorName}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[t.status] || ""}`}>
                      {t.status === "PENDING" ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-0.5 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className={`h-4 w-4 ${k < t.rating ? "fill-current" : "fill-none opacity-30"}`} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-foreground/80">&ldquo;{t.content}&rdquo;</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {t.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleAction(t.id, "APPROVED")}
                        disabled={processing === t.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {processing === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(t.id, "REJECTED")}
                        disabled={processing === t.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-600 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </button>
                    </>
                  )}
                  {t.status === "APPROVED" && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={processing === t.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
