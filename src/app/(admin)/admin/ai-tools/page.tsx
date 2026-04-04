"use client";
import { useState } from "react";
import {
  Wand2, Upload, Loader2, CheckCircle2, AlertTriangle,
  Plus, Trash2, Save, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { GeminiBanner } from "@/components/admin/GeminiInfo";
import type { ExtractedQuestion, AISuggestion } from "@/lib/gemini";

// ─── Manual Assist ─────────────────────────────────────────────────────────────

function ManualAssistPanel() {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [lectureId, setLectureId] = useState("");

  async function handleSuggest() {
    if (!body.trim()) return toast.error("Enter a question body first");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      setSuggestion(data);
    } catch {
      toast.error("AI suggestion failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!suggestion || !lectureId) return toast.error("Select a lecture first");
    const res = await fetch("/api/v1/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...suggestion, body, lectureId }),
    });
    if (res.ok) {
      toast.success("Question saved!");
      setBody(""); setSuggestion(null);
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

        {suggestion && (
          <div className="mt-4 space-y-3 rounded-xl bg-muted/50 p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Suggestion</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                suggestion.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                suggestion.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              )}>{suggestion.difficulty}</span>
            </div>

            <div className="space-y-1.5">
              {suggestion.choices.map((c) => (
                <div
                  key={c.key}
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                    c.key === suggestion.answer
                      ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-background border border-border"
                  )}
                >
                  <span className="font-mono text-xs font-bold text-muted-foreground">{c.key}</span>
                  <span className="flex-1">{c.text}</span>
                  {c.key === suggestion.answer && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />}
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-sm">
              <p className="mb-1 text-xs font-medium text-primary">Explanation</p>
              <p className="text-sm text-foreground">{suggestion.explanation}</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Lecture ID (required to save)"
                value={lectureId}
                onChange={(e) => setLectureId(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PDF/DOCX Extractor ────────────────────────────────────────────────────────

function PDFExtractPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [issues, setIssues] = useState<{ index: number; issue: string }[]>([]);
  const [lectureId, setLectureId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleExtract() {
    if (!file) return toast.error("Choose a PDF or DOCX file");
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/v1/ai/extract", { method: "POST", body: form });
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setIssues(data.issues ?? []);
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

  async function handleSaveAll() {
    if (!lectureId) return toast.error("Enter a Lecture ID");
    setSaving(true);
    try {
      const res = await fetch("/api/v1/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questions.map((q) => ({ ...q, lectureId })) }),
      });
      if (res.ok) {
        toast.success(`Saved ${questions.length} questions!`);
        setQuestions([]); setIssues([]); setFile(null); setLectureId("");
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
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{questions.length} questions extracted</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Lecture ID"
                value={lectureId}
                onChange={(e) => setLectureId(e.target.value)}
                className="w-36 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save All
              </button>
            </div>
          </div>

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
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 animate-fade-in">
                    {q.choices.map((c) => (
                      <div
                        key={c.key}
                        className={cn(
                          "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                          c.key === q.answer
                            ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                            : "bg-muted/50 border border-transparent"
                        )}
                      >
                        <span className="font-mono text-xs text-muted-foreground">{c.key}</span>
                        <span>{c.text}</span>
                        {c.key === q.answer && <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />}
                      </div>
                    ))}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground italic px-1 pt-1">{q.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">AI Tools</h1>
        <p className="mt-1 text-muted-foreground">Generate, extract, and validate questions with AI</p>
      </div>
      <GeminiBanner />
      <div className="grid gap-6 md:grid-cols-2">
        <ManualAssistPanel />
        <PDFExtractPanel />
      </div>
    </div>
  );
}
