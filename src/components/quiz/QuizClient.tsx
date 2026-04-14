"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ListOrdered,
  GraduationCap,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";

interface Question {
  id: string;
  questionType?: "MCQ" | "ESSAY";
  body: string;
  imageUrl?: string | null;
  stemLayout?: "STANDARD" | "IMAGE_OVERLAY";
  choices: { key: string; text: string }[];
  answer: string;
  essayReference?: string | null;
  explanation?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  lectureId: string;
}

interface QuizClientProps {
  paperId: string;
  paperTitle: string;
  timeLimitMin: number | null;
  questions: Question[];
  /** Site-wide AI toggle (admin settings) */
  siteAiEnabled?: boolean;
  /** Per-paper: allow AI explain at all */
  paperAiExplanationEnabled?: boolean;
  /** Per-paper: allow AI during the quiz; if false, only after submit (brief) / on review page */
  allowAiDuringQuiz?: boolean;
  /** Force exam behaviour: no tutor mode, no instant feedback */
  secureExamMode?: boolean;
  /** Block copy / context menu on question card during secured exam */
  restrictCopyPaste?: boolean;
  /** Count tab/window hides and warn; sent with submit */
  trackFocusLoss?: boolean;
  /** No login: submit via guest API and open result under /guest/attempt/... */
  guestQuiz?: boolean;
}

function metaStorageKey(paperId: string) {
  return `medqs-quiz-meta-${paperId}`;
}

function examModeKey(paperId: string) {
  return `medqs-quiz-exam-${paperId}`;
}

