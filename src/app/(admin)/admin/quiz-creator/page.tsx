"use client";
import { useState, useEffect } from "react";
import {
  Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp,
  Clock, BookOpen, Users, Image, Layers, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Module   { id: string; name: string }
interface Semester { id: string; name: string }

interface QuizQuestion {
  body: string;
  imageUrl?: string;
  choices: { key: string; text: string }[];
  answer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

const CHOICE_KEYS = ["A", "B", "C", "D", "E"];
const DIFF_COLORS = { EASY: "text-emerald-600", MEDIUM: "text-amber-600", HARD: "text-red-500" };

export default function AdminQuizCreatorPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [modules, setModules]     = useState<Module[]>([]);
  const [saving, setSaving]       = useState(false);

  const [form, setForm] = useState({
    title: "", semesterId: "", moduleId: "",
    timeLimitMin: "", isInteractive: true,
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([{
    body: "", choices: [
      { key: "A", text: "" }, { key: "B", text: "" },
      { key: "C", text: "" }, { key: "D", text: "" },
    ],
    answer: "A", explanation: "", difficulty: "MEDIUM",
  }]);

  const [expandedQ, setExpandedQ] = useState<number | null>(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/semesters").then(r => r.json()),
      fetch("/api/v1/modules-all").then(r => r.json()),
    ]).then(([s, m]) => { setSemesters(s); setModules(m); });
  }, []);

  function addQuestion() {
    setQuestions(qs => [...qs, {
      body: "", choices: [
        { key: "A", text: "" }, { key: "B", text: "" },
        { key: "C", text: "" }, { key: "D", text: "" },
      ],
      answer: "A", explanation: "", difficulty: "MEDIUM",
    }]);
    setExpandedQ(questions.length);
  }

  function removeQuestion(i: number) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i));
    setExpandedQ(null);
  }

  function updateQ(i: number, field: string, value: string) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
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

  async function handleSave() {
    if (!form.title || !form.semesterId || !form.moduleId)
      return toast.error("Fill in title, semester, and module");

    const emptyQ = questions.findIndex(q => !q.body.trim());
    if (emptyQ !== -1) return toast.error(`Question ${emptyQ + 1} is empty`);

    setSaving(true);
    try {
      // 1. Create past paper record
      const paperRes = await fetch("/api/v1/past-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          semesterId: form.semesterId,
          moduleId: form.moduleId,
          isInteractive: form.isInteractive,
          timeLimitMin: form.timeLimitMin ? parseInt(form.timeLimitMin) : null,
        }),
      });

      if (!paperRes.ok) { toast.error("Failed to create quiz"); return; }
      toast.success(`Quiz "${form.title}" saved with ${questions.length} questions!`);
      setForm({ title: "", semesterId: "", moduleId: "", timeLimitMin: "", isInteractive: true });
      setQuestions([{ body: "", choices: [{ key:"A",text:"" }, { key:"B",text:"" }, { key:"C",text:"" }, { key:"D",text:"" }], answer: "A", explanation: "", difficulty: "MEDIUM" }]);
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
            <select value={form.semesterId} onChange={e => setForm(f => ({ ...f, semesterId: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
              <option value="">Select semester...</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Module *</label>
            <select value={form.moduleId} onChange={e => setForm(f => ({ ...f, moduleId: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
              <option value="">Select module...</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
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

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5" /> Image URL <span className="opacity-60">(optional)</span>
                  </label>
                  <input type="url" value={q.imageUrl ?? ""} onChange={e => updateQ(qi, "imageUrl", e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
                  {q.imageUrl && (
                    <img src={q.imageUrl} alt="Question image"
                      className="mt-2 max-h-40 rounded-xl object-contain border border-border"
                      onError={() => updateQ(qi, "imageUrl", "")} />
                  )}
                </div>

                {/* Choices */}
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
    </div>
  );
}
