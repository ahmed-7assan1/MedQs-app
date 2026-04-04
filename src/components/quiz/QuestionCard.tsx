"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  ChevronDown,
  ChevronUp,
  Flag,
  Bookmark,
  BookmarkCheck,
  MessageSquareWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionWithChoices } from "@/types";
import ReactMarkdown from "react-markdown";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { normalizeImageUrl } from "@/lib/markdown-helpers";

interface Props {
  question: QuestionWithChoices;
  index: number;
  showResult?: boolean;
  selectedAnswer?: string;
  onAnswer?: (key: string) => void;
  flagged?: boolean;
  bookmarked?: boolean;
  onToggleFlag?: () => void;
  onToggleBookmark?: () => void;
  onReport?: () => void;
  questionSeconds?: number;
  /** When true, hide AI explain (e.g. exam mode — avoids spoilers). */
  examMode?: boolean;
  /** When false, hide the AI explanation block (site/paper policy). Default true. */
  showAiPanel?: boolean;
  /** Passed to explain API so per-paper AI disable is enforced server-side */
  explainPaperId?: string;
  /** Anti-cheat: discourage copy/paste of stem and choices during live quiz */
  protectContent?: boolean;
}

export function QuestionCard({
  question,
  index,
  showResult,
  selectedAnswer,
  onAnswer,
  flagged,
  bookmarked,
  onToggleFlag,
  onToggleBookmark,
  onReport,
  questionSeconds = 0,
  examMode = false,
  showAiPanel = true,
  explainPaperId,
  protectContent = false,
}: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stemId = `q-stem-${question.id}`;

  useEffect(() => {
    choiceRefs.current = choiceRefs.current.slice(0, question.choices.length);
  }, [question.id, question.choices.length]);

  const focusChoice = useCallback((i: number) => {
    const el = choiceRefs.current[i];
    el?.focus();
  }, []);

  const handleChoiceKeyDown = useCallback(
    (e: React.KeyboardEvent, choiceIndex: number) => {
      if (showResult) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        focusChoice(Math.min(choiceIndex + 1, question.choices.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        focusChoice(Math.max(choiceIndex - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const c = question.choices[choiceIndex];
        if (c) onAnswer?.(c.key);
      }
    },
    [focusChoice, onAnswer, question.choices, showResult]
  );

  async function handleExplain() {
    if (explanation) {
      setExplainOpen((p) => !p);
      return;
    }
    setLoadingExplain(true);
    try {
      const q = explainPaperId
        ? `?paperId=${encodeURIComponent(explainPaperId)}`
        : "";
      const res = await fetch(`/api/v1/questions/${question.id}/explain${q}`);
      const data = await res.json();
      setExplanation(data.explanation);
      setExplainOpen(true);
    } catch {
      setExplanation("Could not load explanation. Please try again.");
      setExplainOpen(true);
    } finally {
      setLoadingExplain(false);
    }
  }

  const difficultyColor = {
    EASY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-300",
    MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-300",
    HARD: "bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-300",
  }[question.difficulty];

  const qm = String(Math.floor(questionSeconds / 60)).padStart(2, "0");
  const qs = String(questionSeconds % 60).padStart(2, "0");

  let rovingChoiceIndex = 0;
  if (selectedAnswer) {
    const i = question.choices.findIndex((c) => c.key === selectedAnswer);
    if (i >= 0) rovingChoiceIndex = i;
  }

  const layout = question.stemLayout === "IMAGE_OVERLAY" ? "IMAGE_OVERLAY" : "STANDARD";

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/90 bg-card shadow-[0_4px_24px_rgb(0_0_0/0.05)] dark:shadow-[0_8px_32px_rgb(0_0_0/0.25)]",
        protectContent && "select-none"
      )}
      aria-labelledby={stemId}
      onCopy={(e) => {
        if (protectContent) e.preventDefault();
      }}
      onContextMenu={(e) => {
        if (protectContent) e.preventDefault();
      }}
    >
      <div className="border-b border-border/80 bg-muted/20 px-5 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {index + 1}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", difficultyColor)}>
              {question.difficulty.toLowerCase()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline" title="Time on this question">
              {qm}:{qs}
            </span>
            {onToggleFlag && (
              <button
                type="button"
                onClick={onToggleFlag}
                className={cn(
                  "rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  flagged ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-pressed={flagged}
                aria-label={flagged ? "Unflag question" : "Flag question for review"}
              >
                <Flag className={cn("h-4 w-4", flagged && "fill-current")} aria-hidden />
              </button>
            )}
            {onToggleBookmark && (
              <button
                type="button"
                onClick={onToggleBookmark}
                className={cn(
                  "rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  bookmarked ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-pressed={bookmarked}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
              >
                {bookmarked ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
              </button>
            )}
            {onReport && (
              <button
                type="button"
                onClick={onReport}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Report question"
              >
                <MessageSquareWarning className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <div id={stemId} className="space-y-4">
          {layout === "IMAGE_OVERLAY" && question.imageUrl ? (
            <figure className="relative overflow-hidden rounded-xl border border-border bg-black/5 dark:bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizeImageUrl(question.imageUrl)}
                alt=""
                className="max-h-[28rem] w-full object-contain"
                referrerPolicy="no-referrer"
                draggable={false}
              />
              {question.body?.trim() ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-4 pt-16 text-white">
                  <MarkdownBody
                    content={question.body}
                    className="text-[14px] font-medium leading-snug text-white prose-p:font-medium prose-headings:text-white"
                  />
                </figcaption>
              ) : null}
            </figure>
          ) : (
            <>
              {question.imageUrl ? (
                <figure className="overflow-hidden rounded-xl border border-border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizeImageUrl(question.imageUrl)}
                    alt={question.body?.trim() ? "Figure for this question" : "Clinical image for this question"}
                    className="max-h-80 w-full object-contain"
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                </figure>
              ) : null}
              {question.body?.trim() ? (
                <MarkdownBody
                  content={question.body}
                  className="text-[15px] font-medium tracking-tight text-foreground md:text-base prose-p:font-medium"
                />
              ) : !question.imageUrl ? (
                <p className="text-sm font-medium text-muted-foreground">(No stem text)</p>
              ) : null}
            </>
          )}
        </div>

        <div
          role="radiogroup"
          aria-labelledby={stemId}
          aria-disabled={showResult}
          className="space-y-2.5"
          onKeyDown={(e) => {
            if (showResult) return;
            const idx = choiceRefs.current.findIndex((el) => el === document.activeElement);
            if (idx < 0) return;
            handleChoiceKeyDown(e, idx);
          }}
        >
          {question.choices.map((choice, choiceIndex) => {
            const isSelected = selectedAnswer === choice.key;
            const isCorrect = showResult && choice.key === question.answer;
            const isWrong = showResult && isSelected && choice.key !== question.answer;

            return (
              <button
                key={choice.key}
                ref={(el) => {
                  choiceRefs.current[choiceIndex] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={showResult ? -1 : choiceIndex === rovingChoiceIndex ? 0 : -1}
                onClick={() => !showResult && onAnswer?.(choice.key)}
                disabled={showResult}
                onKeyDown={(e) => handleChoiceKeyDown(e, choiceIndex)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-150 md:text-[15px]",
                  !showResult && !isSelected && "border-border hover:border-primary/45 hover:bg-primary/[0.04]",
                  !showResult && isSelected && "border-primary ring-2 ring-primary/25 bg-primary/10 font-semibold shadow-sm",
                  isCorrect && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 font-semibold",
                  isWrong && "border-red-400 bg-red-50 dark:bg-red-950/35",
                  showResult && !isCorrect && !isWrong && "cursor-default opacity-55"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                    !showResult && isSelected && "border-primary bg-primary text-primary-foreground",
                    !showResult && !isSelected && "border-muted-foreground/25 text-muted-foreground",
                    isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                    isWrong && "border-red-500 bg-red-500 text-white"
                  )}
                  aria-hidden
                >
                  {choice.key}
                </span>
                <MarkdownBody
                  as="span"
                  content={choice.text}
                  inline
                  className="flex-1 min-w-0 text-left text-sm md:text-[15px] prose-p:font-normal"
                />
                {isCorrect && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />}
                {isWrong && <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" aria-hidden />}
              </button>
            );
          })}
        </div>

        {showResult && question.explanation?.trim() && (
          <section className="rounded-xl border border-border/80 bg-muted/25 px-4 py-3" aria-label="Author explanation">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Explanation</h3>
            <div className="mt-2 text-sm leading-relaxed text-foreground">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                }}
              >
                {question.explanation}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {showAiPanel && !examMode && (
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={handleExplain}
              disabled={loadingExplain}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {loadingExplain ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Lightbulb className="h-4 w-4" aria-hidden />
              )}
              {loadingExplain ? "Generating…" : explanation ? (explainOpen ? "Hide AI explanation" : "Show AI explanation") : "AI explain this question"}
              {explanation && !loadingExplain && (explainOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />)}
            </button>

            {explainOpen && explanation && (
              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm leading-relaxed animate-fade-in">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                  }}
                >
                  {explanation}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
