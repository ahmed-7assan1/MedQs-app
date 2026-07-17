"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Download, FileText, FileImage, FileCode, Trash2, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDownloads, removeDownload, clearDownloads, type DownloadRecord } from "@/lib/local-downloads-store";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PDF", label: "PDF" },
  { key: "IMAGE", label: "Images" },
  { key: "LECTURE", label: "Lectures" },
  { key: "OTHER", label: "Other" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TYPE_META: Record<string, { icon: typeof FileText; bg: string; color: string }> = {
  PDF:    { icon: FileText,  bg: "bg-red-500/10", color: "text-red-500" },
  IMAGE:  { icon: FileImage, bg: "bg-sky-500/10", color: "text-sky-500" },
  LECTURE:{ icon: FileCode,  bg: "bg-amber-500/10", color: "text-amber-500" },
  OTHER:  { icon: FileCode,  bg: "bg-orange-500/10", color: "text-orange-500" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

type GroupKey = "PDF" | "IMAGE" | "LECTURE" | "OTHER";

const GROUP_LABELS: Record<GroupKey, string> = {
  PDF: "PDF Files",
  IMAGE: "Images",
  LECTURE: "Lecture Files",
  OTHER: "Other Files",
};

const GROUP_ORDER: GroupKey[] = ["PDF", "IMAGE", "LECTURE", "OTHER"];

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export default function DownloadsClient() {
  const [tab, setTab] = useState<TabKey>("ALL");
  const [records, setRecords] = useState<DownloadRecord[]>([]);

  const getSnapshot = useCallback(() => {
    return getDownloads();
  }, []);

  useEffect(() => {
    setRecords(getSnapshot());
    const unsub = subscribe(() => {
      setRecords(getSnapshot());
    });
    return unsub;
  }, [getSnapshot]);

  const filtered = tab === "ALL" ? records : records.filter((r) => r.type === tab);

  const handleRemove = (id: string) => {
    removeDownload(id);
    setRecords(getDownloads());
  };

  const handleRedownload = async (e: React.MouseEvent, record: DownloadRecord) => {
    e.preventDefault();
    e.stopPropagation();
    const proxyUrl = `/api/v1/download-proxy?url=${encodeURIComponent(record.fileUrl)}&filename=${encodeURIComponent(record.fileName)}`;
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(proxyUrl, "_blank");
    }
  };

  const grouped = GROUP_ORDER
    .map((key) => ({ key, label: GROUP_LABELS[key], items: filtered.filter((r) => r.type === key) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-16 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Downloads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {records.length} {records.length === 1 ? "file" : "files"} saved to your device
            </p>
          </div>
          {records.length > 0 && (
            <button
              onClick={() => { clearDownloads(); setRecords([]); }}
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>

        {/* ── Filter Tabs ── */}
        <div className="mt-6 flex items-center gap-1.5 rounded-2xl bg-card/50 p-1.5 ring-1 ring-border/40 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-semibold transition-all",
                tab === t.key
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Empty State ── */}
        {filtered.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/30 bg-card/20 py-20 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-card/40">
              <Download className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No downloads yet</h2>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              Files you download from lectures and resources will appear here
            </p>
            <Link
              href="/modules"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Browse Modules
            </Link>
          </div>
        )}

        {/* ── Grouped Cards ── */}
        {grouped.map((group) => (
          <section key={group.key} className="mt-8">
            <div className="flex items-center gap-2.5 mb-3">
              <span className={cn("h-2 w-2 rounded-full", TYPE_META[group.key]?.bg.replace("/10", "") || "bg-muted-foreground")} />
              <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
              <span className="text-[11px] font-medium text-muted-foreground">({group.items.length})</span>
            </div>
            <div className="space-y-2">
              {group.items.map((record) => {
                const meta = TYPE_META[record.type] || TYPE_META.OTHER;
                const Icon = meta.icon;
                return (
                  <div
                    key={record.id}
                    className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm hover:border-border"
                  >
                    {/* Type icon */}
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors", meta.bg)}>
                      <Icon className={cn("h-5 w-5", meta.color)} />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{record.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">{record.fileName}</span>
                        {record.fileSize ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{formatSize(record.fileSize)}</span>
                          </>
                        ) : null}
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(record.downloadedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleRedownload(e, record)}
                        className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                        title="Download again"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(record.id)}
                        className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Remove from list"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
  );
}
