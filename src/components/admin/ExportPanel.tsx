"use client";
import { useState } from "react";
import { FileSpreadsheet, Loader2, ExternalLink, Download } from "lucide-react";
import toast from "react-hot-toast";

type ExportType = "quiz" | "users";

interface ExportResult {
  url: string;
  rows: number;
}

export function ExportPanel() {
  const [loading, setLoading] = useState<ExportType | null>(null);
  const [results, setResults] = useState<Record<ExportType, ExportResult | null>>({
    quiz: null,
    users: null,
  });

  async function handleExport(type: ExportType) {
    setLoading(type);
    try {
      const res = await fetch(`/api/v1/admin/export?type=${type}`);
      const data = await res.json();
      if (res.ok) {
        setResults((prev) => ({ ...prev, [type]: data }));
        toast.success(`Exported ${data.rows} rows to Google Sheets`);
      } else {
        toast.error(data.error ?? "Export failed");
      }
    } catch {
      toast.error("Export failed — check Google Sheets configuration");
    } finally {
      setLoading(null);
    }
  }

  const exports: { type: ExportType; label: string; desc: string }[] = [
    { type: "quiz",  label: "Quiz Results",  desc: "All quiz attempts with scores, student names, and timestamps" },
    { type: "users", label: "Student Data",  desc: "All users with rank, points, university, and semester" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
        <h2 className="font-display text-lg font-semibold">Export to Google Sheets</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Exports are written to your configured spreadsheet. Make sure{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">GOOGLE_SHEETS_SERVICE_ACCOUNT</code> and{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">GOOGLE_SHEETS_SPREADSHEET_ID</code> are set.
      </p>

      <div className="space-y-3">
        {exports.map(({ type, label, desc }) => (
          <div key={type} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div className="min-w-0">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
              {results[type] && (
                <a
                  href={results[type]!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open — {results[type]!.rows} rows exported
                </a>
              )}
            </div>
            <button
              onClick={() => handleExport(type)}
              disabled={loading !== null}
              className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading === type
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />
              }
              {loading === type ? "Exporting..." : "Export"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
