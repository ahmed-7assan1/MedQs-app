"use client";

import { useState, useEffect } from "react";
import { Flag, Check, X, ShieldWarning, Trash, CircleNotch, Prohibit } from "@phosphor-icons/react";
import toast from "react-hot-toast";

type ReportStatus = "PENDING" | "DISMISSED" | "RESOLVED";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; name: string; image: string | null };
  actions: { id: string; action: string; note: string | null; createdAt: string; admin: { id: string; name: string } }[];
}

export default function SocialReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReportStatus>("PENDING");
  const [counts, setCounts] = useState({ pending: 0, dismissed: 0, resolved: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async (status: ReportStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/reports?status=${status}`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports);
        setCounts(data.counts);
      } else {
        toast.error(data.error || "Failed to load");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(tab);
  }, [tab]);

  const handleAction = async (reportId: string, action: string) => {
    setActionLoading(reportId);
    try {
      const res = await fetch("/api/v1/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });
      if (res.ok) {
        toast.success(action === "DISMISSED" ? "Report dismissed" : "Report resolved");
        fetchReports(tab);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: ReportStatus; label: string; count: number }[] = [
    { key: "PENDING", label: "Pending", count: counts.pending },
    { key: "DISMISSED", label: "Dismissed", count: counts.dismissed },
    { key: "RESOLVED", label: "Resolved", count: counts.resolved },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
          <Flag className="h-6 w-6" weight="bold" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Social Reports</h1>
          <p className="text-sm text-muted-foreground">Review reported posts, comments, and users.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl bg-muted/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              tab === t.key
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <CircleNotch className="h-8 w-8 animate-spin text-muted-foreground" weight="bold" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-20 text-center shadow-sm">
          <Flag className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" weight="bold" />
          <h2 className="text-lg font-semibold text-muted-foreground">All clear!</h2>
          <p className="mt-1 text-sm text-muted-foreground">No {tab.toLowerCase()} reports.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Reported by {report.reporter.name}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {report.targetType}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {report.reason}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>

                {tab === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(report.id, "DISMISSED")}
                      disabled={actionLoading === report.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-muted px-3 text-xs font-semibold text-muted-foreground hover:bg-muted/80 transition-all disabled:opacity-50"
                    >
                      {actionLoading === report.id ? <CircleNotch className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "RESOLVED")}
                      disabled={actionLoading === report.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      {actionLoading === report.id ? <CircleNotch className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Resolve
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "WARNED")}
                      disabled={actionLoading === report.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                    >
                      {actionLoading === report.id ? <CircleNotch className="h-3 w-3 animate-spin" /> : <ShieldWarning className="h-3 w-3" />}
                      Warn
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "REMOVED")}
                      disabled={actionLoading === report.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/10 px-3 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      {actionLoading === report.id ? <CircleNotch className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {report.description && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="mb-1 font-semibold">Reporter note:</p>
                  <p>{report.description}</p>
                </div>
              )}

              {report.actions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</p>
                  {report.actions.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                      <span className="font-semibold text-foreground">{a.admin.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className={`font-semibold ${
                        a.action === "DISMISSED" ? "text-muted-foreground" :
                        a.action === "WARNED" ? "text-amber-600" :
                        a.action === "REMOVED" ? "text-red-600" :
                        "text-emerald-600"
                      }`}>
                        {a.action}
                      </span>
                      {a.note && <><span className="text-muted-foreground">•</span><span className="text-muted-foreground">{a.note}</span></>}
                      <span className="mr-auto text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-xs text-muted-foreground">
                Target: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{report.targetType}#{report.targetId.slice(0, 8)}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
