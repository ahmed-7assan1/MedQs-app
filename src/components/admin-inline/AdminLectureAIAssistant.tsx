"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bot, Upload, Wand2, Search, Check, X, Pencil, Plus, Trash2 } from "lucide-react";

type VideoSuggestion = { title: string; searchQuery: string };
type FlashcardDraft = { front: string; back: string };
type QuestionChoiceDraft = { key: string; text: string };
type QuestionDraft = {
  body: string;
  choices: QuestionChoiceDraft[];
  answer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

export function AdminLectureAIAssistant({ lectureId }: { lectureId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState(true);
  const [flashcards, setFlashcards] = useState(true);
  const [questions, setQuestions] = useState(false);
  const [videos, setVideos] = useState(true);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftCards, setDraftCards] = useState<FlashcardDraft[]>([]);
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([]);
  const [activeReview, setActiveReview] = useState<null | "notes" | "flashcards" | "questions" | "videos">(null);
  const [applying, setApplying] = useState<null | "notes" | "flashcards" | "questions">(null);

  const canRun = useMemo(() => Boolean(file) && (notes || flashcards || questions || videos), [file, notes, flashcards, questions, videos]);

  async function run() {
    if (!file) return;
    if (!notes && !flashcards && !questions && !videos) {
      toast.error("Select at least one output");
      return;
    }
    if (!confirm("Run AI on this file and save results to this lecture?")) return;

    setBusy(true);
    setSuggestions([]);
    setDraftNotes("");
    setDraftCards([]);
    setDraftQuestions([]);
    setActiveReview(null);
    try {
      const form = new FormData();
      form.append("lectureId", lectureId);
      form.append("file", file);
      if (notes) form.append("notes", "1");
      if (flashcards) form.append("flashcards", "1");
      if (questions) form.append("questions", "1");
      if (videos) form.append("videos", "1");
      form.append("dryRun", "1");

      const res = await fetch("/api/v1/admin/ai/lecture-from-file", { method: "POST", body: form });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const err =
          typeof (json as any)?.error === "string"
            ? (json as any).error
            : (json as any)?.error
              ? JSON.stringify((json as any).error)
              : "";
        toast.error(err ? `AI failed (${res.status}): ${err}` : `AI failed (${res.status})`);
        return;
      }
      const draft = (json.draft ?? {}) as any;
      setDraftNotes(String(draft.notesMarkdown ?? ""));
      setDraftCards(Array.isArray(draft.flashcards) ? (draft.flashcards as FlashcardDraft[]) : []);
      setDraftQuestions(Array.isArray(draft.questions) ? (draft.questions as QuestionDraft[]) : []);
      const vids = (draft.videoSuggestions ?? []) as VideoSuggestion[];
      setSuggestions(Array.isArray(vids) ? vids : []);
      toast.success("AI draft ready — review before applying");
    } finally {
      setBusy(false);
    }
  }

  async function applyNotes() {
    if (!draftNotes.trim()) {
      toast.error("No notes to apply");
      return;
    }
    if (!confirm("Append these notes to the lecture notes?")) return;
    setApplying("notes");
    try {
      const res = await fetch(`/api/v1/lectures/${lectureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notesMarkdown: draftNotes }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(typeof (j as any)?.error === "string" ? (j as any).error : "Failed to save notes");
        return;
      }
      toast.success("Notes applied");
    } finally {
      setApplying(null);
    }
  }

  async function applyFlashcards() {
    if (!draftCards.length) {
      toast.error("No flashcards to apply");
      return;
    }
    if (!confirm(`Add ${draftCards.length} flashcards to this lecture?`)) return;
    setApplying("flashcards");
    try {
      let ok = 0;
      for (const c of draftCards) {
        const front = String(c.front ?? "").trim();
        const back = String(c.back ?? "").trim();
        if (!front || !back) continue;
        const res = await fetch(`/api/v1/lectures/${lectureId}/flashcards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ front, back }),
        });
        if (res.ok) ok++;
      }
      toast.success(`Flashcards added: ${ok}`);
    } finally {
      setApplying(null);
    }
  }

  async function applyQuestions() {
    if (!draftQuestions.length) {
      toast.error("No questions to apply");
      return;
    }
    if (!confirm(`Add ${draftQuestions.length} questions to this lecture?`)) return;
    setApplying("questions");
    try {
      let ok = 0;
      for (const q of draftQuestions) {
        const body = String(q.body ?? "").trim();
        const choices = Array.isArray(q.choices) ? q.choices : [];
        const answer = String(q.answer ?? "").trim();
        if (!body || choices.length < 2 || !answer) continue;
        const res = await fetch(`/api/v1/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lectureId,
            body,
            choices,
            answer,
            explanation: String(q.explanation ?? "").trim(),
            difficulty: q.difficulty ?? "MEDIUM",
          }),
        });
        if (res.ok) ok++;
      }
      toast.success(`Questions added: ${ok}`);
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-left text-xs font-semibold hover:bg-muted"
      >
        <span className="inline-flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Admin AI Assistant (from file)
        </span>
        <span className="text-[11px] font-normal text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs hover:bg-muted">
              <Upload className="h-4 w-4" />
              <span>{file ? file.name : "Upload PDF/DOCX/TXT"}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  setFile(f);
                }}
              />
            </label>

            <button
              onClick={() => void run()}
              disabled={!canRun || busy}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Wand2 className="h-4 w-4" />
              {busy ? "Working..." : "Generate draft"}
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
              <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />
              Notes (append to lecture)
            </label>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
              <input type="checkbox" checked={flashcards} onChange={(e) => setFlashcards(e.target.checked)} />
              Flashcards (add)
            </label>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
              <input type="checkbox" checked={questions} onChange={(e) => setQuestions(e.target.checked)} />
              Questions (add MCQs)
            </label>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
              <input type="checkbox" checked={videos} onChange={(e) => setVideos(e.target.checked)} />
              Video suggestions (no auto-add)
            </label>
          </div>

          {suggestions.length ? (
            <div className="rounded-md border border-border bg-background p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested videos</p>
              <div className="space-y-2">
                {suggestions.map((s, idx) => (
                  <div key={`${s.searchQuery}-${idx}`} className="flex flex-col gap-1 rounded-md border border-border p-2">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded bg-muted px-2 py-1 font-mono">{s.searchQuery}</span>
                      <a
                        className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 hover:bg-muted"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s.searchQuery)}`}
                      >
                        <Search className="h-3.5 w-3.5" /> Search YouTube
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {(draftNotes.trim() || draftCards.length || draftQuestions.length || suggestions.length) ? (
            <div className="rounded-md border border-border bg-background p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review & apply</p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveReview(activeReview === "notes" ? null : "notes")}
                  className="inline-flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" /> Notes ({draftNotes.trim() ? "1" : "0"})
                </button>
                <button
                  onClick={() => setActiveReview(activeReview === "flashcards" ? null : "flashcards")}
                  className="inline-flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" /> Flashcards ({draftCards.length})
                </button>
                <button
                  onClick={() => setActiveReview(activeReview === "questions" ? null : "questions")}
                  className="inline-flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" /> Questions ({draftQuestions.length})
                </button>
                <button
                  onClick={() => setActiveReview(activeReview === "videos" ? null : "videos")}
                  className="inline-flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" /> Videos ({suggestions.length})
                </button>
              </div>

              {activeReview ? (
                <div className="mt-3 max-h-[26rem] overflow-auto rounded-md border border-border p-3">
                  {activeReview === "notes" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes draft</p>
                        <button
                          onClick={() => void applyNotes()}
                          disabled={applying !== null}
                          className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" /> {applying === "notes" ? "Applying..." : "Apply notes"}
                        </button>
                      </div>
                      <textarea
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        rows={10}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Notes markdown..."
                      />
                      <p className="text-xs text-muted-foreground">Tip: you can edit before applying. This will save to lecture notes.</p>
                    </div>
                  ) : null}

                  {activeReview === "flashcards" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flashcards draft</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDraftCards((p) => [...p, { front: "", back: "" }])}
                            className="inline-flex items-center gap-2 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                          >
                            <Plus className="h-4 w-4" /> Add
                          </button>
                          <button
                            onClick={() => void applyFlashcards()}
                            disabled={applying !== null}
                            className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" /> {applying === "flashcards" ? "Applying..." : "Apply flashcards"}
                          </button>
                        </div>
                      </div>
                      {draftCards.length === 0 ? <p className="text-xs text-muted-foreground">No flashcards.</p> : null}
                      <div className="space-y-2">
                        {draftCards.map((c, idx) => (
                          <div key={idx} className="rounded-md border border-border p-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold">Card {idx + 1}</p>
                              <button
                                onClick={() => setDraftCards((p) => p.filter((_, i) => i !== idx))}
                                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <textarea
                                value={c.front}
                                onChange={(e) =>
                                  setDraftCards((p) => p.map((x, i) => (i === idx ? { ...x, front: e.target.value } : x)))
                                }
                                rows={3}
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                                placeholder="Front"
                              />
                              <textarea
                                value={c.back}
                                onChange={(e) =>
                                  setDraftCards((p) => p.map((x, i) => (i === idx ? { ...x, back: e.target.value } : x)))
                                }
                                rows={3}
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                                placeholder="Back"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeReview === "questions" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questions draft</p>
                        <button
                          onClick={() => void applyQuestions()}
                          disabled={applying !== null}
                          className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" /> {applying === "questions" ? "Applying..." : "Apply questions"}
                        </button>
                      </div>
                      {draftQuestions.length === 0 ? <p className="text-xs text-muted-foreground">No questions.</p> : null}
                      <div className="space-y-2">
                        {draftQuestions.map((q, idx) => (
                          <div key={idx} className="rounded-md border border-border p-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold">Q{idx + 1}</p>
                              <button
                                onClick={() => setDraftQuestions((p) => p.filter((_, i) => i !== idx))}
                                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </button>
                            </div>
                            <textarea
                              value={q.body}
                              onChange={(e) => setDraftQuestions((p) => p.map((x, i) => (i === idx ? { ...x, body: e.target.value } : x)))}
                              rows={4}
                              className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                              placeholder="Question body"
                            />
                            <div className="grid gap-2 sm:grid-cols-2">
                              {q.choices?.map((c, cIdx) => (
                                <div key={`${idx}-${cIdx}`} className="rounded border border-border p-2">
                                  <div className="mb-1 flex items-center justify-between">
                                    <input
                                      value={c.key}
                                      onChange={(e) =>
                                        setDraftQuestions((p) =>
                                          p.map((x, i) =>
                                            i === idx
                                              ? { ...x, choices: x.choices.map((cc, j) => (j === cIdx ? { ...cc, key: e.target.value } : cc)) }
                                              : x
                                          )
                                        )
                                      }
                                      className="w-10 rounded border border-border px-2 py-1 text-xs font-mono"
                                      placeholder="A"
                                    />
                                    <button
                                      onClick={() =>
                                        setDraftQuestions((p) =>
                                          p.map((x, i) =>
                                            i === idx ? { ...x, choices: x.choices.filter((_, j) => j !== cIdx) } : x
                                          )
                                        )
                                      }
                                      className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                                    >
                                      <X className="h-3.5 w-3.5" /> Del
                                    </button>
                                  </div>
                                  <textarea
                                    value={c.text}
                                    onChange={(e) =>
                                      setDraftQuestions((p) =>
                                        p.map((x, i) =>
                                          i === idx
                                            ? { ...x, choices: x.choices.map((cc, j) => (j === cIdx ? { ...cc, text: e.target.value } : cc)) }
                                            : x
                                        )
                                      )
                                    }
                                    rows={2}
                                    className="w-full rounded border border-border px-2 py-1 text-sm"
                                    placeholder="Choice text"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                onClick={() =>
                                  setDraftQuestions((p) =>
                                    p.map((x, i) =>
                                      i === idx ? { ...x, choices: [...(x.choices ?? []), { key: "", text: "" }] } : x
                                    )
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                              >
                                <Plus className="h-4 w-4" /> Add choice
                              </button>
                              <input
                                value={q.answer}
                                onChange={(e) => setDraftQuestions((p) => p.map((x, i) => (i === idx ? { ...x, answer: e.target.value } : x)))}
                                className="w-20 rounded border border-border px-2 py-1 text-xs font-mono"
                                placeholder="Answer"
                              />
                              <select
                                value={q.difficulty}
                                onChange={(e) =>
                                  setDraftQuestions((p) =>
                                    p.map((x, i) => (i === idx ? { ...x, difficulty: e.target.value as any } : x))
                                  )
                                }
                                className="rounded border border-border px-2 py-1 text-xs"
                              >
                                <option value="EASY">EASY</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HARD">HARD</option>
                              </select>
                            </div>
                            <textarea
                              value={q.explanation ?? ""}
                              onChange={(e) =>
                                setDraftQuestions((p) => p.map((x, i) => (i === idx ? { ...x, explanation: e.target.value } : x)))
                              }
                              rows={3}
                              className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                              placeholder="Explanation"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeReview === "videos" ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video suggestions</p>
                      {suggestions.length === 0 ? <p className="text-xs text-muted-foreground">No suggestions.</p> : null}
                      <div className="space-y-2">
                        {suggestions.map((s, idx) => (
                          <div key={`${s.searchQuery}-${idx}`} className="flex flex-col gap-1 rounded-md border border-border p-2">
                            <p className="text-sm font-semibold">{s.title}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded bg-muted px-2 py-1 font-mono">{s.searchQuery}</span>
                              <a
                                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 hover:bg-muted"
                                target="_blank"
                                rel="noreferrer"
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s.searchQuery)}`}
                              >
                                <Search className="h-3.5 w-3.5" /> Search YouTube
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

