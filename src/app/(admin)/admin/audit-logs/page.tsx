"use client";
import { useState, useEffect } from "react";
import { Loader2, Activity, ShieldAlert, User as UserIcon, FileText, Database, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/v1/admin/audit-logs");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        } else {
          toast.error("Failed to fetch audit logs");
        }
      } catch (e) {
        toast.error("Network error fetching logs");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  function getEntityIcon(entity: string) {
    switch (entity.toUpperCase()) {
      case "USER": return <UserIcon className="h-4 w-4 text-blue-500" />;
      case "QUESTION": return <FileText className="h-4 w-4 text-emerald-500" />;
      case "SETTING": return <ShieldCheck className="h-4 w-4 text-amber-500" />;
      default: return <Database className="h-4 w-4 text-indigo-500" />;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 pb-24 space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-red-500">Security & Compliance</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">System Audit Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all administrative actions, data modifications, and security events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2 text-sm font-bold text-red-600 dark:text-red-400">
            <ShieldAlert className="h-4 w-4" />
            <span>Immutable Trail</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.02] bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Decrypting Logs…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Activity className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm font-bold text-muted-foreground">No recent activity found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border border-white/[0.05]">
                  {getEntityIcon(log.entity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold truncate">
                      {log.user?.name || "System"} <span className="text-muted-foreground font-normal">performed</span> {log.action}
                    </p>
                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider whitespace-nowrap ml-4">
                      {format(new Date(log.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-muted font-mono text-[10px]">{log.entity}</span>
                    {log.entityId && (
                      <span className="px-2 py-0.5 rounded bg-muted/50 font-mono text-[10px] truncate max-w-[150px]">ID: {log.entityId}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
