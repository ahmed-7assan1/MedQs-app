"use client";

import { useEffect, useState } from "react";
import { Activity, Users } from "lucide-react";

interface AdminLog {
  id: string; action: string; entityType: string; entityId?: string;
  description?: string; createdAt: string;
  admin: { id: string; name: string; email: string; image?: string };
}

export default function AdminMonitoringPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [adminSummary, setAdminSummary] = useState<any[]>([]);
  const [actionBreakdown, setActionBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [days]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/admin/platform/admin-monitoring?days=${days}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setLogs(json.data);
      setAdminSummary(json.summaries?.adminSummary ?? []);
      setActionBreakdown(json.summaries?.actionBreakdown ?? []);
    } catch (err) {
      setError("Failed to load admin monitoring data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform Admin</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Admin Monitoring</h1>
      </div>

      <div className="flex items-center gap-2">
        {[1, 7, 30].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              days === d ? "bg-blue-500/20 text-blue-500" : "bg-card text-muted-foreground hover:bg-muted/40"
            }`}>{d}d</button>
        ))}
      </div>

      {error ? (
        <div className="flex h-48 items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.02] bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <p className="font-semibold">Admin Activity</p>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : adminSummary.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity in this period</p>
              ) : (
                adminSummary.map((a: any) => (
                  <div key={a.adminId} className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{a.name ?? a.adminId.slice(0, 8)}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-500">{a.actionCount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.02] bg-card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-500" />
              <p className="font-semibold">Action Breakdown</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : actionBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground">No actions in this period</p>
            ) : (
              <div className="space-y-1.5">
                {actionBreakdown.map((ab: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{ab.action}</span>
                      <span className="text-xs text-muted-foreground">{ab.entityType}</span>
                    </div>
                    <span className="text-xs font-bold">{ab._count.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
        <div className="border-b border-white/[0.02] bg-muted/20 px-5 py-3">
          <p className="font-semibold">Recent Actions</p>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">No recent actions</div>
        ) : (
          <div className="divide-y divide-border/40">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  <Activity className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{log.action}</span>
                    <span className="text-xs text-muted-foreground">{log.entityType}</span>
                    <span className="text-xs text-muted-foreground">by {log.admin.name}</span>
                  </div>
                  {log.description && <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
