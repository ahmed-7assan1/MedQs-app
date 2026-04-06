"use client";
import { useState } from "react";
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

  function next() { setFlipped(false); setTimeout(() => setIdx(i => (i + 1) % flashcards.length), 160); }
  function prev() { setFlipped(false); setTimeout(() => setIdx(i => (i - 1 + flashcards.length) % flashcards.length), 160); }
  function markKnown() { setKnown(s => new Set([...s, card.id])); next(); }
  function markAgain() { const n = new Set(known); n.delete(card.id); setKnown(n); next(); }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{idx + 1} / {flashcards.length}</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{known.size} known</span>
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button onClick={() => { setIdx(0); setFlipped(false); setKnown(new Set()); }}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {/* Card */}
      <div className="relative cursor-pointer" style={{ perspective: "1000px", height: 200 }}
        onClick={() => setFlipped(f => !f)}>
        <div className="relative h-full w-full transition-transform duration-500"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>

          {/* Front */}
          <div className="absolute inset-0 rounded-2xl border border-border bg-card flex flex-col items-center justify-center p-6 text-center"
            style={{ backfaceVisibility: "hidden" }}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Question</p>
            <p className="text-sm font-medium leading-relaxed">{card.front}</p>
            <p className="mt-4 text-[10px] text-muted-foreground/60">Click to reveal answer</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-6 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <p className="text-[10px] uppercase tracking-widest text-primary mb-3">Answer</p>
            <p className="text-sm leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button onClick={prev} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={markAgain}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          Study again
        </button>
        <button onClick={markKnown}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-medium text-white hover:bg-emerald-600 transition-colors">
          Got it ✓
        </button>
        <button onClick={next} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {flashcards.map((c, i) => (
          <button key={c.id} onClick={() => { setFlipped(false); setIdx(i); }}
            className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-4 bg-primary" : known.has(c.id) ? "w-1.5 bg-emerald-500" : "w-1.5 bg-muted")} />
        ))}
      </div>
    </div>
  );
}

// ─── Question List ─────────────────────────────────────────────────────────────

function QuestionItem({ question, num }: { question: Question; num: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const dc = DIFF_COLORS[question.difficulty];
  const answered = selected !== null;

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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground mt-0.5">
          {num}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
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
        <span className={cn("flex-shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", dc.bg, dc.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", dc.dot)} />
          {question.difficulty.toLowerCase()}
        </span>
      </div>

      {/* Choices */}
      <div className="px-4 pb-3 space-y-1.5">
        {question.choices.map((c) => {
          const isSelected = selected === c.key;
          const isCorrect = answered && c.key === question.answer;
          const isWrong = answered && isSelected && c.key !== question.answer;
          return (
            <button key={c.key}
              onClick={() => !answered && setSelected(c.key)}
              disabled={answered}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                !answered && "hover:border-primary/40 hover:bg-primary/4 cursor-pointer",
                !answered && "border-border",
                isCorrect && "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
                isWrong   && "border-red-400 bg-red-50 dark:bg-red-900/20",
                answered && !isCorrect && !isWrong && "opacity-50 cursor-not-allowed border-border",
                !answered && isSelected && "border-primary bg-primary/8"
              )}>
              <span className={cn(
                "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
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
                className="flex-1 min-w-0 text-left text-sm prose-p:font-normal"
              />
            </button>
          );
        })}
      </div>

      {/* Explain */}
      <div className="border-t border-border px-4 py-2.5">
        <button onClick={handleExplain} disabled={loadingExplain}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-60">
          {loadingExplain ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
          {loadingExplain ? "Generating..." : explanation ? (showExplain ? "Hide explanation" : "Show explanation") : "Explain with AI"}
        </button>
        {showExplain && explanation && (
          <div className="mt-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 text-xs leading-relaxed animate-fade-in">
            <ReactMarkdown components={{ p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>, strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong> }}>
              {explanation}
            </ReactMarkdown>
          </div>
        )}
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
      <div className="p-4">
        {tab === "flashcards" && flashcards.length > 0 && (
          <FlashcardDeck flashcards={flashcards} />
        )}
        {tab === "questions" && questions.length > 0 && (
          <div
            className={cn(
              "space-y-4 overflow-y-auto pr-1",
              single === "questions"
                ? "max-h-[min(92vh,960px)] min-h-[42vh] md:min-h-[50vh]"
                : "max-h-[600px]"
            )}
          >
            {questions.map((q, i) => (
              <QuestionItem key={q.id} question={q} num={i + 1} />
            ))}
          </div>
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
