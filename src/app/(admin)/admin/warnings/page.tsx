"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Warning {
  id: string; severity: string; status: string; reason: string; description?: string;
  createdAt: string; expiresAt?: string;
  user: { id: string; name: string; email: string; image?: string };
  issuedBy: { id: string; name: string };
  revokedBy?: { id: string; name: string } | null;
}

export default function WarningsPage() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  async function fetchWarnings(reset = false) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      if (severity) params.set("severity", severity);
      if (!reset && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/v1/admin/platform/warnings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setWarnings(reset ? json.data : [...warnings, ...json.data]);
      setHasMore(json.meta.hasMore);
      setCursor(json.meta.nextCursor);
      setTotal(json.meta.total);
    } catch (err) {
      setError("Failed to load warnings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchWarnings(true); }, [status, severity]);

  const severityColor: Record<string, string> = {
    MILD: "bg-blue-500/10 text-blue-500",
    MODERATE: "bg-amber-500/10 text-amber-500",
    SEVERE: "bg-orange-500/10 text-orange-500",
    CRITICAL: "bg-red-500/10 text-red-500",
  };
  const statusColor: Record<string, string> = {
    ACTIVE: "bg-red-500/10 text-red-500",
    EXPIRED: "bg-muted text-muted-foreground",
    REVOKED: "bg-emerald-500/10 text-emerald-500",
    SERVED: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Warning System</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{total} total warnings</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setCursor(null); }}
          className="rounded-xl border border-white/[0.02] bg-card px-3 py-2 text-xs font-medium outline-none">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
          <option value="SERVED">Served</option>
        </select>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setCursor(null); }}
          className="rounded-xl border border-white/[0.02] bg-card px-3 py-2 text-xs font-medium outline-none">
          <option value="">All Severities</option>
          <option value="MILD">Mild</option>
          <option value="MODERATE">Moderate</option>
          <option value="SEVERE">Severe</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground self-center">{total} results</span>
      </div>

      <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
        {loading && warnings.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-48 items-center justify-center text-sm text-red-500">{error}</div>
        ) : warnings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <AlertTriangle className="h-8 w-8" />
            <p className="text-sm">No warnings found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {warnings.map((w) => (
              <div key={w.id} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/users/${w.user.id}`} className="text-sm font-medium hover:underline">
                      {w.user.name}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severityColor[w.severity] ?? ""}`}>
                      {w.severity}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[w.status] ?? ""}`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{w.reason}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Issued by {w.issuedBy.name} · {new Date(w.createdAt).toLocaleDateString()}
                    {w.expiresAt && ` · Expires ${new Date(w.expiresAt).toLocaleDateString()}`}
                    {w.revokedBy && ` · Revoked by ${w.revokedBy.name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button onClick={() => fetchWarnings(false)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.02] bg-card px-4 py-2 text-xs font-medium transition-colors hover:bg-muted/40">
            {loading ? "Loading..." : "Load More"} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
