"use client";
import { useState, useEffect, useCallback } from "react";
import { Layers, HelpCircle, ChevronLeft, ChevronRight, RotateCcw, Lightbulb, Loader2, Sparkles, CheckCircle2, MessageCircle } from "lucide-react";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { normalizeImageUrl } from "@/lib/markdown-helpers";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { PremiumVideoPlayer } from "@/components/content/PremiumVideoPlayer";
import { useRouter } from "next/navigation";
import { useCommunityShareStore } from "@/lib/store";
import { RATING_LABELS } from "@/lib/sm2";
interface Flashcard { id: string; front: string; back: string }
interface Question {
  id: string; body: string; imageUrl?: string | null; videoUrl?: string | null;
  choices: { key: string; text: string }[];
  answer: string; explanation?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD"; lectureId: string;
  questionType?: string;
}

interface Props {
  flashcards: Flashcard[];
  questions: Question[];
  /** `both` = tabs; single section pages hide tabs */
  mode?: "both" | "flashcards" | "questions" | "osce";
  userId?: string;
  lectureId?: string;
}

type Tab = "flashcards" | "questions";
type DiffColor = { bg: string; text: string; dot: string };

const DIFF_COLORS: Record<string, DiffColor> = {
  EASY:   { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  MEDIUM: { bg: "bg-amber-50 dark:bg-amber-900/20",     text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-500" },
  HARD:   { bg: "bg-red-50 dark:bg-red-900/20",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500" },
};

// ─── Flashcard Deck ────────────────────────────────────────────────────────────

function FlashcardDeck({ flashcards, lectureId, userId, onDueCountChange }: {
  flashcards: Flashcard[]; lectureId?: string; userId?: string; onDueCountChange?: (n: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dueIds, setDueIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!lectureId || !userId) { setLoading(false); return; }
    fetch(`/api/v1/lectures/${lectureId}/flashcards/due`)
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<string>((data.due ?? []).map((c: any) => c.id));
        setDueIds(ids);
        onDueCountChange?.(data.dueCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lectureId, userId, onDueCountChange]);

  const dueCards = flashcards.filter((c) => dueIds.has(c.id));
  const allCards = dueCards.length > 0 ? dueCards : flashcards;
  const currentIdx = Math.min(idx, allCards.length - 1);
  const currentCard = allCards[currentIdx];
  const totalCards = allCards.length;

  function goNext() {
    setFlipped(false);
    setTimeout(() => setIdx((i) => Math.min(i + 1, totalCards - 1)), 160);
  }

  async function handleRate(quality: string) {
    if (!currentCard || submitting) return;
    setSubmitting(currentCard.id);
    try {
      await fetch(`/api/v1/flashcards/${currentCard.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      setDueIds((prev) => { const n = new Set(prev); n.delete(currentCard.id); return n; });
      const newDueIds = new Set(dueIds);
      newDueIds.delete(currentCard.id);
      if (newDueIds.size === 0) {
        toast.success("All due cards reviewed! 🎉");
        onDueCountChange?.(0);
      }
      if (totalCards <= 1) {
        setIdx(0);
      } else {
        goNext();
      }
    } catch {
      toast.error("Failed to save review");
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <p className="text-lg font-bold text-foreground">All caught up!</p>
        <p className="text-sm text-muted-foreground">No flashcards due for review.</p>
      </div>
    );
  }

  const r = RATING_LABELS;
  const remaining = dueCards.filter((c) => dueIds.has(c.id)).length;

  return (
    <div className="flex w-full max-w-none flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Flashcard</p>
            <p className="font-display text-lg font-bold text-foreground md:text-xl">
              {currentIdx + 1} <span className="text-muted-foreground">/</span> {totalCards}
              {dueCards.length > 0 && dueCards.length < flashcards.length && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({dueCards.length} due)</span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs">
            <span className="font-medium text-amber-600 dark:text-amber-400">{remaining} remaining</span>
            <button
              type="button"
              onClick={() => { setIdx(0); setFlipped(false); }}
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Restart
            </button>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${totalCards > 0 ? ((totalCards - remaining) / totalCards) * 100 : 0}%` }} />
        </div>
      </div>

      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: "1200px", minHeight: "min(50vh, 480px)" }}
        onClick={() => { if (!flipped) setFlipped(true); }}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !flipped) { e.preventDefault(); setFlipped(true); }
        }}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Show question" : "Show answer"}
      >
        <div
          className="relative min-h-[min(50vh,480px)] w-full transition-transform duration-500"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-muted/35 p-6 text-center ring-1 ring-border/50 sm:p-10"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Front</p>
            <p className="max-w-3xl text-lg font-black leading-tight text-foreground sm:text-2xl">{currentCard.front}</p>
            <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Tap to reveal answer</p>
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-primary/[0.07] p-6 text-center ring-1 ring-primary/25 sm:p-10"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-primary/70">Back</p>
            <p className="max-w-3xl text-lg leading-relaxed text-foreground sm:text-2xl">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => { if (currentIdx > 0) { setFlipped(false); setTimeout(() => setIdx(currentIdx - 1), 160); } }}
          disabled={currentIdx <= 0}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card transition-all hover:bg-muted hover:scale-105 active:scale-95 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2 sm:flex-none">
          {flipped ? (
            r.map((rating) => (
              <button
                key={rating.key}
                type="button"
                onClick={() => handleRate(rating.key)}
                disabled={submitting === currentCard.id}
                className={`flex min-h-12 flex-1 items-center justify-center rounded-2xl px-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 sm:w-28 sm:flex-none ${rating.color}`}
              >
                {submitting === currentCard.id ? <Loader2 className="h-4 w-4 animate-spin" /> : rating.label}
              </button>
            ))
          ) : (
            <span className="text-[11px] text-muted-foreground">Tap the card to rate it</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => { if (currentIdx < totalCards - 1) { setFlipped(false); setTimeout(() => setIdx(currentIdx + 1), 160); } }}
          disabled={currentIdx >= totalCards - 1}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card transition-all hover:bg-muted hover:scale-105 active:scale-95 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {allCards.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => { setFlipped(false); setIdx(i); }}
            className={cn(
              "h-2 rounded-full transition-all",
              i === currentIdx ? "w-8 bg-primary" : dueIds.has(c.id) ? "w-2 bg-amber-500" : "w-2 bg-emerald-500"
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
  const router = useRouter();
  const setSharedQuestion = useCommunityShareStore((s) => s.setSharedQuestion);
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selected = selectedKey !== undefined ? selectedKey : internalSelected;
  const setSelected = (k: string) => {
    if (onSelectKey) onSelectKey(k);
    else setInternalSelected(k);
  };
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [essayAnswer, setEssayAnswer] = useState("");
  const [essayResult, setEssayResult] = useState<any>(null);
  const [grading, setGrading] = useState(false);

  const dc = DIFF_COLORS[question.difficulty];
  const isEssay = question.questionType === "ESSAY";
  const answered = isEssay ? !!essayResult : selected !== null;
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

  async function handleGradeEssay() {
    if (!essayAnswer.trim()) return toast.error("Please type your answer first");
    setGrading(true);
    try {
      const res = await fetch(`/api/v1/questions/${question.id}/grade`, {
        method: "POST",
        body: JSON.stringify({ answer: essayAnswer })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEssayResult(data);
      toast.success(`AI Grade: ${data.scorePercent}%`);
    } catch (e: any) {
      toast.error(e.message || "Grading failed");
    } finally {
      setGrading(false);
    }
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50 text-sm font-black text-muted-foreground ring-1 ring-border">
                {num}
              </span>
              <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">
                Question Analysis
              </h2>
            </div>
            <span className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest", dc.bg, dc.text)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", dc.dot)} />
              {question.difficulty.toLowerCase()}
            </span>
          </div>
          <div className="min-w-0 space-y-4">
            {question.videoUrl ? (
              <div className="mb-6">
                <PremiumVideoPlayer primaryUrl={question.videoUrl} title="Examination Media" />
              </div>
            ) : question.imageUrl ? (
              <div className="overflow-hidden rounded-xl border border-white/[0.02] bg-muted/20">
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

      {/* Choices or Essay */}
      {isEssay ? (
        <div className="mt-6 space-y-6">
           <div className="relative">
              <textarea
                value={essayAnswer}
                onChange={(e) => !answered && setEssayAnswer(e.target.value)}
                disabled={answered || grading}
                placeholder="Type your clinical analysis/answer here..."
                className="w-full min-h-[160px] rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm md:text-base focus:border-primary/50 focus:outline-none transition-all"
              />
              {!answered && (
                <button
                  onClick={handleGradeEssay}
                  disabled={grading || !essayAnswer.trim()}
                  className="absolute bottom-4 right-4 btn-gradient px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50"
                >
                  {grading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 inline" />}
                  Submit to AI
                </button>
              )}
           </div>

           {essayResult && (
             <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-4 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                         <Sparkles className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">AI Assessment Result</p>
                         <h4 className="text-lg font-black text-white">Diagnostic Feedback</h4>
                      </div>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Score</p>
                      <p className="text-3xl font-black text-indigo-400 tabular-nums">{essayResult.scorePercent}%</p>
                   </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/80 italic leading-relaxed">
                   "{essayResult.feedback}"
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                   {essayResult.strengths?.length > 0 && (
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Clinical Strengths</p>
                        <ul className="space-y-1.5">
                           {essayResult.strengths.map((s: string, i: number) => (
                             <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                                <span className="text-emerald-500 mt-0.5">•</span> {s}
                             </li>
                           ))}
                        </ul>
                     </div>
                   )}
                   {essayResult.missingKeyPoints?.length > 0 && (
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Missing Key Points</p>
                        <ul className="space-y-1.5">
                           {essayResult.missingKeyPoints.map((m: string, i: number) => (
                             <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                                <span className="text-amber-500 mt-0.5">•</span> {m}
                             </li>
                           ))}
                        </ul>
                     </div>
                   )}
                </div>
             </div>
           )}
        </div>
      ) : (
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
      )}

      {/* Explain & Discuss */}
      <div className={cn(immersive ? "mt-8 border-t border-white/[0.03] pt-6 flex flex-col gap-3" : "border-t border-border px-4 py-2.5 flex flex-col gap-3")}>
        <div className="flex items-center gap-6">
          <button onClick={handleExplain} disabled={loadingExplain}
            className={cn(
              "flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-60",
              immersive ? "text-sm" : "text-xs"
            )}>
            {loadingExplain ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
            {loadingExplain ? "Generating..." : explanation ? (showExplain ? "Hide explanation" : "Show explanation") : "Explain with AI"}
          </button>

          {answered && !isEssay && (
            <button 
              onClick={() => {
                 setSharedQuestion({
                    id: question.id,
                    body: question.body,
                    choices: question.choices,
                    correctAnswer: question.answer,
                    userAnswer: selected,
                    isCorrect: selected === question.answer,
                    lectureId: question.lectureId
                 });
                 router.push("/social");
              }}
              className={cn(
                "flex items-center gap-1.5 font-medium text-indigo-400 transition-colors hover:text-indigo-300",
                immersive ? "text-sm" : "text-xs"
              )}>
              <MessageCircle className="h-3.5 w-3.5" />
              Discuss in Forum
            </button>
          )}
        </div>
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

function QuestionsStepper({ questions, osce = false }: { questions: Question[], osce?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(60); // 60s per station for OSCE
  const [osceStarted, setOsceStarted] = useState(!osce);

  const q = questions[idx];
  const total = questions.length;

  const goNext = useCallback(() => {
    if (idx < total - 1) {
      setIdx((i) => i + 1);
      if (osce) setTimeLeft(60);
    } else if (osce) {
      setOsceStarted(false);
      toast.success("OSCE Session Completed!");
    }
  }, [idx, total, osce]);

  const goPrev = useCallback(() => {
    if (!osce) setIdx((i) => Math.max(0, i - 1));
  }, [osce]);

  useEffect(() => {
    if (!osce || !osceStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          goNext();
          return 60;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [osce, osceStarted, goNext]);

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
        if (!osce) goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, osce]);

  if (!q) return null;

  if (osce && !osceStarted && idx === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-[28px] bg-primary/10 flex items-center justify-center mb-6">
          <Layers className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-2xl font-black text-white">Ready for OSCE Session?</h3>
        <p className="text-sm text-white/40 mt-2 max-w-sm">
          This session is timed. You will have 60 seconds per station. Transitions are automated.
        </p>
        <button 
          onClick={() => setOsceStarted(true)}
          className="btn-gradient mt-8 px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white"
        >
          Start Examination
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {osce ? `Station ${idx + 1}` : "Question"}
            </p>
            <p className="font-display text-lg font-bold text-foreground md:text-xl">
              {idx + 1} <span className="text-muted-foreground">/</span> {total}
            </p>
          </div>
          {osce && (
            <div className={cn(
              "flex flex-col items-end",
              timeLeft <= 10 ? "text-red-500" : "text-primary"
            )}>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Time Remaining</span>
               <span className="text-2xl font-black tabular-nums">{timeLeft}s</span>
            </div>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              osce ? "bg-indigo-500" : "bg-primary"
            )}
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
        {!osce ? (
          <>
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center py-2">
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] animate-pulse">Station active • Automated transition enabled</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function LectureClient({ flashcards, questions, mode = "both", userId, lectureId }: Props) {
  const single: Tab | null = mode === "flashcards" ? "flashcards" : mode === "questions" ? "questions" : null;
  const [tab, setTab] = useState<Tab>(
    single === "questions" || mode === "osce" ? "questions" : (flashcards.length > 0 ? "flashcards" : "questions")
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
          <FlashcardDeck flashcards={flashcards} lectureId={lectureId} userId={userId} />
        )}
        {tab === "questions" && questions.length > 0 && (
          <QuestionsStepper questions={questions} osce={mode === "osce"} />
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

