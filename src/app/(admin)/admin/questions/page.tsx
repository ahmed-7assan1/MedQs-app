"use client";
import { useState, useEffect, useMemo } from "react";
import {
  HelpCircle, Plus, Trash2, Loader2,
  CheckCircle2, ChevronDown, ChevronUp, Search, ImagePlus, X, BookOpen, Pencil, FileText, Download, Settings, Save, ChevronLeft, ChevronRight
} from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, ShadingType, AlignmentType, VerticalAlign, UnderlineType, PageBreak } from "docx";
import { QuickDrawModal } from "@/components/draw/QuickDrawModal";
import { uploadQuestionImageClient } from "@/lib/upload-question-image-client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";
import dynamic from "next/dynamic";
const WordExportModal = dynamic(() => import("@/components/admin/WordExportModal").then((mod) => mod.WordExportModal), { ssr: false });
import Link from "next/link";

interface Question {
  id: string;
  body: string;
  imageUrl?: string | null;
  stemLayout?: "STANDARD" | "IMAGE_OVERLAY";
  answer: string;
  difficulty: string;
  explanation?: string | null;
  lectureId: string;
  lecture?: { title: string };
  choices: { key: string; text: string }[];
}

interface ModuleT { id: string; name: string }
interface SubjectT { id: string; name: string; moduleId: string }
interface LectureT { id: string; title: string; subjectId: string }

