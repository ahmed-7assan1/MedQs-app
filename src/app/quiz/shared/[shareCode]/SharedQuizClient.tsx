"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

interface QuizData {
  id: string;
  title: string;
  questions: QuestionItem[];
  shareCode: string;
  source?: string;
}

interface QuestionItem {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export function SharedQuizClient({ quiz }: { quiz: QuizData }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const isExportView = quiz.source === "export";

  if (isExportView) {
    return <ExportView quiz={quiz} isDark={isDark} />;
  }

  return <InteractiveView quiz={quiz} isDark={isDark} />;
}

function ExportView({ quiz, isDark }: { quiz: QuizData; isDark: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffColor = (d?: string) => {
    if (!d) return "";
    const map: Record<string, string> = { EASY: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20", HARD: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
    return map[d] || "";
  };

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]")}>
      <div className="max-w-3xl mx-auto w-full px-4 py-10">
        <div className={cn("mb-10 rounded-2xl p-6 sm:p-8 border shadow-sm", isDark ? "bg-[#12121a] border-white/[0.06]" : "bg-white border-gray-200/60 shadow-gray-200/50")}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>{quiz.title}</h1>
              <p className={cn("text-sm mt-1", isDark ? "text-gray-500" : "text-gray-400")}>{quiz.questions.length} Questions</p>
            </div>
            <button
              onClick={copyLink}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                copied
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                  : isDark
                    ? "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
            >
              {copied ? "✓ Copied" : "Copy Link"}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {quiz.questions.map((q: any, idx) => {
            const choices = q.choices || [];
            const body = q.body || q.question || "";
            const num = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={idx}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isDark
                    ? "bg-[#12121a] border-white/[0.06] shadow-lg shadow-black/20 hover:border-white/[0.12]"
                    : "bg-white border-gray-200/60 shadow-sm shadow-gray-200/50 hover:shadow-md hover:border-gray-300/60"
                )}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex gap-4 mb-5">
                    <span className={cn(
                      "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold tracking-wider",
                      isDark ? "bg-teal-500/15 text-teal-400" : "bg-teal-500/10 text-teal-600"
                    )}>
                      {num}
                    </span>
                    <p className={cn("text-base sm:text-lg font-medium leading-relaxed pt-1", isDark ? "text-white" : "text-gray-900")}>{body}</p>
                  </div>

                  {choices.length > 0 && (
                    <div className="space-y-2.5 ml-[52px] mb-4">
                      {choices.map((c: any, oi: number) => {
                        const isAnswer = c.key === q.answer;
                        return (
                          <div
                            key={oi}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all",
                              isAnswer
                                ? "border-emerald-500/40 bg-emerald-500/[0.07]"
                                : isDark
                                  ? "border-white/[0.06] bg-white/[0.02] text-gray-300"
                                  : "border-gray-100 bg-gray-50/50 text-gray-700"
                            )}
                          >
                            <span className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                              isAnswer
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500"
                                : isDark
                                  ? "bg-white/[0.04] border-white/[0.08] text-gray-400"
                                  : "bg-gray-100 border-gray-200 text-gray-500"
                            )}>
                              {c.key}
                            </span>
                            <span className="flex-1">{c.text}</span>
                            {isAnswer && (
                              <span className="flex-shrink-0 flex items-center gap-1 text-emerald-500 text-xs font-bold">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-3 ml-[52px]">
                    {q.difficulty && (
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border", diffColor(q.difficulty))}>
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {q.explanation && (
                  <div className={cn(
                    "px-5 sm:px-6 py-4 border-t text-sm leading-relaxed",
                    isDark
                      ? "bg-blue-500/[0.04] border-white/[0.06] text-blue-300"
                      : "bg-blue-50/50 border-gray-200/60 text-blue-700"
                  )}>
                    <span className="font-bold">Explanation: </span>{q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InteractiveView({ quiz, isDark }: { quiz: QuizData; isDark: boolean }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setCurrentIdx(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
  }, [quiz]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(session => {
        if (session?.user?.id) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  const q = quiz.questions[currentIdx];

  const correctAnswerText = useMemo(() => {
    if (!q) return "";
    if (q.options && q.options.length > 0) {
      const letterIndex = q.answer?.charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex < q.options.length) {
        return q.options[letterIndex];
      }
    }
    return q.answer || "";
  }, [q]);

  if (!authenticated) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-[#050505]" : "bg-[#FCFCFC]")}>
        <div className="text-center max-w-md px-6">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6", isDark ? "bg-white/10" : "bg-gray-100")}>
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>{quiz.title}</h1>
          <p className={cn("text-sm mb-8", isDark ? "text-gray-400" : "text-gray-500")}>{quiz.questions.length} questions · AI-Powered</p>
          <a
            href={`/login?redirect=/quiz/shared/${quiz.shareCode}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20 transition-all"
          >
            Sign Up / Login to Solve
          </a>
          <p className={cn("text-xs mt-4", isDark ? "text-gray-600" : "text-gray-400")}>Create a free account to attempt this quiz and track your score.</p>
        </div>
      </div>
    );
  }

  const handleAnswer = (option: string) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
    if (option === correctAnswerText) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-[#050505]" : "bg-[#FCFCFC]")}>
        <div className="text-center max-w-md px-6">
          <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold", pct >= 70 ? "bg-emerald-500/20 text-emerald-400" : pct >= 40 ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400")}>
            {pct}%
          </div>
          <h1 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>Quiz Complete!</h1>
          <p className={cn("text-sm mb-6", isDark ? "text-gray-400" : "text-gray-500")}>You scored {score} out of {quiz.questions.length}</p>
          <button
            onClick={() => { setCurrentIdx(0); setScore(0); setFinished(false); setSelected(null); setRevealed(false); }}
            className={cn("px-6 py-3 rounded-xl font-bold transition-all", isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-900 hover:bg-gray-200")}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = revealed && selected === correctAnswerText;
  const isWrong = revealed && selected !== correctAnswerText;

  return (
    <div className={cn("min-h-screen flex flex-col", isDark ? "bg-[#050505]" : "bg-[#FCFCFC]")}>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>{quiz.title}</h1>
            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>Question {currentIdx + 1} of {quiz.questions.length}</p>
          </div>
          <div className="flex gap-1.5">
            {quiz.questions.map((_, i) => (
              <div key={i} className={cn("w-2 h-2 rounded-full", i < currentIdx ? "bg-indigo-500" : i === currentIdx ? "bg-indigo-400" : isDark ? "bg-white/20" : "bg-gray-200")} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className={cn("p-6 rounded-2xl border mb-6", isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200")}>
              <p className={cn("text-base font-medium leading-relaxed mb-6", isDark ? "text-white" : "text-gray-900")}>{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isSelected = selected === opt;
                  const isAnswer = revealed && opt === correctAnswerText;
                  let btnClass = isDark ? "border-white/10 text-gray-300" : "border-gray-200 text-gray-700";
                  if (isSelected && !revealed) btnClass = "border-indigo-500 bg-indigo-500/10 text-indigo-400";
                  if (isAnswer && revealed) btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                  if (isSelected && isWrong) btnClass = "border-rose-500 bg-rose-500/10 text-rose-400";

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={revealed}
                      className={cn("w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium", btnClass)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {revealed && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("p-4 rounded-xl border mb-6", isCorrect ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10")}>
                <p className={cn("text-sm font-bold mb-1", isCorrect ? "text-emerald-400" : "text-rose-400")}>
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </p>
                {q.explanation && <p className={cn("text-xs leading-relaxed", isDark ? "text-gray-400" : "text-gray-500")}>{q.explanation}</p>}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {revealed && (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            {currentIdx < quiz.questions.length - 1 ? "Next Question →" : "See Results"}
          </button>
        )}
      </div>
    </div>
  );
}
