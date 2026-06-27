"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
  currentUserId?: string;
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
  currentUserId,
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
  const [reportImages, setReportImages] = useState<File[]>([]);
  const [reportImagePreviews, setReportImagePreviews] = useState<string[]>([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [previousAttempts, setPreviousAttempts] = useState<{ id: string; score: number; createdAt: string; timeTaken: number }[]>([]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const navigateTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrentIndex(index);
  }, []);

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
      const j = JSON.parse(raw) as { 
        flagged?: string[]; 
        bookmarked?: string[];
        answers?: Record<string, string>;
        revealed?: Record<string, boolean>;
      };
      if (Array.isArray(j.flagged)) setFlagged(new Set(j.flagged));
      if (Array.isArray(j.bookmarked)) setBookmarked(new Set(j.bookmarked));
      if (j.answers) setAnswers(j.answers);
      if (j.revealed) setRevealed(j.revealed);
    } catch {
      /* ignore */
    }
  }, [paperId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        metaStorageKey(paperId),
        JSON.stringify({ 
          flagged: [...flagged], 
          bookmarked: [...bookmarked],
          answers,
          revealed
        })
      );
    } catch {
      /* ignore */
    }
  }, [flagged, bookmarked, answers, revealed, paperId]);

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
      // Clear progress cache after successful submit
      localStorage.removeItem(metaStorageKey(paperId));
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

  useEffect(() => {
    if (timeLeft !== null && timeLeft < 120 && timeLeft > 0 && timeLeft % 30 === 0) {
      if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
    }
  }, [timeLeft]);

  const q = questions[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const pct = Math.round((answeredCount / questions.length) * 100);
  const mins = timeLeft !== null ? String(Math.floor(timeLeft / 60)).padStart(2, "0") : null;
  const secs = timeLeft !== null ? String(timeLeft % 60).padStart(2, "0") : null;
  const timerWarn = timeLeft !== null && timeLeft < 120;

  // --- Firebase Background Sync ---
  // We sync to Firestore every 5 answers to avoid hitting Postgres during the session
  const lastSyncedCount = useRef(0);
  useEffect(() => {
    const currentCount = Object.keys(answers).length;
    if (currentCount > 0 && currentCount % 5 === 0 && currentCount !== lastSyncedCount.current) {
      lastSyncedCount.current = currentCount;
      if (!guestQuiz && currentUserId) {
        // Dynamic import to keep component bundle lean
        import("@/lib/firebase/config").then(({ db }) => {
          const { doc, setDoc } = require("firebase/firestore");
          const progressRef = doc(db, `users/${currentUserId}/quizProgress/${paperId}`);
          setDoc(progressRef, { 
            answers, 
            revealed, 
            updatedAt: new Date().toISOString(),
            paperTitle 
          }, { merge: true }).catch(() => {});
        });
      }
    }
  }, [answers, revealed, paperId, guestQuiz, currentUserId, paperTitle]);

  useEffect(() => {
    if (guestQuiz || !currentUserId) return;
    // On mount, try to recover from Firestore if localStorage is missing/empty
    const recover = async () => {
      try {
        const { db } = await import("@/lib/firebase/config");
        const { doc, getDoc } = await import("firebase/firestore");
        const progressRef = doc(db, `users/${currentUserId}/quizProgress/${paperId}`);
        const snap = await getDoc(progressRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.answers && Object.keys(answers).length === 0) {
             setAnswers(data.answers);
             if (data.revealed) setRevealed(data.revealed);
          }
        }
      } catch (e) {}
    };
    recover();
  }, [paperId, guestQuiz, currentUserId]);

  useEffect(() => {
    const url = guestQuiz
      ? `/api/v1/guest-quiz/past-papers/${paperId}/attempts`
      : `/api/v1/past-papers/${paperId}/attempts`;
    fetch(url)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPreviousAttempts(data))
      .catch(() => {});
  }, [paperId, guestQuiz]);

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
      if (navigator.vibrate) navigator.vibrate(10);
    },
    [q, revealed, examMode, currentIndex, questions.length]
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
      const imageDataUrls = await Promise.all(
        reportImages.map((f) => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        }))
      );
      const res = await fetch(`/api/v1/questions/${q.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: reportNote, pastPaperId: paperId, images: imageDataUrls }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not submit report");
        return;
      }
      toast.success("Thanks — your report was recorded for review.");
      setReportOpen(false);
      setReportNote("");
      setReportImages([]);
      setReportImagePreviews([]);
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setReportSubmitting(false);
    }
  }, [q, reportNote, reportImages, paperId]);

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
    <div className="animate-fade-in">
      {/* ── Fixed top bar (portaled to body to escape translateZ) ── */}
      {typeof document !== "undefined" && createPortal(
        <header className="fixed top-0 inset-x-0 z-40 w-full rounded-b-2xl border-b border-gray-200/70 dark:border-white/[0.06] bg-background/95 backdrop-blur-xl saturate-[1.8] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between gap-2 px-3 py-2 md:px-6 md:py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 shrink-0"
            >
              <span
                className="block h-7 w-7 md:h-8 md:w-8 shrink-0 bg-foreground"
                style={{
                  maskImage: "url(/medonex-logo.svg)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskImage: "url(/medonex-logo.svg)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                }}
              />
            </Link>
            <div className="min-w-0 max-w-[140px] md:max-w-[300px]">
              <h1 className="text-sm font-black tracking-tight text-foreground truncate leading-tight">{paperTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!secureExamMode ? (
              <div className="flex rounded-full border border-border bg-muted/50 p-0.5">
                <button
                  type="button"
                  onClick={() => setExamMode(false)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] md:text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !examMode ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={!examMode}
                >
                  <BookOpen className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Tutor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExamMode(true)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] md:text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    examMode ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={examMode}
                >
                  <GraduationCap className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Exam</span>
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-200">
                <GraduationCap className="h-3 w-3" aria-hidden />
                Secured
              </span>
            )}
            <div
              className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-sm md:text-base tabular-nums text-muted-foreground"
              title="Time on this question"
            >
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              <span className="font-mono font-medium">
                {String(Math.floor(questionSeconds / 60)).padStart(2, "0")}:
                {String(questionSeconds % 60).padStart(2, "0")}
              </span>
            </div>
            {timeLeft !== null && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm md:text-base font-bold tabular-nums transition-colors",
                  timerWarn
                    ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse-soft"
                    : "border-border bg-muted/50 text-foreground"
                )}
                role="timer"
                aria-live="polite"
              >
                <Clock className="h-4 w-4 shrink-0" aria-hidden />
                {mins}:{secs}
              </div>
            )}
          </div>
        </div>
      </header>, document.body
      )}

      {/* ── Content area ── */}
      <div className="mx-auto max-w-4xl px-4 pt-[52px] pb-6 md:px-6 md:py-8 md:pt-24" style={{ scrollbarGutter: "stable" }}>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExitModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>
        {previousAttempts.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Previous attempts</p>
            <div className="flex flex-wrap gap-2">
              {previousAttempts.map((a) => (
                <Link
                  key={a.id}
                  href={guestQuiz ? `/guest/attempt/${a.id}` : `/quiz/attempt/${a.id}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted",
                    a.score >= 70
                      ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : a.score >= 50
                      ? "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                      : "border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                  )}
                >
                  <span className="font-semibold">{Math.round(a.score)}%</span>
                  <span className="opacity-60">{new Date(a.createdAt).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
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

      <div
        onTouchStart={(e) => {
          setTouchStart(e.touches[0].clientX);
          setTouchStartY(e.touches[0].clientY);
        }}
        onTouchEnd={(e) => {
          if (touchStart === null || touchStartY === null) return;
          const touchEnd = e.changedTouches[0].clientX;
          const touchEndY = e.changedTouches[0].clientY;
          const diffX = touchStart - touchEnd;
          const diffY = touchStartY - touchEndY;

          if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
            if (diffX > 0) {
              navigateTo(Math.min(currentIndex + 1, questions.length - 1), 1);
            } else {
              navigateTo(Math.max(currentIndex - 1, 0), -1);
            }
          }
          setTouchStart(null);
          setTouchStartY(null);
        }}
        className="touch-pan-y w-full min-h-[40vh] sm:min-h-0"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={q.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full"
          >
            <QuestionCard
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom spacer so content isn't hidden behind fixed nav */}
      <div className="sm:hidden" style={{ height: "calc(5rem + env(safe-area-inset-bottom, 0px))" }} aria-hidden />

      {/* ── Mobile nav + drawer integrated (portaled, always in DOM) ── */}
      {typeof document !== "undefined" && createPortal(
        <div className="md:hidden fixed bottom-0 inset-x-0 z-max flex flex-col justify-end pointer-events-none">
          {/* Backdrop (covers full screen, closes drawer on tap) */}
          <AnimatePresence>
            {navigatorOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 pointer-events-auto"
                onClick={() => setNavigatorOpen(false)}
              />
            )}
          </AnimatePresence>
          {/* Drawer panel (slides up from inside the nav) */}
          <AnimatePresence>
            {navigatorOpen && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="pointer-events-auto w-full max-h-[70vh] rounded-t-2xl overflow-hidden border-t border-gray-200/70 dark:border-white/[0.06] bg-background/95 backdrop-blur-xl saturate-[1.8] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]"
                role="dialog"
                aria-modal="true"
                aria-label="Jump to question"
              >
                <div className="flex max-h-[70vh] flex-col">
                  <div className="mx-auto mt-3 mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20" />
                  <div className="flex shrink-0 items-center justify-between px-4 pb-2">
                    <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Jump to question</div>
                    <button
                      type="button"
                      onClick={() => setNavigatorOpen(false)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Close"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
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
                              navigateTo(i, i > currentIndex ? 1 : -1);
                              setNavigatorOpen(false);
                            }}
                            className={cn(
                              "flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              i === currentIndex && "border-primary ring-2 ring-primary/30 bg-primary/5",
                              isFlagged && "border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-500 dark:bg-amber-500/20 dark:text-amber-400",
                              !done && !isFlagged && "border-gray-200 bg-white text-gray-500 dark:border-white/10 dark:bg-muted/30 dark:text-muted-foreground",
                              examMode && done && !isFlagged && "border-primary/50 bg-primary/10 text-primary",
                              correct && !isFlagged && "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-400",
                              wrong && !isFlagged && "border-red-400 bg-red-50 text-red-700 dark:border-red-400/50 dark:bg-red-500/10 dark:text-red-400"
                            )}
                            aria-label={`Question ${i + 1}${done ? ", answered" : ", unanswered"}${isFlagged ? ", marked for review" : ""}`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav bar itself */}
          <nav
            className="pointer-events-auto flex flex-row items-center justify-between gap-4 rounded-t-2xl border-t border-gray-200/70 dark:border-white/[0.06] bg-background/95 backdrop-blur-xl saturate-[1.8] px-4 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
            aria-label="Question navigation"
          >
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo(Math.max(currentIndex - 1, 0), -1)}
                disabled={currentIndex === 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                type="button"
                onClick={() => setNavigatorOpen((o) => !o)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={navigatorOpen}
              >
                <ListOrdered className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Outline</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo(Math.min(currentIndex + 1, questions.length - 1), 1)}
                disabled={currentIndex >= questions.length - 1}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ChevronRight className="h-4 w-4 sm:hidden" aria-hidden />}
              <span className="hidden sm:inline">{submitting ? "Submitting…" : "Submit quiz"}</span>
              <span className="sm:hidden">{submitting ? "..." : "Submit"}</span>
            </button>
          </nav>
        </div>,
        document.body
      )}

      {/* Desktop inline navigator */}
      {navigatorOpen && (
        <div
          className="mt-4 hidden sm:block rounded-2xl border border-border bg-card p-4 shadow-lg"
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
                    navigateTo(i, i > currentIndex ? 1 : -1);
                    setNavigatorOpen(false);
                  }}
                  className={cn(
                    "flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
          className="fixed inset-0 z-sticky flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          onClick={() => {
            setReportOpen(false);
            setReportNote("");
            setReportImages([]);
            setReportImagePreviews([]);
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

            {/* ── Image attachment ── */}
            <div className="mt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newFiles = [...reportImages, ...files].slice(0, 5);
                    setReportImages(newFiles);
                    Promise.all(
                      newFiles.map((f) => new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(f);
                      }))
                    ).then(setReportImagePreviews);
                    e.target.value = "";
                  }}
                />
                <span className="text-sm">📎</span>
                Attach images ({reportImages.length}/5)
              </label>
              {reportImagePreviews.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {reportImagePreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Attachment ${i + 1}`}
                        className="h-16 w-16 rounded-lg border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = reportImages.filter((_, j) => j !== i);
                          const newPreviews = reportImagePreviews.filter((_, j) => j !== i);
                          setReportImages(newFiles);
                          setReportImagePreviews(newPreviews);
                        }}
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReportOpen(false);
                  setReportNote("");
                  setReportImages([]);
                  setReportImagePreviews([]);
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

      {/* ── Exit confirmation modal ── */}
      {typeof document !== "undefined" && exitModalOpen && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-max flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setExitModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-foreground">Exit quiz?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your progress will be lost if you leave before submitting.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setExitModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => router.push("/past-papers")}
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Yes, exit
              </button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
    </div>
  );
}
