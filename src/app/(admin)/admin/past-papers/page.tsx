"use client";
import { useState, useEffect } from "react";
import {
  FileText, Plus, Trash2, Loader2,
  Clock, BarChart3, CheckCircle2, AlertCircle, X, Search, Filter, BookOpen, MapPin, User, ChevronDown, ChevronRight
} from "lucide-react";
import { FileUploader } from "@/components/ui/FileUploader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

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
        const sRaw = sRes.ok ? await sRes.json().catch(() => []) : [];
        const mRaw = mRes.ok ? await mRes.json().catch(() => []) : [];

        if (!cancelled) {
          setPapers(Array.isArray(pp) ? pp : []);
          setSemesters(unwrapApiList(sRaw));
          setModules(unwrapApiList(mRaw));
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
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Academic Archives</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Past Papers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload exam archives and configure interactive sessions with AI proctoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground sm:flex">
            <FileText className="h-4 w-4 text-primary" />
            <span>{papers.length.toLocaleString()} Papers</span>
          </div>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow shadow-blue-500/30 hover:opacity-90 transition-all"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Paper"}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-500/20 bg-card p-6 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">New Past Paper</h2>
              <p className="text-xs text-muted-foreground">Configure the exam title, visibility, and AI features.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Exam Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Final Anatomy Exam 2024"
                className="w-full h-11 rounded-xl border-border/60 bg-background/50 px-4 text-sm focus:ring-blue-500/40 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Semester Selection *</label>
              <MedqsSelect
                value={form.semesterId}
                onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value }))}
                className="w-full h-11 rounded-xl border-border/60 bg-background/50"
              >
                <option value="">Select Semester…</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </MedqsSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Assigned Module *</label>
              <MedqsSelect
                value={form.moduleId}
                onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value }))}
                className="w-full h-11 rounded-xl border-border/60 bg-background/50"
              >
                <option value="">Select Module…</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </MedqsSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Duration (Min) <span className="opacity-60">optional</span></label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  value={form.timeLimitMin}
                  onChange={(e) => setForm((f) => ({ ...f, timeLimitMin: e.target.value }))}
                  placeholder="e.g. 60"
                  className="w-full h-11 rounded-xl border-border/60 bg-background/50 pl-10 pr-4 text-sm focus:ring-blue-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 p-3">
              <div>
                <p className="text-sm font-bold">Interactive Mode</p>
                <p className="text-[10px] text-muted-foreground">Enable student quiz logic</p>
              </div>
              <button
                onClick={() => setForm((f) => ({ ...f, isInteractive: !f.isInteractive }))}
                className={cn(
                  "relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  form.isInteractive ? "bg-blue-600 shadow-sm shadow-blue-500/40" : "bg-muted"
                )}
              >
                <span className={cn(
                  "h-4 w-4 rounded-full bg-white shadow transition-transform",
                  form.isInteractive ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
             <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Google Sync</span>
                <button
                  onClick={() => setForm((f) => ({ ...f, googleSheetsSyncEnabled: !f.googleSheetsSyncEnabled }))}
                  className={cn(
                    "relative flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    form.googleSheetsSyncEnabled ? "bg-emerald-500" : "bg-muted"
                  )}
                >
                  <span className={cn("h-3 w-3 rounded-full bg-white shadow transition-transform", form.googleSheetsSyncEnabled ? "translate-x-5" : "translate-x-1")} />
                </button>
             </div>
             <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">AI Tutor</span>
                <button
                  onClick={() => setForm((f) => ({ ...f, aiExplanationEnabled: !f.aiExplanationEnabled }))}
                  className={cn(
                    "relative flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    form.aiExplanationEnabled ? "bg-blue-500" : "bg-muted"
                  )}
                >
                  <span className={cn("h-3 w-3 rounded-full bg-white shadow transition-transform", form.aiExplanationEnabled ? "translate-x-5" : "translate-x-1")} />
                </button>
             </div>
             <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Secured Exam</span>
                <button
                  onClick={() => setForm((f) => ({ ...f, secureExamMode: !f.secureExamMode }))}
                  className={cn(
                    "relative flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    form.secureExamMode ? "bg-amber-500" : "bg-muted"
                  )}
                >
                  <span className={cn("h-3 w-3 rounded-full bg-white shadow transition-transform", form.secureExamMode ? "translate-x-5" : "translate-x-1")} />
                </button>
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">PDF Document <span className="opacity-50">(Manual Only)</span></label>
            {form.pdfUrl ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="flex-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate">Document ready for publish</p>
                <button onClick={() => setForm(f => ({ ...f, pdfUrl: "" }))} className="text-xs font-bold text-muted-foreground hover:text-red-500">Remove</button>
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

          <div className="flex items-center justify-between border-t border-border/60 pt-5">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Discard</button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow shadow-blue-500/30 hover:opacity-90 disabled:opacity-60 transition-all font-display"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Plus className="h-4 w-4 text-white" />}
              Create Archives
            </button>
          </div>
        </div>
      )}

      {/* Papers list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : papers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-24 text-center bg-muted/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground opacity-30" />
          </div>
          <p className="font-display text-lg font-bold">No archives yet</p>
          <p className="max-w-xs text-sm text-muted-foreground mt-1">Upload exams to provide students with assessment history.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {papers.map(paper => (
            <div key={paper.id} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-blue-500/40 hover:shadow-lg">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 shadow-inner">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold truncate">{paper.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                       <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase font-bold text-foreground/70">
                        {paper.module?.name ?? "General"}
                       </span>
                       <span className="h-1 w-1 rounded-full bg-border" />
                       <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                         {paper.timeLimitMin && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {paper.timeLimitMin}m</span>}
                         <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {paper._count?.attempts ?? 0} sign-ins</span>
                       </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {paper.isInteractive && <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-500 uppercase tracking-tight ring-1 ring-violet-500/20">Interactive</span>}
                      {paper.isInteractive && (paper._count?.paperQuestions ?? 0) > 0 && <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-500/10">{paper._count?.paperQuestions} Questions</span>}
                      {paper.googleSheetsSyncEnabled && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 uppercase tracking-tight ring-1 ring-emerald-500/20">Sync On</span>}
                      {paper.secureExamMode && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 uppercase tracking-tight ring-1 ring-amber-500/20">Secured</span>}
                      {paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500 hover:bg-blue-500/20 transition-colors uppercase tracking-tight ring-1 ring-blue-500/20">PDF Archive</a>}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <div className="flex flex-wrap gap-1 sm:justify-end">
                    {[
                      { label: "AI Tutor", active: paper.aiExplanationEnabled !== false, onClick: () => patchPaper(paper.id, { aiExplanationEnabled: !paper.aiExplanationEnabled }) },
                      { label: "AI In-Quiz", active: !!paper.allowAiDuringQuiz, onClick: () => patchPaper(paper.id, { allowAiDuringQuiz: !paper.allowAiDuringQuiz }) },
                      { label: "Secured", active: !!paper.secureExamMode, onClick: () => patchPaper(paper.id, { secureExamMode: !paper.secureExamMode }) },
                      { label: "Sync", active: !!paper.googleSheetsSyncEnabled, onClick: () => patchPaper(paper.id, { googleSheetsSyncEnabled: !paper.googleSheetsSyncEnabled }) }
                    ].map(btn => (
                      <button
                        key={btn.label}
                        onClick={btn.onClick}
                        className={cn(
                          "rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-widest transition-all",
                          btn.active ? "bg-blue-600 text-white shadow shadow-blue-500/30" : "border border-border/60 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDelete(paper.id, paper.title)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/50 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 sm:self-end"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
