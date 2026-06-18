"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

interface QuizData {
  id: string;
  title: string;
  questions: QuestionItem[];
  shareCode: string;
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
  const [authenticated, setAuthenticated] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(session => {
        if (session?.user?.id) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

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

  const q = quiz.questions[currentIdx];

  const handleAnswer = (option: string) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
    if (option === q.answer) setScore(s => s + 1);
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

  const isCorrect = revealed && selected === q.answer;
  const isWrong = revealed && selected !== q.answer;

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
                  const isAnswer = revealed && opt === q.answer;
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
