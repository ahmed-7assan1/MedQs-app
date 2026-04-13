"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp,
  Clock, BookOpen, Image, Check, X, Pencil, ImagePlus,
} from "lucide-react";
import { apiErrorMessage } from "@/lib/api-error-client";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";
import { QuickDrawModal } from "@/components/draw/QuickDrawModal";
import { uploadQuestionImageClient } from "@/lib/upload-question-image-client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Module   { id: string; name: string }
interface Semester { id: string; name: string }
interface CreatedPaper {
  id: string;
  title: string;
  quizLectureId?: string | null;
  kind?: string;
}

interface QuizQuestion {
  id?: string;
  questionType?: "MCQ" | "ESSAY";
  body: string;
  imageUrl?: string;
  choices: { key: string; text: string }[];
  answer: string;
  essayReference?: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

const CHOICE_KEYS = ["A", "B", "C", "D", "E"];
const DIFF_COLORS = { EASY: "text-emerald-600", MEDIUM: "text-amber-600", HARD: "text-red-500" };

export default function AdminQuizCreatorPage() {
  const search = useSearchParams();
  const editingPaperId = (search?.get("paperId") ?? "").trim() || null;
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [modules, setModules]     = useState<Module[]>([]);
  const [saving, setSaving]       = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [removedQuestionIds, setRemovedQuestionIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "", semesterId: "", moduleId: "",
    timeLimitMin: "", isInteractive: true,
    googleSheetsSyncEnabled: false,
    randomizeQuestions: false,
    isPrivate: false,
  });
  const [quizLectureId, setQuizLectureId] = useState<string>("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([{
    body: "", choices: [
      { key: "A", text: "" }, { key: "B", text: "" },
      { key: "C", text: "" }, { key: "D", text: "" },
    ],
    answer: "A", explanation: "", difficulty: "MEDIUM",
  }]);

  const [expandedQ, setExpandedQ] = useState<number | null>(0);
  const [drawForQi, setDrawForQi] = useState<number | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [aiFileBusy, setAiFileBusy] = useState(false);
  const [aiQuestionMode, setAiQuestionMode] = useState<"mcq" | "essay" | "mixed">("mcq");

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/semesters").then((r) => r.json()),
      fetch("/api/v1/modules-all").then((r) => r.json()),
    ]).then(([s, m]) => {
      setSemesters(unwrapApiList<Semester>(s));
      setModules(unwrapApiList<Module>(m));
    });
  }, []);

  useEffect(() => {
    // reset quiz lecture when switching module
    setQuizLectureId("");
  }, [form.moduleId]);

  function addQuestion() {
    setQuestions(qs => [...qs, {
      questionType: "MCQ",
      body: "", choices: [
        { key: "A", text: "" }, { key: "B", text: "" },
        { key: "C", text: "" }, { key: "D", text: "" },
      ],
      answer: "A", explanation: "", difficulty: "MEDIUM",
    }]);
    setExpandedQ(questions.length);
  }

  function removeQuestion(i: number) {
    setQuestions(qs => {
      const q = qs[i];
      if (q?.id) setRemovedQuestionIds((prev) => [...prev, q.id!]);
      return qs.filter((_, idx) => idx !== i);
    });
    setExpandedQ(null);
  }

  function updateQ(i: number, field: string, value: string) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  async function uploadQuestionImage(qi: number, file: File) {
    setUploadingIdx(qi);
    try {
      const result = await uploadQuestionImageClient(file);
      if (result.ok) {
        updateQ(qi, "imageUrl", result.url);
        toast.success("Image attached");
      } else {
        toast.error(result.error);
      }
    } finally {
      setUploadingIdx(null);
    }
  }

  function updateChoice(qi: number, ci: number, value: string) {
    setQuestions(qs => qs.map((q, idx) => idx === qi
      ? { ...q, choices: q.choices.map((c, cidx) => cidx === ci ? { ...c, text: value } : c) }
      : q
    ));
  }

  function addChoice(qi: number) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi || q.choices.length >= 5) return q;
      const key = CHOICE_KEYS[q.choices.length];
      return { ...q, choices: [...q.choices, { key, text: "" }] };
    }));
  }

  function removeChoice(qi: number, ci: number) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi || q.choices.length <= 2) return q;
      const newChoices = q.choices.filter((_, cidx) => cidx !== ci)
        .map((c, i) => ({ ...c, key: CHOICE_KEYS[i] }));
      return { ...q, choices: newChoices, answer: q.answer === q.choices[ci].key ? newChoices[0].key : q.answer };
    }));
  }

  const activeModuleName = useMemo(() => {
    const m = modules.find((x) => x.id === form.moduleId);
    return m?.name ?? "";
  }, [modules, form.moduleId]);

  useEffect(() => {
    if (!editingPaperId) return;
    let cancelled = false;
    (async () => {
      setLoadingEdit(true);
      try {
        const paperRes = await fetch(`/api/v1/past-papers/${editingPaperId}`);
        const paper = await paperRes.json().catch(() => ({}));
        if (!paperRes.ok) {
          toast.error(await apiErrorMessage(paperRes, "Could not load quiz"));
          return;
        }
        const lectureId = typeof paper.quizLectureId === "string" ? paper.quizLectureId : "";
        if (!lectureId) {
          toast.error("This quiz has no quiz lecture. Re-create it from Quiz Creator.");
          return;
        }
        const qsRes = await fetch(`/api/v1/questions?lectureId=${encodeURIComponent(lectureId)}`);
        const qsRaw = await qsRes.json().catch(() => []);
        const qs = unwrapApiList<any>(qsRaw);
        if (!cancelled) {
          setForm((f) => ({
            ...f,
            title: typeof paper.title === "string" ? paper.title : f.title,
            semesterId: typeof paper.semesterId === "string" ? paper.semesterId : f.semesterId,
            moduleId: typeof paper.moduleId === "string" ? paper.moduleId : f.moduleId,
            timeLimitMin: paper.timeLimitMin != null ? String(paper.timeLimitMin) : "",
            googleSheetsSyncEnabled: Boolean(paper.googleSheetsSyncEnabled),
            randomizeQuestions: Boolean(paper.randomizeQuestions),
            isPrivate: Boolean(paper.isPrivate),
          }));
          setQuizLectureId(lectureId);
          setRemovedQuestionIds([]);
          setQuestions(
            Array.isArray(qs) && qs.length > 0
              ? qs.map((q: any) => ({
                  id: q.id,
                  questionType: q.questionType === "ESSAY" ? "ESSAY" : "MCQ",
                  body: q.body ?? "",
                  imageUrl: q.imageUrl ?? undefined,
                  choices: Array.isArray(q.choices) ? q.choices : (q.choices ?? []),
                  answer: q.answer ?? "A",
                  essayReference: q.essayReference ?? "",
                  explanation: q.explanation ?? "",
                  difficulty: q.difficulty ?? "MEDIUM",
                }))
              : [{
                  questionType: "MCQ",
                  body: "",
                  choices: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }],
                  answer: "A",
                  essayReference: "",
                  explanation: "",
                  difficulty: "MEDIUM",
                }]
          );
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingPaperId]);

  async function ensureQuizBankLecture(moduleId: string): Promise<string> {
    const res = await fetch(`/api/v1/modules/${encodeURIComponent(moduleId)}/ensure-quiz-bank-lecture`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || typeof data?.lectureId !== "string" || !data.lectureId) {
      throw new Error(await apiErrorMessage(res, "Could not prepare quiz storage"));
    }
    return data.lectureId;
  }

  async function importQuestionsFromFile(file: File) {
    setAiFileBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("questionMode", aiQuestionMode);
      const res = await fetch("/api/v1/ai/extract", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "AI extraction failed");
        return;
      }
      const rows = Array.isArray(data?.questions) ? data.questions : [];
      if (!rows.length) {
        toast.error("No questions extracted from file.");
        return;
      }
      const mapped: QuizQuestion[] = rows.map((q: any) => {
        const qt = q?.questionType === "ESSAY" ? "ESSAY" : "MCQ";
        return {
          questionType: qt,
          body: String(q?.body ?? "").trim(),
          imageUrl: q?.imageUrl ? String(q.imageUrl) : undefined,
          choices:
            qt === "ESSAY"
              ? []
              : (Array.isArray(q?.choices) ? q.choices : []).map((c: any, i: number) => ({
                  key: String(c?.key ?? CHOICE_KEYS[i] ?? "A"),
                  text: String(c?.text ?? ""),
                })),
          answer: qt === "ESSAY" ? "ESSAY" : String(q?.answer ?? "A"),
          essayReference: qt === "ESSAY" ? String(q?.essayReference ?? q?.answer ?? "") : "",
          explanation: String(q?.explanation ?? ""),
          difficulty: q?.difficulty === "EASY" || q?.difficulty === "HARD" ? q.difficulty : "MEDIUM",
        };
      });
      setQuestions((prev) => [...prev.filter((q) => q.body.trim()), ...mapped]);
      toast.success(`AI imported ${mapped.length} question(s) from file`);
    } catch {
      toast.error("Upload/extraction took too long. Try a smaller file or split it into parts.");
    } finally {
      setAiFileBusy(false);
    }
  }

  async function handleSave() {
    if (!form.title || !form.semesterId || !form.moduleId)
      return toast.error("Fill in title, semester, and module");

    const emptyQ = questions.findIndex(q => !q.body.trim());
    if (emptyQ !== -1) return toast.error(`Question ${emptyQ + 1} is empty`);

    // For admin-authored quizzes, questions must be stored under the quiz's dedicated lecture.
    // The API will create that lecture automatically when kind=ADMIN_AUTHORED_QUIZ.

    setSaving(true);
    try {
      const paperRes = await fetch(editingPaperId ? `/api/v1/past-papers/${editingPaperId}` : "/api/v1/past-papers", {
        method: editingPaperId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          semesterId: form.semesterId,
          moduleId: form.moduleId,
          kind: "ADMIN_AUTHORED_QUIZ",
          timeLimitMin: form.timeLimitMin ? parseInt(form.timeLimitMin, 10) : null,
          googleSheetsSyncEnabled: form.googleSheetsSyncEnabled,
          randomizeQuestions: form.randomizeQuestions,
          isPrivate: form.isPrivate,
        }),
      });

      const paper = (await paperRes.json().catch(() => ({}))) as any;
      if (!paperRes.ok) {
        toast.error(await apiErrorMessage(paperRes, "Failed to create quiz"));
        return;
      }
      let qLectureId = editingPaperId ? quizLectureId : (typeof paper.quizLectureId === "string" ? paper.quizLectureId : "");
      const questionRows = questions.filter((q) => q.body.trim());
      // Do not block quiz creation if lecture link is absent; lazily ensure hidden storage only when needed.
      if (!qLectureId && questionRows.length > 0) {
        qLectureId = await ensureQuizBankLecture(form.moduleId);
      }
      setQuizLectureId(qLectureId);

      const createdIds: string[] = [];

      if (questionRows.length > 0 && qLectureId) {
        for (let idx = 0; idx < questionRows.length; idx++) {
          const q = questionRows[idx]!;
          const isEssay = (q.questionType ?? "MCQ") === "ESSAY";
          const normalizedChoices = isEssay
            ? []
            : (q.choices ?? [])
                .map((c) => ({ key: String(c.key ?? ""), text: String(c.text ?? "").trim() }))
                .filter((c) => c.key && c.text);
          if (!isEssay) {
            if (normalizedChoices.length < 2) {
              toast.error(`Question ${idx + 1}: add at least 2 non-empty choices`);
              return;
            }
            const answerKey = String(q.answer ?? "A");
            if (!normalizedChoices.some((c) => c.key === answerKey)) {
              toast.error(`Question ${idx + 1}: selected answer key is not in choices`);
              return;
            }
          }
          const isUpdate = typeof q.id === "string" && q.id.length > 0;
          const qRes = await fetch(isUpdate ? `/api/v1/questions/${q.id}` : "/api/v1/questions", {
            method: isUpdate ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body: q.body.trim(),
              questionType: q.questionType ?? "MCQ",
              imageUrl: q.imageUrl?.trim() || null,
              choices: normalizedChoices,
              answer: q.questionType === "ESSAY" ? "ESSAY" : q.answer,
              essayReference: q.questionType === "ESSAY" ? q.essayReference?.trim() || q.answer : undefined,
              explanation: q.explanation?.trim() || "",
              difficulty: q.difficulty,
              lectureId: qLectureId,
            }),
          });
          if (!qRes.ok) {
            toast.error(await apiErrorMessage(qRes, `Question ${idx + 1}: failed to save`));
            return;
          }
          const row = await qRes.json().catch(() => ({}));
          if (typeof row?.id === "string") createdIds.push(row.id);
        }
      }

      // “Delete” questions safely: move removed questions to an archive lecture (so attempts remain valid).
      if (editingPaperId && removedQuestionIds.length > 0) {
        const arcRes = await fetch(`/api/v1/modules/${form.moduleId}/ensure-quiz-archive-lecture`, { method: "POST" });
        const arc = await arcRes.json().catch(() => ({}));
        const archiveLectureId = typeof arc?.lectureId === "string" ? arc.lectureId : "";
        if (!arcRes.ok || !archiveLectureId) {
          toast.error(await apiErrorMessage(arcRes, "Could not archive removed questions"));
          return;
        }
        for (const id of removedQuestionIds) {
          await fetch(`/api/v1/questions/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lectureId: archiveLectureId }),
          }).catch(() => {});
        }
      }

      toast.success(editingPaperId ? "Quiz updated" : `Quiz saved — ${createdIds.length} question(s) in this quiz`);
      setForm({
        title: "", semesterId: "", moduleId: "",
        timeLimitMin: "", isInteractive: true,
        googleSheetsSyncEnabled: false,
        randomizeQuestions: false,
        isPrivate: false,
      });
      setQuizLectureId("");
      setQuestions([{ questionType: "MCQ", body: "", choices: [{ key:"A",text:"" }, { key:"B",text:"" }, { key:"C",text:"" }, { key:"D",text:"" }], answer: "A", essayReference: "", explanation: "", difficulty: "MEDIUM" }]);
    } finally { setSaving(false); }
  }

  const validCount = questions.filter(q => q.body.trim()).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-bold">Quiz Creator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build custom quizzes for your students with images, multiple choices, and AI explanations.
        </p>
      </div>

      {/* Quiz metadata */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Quiz Info
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Anatomy Module 1 Quiz — Upper Limb"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Semester *</label>
            <MedqsSelect
              value={form.semesterId}
              onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value }))}
              className="w-full rounded-xl"
            >
              <option value="">Select semester...</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </MedqsSelect>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Module *</label>
            <MedqsSelect
              value={form.moduleId}
              onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value }))}
              className="w-full rounded-xl"
            >
              <option value="">Select module...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </MedqsSelect>
          </div>

          <div className="sm:col-span-2 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              This quiz will have its <span className="text-foreground/80">own questions only</span> (separate from lecture questions).
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              A dedicated “quiz lecture” is created automatically on save.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div>
              <p className="text-sm font-medium">Google Sheets (this quiz)</p>
              <p className="text-xs text-muted-foreground">
                Append each result to tab <code className="rounded bg-muted px-1 text-[10px]">QuizLive</code> (set{" "}
                <code className="rounded bg-muted px-1 text-[10px]">GOOGLE_SHEETS_*</code> on the server).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, googleSheetsSyncEnabled: !f.googleSheetsSyncEnabled }))}
              className={cn(
                "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors",
                form.googleSheetsSyncEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
                  form.googleSheetsSyncEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Time limit <span className="text-muted-foreground/60">(minutes, optional)</span>
            </label>
            <input type="number" value={form.timeLimitMin} min="1"
              onChange={e => setForm(f => ({ ...f, timeLimitMin: e.target.value }))}
              placeholder="e.g. 30"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Interactive quiz</p>
              <p className="text-xs text-muted-foreground">Students answer & see instant scores</p>
            </div>
            <button onClick={() => setForm(f => ({ ...f, isInteractive: !f.isInteractive }))}
              className={cn("relative h-6 w-11 rounded-full transition-colors", form.isInteractive ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow transition-transform top-1",
                form.isInteractive ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-violet-200/80 bg-violet-50/40 px-4 py-3 dark:border-violet-900/50 dark:bg-violet-950/20">
            <div>
              <p className="text-sm font-medium">Randomize Questions</p>
              <p className="text-xs text-muted-foreground">Shuffle questions randomly for each student.</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, randomizeQuestions: !f.randomizeQuestions }))}
              className={cn("relative h-6 w-11 rounded-full transition-colors", form.randomizeQuestions ? "bg-violet-500" : "bg-muted")}>
              <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow transition-transform top-1",
                form.randomizeQuestions ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-rose-200/80 bg-rose-50/40 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/20">
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">Private Quiz (Hidden)</p>
              <p className="text-xs text-muted-foreground">Only Admins can see this quiz. Hidden from students.</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
              className={cn("relative h-6 w-11 rounded-full transition-colors", form.isPrivate ? "bg-rose-500" : "bg-muted")}>
              <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow transition-transform top-1",
                form.isPrivate ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>
        </div>
      </div>

      {/* AI import from file */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <h2 className="font-semibold mb-3">AI Assistant (File → Questions)</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Upload PDF/DOCX/image. Assistant can OCR and generate MCQ, essay, or mixed questions.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <MedqsSelect
            value={aiQuestionMode}
            onChange={(e) => setAiQuestionMode(e.target.value as typeof aiQuestionMode)}
            className="min-w-[12rem] rounded-xl"
          >
            <option value="mcq">Multiple choice only</option>
            <option value="essay">Essay only</option>
            <option value="mixed">Mixed (MCQ + Essay)</option>
          </MedqsSelect>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted">
            {aiFileBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Upload file for AI
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={aiFileBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importQuestionsFromFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-6">
        {questions.map((q, qi) => (
          <div key={qi} className={cn("rounded-2xl border bg-card overflow-hidden transition-all",
            expandedQ === qi ? "border-primary/30 shadow-md" : "border-border")}>

            {/* Question header */}
            <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setExpandedQ(expandedQ === qi ? null : qi)}>
              <span className={cn("flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                q.body.trim() ? "bg-emerald-500" : "bg-muted-foreground/40")}>
                {q.body.trim() ? <Check className="h-3.5 w-3.5" /> : qi + 1}
              </span>
              <p className="flex-1 text-sm font-medium truncate text-muted-foreground">
                {q.body.trim() || `Question ${qi + 1} — click to edit`}
              </p>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-semibold", DIFF_COLORS[q.difficulty])}>{q.difficulty}</span>
                <button onClick={e => { e.stopPropagation(); removeQuestion(qi); }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {expandedQ === qi ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            {/* Question body */}
            {expandedQ === qi && (
              <div className="border-t border-border px-5 py-5 space-y-4 animate-fade-in">
                {/* Question text */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Question stem *</label>
                  <textarea value={q.body} onChange={e => updateQ(qi, "body", e.target.value)}
                    placeholder="Type your question here..."
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none" />
                </div>

                {/* Question type */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Question type</label>
                  <MedqsSelect
                    value={q.questionType ?? "MCQ"}
                    onChange={(e) => {
                      const t = e.target.value === "ESSAY" ? "ESSAY" : "MCQ";
                      setQuestions((qs) =>
                        qs.map((item, idx) =>
                          idx !== qi
                            ? item
                            : {
                                ...item,
                                questionType: t,
                                choices:
                                  t === "ESSAY"
                                    ? []
                                    : item.choices.length
                                      ? item.choices
                                      : [
                                          { key: "A", text: "" },
                                          { key: "B", text: "" },
                                        ],
                                answer: t === "ESSAY" ? "ESSAY" : item.answer || "A",
                              }
                        )
                      );
                    }}
                    className="w-full rounded-xl"
                  >
                    <option value="MCQ">Multiple choice</option>
                    <option value="ESSAY">Essay</option>
                  </MedqsSelect>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5" /> Image URL <span className="opacity-60">(optional)</span>
                  </label>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDrawForQi(qi)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Draw
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted">
                      {uploadingIdx === qi ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" />
                      )}
                      Upload
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingIdx !== null}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadQuestionImage(qi, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <input type="url" value={q.imageUrl ?? ""} onChange={e => updateQ(qi, "imageUrl", e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
                  {q.imageUrl && (
                    <img src={q.imageUrl} alt="Question image"
                      className="mt-2 max-h-40 rounded-xl object-contain border border-border"
                      onError={() => updateQ(qi, "imageUrl", "")} />
                  )}
                </div>

                {/* Choices (MCQ only) */}
                {(q.questionType ?? "MCQ") === "MCQ" ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Answer choices ({q.choices.length}/5)
                    </label>
                    {q.choices.length < 5 && (
                      <button onClick={() => addChoice(qi)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-primary hover:bg-primary/8 transition-colors">
                        <Plus className="h-3 w-3" /> Add choice
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {q.choices.map((c, ci) => (
                      <div key={c.key} className="flex items-center gap-2">
                        <button onClick={() => updateQ(qi, "answer", c.key)}
                          className={cn("flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-all",
                            q.answer === c.key
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-border text-muted-foreground hover:border-primary/40")}>
                          {c.key}
                        </button>
                        <input type="text" value={c.text} onChange={e => updateChoice(qi, ci, e.target.value)}
                          placeholder={`Choice ${c.key}...`}
                          className={cn("flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors",
                            q.answer === c.key
                              ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10"
                              : "border-border bg-background")} />
                        {q.choices.length > 2 && (
                          <button onClick={() => removeChoice(qi, ci)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Click a letter to mark as correct answer
                  </p>
                </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Essay reference answer (AI grading)</label>
                    <textarea
                      value={q.essayReference ?? ""}
                      onChange={(e) => updateQ(qi, "essayReference", e.target.value)}
                      placeholder="Paste the key answer points extracted from file..."
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Student answer does not need exact wording. AI checks semantic closeness to this reference.
                    </p>
                  </div>
                )}

                {/* Explanation + Difficulty */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Explanation</label>
                    <textarea value={q.explanation} onChange={e => updateQ(qi, "explanation", e.target.value)}
                      placeholder="Why is this the correct answer?"
                      rows={2}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty</label>
                    <div className="flex flex-col gap-1.5">
                      {(["EASY","MEDIUM","HARD"] as const).map(d => (
                        <button key={d} onClick={() => updateQ(qi, "difficulty", d)}
                          className={cn("rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left",
                            q.difficulty === d
                              ? d === "EASY" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" :
                                d === "MEDIUM" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30" :
                                "bg-red-100 text-red-700 dark:bg-red-900/30"
                              : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add question + Save */}
      <div className="flex items-center justify-between">
        <button onClick={addQuestion}
          className="btn btn-secondary gap-2">
          <Plus className="h-4 w-4" />
          Add question
        </button>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {validCount}/{questions.length} question{questions.length !== 1 ? "s" : ""} ready
          </p>
          <button onClick={handleSave} disabled={saving || !form.title || !form.semesterId || !form.moduleId}
            className="btn btn-primary gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Quiz"}
          </button>
        </div>
      </div>

      <QuickDrawModal
        open={drawForQi !== null}
        onClose={() => setDrawForQi(null)}
        onSaved={(url) => {
          if (drawForQi === null) return;
          updateQ(drawForQi, "imageUrl", url);
          setDrawForQi(null);
        }}
        title="Draw for quiz question"
        exportBackground="#ffffff"
      />
    </div>
  );
}