const DEFAULT_KEYS = ["A", "B", "C", "D"] as const;
const PAGE_SIZE = 18;

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [listPage, setListPage] = useState(0);

  const [modules, setModules] = useState<ModuleT[]>([]);
  const [subjects, setSubjects] = useState<SubjectT[]>([]);
  const [lectures, setLectures] = useState<LectureT[]>([]);
  const [filterLectures, setFilterLectures] = useState<LectureT[]>([]);
  const [pickModule, setPickModule] = useState("");
  const [pickSubject, setPickSubject] = useState("");
  const [pickLecture, setPickLecture] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterLecture, setFilterLecture] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [choices, setChoices] = useState<{ key: string; text: string }[]>([
    { key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" },
  ]);
  const [answer, setAnswer] = useState("A");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stemLayout, setStemLayout] = useState<"STANDARD" | "IMAGE_OVERLAY">("STANDARD");
  const [drawOpen, setDrawOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/questions${filterLecture ? `?lectureId=${filterLecture}` : ""}`)
      .then((r) => r.json())
      .then((data) => setQuestions(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [filterLecture]);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/modules-all").then((r) => r.json()),
      fetch("/api/v1/subjects-all").then((r) => r.json()),
    ]).then(([m, s]) => {
      setModules(unwrapApiList<ModuleT>(m));
      setSubjects(unwrapApiList<SubjectT>(s));
    });
  }, []);

  useEffect(() => {
    if (!pickSubject) {
      setLectures([]);
      setPickLecture("");
      return;
    }
    fetch(`/api/v1/subjects/${pickSubject}/lectures`)
      .then((r) => r.json())
      .then((data) => setLectures(Array.isArray(data) ? data : []));
  }, [pickSubject]);

  useEffect(() => {
    if (!filterSubject) {
      setFilterLectures([]);
      setFilterLecture("");
      return;
    }
    fetch(`/api/v1/subjects/${filterSubject}/lectures`)
      .then((r) => r.json())
      .then((data) => setFilterLectures(Array.isArray(data) ? data : []));
  }, [filterSubject]);

  async function uploadQuestionImage(file: File) {
    setUploadingImage(true);
    try {
      const result = await uploadQuestionImageClient(file);
      if (result.ok) {
        setImageUrl(result.url);
        toast.success("Image attached");
      } else {
        toast.error(result.error);
      }
    } finally {
      setUploadingImage(false);
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/v1/questions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuestions((q) => q.filter((x) => x.id !== id));
      toast.success("Deleted");
    } else {
      toast.error(await apiErrorMessage(res, "Failed to delete"));
    }
  }

  function patchQuestion(id: string, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function patchChoice(questionId: string, idx: number, text: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, choices: q.choices.map((c, i) => (i === idx ? { ...c, text } : c)) }
          : q
      )
    );
  }

  async function saveQuestion(id: string) {
    const current = questions.find((q) => q.id === id);
    if (!current) return;
    const payload = {
      body: current.body,
      imageUrl: current.imageUrl ?? null,
      stemLayout: current.stemLayout ?? "STANDARD",
      answer: current.answer,
      difficulty: current.difficulty,
      explanation: current.explanation ?? "",
      lectureId: current.lectureId,
      choices: current.choices,
    };
    const res = await fetch(`/api/v1/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) toast.success("Question updated");
    else toast.error(await apiErrorMessage(res, "Failed to update question"));
  }

  async function addManualQuestion() {
    const validChoices = choices.filter((c) => c.text.trim());
    if (validChoices.length < 2) return toast.error("Fill at least two answer choices");
    if (!pickLecture) return toast.error("Select module → subject → lecture");
    if (!body.trim() && !imageUrl.trim()) return toast.error("Add question text and/or an image");
    if (stemLayout === "IMAGE_OVERLAY" && !imageUrl.trim())
      return toast.error("Overlay layout requires an image");
    if (!validChoices.some((c) => c.key === answer)) return toast.error("Correct answer must match one of the choice keys");

    setSaving(true);
    try {
      const res = await fetch("/api/v1/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureId: pickLecture,
          body: body.trim(),
          imageUrl: imageUrl.trim() || null,
          choices: validChoices.map((c) => ({ key: c.key, text: c.text.trim() })),
          answer,
          explanation: explanation.trim() || undefined,
          difficulty,
          stemLayout,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(typeof err?.error === "string" ? err.error : "Could not save question");
        return;
      }
      const created = await res.json();
      setQuestions((prev) => [...prev, created]);
      toast.success("Question added");
      setBody("");
      setImageUrl("");
      setExplanation("");
      setChoices([
        { key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" },
      ]);
      setAnswer("A");
      setStemLayout("STANDARD");
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  }


  const filtered = questions.filter((q) => {
    const blob = `${q.body} ${q.imageUrl ?? ""}`.toLowerCase();
    return blob.includes(search.toLowerCase());
  });

  useEffect(() => {
    setListPage(0);
  }, [search, filterLecture]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeListPage = Math.min(listPage, totalPages - 1);
  const paged = useMemo(
    () => filtered.slice(safeListPage * PAGE_SIZE, (safeListPage + 1) * PAGE_SIZE),
    [filtered, safeListPage]
  );

  const filteredSubjects = subjects.filter((s) => s.moduleId === pickModule);
  const filterSubjectsByModule = subjects.filter((s) => s.moduleId === filterModule);

  const diffColor: Record<string, string> = {
    EASY:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    HARD:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Assessment Bank</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Questions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your question bank, export to Word, or use AI tools to generate content.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground sm:flex">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>{questions.length.toLocaleString()} Items</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setExportOpen((o) => !o);
              setAddOpen(false);
            }}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted disabled:opacity-40"
          >
            <Settings className="h-4 w-4 text-blue-500" />
            Export Settings
          </button>
          <button
            type="button"
            onClick={() => {
              setAddOpen((o) => !o);
              setExportOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow shadow-blue-500/30 hover:opacity-90 transition-all"
          >
            {addOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {addOpen ? "Cancel" : "Add Manually"}
          </button>
        </div>
      </div>

      {exportOpen && (
        <WordExportModal 
           questions={filtered.map(q => ({
             groupTitle: q.lecture?.title,
             body: q.body,
             choices: q.choices,
             answer: q.answer,
             explanation: q.explanation
           }))} 
           onClose={() => setExportOpen(false)} 
        />
      )}

      {addOpen && (
        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-card p-6 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/10 space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">New Manual Question</h2>
              <p className="text-xs text-muted-foreground">Fill in the details below to add a custom item to the bank.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Context: Module</label>
              <MedqsSelect
                value={pickModule}
                onChange={(e) => {
                  setPickModule(e.target.value);
                  setPickSubject("");
                  setPickLecture("");
                }}
                className="w-full h-11 rounded-xl border-border/60 bg-background/50 focus:ring-blue-500/40"
              >
                <option value="">Select Module…</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </MedqsSelect>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Context: Subject</label>
              <MedqsSelect
                value={pickSubject}
                onChange={(e) => {
                  setPickSubject(e.target.value);
                  setPickLecture("");
                }}
                disabled={!pickModule}
                className="w-full h-11 rounded-xl border-border/60 bg-background/50 focus:ring-blue-500/40"
              >
                <option value="">Select Subject…</option>
                {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </MedqsSelect>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target: Lecture</label>
              <MedqsSelect
                value={pickLecture}
                onChange={(e) => setPickLecture(e.target.value)}
                disabled={!pickSubject}
                className="w-full h-11 rounded-xl border-border/60 bg-background/50 focus:ring-blue-500/40"
              >
                <option value="">Select Lecture…</option>
                {lectures.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </MedqsSelect>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Question Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Type question stem here (Markdown supported)…"
              className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm focus:ring-blue-500/40 focus:outline-none min-h-[100px]"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-3">
               <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Media / Figures</label>
               <div className="flex flex-col gap-3">
                 <div className="flex gap-2">
                   <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="External Image URL (or upload)"
                    className="flex-1 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm focus:ring-blue-500/40 focus:outline-none"
                   />
                   <button
                    type="button"
                    onClick={() => setDrawOpen(true)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/50 text-muted-foreground hover:bg-muted"
                    title="Sketch a figure"
                   >
                    <Pencil className="h-4 w-4" />
                   </button>
                   <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border/60 bg-background/50 text-muted-foreground hover:bg-muted" title="Upload file">
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadQuestionImage(file);
                        e.target.value = "";
                      }}
                    />
                   </label>
                   {imageUrl && (
                    <button type="button" onClick={() => setImageUrl("")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-red-500/10 text-red-500 hover:bg-red-500/20">
                      <Trash2 className="h-4 w-4" />
                    </button>
                   )}
                 </div>

                 {imageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20 relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Question figure" className="h-full w-full object-contain p-2" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] font-bold text-white uppercase tracking-widest">Image Attached</p>
                    </div>
                  </div>
                 )}

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 opacity-60">Layout Mode</label>
                    <MedqsSelect
                      value={stemLayout}
                      onChange={(e) => setStemLayout(e.target.value as any)}
                      className="w-full h-10 rounded-xl border-border/60 bg-background/50 text-xs"
                    >
                      <option value="STANDARD">Standard: Image above text</option>
                      <option value="IMAGE_OVERLAY">Overlay: Text on image (clinical)</option>
                    </MedqsSelect>
                 </div>
               </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Proffered Choices</label>
              <div className="grid gap-2.5">
                {choices.map((c, i) => (
                  <div key={c.key} className={cn(
                    "relative flex items-center gap-3 rounded-xl border p-2.5 transition-all",
                    answer === c.key ? "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20" : "border-border/60 bg-background/30"
                  )}>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/40 text-[10px] font-bold font-mono">
                      {c.key}
                    </span>
                    <input
                      value={c.text}
                      onChange={(e) =>
                        setChoices((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                      }
                      className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm focus:ring-0"
                      placeholder={`Possible Answer ${c.key}…`}
                    />
                    <button
                      type="button"
                      onClick={() => setAnswer(c.key)}
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all",
                        answer === c.key ? "bg-emerald-500 text-white shadow shadow-emerald-500/30" : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Complexity & Difficulty</label>
              <MedqsSelect
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full h-11 rounded-xl border-border/60 bg-background/50"
              >
                <option value="EASY">Level: Easy — Straightforward facts</option>
                <option value="MEDIUM">Level: Medium — Clinical application</option>
                <option value="HARD">Level: Hard — Complex reasoning</option>
              </MedqsSelect>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Rationale / Solution (Markdown OK)</label>
              <input
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why the correct answer is the right one…"
                className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm focus:ring-blue-500/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-5">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="px-4 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Discard Entry
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={addManualQuestion}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow shadow-blue-500/30 hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Question
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Card ── */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-bold tracking-tight">List Filter</span>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in loaded list…"
              className="w-full rounded-xl border border-border/60 bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Module</label>
            <MedqsSelect
              value={filterModule}
              onChange={(e) => {
                setFilterModule(e.target.value);
                setFilterSubject("");
                setFilterLecture("");
              }}
              className="w-full h-10 rounded-xl border-border/60 bg-background/50 focus:ring-blue-500/40"
            >
              <option value="">Any Module</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </MedqsSelect>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
            <MedqsSelect
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setFilterLecture("");
              }}
              disabled={!filterModule}
              className="w-full h-10 rounded-xl border-border/60 bg-background/50 focus:ring-blue-500/40"
            >
              <option value="">Any Subject</option>
              {filterSubjectsByModule.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </MedqsSelect>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Lecture</label>
            <MedqsSelect
              value={filterLecture}
              onChange={(e) => setFilterLecture(e.target.value)}
              disabled={!filterSubject}
              className="w-full h-10 rounded-xl border-border/60 bg-background/50 focus:ring-blue-500/40"
            >
              <option value="">All Lectures</option>
              {filterLectures.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </MedqsSelect>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-24 text-center bg-muted/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 mb-4">
            <HelpCircle className="h-8 w-8 text-muted-foreground opacity-30" />
          </div>
          <p className="font-display text-lg font-bold">No questions found</p>
          <p className="max-w-sm text-sm text-muted-foreground mt-1">
            We couldn&apos;t find any items matching these filters. Try adjusting your selections or add one manually.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Showing {paged.length} of {filtered.length} questions
            </p>
            <div className="h-px flex-1 bg-border/40 mx-4 hidden sm:block" />
          </div>

          <div className="space-y-2.5">
            {paged.map((q, i) => {
              const open = expanded.has(q.id);
              const rowNum = (safeListPage * PAGE_SIZE) + i + 1;
              return (
                <div key={q.id} className={cn(
                  "overflow-hidden rounded-2xl border transition-all duration-200",
                  open ? "border-blue-500/30 bg-card shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/10" : "border-border/60 bg-card hover:border-border hover:shadow-md"
                )}>
                  <div
                    className="flex cursor-pointer items-center gap-4 px-5 py-4"
                    onClick={() =>
                      setExpanded((s) => {
                        const n = new Set(s);
                        n.has(q.id) ? n.delete(q.id) : n.add(q.id);
                        return n;
                      })
                    }
                  >
                    <span className="flex-shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground/60 w-6">
                      {rowNum.toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      {q.imageUrl ? (
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wide">
                          <ImagePlus className="h-3 w-3" /> Image Question
                        </div>
                      ) : null}
                      <p className="text-sm font-medium leading-relaxed truncate">
                        {q.body || "(image only)"}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight", diffColor[q.difficulty])}>
                        {q.difficulty}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(q.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-transform duration-200",
                          open && "rotate-180"
                        )}>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-border/40 px-5 pb-5 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {q.imageUrl ? (
                        <div className="max-w-md overflow-hidden rounded-xl border border-border/60 shadow-inner bg-muted/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={q.imageUrl} alt="" className="max-h-64 w-full object-contain p-2" />
                        </div>
                      ) : null}
                      
                      <div className="grid gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Question Stem</label>
                          <textarea
                            value={q.body}
                            onChange={(e) => patchQuestion(q.id, { body: e.target.value })}
                            rows={3}
                            className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm focus:ring-blue-500/40 focus:outline-none"
                            placeholder="Type stem here..."
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {q.choices.map((c, idx) => (
                            <div key={c.key} className={cn(
                              "relative flex items-center gap-3 rounded-xl border p-3 transition-all",
                              q.answer === c.key ? "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20" : "border-border/60 bg-background/30"
                            )}>
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/40 text-[10px] font-bold font-mono">
                                {c.key}
                              </span>
                              <input
                                value={c.text}
                                onChange={(e) => patchChoice(q.id, idx, e.target.value)}
                                className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm focus:ring-0"
                                placeholder={`Choice ${c.key}...`}
                              />
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`answer-${q.id}`}
                                  checked={q.answer === c.key}
                                  onChange={() => patchQuestion(q.id, { answer: c.key })}
                                  className="h-4 w-4 rounded-full border-border/60 text-emerald-500 focus:ring-emerald-500/40"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Right</span>
                              </label>
                              {c.key === q.answer && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-1" />}
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">Difficulty Level</label>
                            <MedqsSelect
                              value={q.difficulty}
                              onChange={(e) => patchQuestion(q.id, { difficulty: e.target.value })}
                              className="w-full h-10 rounded-xl border-border/60 bg-background/50"
                            >
                              <option value="EASY">EASY</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="HARD">HARD</option>
                            </MedqsSelect>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">Explanation / Rationale</label>
                            <input
                              value={q.explanation ?? ""}
                              onChange={(e) => patchQuestion(q.id, { explanation: e.target.value })}
                              className="w-full h-10 rounded-xl border border-border/60 bg-background/50 px-4 text-sm"
                              placeholder="Why is it right?"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/60">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-bold uppercase tracking-widest">Linked ID:</span>
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{q.id}</code>
                          </div>
                          <button
                            type="button"
                            onClick={() => void saveQuestion(q.id)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow shadow-blue-500/30 hover:opacity-90 transition-all font-display"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Update Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row border-t border-border/40 px-2 mt-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Page {safeListPage + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeListPage <= 0}
                  onClick={() => setListPage((p) => Math.max(0, p - 1))}
                  className="flex h-10 items-center justify-center rounded-xl border border-border/60 bg-card px-4 text-xs font-bold transition-all hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = i; // simple logic for now
                    return (
                      <button key={p} onClick={() => setListPage(p)} className={cn(
                        "h-10 w-10 rounded-xl text-xs font-bold transition-all",
                        safeListPage === p ? "bg-blue-600 text-white shadow shadow-blue-500/40" : "border border-border/60 bg-card hover:bg-muted"
                      )}>
                        {p + 1}
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  disabled={safeListPage >= totalPages - 1}
                  onClick={() => setListPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="flex h-10 items-center justify-center rounded-xl border border-border/60 bg-card px-4 text-xs font-bold transition-all hover:bg-muted disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <QuickDrawModal
        open={drawOpen}
        onClose={() => setDrawOpen(false)}
        onSaved={(url) => setImageUrl(url)}
        title="Draw figure for question"
        exportBackground="#ffffff"
      />
    </div>
  );
}
