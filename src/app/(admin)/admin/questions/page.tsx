"use client";
import { useState, useEffect, useMemo } from "react";
import {
  HelpCircle, Plus, Trash2, Loader2,
  CheckCircle2, ChevronDown, ChevronUp, Search, ImagePlus, X, BookOpen, Pencil, FileText, Download, Settings
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
import { WordExportModal } from "@/components/admin/WordExportModal";
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
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Questions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{questions.length} total — add manually or use AI tools</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setExportOpen((o) => !o);
              setAddOpen(false);
            }}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
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
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add manually
          </button>
          <Link
            href="/admin/ai-tools"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            AI tools
          </Link>
        </div>
      </div>

      {exportOpen && (
        <WordExportModal 
           questions={filtered.map(q => ({
             body: q.body,
             choices: q.choices,
             answer: q.answer,
             explanation: q.explanation
           }))} 
           onClose={() => setExportOpen(false)} 
        />
      )}

      {addOpen && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-primary" />
            New question (manual)
          </div>
          <p className="text-xs text-muted-foreground">
            Pick a lecture, write the stem (optional if you only use an image), add choices, and mark the correct key.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Module</label>
              <MedqsSelect
                value={pickModule}
                onChange={(e) => {
                  setPickModule(e.target.value);
                  setPickSubject("");
                  setPickLecture("");
                }}
                className="w-full"
              >
                <option value="">Select…</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </MedqsSelect>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Subject</label>
              <MedqsSelect
                value={pickSubject}
                onChange={(e) => {
                  setPickSubject(e.target.value);
                  setPickLecture("");
                }}
                disabled={!pickModule}
                className="w-full"
              >
                <option value="">Select…</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </MedqsSelect>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Lecture</label>
              <MedqsSelect
                value={pickLecture}
                onChange={(e) => setPickLecture(e.target.value)}
                disabled={!pickSubject}
                className="w-full"
              >
                <option value="">Select…</option>
                {lectures.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </MedqsSelect>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Question text (markdown OK)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Question stem… (can leave empty if the image carries the question)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Image (URL or upload)</label>
            <div className="flex flex-wrap gap-2">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setDrawOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
                Draw
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted">
                {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                Upload
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadQuestionImage(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {imageUrl ? (
                <button type="button" onClick={() => setImageUrl("")} className="rounded-lg border border-border p-2 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {imageUrl ? (
              <div className="mt-2 overflow-hidden rounded-lg border border-border max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="max-h-40 w-full object-contain bg-muted/30" />
              </div>
            ) : null}
            <div className="mt-2">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Stem + image layout</label>
              <MedqsSelect
                value={stemLayout}
                onChange={(e) => setStemLayout(e.target.value as "STANDARD" | "IMAGE_OVERLAY")}
                className="w-full max-w-md"
              >
                <option value="STANDARD">Image above text (default)</option>
                <option value="IMAGE_OVERLAY">Text overlaid on image (clinical slide)</option>
              </MedqsSelect>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Overlay works best when you have an image and a short line of stem text.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {choices.map((c, i) => (
              <div key={c.key} className="flex gap-2">
                <span className="flex w-8 items-center justify-center rounded-md bg-muted text-xs font-mono font-semibold">
                  {c.key}
                </span>
                <input
                  value={c.text}
                  onChange={(e) =>
                    setChoices((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                  }
                  placeholder="Choice text"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Correct answer</label>
              <MedqsSelect
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-w-[4.5rem]"
              >
                {DEFAULT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </MedqsSelect>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Difficulty</label>
              <MedqsSelect
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                className="min-w-[7rem]"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </MedqsSelect>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Explanation (optional)</label>
            <input
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Close
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={addManualQuestion}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save question"}
            </button>
          </div>
        </div>
      )}

      {/* List scope: exact lecture (module → subject → lecture) */}
      <div className="mb-4 rounded-xl border border-border bg-muted/15 p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Show questions from…</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Choose the lecture whose bank you want to edit. Leave lecture empty to load all questions (may be slow on large sites).
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Module</label>
            <MedqsSelect
              value={filterModule}
              onChange={(e) => {
                setFilterModule(e.target.value);
                setFilterSubject("");
                setFilterLecture("");
              }}
              className="w-full"
            >
              <option value="">Any</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </MedqsSelect>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Subject</label>
            <MedqsSelect
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setFilterLecture("");
              }}
              disabled={!filterModule}
              className="w-full"
            >
              <option value="">Any</option>
              {filterSubjectsByModule.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </MedqsSelect>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Lecture</label>
            <MedqsSelect
              value={filterLecture}
              onChange={(e) => setFilterLecture(e.target.value)}
              disabled={!filterSubject}
              className="w-full"
            >
              <option value="">All in site (no lecture filter)</option>
              {filterLectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </MedqsSelect>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in loaded list…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground opacity-30" />
          <p className="font-medium">No questions found</p>
          <p className="text-sm text-muted-foreground">Add one manually above or use AI tools with a lecture PDF.</p>
        </div>
      ) : (
        <>
        <div className="space-y-2">
          {paged.map((q, i) => {
            const open = expanded.has(q.id);
            const rowNum = safeListPage * PAGE_SIZE + i + 1;
            return (
              <div key={q.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    setExpanded((s) => {
                      const n = new Set(s);
                      n.has(q.id) ? n.delete(q.id) : n.add(q.id);
                      return n;
                    })
                  }
                >
                  <span className="flex-shrink-0 text-xs font-mono text-muted-foreground w-8">{rowNum}</span>
                  <div className="flex-1 min-w-0">
                    {q.imageUrl ? (
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <ImagePlus className="h-3.5 w-3.5" /> Image question
                      </div>
                    ) : null}
                    <p className="text-sm truncate">{q.body || "(image only)"}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", diffColor[q.difficulty])}>
                      {q.difficulty}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(q.id);
                      }}
                      className="rounded p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {open && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 animate-fade-in">
                    {q.imageUrl ? (
                      <div className="max-w-md overflow-hidden rounded-lg border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={q.imageUrl} alt="" className="max-h-56 w-full object-contain bg-muted/20" />
                      </div>
                    ) : null}
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Question text</label>
                      <textarea
                        value={q.body}
                        onChange={(e) => patchQuestion(q.id, { body: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.choices.map((c, idx) => (
                        <div key={c.key} className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5">
                          <span className="w-6 text-xs font-mono text-muted-foreground">{c.key}</span>
                          <input
                            value={c.text}
                            onChange={(e) => patchChoice(q.id, idx, e.target.value)}
                            className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                          />
                          <label className="text-xs">
                            <input
                              type="radio"
                              name={`answer-${q.id}`}
                              checked={q.answer === c.key}
                              onChange={() => patchQuestion(q.id, { answer: c.key })}
                            />{" "}
                            Correct
                          </label>
                          {c.key === q.answer && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Difficulty</label>
                        <MedqsSelect
                          value={q.difficulty}
                          onChange={(e) => patchQuestion(q.id, { difficulty: e.target.value })}
                          className="w-full"
                        >
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </MedqsSelect>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Explanation</label>
                        <input
                          value={q.explanation ?? ""}
                          onChange={(e) => patchQuestion(q.id, { explanation: e.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Lecture: <code className="font-mono">{q.lectureId}</code>
                      </p>
                      <button
                        type="button"
                        onClick={() => void saveQuestion(q.id)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Save edits
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length > PAGE_SIZE ? (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing {safeListPage * PAGE_SIZE + 1}–{Math.min((safeListPage + 1) * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeListPage <= 0}
                onClick={() => setListPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm tabular-nums text-muted-foreground">
                Page {safeListPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safeListPage >= totalPages - 1}
                onClick={() => setListPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
        </>
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
