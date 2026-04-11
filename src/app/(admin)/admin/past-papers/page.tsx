"use client";
import { useState, useEffect } from "react";
import {
  FileText, Plus, Trash2, Loader2,
  Clock, BarChart3, CheckCircle2, AlertCircle,
} from "lucide-react";
import { FileUploader } from "@/components/ui/FileUploader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";

interface Module  { id: string; name: string }
interface Semester { id: string; name: string }
interface PastPaper {
  id: string; title: string; pdfUrl?: string;
  isInteractive: boolean; timeLimitMin?: number;
  semesterId: string; moduleId: string;
  createdAt: string;
  module: { name: string };
  _count: { attempts: number; paperQuestions?: number };
  aiExplanationEnabled?: boolean;
  allowAiDuringQuiz?: boolean;
  secureExamMode?: boolean;
  restrictCopyPaste?: boolean;
  trackFocusLoss?: boolean;
  googleSheetsSyncEnabled?: boolean;
}

export default function AdminPastPapersPage() {
  const [papers, setPapers]     = useState<PastPaper[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [modules, setModules]   = useState<Module[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({
    title: "",
    semesterId: "",
    moduleId: "",
    isInteractive: false,
    timeLimitMin: "",
    pdfUrl: "",
    aiExplanationEnabled: true,
    allowAiDuringQuiz: false,
    secureExamMode: false,
    restrictCopyPaste: false,
    trackFocusLoss: false,
    googleSheetsSyncEnabled: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ppRes, sRes, mRes] = await Promise.all([
          fetch("/api/v1/past-papers"),
          fetch("/api/v1/semesters"),
          fetch("/api/v1/modules-all"),
        ]);

        const pp = ppRes.ok ? await ppRes.json().catch(() => []) : [];
        const s = sRes.ok ? await sRes.json().catch(() => []) : [];
        const m = mRes.ok ? await mRes.json().catch(() => []) : [];

        if (!cancelled) {
          setPapers(Array.isArray(pp) ? pp : []);
          setSemesters(Array.isArray(s) ? s : []);
          setModules(Array.isArray(m) ? m : []);
        }

        if (!ppRes.ok && !cancelled) {
          toast.error("Could not load papers. Check server/DB migration then refresh.");
        }
      } catch {
        if (!cancelled) toast.error("Failed to load page data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    if (!form.title || !form.semesterId || !form.moduleId)
      return toast.error("Fill in title, semester, and module");

    setSaving(true);
    const res = await fetch("/api/v1/past-papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        semesterId: form.semesterId,
        moduleId: form.moduleId,
        isInteractive: form.isInteractive,
        timeLimitMin: form.timeLimitMin ? parseInt(form.timeLimitMin) : null,
        pdfUrl: form.pdfUrl || null,
        aiExplanationEnabled: form.aiExplanationEnabled,
        allowAiDuringQuiz: form.allowAiDuringQuiz,
        secureExamMode: form.secureExamMode,
        restrictCopyPaste: form.restrictCopyPaste,
        trackFocusLoss: form.trackFocusLoss,
        googleSheetsSyncEnabled: form.googleSheetsSyncEnabled,
      }),
    });

    if (res.ok) {
      const paper = await res.json();
      setPapers(prev => [paper, ...prev]);
      setForm({
        title: "",
        semesterId: "",
        moduleId: "",
        isInteractive: false,
        timeLimitMin: "",
        pdfUrl: "",
        aiExplanationEnabled: true,
        allowAiDuringQuiz: false,
        secureExamMode: false,
        restrictCopyPaste: false,
        trackFocusLoss: false,
        googleSheetsSyncEnabled: false,
      });
      setShowForm(false);
      toast.success("Past paper created!");
    } else {
      toast.error(await apiErrorMessage(res, "Failed to create"));
    }
    setSaving(false);
  }

  async function patchPaper(
    id: string,
    patch: Partial<
      Pick<
        PastPaper,
        | "aiExplanationEnabled"
        | "allowAiDuringQuiz"
        | "secureExamMode"
        | "restrictCopyPaste"
        | "trackFocusLoss"
        | "googleSheetsSyncEnabled"
      >
    >
  ) {
    const res = await fetch(`/api/v1/past-papers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Could not update paper"));
      return;
    }
    const updated = await res.json();
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? All student attempts will be lost.`)) return;
    const res = await fetch(`/api/v1/past-papers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPapers(prev => prev.filter(p => p.id !== id));
      toast.success("Deleted");
    } else {
      toast.error(await apiErrorMessage(res, "Failed to delete"));
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Past Papers</h1>
          <p className="mt-1 text-sm text-muted-foreground">{papers.length} papers uploaded</p>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Paper"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4 animate-fade-in">
          <h2 className="font-semibold">Add Past Paper</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Anatomy Final Exam 2024"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Semester *</label>
              <select
                value={form.semesterId}
                onChange={e => setForm(f => ({ ...f, semesterId: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select semester...</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Module *</label>
              <select
                value={form.moduleId}
                onChange={e => setForm(f => ({ ...f, moduleId: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select module...</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Time limit (minutes) <span className="opacity-60">optional</span>
              </label>
              <input
                type="number"
                value={form.timeLimitMin}
                onChange={e => setForm(f => ({ ...f, timeLimitMin: e.target.value }))}
                placeholder="e.g. 60"
                min="1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Interactive quiz</p>
                <p className="text-xs text-muted-foreground">
                  Linked question set (Quiz Creator) or all module questions if none linked
                </p>
              </div>
              <div
                onClick={() => setForm(f => ({ ...f, isInteractive: !f.isInteractive }))}
                className={cn(
                  "relative ml-auto flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  form.isInteractive ? "bg-primary" : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
                  form.isInteractive ? "translate-x-6" : "translate-x-1"
                )} />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-emerald-200/70 bg-emerald-50/30 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/15">
              <div>
                <p className="text-sm font-medium">Google Sheets sync</p>
                <p className="text-xs text-muted-foreground">
                  Append each attempt to the live tab (server env <code className="rounded bg-muted px-1">GOOGLE_SHEETS_*</code>)
                </p>
              </div>
              <div
                role="switch"
                aria-checked={form.googleSheetsSyncEnabled}
                onClick={() => setForm((f) => ({ ...f, googleSheetsSyncEnabled: !f.googleSheetsSyncEnabled }))}
                className={cn(
                  "relative ml-auto flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  form.googleSheetsSyncEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
                    form.googleSheetsSyncEnabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">AI explanations</p>
                <p className="text-xs text-muted-foreground">Gemini “explain this question” on review / quiz</p>
              </div>
              <div
                role="switch"
                aria-checked={form.aiExplanationEnabled}
                onClick={() => setForm((f) => ({ ...f, aiExplanationEnabled: !f.aiExplanationEnabled }))}
                className={cn(
                  "relative ml-auto flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  form.aiExplanationEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
                    form.aiExplanationEnabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">AI during quiz</p>
                <p className="text-xs text-muted-foreground">
                  If off, AI only after submit / on results page (recommended for exams)
                </p>
              </div>
              <div
                role="switch"
                aria-checked={form.allowAiDuringQuiz}
                onClick={() => setForm((f) => ({ ...f, allowAiDuringQuiz: !f.allowAiDuringQuiz }))}
                className={cn(
                  "relative ml-auto flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  form.allowAiDuringQuiz ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
                    form.allowAiDuringQuiz ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Exam integrity (interactive papers)</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.secureExamMode}
                    onChange={(e) => setForm((f) => ({ ...f, secureExamMode: e.target.checked }))}
                    className="rounded border-border"
                  />
                  Secured exam (exam only, no tutor)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.restrictCopyPaste}
                    onChange={(e) => setForm((f) => ({ ...f, restrictCopyPaste: e.target.checked }))}
                    className="rounded border-border"
                  />
                  Block copy / right-click on questions
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={form.trackFocusLoss}
                    onChange={(e) => setForm((f) => ({ ...f, trackFocusLoss: e.target.checked }))}
                    className="rounded border-border"
                  />
                  Track tab switches + warn
                </label>
              </div>
            </div>
          </div>

          {/* PDF upload */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              PDF file <span className="opacity-60">(optional — for non-interactive papers)</span>
            </label>
            {form.pdfUrl ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <p className="flex-1 text-sm text-emerald-700 dark:text-emerald-400 truncate">PDF uploaded</p>
                <button
                  onClick={() => setForm(f => ({ ...f, pdfUrl: "" }))}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            ) : (
              <FileUploader
                folder="pastpaper"
                accept=".pdf"
                maxSizeMB={50}
                onUpload={(files) => {
                  if (files[0]) setForm(f => ({ ...f, pdfUrl: files[0].url }));
                }}
              />
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Creating..." : "Create Paper"}
            </button>
          </div>
        </div>
      )}

      {/* Papers list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : papers.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground opacity-30" />
          <p className="font-medium">No past papers yet</p>
          <p className="text-sm text-muted-foreground">Click &quot;Add Paper&quot; to upload the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {papers.map(paper => (
            <div key={paper.id} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{paper.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{paper.module?.name ?? "—"}</span>
                    {paper.timeLimitMin && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {paper.timeLimitMin} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" /> {paper._count?.attempts ?? 0} attempts
                    </span>
                    {paper.isInteractive && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        Interactive
                      </span>
                    )}
                    {paper.isInteractive && (paper._count?.paperQuestions ?? 0) > 0 && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {paper._count?.paperQuestions} linked Q
                      </span>
                    )}
                    {paper.googleSheetsSyncEnabled && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Sheets
                      </span>
                    )}
                    {paper.aiExplanationEnabled === false && (
                      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        No AI
                      </span>
                    )}
                    {paper.allowAiDuringQuiz && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
                        AI in-quiz
                      </span>
                    )}
                    {paper.secureExamMode && (
                      <span className="rounded-full bg-amber-200 px-2 py-0.5 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                        Secured
                      </span>
                    )}
                    {paper.pdfUrl && (
                      <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline">PDF</a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const on = paper.aiExplanationEnabled !== false;
                      patchPaper(paper.id, { aiExplanationEnabled: !on });
                    }}
                    className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                  >
                    {paper.aiExplanationEnabled === false ? "Enable AI" : "Disable AI"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchPaper(paper.id, { allowAiDuringQuiz: !Boolean(paper.allowAiDuringQuiz) })
                    }
                    className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                  >
                    {paper.allowAiDuringQuiz ? "AI only after quiz" : "Allow AI in quiz"}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchPaper(paper.id, { secureExamMode: !Boolean(paper.secureExamMode) })}
                    className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                  >
                    {paper.secureExamMode ? "Unsecure exam" : "Secure exam"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchPaper(paper.id, { googleSheetsSyncEnabled: !Boolean(paper.googleSheetsSyncEnabled) })
                    }
                    className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
                  >
                    {paper.googleSheetsSyncEnabled ? "Sheets off" : "Sheets on"}
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(paper.id, paper.title)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
