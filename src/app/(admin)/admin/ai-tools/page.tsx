"use client";
import { useState, useEffect } from "react";
import {
  Wand2, Upload, Loader2, AlertTriangle,
  Trash2, Save, ChevronDown, ChevronUp, Sparkles, BookOpen, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { GeminiBanner } from "@/components/admin/GeminiInfo";
import { AiQuestionPlacementPicker } from "@/components/admin/AiQuestionPlacementPicker";
import type { ExtractedQuestion, AISuggestion } from "@/lib/gemini";

type AIProviderChoice = "auto" | "gemini" | "openai" | "anthropic" | "deepseek";

// ─── Manual Assist ─────────────────────────────────────────────────────────────

function ManualAssistPanel({ providerChoice }: { providerChoice: AIProviderChoice }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [edited, setEdited] = useState<AISuggestion | null>(null);
  const [lectureId, setLectureId] = useState("");
  const [placementKey, setPlacementKey] = useState(0);

  useEffect(() => {
    if (suggestion) {
      setEdited({
        ...suggestion,
        choices: suggestion.choices.map((c) => ({ ...c })),
      });
    } else {
      setEdited(null);
    }
  }, [suggestion]);

  async function handleSuggest() {
    if (!body.trim()) return toast.error("Enter a question body first");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          preferredProvider: providerChoice === "auto" ? undefined : providerChoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "AI suggestion failed");
        setSuggestion(null);
        return;
      }
      setSuggestion(data);
      if (typeof data.fallbackFrom === "string" && data.fallbackFrom) {
        toast(`Switched from ${data.fallbackFrom} to ${data.provider}`);
      }
    } catch {
      toast.error("AI suggestion failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const pack = edited ?? suggestion;
    if (!pack || !lectureId) return toast.error("اختر المديول، المادة، ثم المحاضرة أو كويز كامل للمادة");
    const res = await fetch("/api/v1/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pack, body, lectureId }),
    });
    if (res.ok) {
      toast.success("Question saved!");
      setBody("");
      setSuggestion(null);
      setEdited(null);
      setLectureId("");
      setPlacementKey((k) => k + 1);
    } else {
      toast.error("Failed to save");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Manual AI Assist</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Question body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="A 35-year-old patient presents with..."
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <button
          onClick={handleSuggest}
          disabled={loading || !body.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating..." : "Generate with AI"}
        </button>

        {suggestion && edited && (
          <div className="mt-4 space-y-3 rounded-xl bg-muted/50 p-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Review & edit before save
              </span>
              <select
                value={edited.difficulty}
                onChange={(e) =>
                  setEdited((prev) =>
                    prev ? { ...prev, difficulty: e.target.value as AISuggestion["difficulty"] } : prev
                  )
                }
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            <div className="space-y-2">
              {edited.choices.map((c, idx) => (
                <div key={c.key} className="flex flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2 sm:flex-row sm:items-center">
                  <span className="font-mono text-xs font-bold text-muted-foreground">{c.key}</span>
                  <input
                    value={c.text}
                    onChange={(e) =>
                      setEdited((prev) => {
                        if (!prev) return prev;
                        const choices = prev.choices.map((x, j) =>
                          j === idx ? { ...x, text: e.target.value } : x
                        );
                        return { ...prev, choices };
                      })
                    }
                    className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                  />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input
                      type="radio"
                      name="manual-correct"
                      checked={edited.answer === c.key}
                      onChange={() => setEdited((prev) => (prev ? { ...prev, answer: c.key } : prev))}
                    />
                    Correct
                  </label>
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Explanation</label>
              <textarea
                value={edited.explanation}
                onChange={(e) => setEdited((prev) => (prev ? { ...prev, explanation: e.target.value } : prev))}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <AiQuestionPlacementPicker
              key={`manual-${placementKey}`}
              radioGroupName="ai-placement-manual"
              onChange={setLectureId}
              disabled={loading}
            />
            <button
              onClick={handleSave}
              disabled={!lectureId}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PDF/DOCX Extractor ────────────────────────────────────────────────────────

function PDFExtractPanel({ providerChoice }: { providerChoice: AIProviderChoice }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [issues, setIssues] = useState<{ index: number; issue: string }[]>([]);
  const [lectureId, setLectureId] = useState("");
  const [placementKey, setPlacementKey] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleExtract() {
    if (!file) return toast.error("Choose a PDF or DOCX file");
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    if (providerChoice !== "auto") form.append("preferredProvider", providerChoice);
    try {
      const res = await fetch("/api/v1/ai/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Extraction failed");
        setQuestions([]);
        setIssues([]);
        return;
      }
      setQuestions(data.questions ?? []);
      setIssues(data.issues ?? []);
      if (typeof data.fallbackFrom === "string" && data.fallbackFrom) {
        toast(`Switched from ${data.fallbackFrom} to ${data.provider}`);
      }
      if (data.questions?.length) {
        toast.success(`Extracted ${data.questions.length} questions`);
      } else {
        toast.error("No questions found in file");
      }
    } catch {
      toast.error("Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function removeQuestion(i: number) {
    setQuestions((q) => q.filter((_, idx) => idx !== i));
    setIssues((iss) => iss.filter((x) => x.index !== i).map((x) => ({ ...x, index: x.index > i ? x.index - 1 : x.index })));
  }

  function patchQuestion(i: number, patch: Partial<ExtractedQuestion>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function patchChoice(qIndex: number, choiceIndex: number, text: string) {
    setQuestions((qs) =>
      qs.map((q, j) =>
        j === qIndex
          ? {
              ...q,
              choices: q.choices.map((c, k) => (k === choiceIndex ? { ...c, text } : c)),
            }
          : q
      )
    );
  }

  async function handleSaveAll() {
    if (!lectureId) return toast.error("اختر المديول، المادة، ثم المحاضرة أو كويز كامل للمادة");
    setSaving(true);
    try {
      const res = await fetch("/api/v1/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questions.map((q) => ({ ...q, lectureId })) }),
      });
      if (res.ok) {
        toast.success(`Saved ${questions.length} questions!`);
        setQuestions([]);
        setIssues([]);
        setFile(null);
        setLectureId("");
        setPlacementKey((k) => k + 1);
      } else {
        toast.error("Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <Upload className="h-5 w-5 text-violet-500" />
        <h2 className="font-display text-lg font-semibold">Auto Extract from PDF / DOCX</h2>
      </div>

      {/* File drop zone */}
      <label className={cn(
        "mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
        file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted"
      )}>
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">{file ? file.name : "Drop PDF or DOCX here"}</p>
        <p className="text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(0)} KB` : "or click to browse"}</p>
        <input
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <button
        onClick={handleExtract}
        disabled={!file || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Extracting with AI..." : "Extract Questions"}
      </button>

      {/* Validation issues */}
      {issues.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {issues.length} quality issue{issues.length > 1 ? "s" : ""} flagged
          </div>
          {issues.map((iss) => (
            <p key={iss.index} className="text-xs text-amber-700 dark:text-amber-300">
              Q{iss.index + 1}: {iss.issue}
            </p>
          ))}
        </div>
      )}

      {/* Extracted questions list */}
      {questions.length > 0 && (
        <div className="mt-4 space-y-3">
          <AiQuestionPlacementPicker
            key={`pdf-${placementKey}`}
            radioGroupName="ai-placement-pdf"
            onChange={setLectureId}
            disabled={saving}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium">{questions.length} questions extracted</span>
            <button
              onClick={handleSaveAll}
              disabled={saving || !lectureId}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save All
            </button>
          </div>

          <div className="space-y-2">
          {questions.map((q, i) => {
            const hasIssue = issues.some((iss) => iss.index === i);
            return (
              <div
                key={i}
                className={cn(
                  "rounded-lg border bg-background",
                  hasIssue ? "border-amber-300 dark:border-amber-700" : "border-border"
                )}
              >
                <div
                  className="flex cursor-pointer items-center justify-between px-4 py-3"
                  onClick={() => toggleExpand(i)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 text-xs font-mono text-muted-foreground">Q{i + 1}</span>
                    <p className="truncate text-sm">{q.body}</p>
                    {hasIssue && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1 ml-2">
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      q.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                      q.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>{q.difficulty}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeQuestion(i); }}
                      className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {expanded.has(i) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {expanded.has(i) && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 animate-fade-in">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Question</label>
                      <textarea
                        value={q.body}
                        onChange={(e) => patchQuestion(i, { body: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Choices</label>
                      <div className="space-y-2">
                        {q.choices.map((c, ci) => (
                          <div key={c.key} className="flex flex-col gap-1 sm:flex-row sm:items-center">
                            <span className="w-8 font-mono text-xs text-muted-foreground">{c.key}</span>
                            <input
                              value={c.text}
                              onChange={(e) => patchChoice(i, ci, e.target.value)}
                              className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                              <input
                                type="radio"
                                name={`pdf-q-${i}-answer`}
                                checked={q.answer === c.key}
                                onChange={() => patchQuestion(i, { answer: c.key })}
                                onClick={(e) => e.stopPropagation()}
                              />
                              Correct
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Difficulty</label>
                        <select
                          value={q.difficulty}
                          onChange={(e) =>
                            patchQuestion(i, { difficulty: e.target.value as ExtractedQuestion["difficulty"] })
                          }
                          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Explanation</label>
                      <textarea
                        value={q.explanation ?? ""}
                        onChange={(e) => patchQuestion(i, { explanation: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Lecture notes + flashcards (admin) ──────────────────────────────────────

function LectureEnhancePanel({ providerChoice }: { providerChoice: AIProviderChoice }) {
  const [lectureId, setLectureId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [wantNotes, setWantNotes] = useState(true);
  const [wantFlashcards, setWantFlashcards] = useState(false);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!lectureId) return toast.error("Select a lecture first");
    if (!wantNotes && !wantFlashcards) return toast.error("Choose notes and/or flashcards");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/ai/lecture-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureId,
          instructions,
          notes: wantNotes,
          flashcards: wantFlashcards,
          preferredProvider: providerChoice === "auto" ? undefined : providerChoice,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Request failed");
        return;
      }
      const parts: string[] = [];
      if (data.notesAdded) parts.push("notes");
      if (typeof data.flashcardsAdded === "number" && data.flashcardsAdded > 0) {
        parts.push(`${data.flashcardsAdded} flashcards`);
      }
      toast.success(parts.length ? `Added: ${parts.join(", ")}` : "Done");
      if (typeof data.fallbackFrom === "string" && data.fallbackFrom) {
        toast(`Switched from ${data.fallbackFrom} to ${data.provider}`);
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <BookOpen className="h-5 w-5 text-sky-600" />
        <Layers className="h-5 w-5 text-emerald-600" />
        <h2 className="font-display text-lg font-semibold">Lecture AI: notes & flashcards</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Generates markdown notes (appended to the lecture &quot;Notes&quot; section) and/or flashcards on the selected
        lecture. Students see notes under the lecture hub when content exists.
      </p>

      <AiQuestionPlacementPicker
        radioGroupName="ai-lecture-enhance"
        onChange={setLectureId}
        disabled={loading}
      />

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Focus / instructions for AI (optional)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder="e.g. Emphasize drug mechanisms and side effects for the exam…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={wantNotes}
              onChange={(e) => setWantNotes(e.target.checked)}
              className="rounded border-border"
            />
            Add / extend study notes (markdown)
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={wantFlashcards}
              onChange={(e) => setWantFlashcards(e.target.checked)}
              className="rounded border-border"
            />
            Generate flashcards
          </label>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading || !lectureId || (!wantNotes && !wantFlashcards)}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Working…" : "Run AI on lecture"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIToolsPage() {
  const [providerChoice, setProviderChoice] = useState<AIProviderChoice>("auto");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">AI Tools</h1>
        <p className="mt-1 text-muted-foreground">Generate, extract, and validate questions with AI</p>
      </div>
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Preferred AI provider</label>
        <select
          value={providerChoice}
          onChange={(e) => setProviderChoice(e.target.value as AIProviderChoice)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="auto">Auto (best available + fallback)</option>
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="deepseek">DeepSeek</option>
        </select>
        <p className="mt-2 text-xs text-muted-foreground">
          If your selected provider fails or quota ends, the request automatically switches to the next configured provider.
        </p>
      </div>
      <GeminiBanner />
      <div className="grid gap-6 md:grid-cols-2">
        <ManualAssistPanel providerChoice={providerChoice} />
        <PDFExtractPanel providerChoice={providerChoice} />
      </div>
      <div className="mt-6">
        <LectureEnhancePanel providerChoice={providerChoice} />
      </div>
    </div>
  );
}
