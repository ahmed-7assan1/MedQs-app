"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, ArrowRight, Award, BrainCircuit, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Question = {
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

type AtlasQuizModalProps = {
  isOpen: boolean;
  onClose: () => void;
  systemId?: string;
  structureId?: string;
  targetName?: string;
};

export default function AtlasQuizModal({ isOpen, onClose, systemId, structureId, targetName = "Human Anatomy" }: AtlasQuizModalProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);

    try {
      const res = await fetch("/api/v1/atlas/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId, structureId })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        throw new Error("No questions returned.");
      }
    } catch (e: any) {
      console.error("[ATLAS_QUIZ_FETCH]", e);
      setError("Failed to generate clinical quiz questions. Please verify your internet connection or try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen, systemId, structureId]);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || isAnswered) return;
    setIsAnswered(true);
    if (selectedAnswer === questions[currentIdx].answerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-[#111115] border border-white/10 rounded-[32px] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#16161c] shrink-0">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-black text-sm tracking-tight text-white">Anatomy Quick Quiz</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Target: {targetName}</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close quiz" className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <p className="text-white/60 font-bold text-sm">Generating AI Clinical Questions...</p>
                <p className="text-white/20 text-xs">Curating high-yield boards-style MCQs</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="max-w-xs">
                  <p className="text-sm text-white/80 font-bold">{error}</p>
                </div>
                <button onClick={fetchQuestions} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-black text-sm rounded-xl transition-all shadow-md">
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            ) : quizFinished ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white">Quiz Completed!</h4>
                  <p className="text-sm text-white/40 mt-1">Excellent study session.</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4">
                  <p className="text-3xl font-black text-cyan-400">{score} / {questions.length}</p>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-1">Correct Answers</p>
                </div>
                <div className="flex gap-3 w-full max-w-xs">
                  <button onClick={fetchQuestions} className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-colors">Retake Quiz</button>
                  <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-sm font-bold text-white transition-colors">Close</button>
                </div>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-5">
                {/* Question Info */}
                <div className="flex items-center justify-between text-xs font-bold text-white/40">
                  <span>Question {currentIdx + 1} of {questions.length}</span>
                  <span className="text-cyan-400">Score: {score}</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
                </div>

                {/* Question Text */}
                <p className="text-base font-bold text-white leading-relaxed">{questions[currentIdx].question}</p>

                {/* Choices Grid */}
                <div className="space-y-2">
                  {questions[currentIdx].choices.map((choice, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = questions[currentIdx].answerIndex === idx;

                    let btnClass = "bg-[#1c1c22] border-white/5 text-white/80 hover:bg-white/5";
                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                      } else if (isSelected) {
                        btnClass = "bg-rose-500/10 border-rose-500/30 text-rose-500";
                      } else {
                        btnClass = "bg-[#1c1c22]/50 border-white/5 text-white/20 opacity-50";
                      }
                    } else if (isSelected) {
                      btnClass = "bg-cyan-500/15 border-cyan-500/40 text-cyan-300";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        disabled={isAnswered}
                        className={cn("w-full px-4 py-3.5 rounded-2xl border text-left text-sm font-medium transition-all flex items-center justify-between", btnClass)}
                      >
                        <span>{choice}</span>
                        {isAnswered && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                        {isAnswered && isSelected && !isCorrect && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Panel */}
                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2"
                    >
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Clinical Explanation</h5>
                      <p className="text-xs text-white/70 leading-relaxed">{questions[currentIdx].explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {questions.length > 0 && !quizFinished && !loading && (
            <div className="px-6 py-4 border-t border-white/5 bg-[#16161c] flex justify-end shrink-0">
              {!isAnswered ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null}
                  className="h-11 px-6 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="h-11 px-6 bg-cyan-500 hover:bg-cyan-600 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  {currentIdx + 1 === questions.length ? "Finish Quiz" : "Next Question"} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
