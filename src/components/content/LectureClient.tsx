"use client";
import { useState, useEffect, useCallback } from "react";
import { Layers, HelpCircle, ChevronLeft, ChevronRight, RotateCcw, Lightbulb, Loader2 } from "lucide-react";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { normalizeImageUrl } from "@/lib/markdown-helpers";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

interface Flashcard { id: string; front: string; back: string }
interface Question {
  id: string; body: string; imageUrl?: string | null;
  choices: { key: string; text: string }[];
  answer: string; explanation?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD"; lectureId: string;
}

interface Props {
  flashcards: Flashcard[];
  questions: Question[];
  /** `both` = tabs; single section pages hide tabs */
  mode?: "both" | "flashcards" | "questions";
}

type Tab = "flashcards" | "questions";
type DiffColor = { bg: string; text: string; dot: string };

const DIFF_COLORS: Record<string, DiffColor> = {
  EASY:   { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  MEDIUM: { bg: "bg-amber-50 dark:bg-amber-900/20",     text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-500" },
  HARD:   { bg: "bg-red-50 dark:bg-red-900/20",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500" },
};

// ─── Flashcard Deck ────────────────────────────────────────────────────────────

function FlashcardDeck({ flashcards }: { flashcards: Flashcard[] }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const card = flashcards[idx];
  const pct = Math.round((known.size / flashcards.length) * 100);
  const total = flashcards.length;

  function next() {
    setFlipped(false);
    setTimeout(() => setIdx((i) => (i + 1) % flashcards.length), 160);
  }
  function prev() {
    setFlipped(false);
    setTimeout(() => setIdx((i) => (i - 1 + flashcards.length) % flashcards.length), 160);
  }
  function markKnown() {
    setKnown((s) => new Set([...s, card.id]));
    next();
  }
  function markAgain() {
    const n = new Set(known);
    n.delete(card.id);
    setKnown(n);
    next();
  }

  return (
    <div className="flex w-full max-w-none flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Flashcard</p>
            <p className="font-display text-lg font-bold tabular-nums text-foreground md:text-xl">
              {idx + 1} <span className="text-muted-foreground">/</span> {total}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{known.size} known</span>
            <button
              type="button"
              onClick={() => {
                setIdx(0);
                setFlipped(false);
                setKnown(new Set());
              }}
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Card — wide, page-like (no nested heavy card frame) */}
      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: "1200px", minHeight: "min(45vh, 440px)" }}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Show question" : "Show answer"}
      >
        <div
          className="relative min-h-[min(45vh,440px)] w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-muted/35 p-6 text-center ring-1 ring-border/50 md:p-10"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Front</p>
            <p className="max-w-3xl text-base font-medium leading-relaxed text-foreground md:text-lg">{card.front}</p>
            <p className="mt-6 text-xs text-muted-foreground">Tap to reveal answer</p>
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-primary/[0.07] p-6 text-center ring-1 ring-primary/25 md:p-10"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-primary">Back</p>
            <p className="max-w-3xl text-base leading-relaxed text-foreground md:text-lg">{card.back}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={prev}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={markAgain}
          className="flex min-h-11 min-w-[6.5rem] flex-1 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted sm:flex-initial sm:px-6"
        >
          Study again
        </button>
        <button
          type="button"
          onClick={markKnown}
          className="flex min-h-11 min-w-[6.5rem] flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:flex-initial sm:px-6"
        >
          Got it
        </button>
        <button
          type="button"
          onClick={next}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {flashcards.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setFlipped(false);
              setIdx(i);
            }}
            className={cn(
              "h-2 rounded-full transition-all",
              i === idx ? "w-8 bg-primary" : known.has(c.id) ? "w-2 bg-emerald-500" : "w-2 bg-muted"
            )}
            aria-label={`Card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Question List ─────────────────────────────────────────────────────────────

function QuestionItem({
  question,
  num,
  variant = "compact",
  selectedKey,
  onSelectKey,
}: {
  question: Question;
  num: number;
  variant?: "compact" | "immersive";
  /** When both provided, selection is controlled (persists across navigation). */
  selectedKey?: string | null;
  onSelectKey?: (key: string) => void;
}) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selected = selectedKey !== undefined ? selectedKey : internalSelected;
  const setSelected = (k: string) => {
    if (onSelectKey) onSelectKey(k);
    else setInternalSelected(k);
  };
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const dc = DIFF_COLORS[question.difficulty];
  const answered = selected !== null;
  const immersive = variant === "immersive";

  async function handleExplain() {
    if (explanation) { setShowExplain(e => !e); return; }
    setLoadingExplain(true);
    try {
      const res = await fetch(`/api/v1/questions/${question.id}/explain`);
      const data = await res.json();
      setExplanation(data.explanation);
      setShowExplain(true);
    } catch { toast.error("Could not load explanation"); }
    finally { setLoadingExplain(false); }
  }

  return (
    <div
      className={cn(
        immersive
          ? "w-full max-w-none bg-transparent"
          : "overflow-hidden rounded-xl border border-border bg-card"
      )}
    >
      {/* Header — immersive: flat on the page (no inner card); compact: numbered row */}
      {immersive ? (
        <div className="space-y-4">
          <div className="flex items-start justify-end gap-3">
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                dc.bg,
                dc.text
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", dc.dot)} />
              {question.difficulty.toLowerCase()}
            </span>
          </div>
          <div className="min-w-0 space-y-4">
            {question.imageUrl ? (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={normalizeImageUrl(question.imageUrl)}
                  alt=""
                  className="max-h-[min(52vh,520px)] w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}
            {question.body?.trim() ? (
              <MarkdownBody
                content={question.body}
                className="max-w-none font-medium leading-relaxed prose-p:font-medium prose-p:leading-relaxed text-base md:text-lg"
              />
            ) : !question.imageUrl ? (
              <p className="text-base text-muted-foreground">(No text)</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 pb-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            {num}
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            {question.imageUrl ? (
              <div className="overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={normalizeImageUrl(question.imageUrl)}
                  alt=""
                  className="max-h-52 w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}
            {question.body?.trim() ? (
              <MarkdownBody content={question.body} className="text-sm font-medium prose-p:font-medium" />
            ) : !question.imageUrl ? (
              <p className="text-sm text-muted-foreground">(No text)</p>
            ) : null}
          </div>
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              dc.bg,
              dc.text
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", dc.dot)} />
            {question.difficulty.toLowerCase()}
          </span>
        </div>
      )}

      {/* Choices */}
      <div className={cn(immersive ? "mt-6 space-y-2.5 md:space-y-3" : "space-y-1.5 px-4 pb-3")}>
        {question.choices.map((c) => {
          const isSelected = selected === c.key;
          const isCorrect = answered && c.key === question.answer;
          const isWrong = answered && isSelected && c.key !== question.answer;
          return (
            <button key={c.key}
              onClick={() => !answered && setSelected(c.key)}
              disabled={answered}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border text-left transition-all",
                immersive ? "px-4 py-4 md:py-5" : "gap-2.5 rounded-lg px-3 py-2.5 text-sm",
                !answered && "cursor-pointer border-border hover:border-primary/40 hover:bg-primary/4",
                isCorrect && "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
                isWrong && "border-red-400 bg-red-50 dark:bg-red-900/20",
                answered && !isCorrect && !isWrong && "cursor-not-allowed border-border opacity-50",
                !answered && isSelected && "border-primary bg-primary/8"
              )}>
              <span className={cn(
                "flex shrink-0 items-center justify-center rounded-full border font-bold",
                immersive ? "h-8 w-8 text-sm" : "h-5 w-5 text-[11px]",
                isCorrect ? "border-emerald-500 bg-emerald-500 text-white" :
                isWrong   ? "border-red-400 bg-red-400 text-white" :
                isSelected ? "border-primary bg-primary text-primary-foreground" :
                "border-border text-muted-foreground"
              )}>
                {c.key}
              </span>
              <MarkdownBody
                as="span"
                content={c.text}
                inline
                className={cn(
                  "min-w-0 flex-1 text-left prose-p:font-normal",
                  immersive ? "text-base md:text-[1.05rem]" : "text-sm"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Explain */}
      <div className={cn(immersive ? "mt-8 border-t border-border/70 pt-6" : "border-t border-border px-4 py-2.5")}>
        <button onClick={handleExplain} disabled={loadingExplain}
          className={cn(
            "flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-60",
            immersive ? "text-sm" : "text-xs"
          )}>
          {loadingExplain ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
          {loadingExplain ? "Generating..." : explanation ? (showExplain ? "Hide explanation" : "Show explanation") : "Explain with AI"}
        </button>
        {showExplain && explanation && (
          <div className={cn(
            "mt-3 rounded-xl border border-primary/15 bg-primary/5 leading-relaxed animate-fade-in",
            immersive ? "px-4 py-3 text-sm" : "px-3 py-2.5 text-xs"
          )}>
            <ReactMarkdown components={{ p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>, strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong> }}>
              {explanation}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionsStepper({ questions }: { questions: Question[] }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const q = questions[idx];
  const total = questions.length;

  const goNext = useCallback(() => {
    setIdx((i) => Math.min(total - 1, i + 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setIdx((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    function typingTarget(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      return Boolean(el.isContentEditable);
    }
    function onKey(e: KeyboardEvent) {
      if (typingTarget(e.target)) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  if (!q) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Question</p>
            <p className="font-display text-lg font-bold tabular-nums text-foreground md:text-xl">
              {idx + 1} <span className="text-muted-foreground">/</span> {total}
            </p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <QuestionItem
        key={q.id}
        question={q}
        num={idx + 1}
        variant="immersive"
        selectedKey={answers[q.id] ?? null}
        onSelectKey={(key) => setAnswers((prev) => ({ ...prev, [q.id]: key }))}
      />

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          Use <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">←</kbd>{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">→</kbd> or{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">Enter</kbd> for next
        </p>
        <div className="flex items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={goPrev}
            disabled={idx === 0}
            className="inline-flex min-h-11 min-w-[7rem] items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={idx >= total - 1}
            className="inline-flex min-h-11 min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function LectureClient({ flashcards, questions, mode = "both" }: Props) {
  const single: Tab | null = mode === "flashcards" ? "flashcards" : mode === "questions" ? "questions" : null;
  const [tab, setTab] = useState<Tab>(
    single ?? (flashcards.length > 0 ? "flashcards" : "questions")
  );

  const tabs = [
    { id: "flashcards" as Tab, label: "Flashcards", count: flashcards.length, icon: Layers, disabled: flashcards.length === 0 },
    { id: "questions"  as Tab, label: "Questions",  count: questions.length,  icon: HelpCircle, disabled: questions.length === 0 },
  ];

  return (
    <div
      className={cn(
        single === "questions" || single === "flashcards"
          ? "overflow-visible rounded-none border-0 bg-transparent shadow-none"
          : "overflow-hidden rounded-2xl border border-border bg-card"
      )}
    >
      {/* Tab bar — hidden on dedicated section pages */}
      {single === null && (
        <div className="flex border-b border-border">
          {tabs.map(t => (
            <button key={t.id}
              onClick={() => !t.disabled && setTab(t.id)}
              disabled={t.disabled}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                tab === t.id
                  ? "border-primary text-primary"
                  : t.disabled
                  ? "border-transparent text-muted-foreground/40 cursor-not-allowed"
                  : "border-transparent text-muted-foreground hover:text-foreground cursor-pointer"
              )}>
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  tab === t.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={cn(single === "questions" || single === "flashcards" ? "p-0" : "p-4")}>
        {tab === "flashcards" && flashcards.length > 0 && (
          <FlashcardDeck flashcards={flashcards} />
        )}
        {tab === "questions" && questions.length > 0 && (
          <QuestionsStepper questions={questions} />
        )}
        {((tab === "flashcards" && flashcards.length === 0) || (tab === "questions" && questions.length === 0)) && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <p className="text-sm">No {tab} for this lecture yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