export function QuizClient({
  paperId,
  paperTitle,
  timeLimitMin,
  questions,
  siteAiEnabled = true,
  paperAiExplanationEnabled = true,
  allowAiDuringQuiz = false,
  secureExamMode = false,
  restrictCopyPaste = false,
  trackFocusLoss = false,
  guestQuiz = false,
}: QuizClientProps) {
  const router = useRouter();
  const focusLossRef = useRef(0);
  const wasHiddenRef = useRef(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimitMin ? timeLimitMin * 60 : null);
  const [startTime] = useState(Date.now());
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(() => new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const { siteName, logoUrl } = useSiteConfig();
  const [logoHover, setLogoHover] = useState(false);

  const examActive = examMode || secureExamMode;

  const showAiPanel =
    siteAiEnabled &&
    paperAiExplanationEnabled &&
    (allowAiDuringQuiz || submitted);

  useEffect(() => {
    if (secureExamMode) setExamMode(true);
  }, [secureExamMode]);

  useEffect(() => {
    if (!trackFocusLoss || submitted) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        focusLossRef.current += 1;
        wasHiddenRef.current = true;
      } else if (document.visibilityState === "visible" && wasHiddenRef.current) {
        wasHiddenRef.current = false;
        toast.error(
          "Academic integrity: you left this quiz tab. This may be reported to your course doctor when you submit.",
          { duration: 7000 }
        );
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [trackFocusLoss, submitted]);

  const protectQuestion = restrictCopyPaste && examActive;

  useEffect(() => {
    try {
      const ex = sessionStorage.getItem(examModeKey(paperId));
      if (ex === "1") setExamMode(true);
    } catch {
      /* ignore */
    }
  }, [paperId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(examModeKey(paperId), examMode ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [examMode, paperId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(metaStorageKey(paperId));
      if (!raw) return;
      const j = JSON.parse(raw) as { flagged?: string[]; bookmarked?: string[] };
      if (Array.isArray(j.flagged)) setFlagged(new Set(j.flagged));
      if (Array.isArray(j.bookmarked)) setBookmarked(new Set(j.bookmarked));
    } catch {
      /* ignore */
    }
  }, [paperId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        metaStorageKey(paperId),
        JSON.stringify({ flagged: [...flagged], bookmarked: [...bookmarked] })
      );
    } catch {
      /* ignore */
    }
  }, [flagged, bookmarked, paperId]);

  useEffect(() => {
    setQuestionSeconds(0);
    const t = setInterval(() => setQuestionSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    try {
      const url = guestQuiz
        ? `/api/v1/guest-quiz/past-papers/${paperId}/attempt`
        : `/api/v1/past-papers/${paperId}/attempt`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          timeTaken,
          focusLossCount: trackFocusLoss ? focusLossRef.current : 0,
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      const data = await res.json();
      setSubmitted(true);
      router.push(guestQuiz ? `/guest/attempt/${data.attemptId}` : `/quiz/attempt/${data.attemptId}`);
    } catch {
      toast.error("Submission failed. Please try again.");
      setSubmitting(false);
    }
  }, [answers, guestQuiz, paperId, startTime, submitted, submitting, router, trackFocusLoss]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, handleSubmit]);

  const q = questions[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const pct = Math.round((answeredCount / questions.length) * 100);
  const mins = timeLeft !== null ? String(Math.floor(timeLeft / 60)).padStart(2, "0") : null;
  const secs = timeLeft !== null ? String(timeLeft % 60).padStart(2, "0") : null;
  const timerWarn = timeLeft !== null && timeLeft < 120;

  const onSelectAnswer = useCallback(
    (key: string) => {
      if (!q) return;
      const isEssay = q.questionType === "ESSAY";
      if (examMode) {
        setAnswers((a) => ({ ...a, [q.id]: key }));
        return;
      }
      if (isEssay) {
        setAnswers((a) => ({ ...a, [q.id]: key }));
        return;
      }
      if (revealed[q.id]) return;
      setAnswers((a) => ({ ...a, [q.id]: key }));
      setRevealed((r) => ({ ...r, [q.id]: true }));
    },
    [q, revealed, examMode]
  );

  const toggleFlag = useCallback(() => {
    if (!q) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  }, [q]);

  const toggleBookmark = useCallback(() => {
    if (!q) return;
    setBookmarked((prev) => {
      const next = new Set(prev);
      const isSaving = !next.has(q.id);
      if (!isSaving) next.delete(q.id);
      else next.add(q.id);
      
      if (!guestQuiz) {
        fetch(`/api/v1/questions/${q.id}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ save: isSaving }),
        }).catch(() => {});
      }
      return next;
    });
  }, [q, guestQuiz]);

  const submitReport = useCallback(async () => {
    if (!q) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/v1/questions/${q.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: reportNote, pastPaperId: paperId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not submit report");
        return;
      }
      toast.success("Thanks — your report was recorded for review.");
      setReportOpen(false);
      setReportNote("");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setReportSubmitting(false);
    }
  }, [q, reportNote, paperId]);

  if (submitted) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-muted-foreground">Loading your results…</p>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-muted-foreground">
        No questions in this paper.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8 animate-fade-in">
      <header className="mb-6 sticky top-4 z-40 group">
        {/* Dynamic Glassmorphic Capsule */}
        <div className="rounded-2xl border border-border bg-background/80 dark:bg-muted/40 px-3 py-2.5 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
          
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onMouseEnter={() => setLogoHover(true)}
              onMouseLeave={() => setLogoHover(false)}
              className="flex items-center gap-2 rounded-xl bg-muted/50 dark:bg-white/[0.04] p-1.5 transition-colors hover:bg-muted dark:hover:bg-white/10"
            >
              <MedQsLogoMark className="h-8 w-8" />
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: logoHover ? "auto" : 0, opacity: logoHover ? 1 : 0 }}
                className="overflow-hidden whitespace-nowrap font-display text-sm font-bold tracking-tight text-foreground/90"
              >
                <div className="pr-2">{siteName || "MedQs"}</div>
              </motion.div>
            </Link>

            <div className="w-px h-8 bg-border mx-1 hidden sm:block" />

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Question {currentIndex + 1} of {questions.length}</p>
              <h1 className="font-display text-base font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-[300px]">{paperTitle}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!secureExamMode ? (
              <div
                className="flex rounded-xl border border-border bg-muted/50 p-1"
                role="group"
                aria-label="Study mode"
              >
                <button
                  type="button"
                  onClick={() => setExamMode(false)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !examMode ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={!examMode}
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  Tutor
                </button>
                <button
                  type="button"
                  onClick={() => setExamMode(true)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    examMode ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={examMode}
                >
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                  Exam
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-200">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                Secured
              </span>
            )}
            <div
              className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs tabular-nums text-muted-foreground"
              title="Time on this question"
            >
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="font-mono font-medium">
                {String(Math.floor(questionSeconds / 60)).padStart(2, "0")}:
                {String(questionSeconds % 60).padStart(2, "0")}
              </span>
            </div>
            {timeLeft !== null && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm font-bold tabular-nums transition-colors",
                  timerWarn
                    ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse-soft"
                    : "border-border bg-muted/50 text-foreground"
                )}
                role="timer"
                aria-live="polite"
              >
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {mins}:{secs}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mb-6">
        {examActive && (
          <p className="mb-2 rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Exam mode:</span> no instant feedback or AI explain — results after you submit.
            {trackFocusLoss ? " Tab switches may be recorded for integrity." : ""}
            {restrictCopyPaste ? " Copying question text is disabled." : ""}
          </p>
        )}
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>
            {answeredCount} of {questions.length} answered
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        index={currentIndex}
        showResult={examMode ? false : !!revealed[q.id]}
        selectedAnswer={answers[q.id]}
        onAnswer={onSelectAnswer}
        flagged={flagged.has(q.id)}
        bookmarked={bookmarked.has(q.id)}
        onToggleFlag={toggleFlag}
        onToggleBookmark={toggleBookmark}
        onReport={() => setReportOpen(true)}
        questionSeconds={questionSeconds}
        examMode={examMode}
        showAiPanel={showAiPanel}
        explainPaperId={paperId}
        protectContent={protectQuestion}
      />

      <nav className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Question navigation">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex >= questions.length - 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setNavigatorOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={navigatorOpen}
          >
            <ListOrdered className="h-4 w-4" aria-hidden />
            Outline
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
          {submitting ? "Submitting…" : "Submit quiz"}
        </button>
      </nav>

      {navigatorOpen && (
        <div
          className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-lg"
          role="region"
          aria-label="Jump to question"
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jump to</div>
          <div className="flex flex-wrap gap-2">
            {questions.map((qq, i) => {
              const done = !!answers[qq.id];
              const rev = !!revealed[qq.id];
              const choice = answers[qq.id];
              const correct = !examMode && rev && choice === qq.answer;
              const wrong = !examMode && rev && choice != null && choice !== qq.answer;
              const isFlagged = flagged.has(qq.id);
              return (
                <button
                  key={qq.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(i);
                    setNavigatorOpen(false);
                  }}
                  className={cn(
                    "flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    i === currentIndex && "border-primary ring-2 ring-primary/30",
                    isFlagged && "border-amber-400 bg-amber-400/30 text-amber-800 dark:border-amber-500 dark:bg-amber-500/20 dark:text-amber-400",
                    !done && !isFlagged && "border-border bg-muted/30 text-muted-foreground",
                    examMode && done && !isFlagged && "border-primary/45 bg-primary/10 text-primary",
                    correct && !isFlagged && "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    wrong && !isFlagged && "border-red-400/50 bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                  aria-label={`Question ${i + 1}${done ? ", answered" : ", unanswered"}${isFlagged ? ", marked for review" : ""}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {reportOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          onClick={() => {
            setReportOpen(false);
            setReportNote("");
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="report-dialog-title" className="font-display text-lg font-semibold">
              Report question
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us what is wrong (typo, outdated fact, image issue). Optional note:
            </p>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Optional details…"
              aria-label="Report details"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReportOpen(false);
                  setReportNote("");
                }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitReport()}
                disabled={reportSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {reportSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {reportSubmitting ? "Sending…" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
