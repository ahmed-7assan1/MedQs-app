"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, XCircle, Clock } from "lucide-react";

interface SecurityEvent {
  id: string; type: string; severity: string; status: string;
  description?: string; ipAddress?: string; endpoint?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
  resolvedBy?: { id: string; name: string } | null;
}

export default function SecurityDashboardPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ total: 0, open: 0, critical: 0, high: 0 });
  const [typeBreakdown, setTypeBreakdown] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [typeFilter]);

  async function fetchEvents() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ days: "7", limit: "50" });
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/v1/admin/platform/security?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setEvents(json.data);
      setSummary(json.meta.summary);
      setTypeBreakdown(json.typeBreakdown ?? []);
    } catch (err) {
      setError("Failed to load security events");
    } finally {
      setLoading(false);
    }
  }

  const severityColor: Record<string, string> = {
    INFO: "bg-blue-500/10 text-blue-500",
    LOW: "bg-slate-500/10 text-slate-500",
    MEDIUM: "bg-amber-500/10 text-amber-500",
    HIGH: "bg-orange-500/10 text-orange-500",
    CRITICAL: "bg-red-500/10 text-red-500",
  };
  const statusColor: Record<string, string> = {
    NEW: "bg-red-500/10 text-red-500",
    INVESTIGATING: "bg-amber-500/10 text-amber-500",
    RESOLVED: "bg-emerald-500/10 text-emerald-500",
    FALSE_POSITIVE: "bg-blue-500/10 text-blue-500",
    IGNORED: "bg-muted text-muted-foreground",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Security Dashboard</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
          <Shield className="mb-1.5 h-5 w-5 text-blue-500" />
          <p className="font-display text-2xl font-bold">{summary.total}</p>
          <p className="text-[10px] text-muted-foreground">Total (7d)</p>
        </div>
        <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
          <AlertTriangle className="mb-1.5 h-5 w-5 text-red-500" />
          <p className="font-display text-2xl font-bold">{summary.open}</p>
          <p className="text-[10px] text-muted-foreground">Open</p>
        </div>
        <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
          <XCircle className="mb-1.5 h-5 w-5 text-orange-500" />
          <p className="font-display text-2xl font-bold">{summary.critical}</p>
          <p className="text-[10px] text-muted-foreground">Critical</p>
        </div>
        <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
          <Clock className="mb-1.5 h-5 w-5 text-amber-500" />
          <p className="font-display text-2xl font-bold">{summary.high}</p>
          <p className="text-[10px] text-muted-foreground">High</p>
        </div>
      </div>

      {error ? (
        <div className="flex h-32 items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <>
          {/* Type breakdown */}
          <div className="rounded-2xl border border-white/[0.02] bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Event Type Breakdown</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {typeBreakdown.map((tb: any, i: number) => (
                <button key={i} onClick={() => setTypeFilter(tb.type === typeFilter ? "" : tb.type)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    typeFilter === tb.type ? "border-blue-500/40 bg-blue-500/5" : "border-white/[0.02] bg-muted/20"
                  }`}>
                  <p className="text-xs font-medium">{tb.type.replace(/_/g, " ")}</p>
                  <p className="text-lg font-bold">{tb._count.id}</p>
                  <p className={`text-[10px] ${severityColor[tb.severity] ?? ""}`}>{tb.severity}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Events list */}
          <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
            <div className="border-b border-white/[0.02] bg-muted/20 px-5 py-3">
              <p className="font-semibold">Security Events</p>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No security events in this period</div>
            ) : (
              <div className="divide-y divide-border/40">
                {events.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/20">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      e.severity === "CRITICAL" ? "bg-red-500/20" : "bg-muted"
                    }`}>
                      <Shield className={`h-3.5 w-3.5 ${
                        e.severity === "CRITICAL" ? "text-red-500" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severityColor[e.severity] ?? ""}`}>
                          {e.severity}
                        </span>
                        <span className="text-xs font-medium">{e.type.replace(/_/g, " ")}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[e.status] ?? ""}`}>
                          {e.status}
                        </span>
                      </div>
                      {e.description && <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {e.endpoint && `${e.endpoint} · `}
                        {e.ipAddress && `${e.ipAddress} · `}
                        {e.user?.name && `User: ${e.user.name} · `}
                        {new Date(e.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
