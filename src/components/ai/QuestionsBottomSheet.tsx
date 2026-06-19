"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Check, Download, ArrowLeft, ArrowRight, FileText, BookmarkSimple } from "@phosphor-icons/react";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

export interface QuestionData {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface QuestionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionData[];
  isDark: boolean;
}

function exportToWord(questions: QuestionData[]) {
  const items = questions.map((q, i) => ({
    body: q.question,
    choices: q.options.map((opt, j) => ({
      key: String.fromCharCode(65 + j),
      text: opt,
    })),
    answer: q.answer,
    explanation: q.explanation,
  }));

  const rows: any[] = [];

  items.forEach((q, i) => {
    const questionPara = new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({ text: `Q${i + 1}: `, bold: true, size: 22, font: "Candara" }),
        new TextRun({ text: q.body, size: 22, font: "Candara" }),
      ],
    });

    const optionsLines: (Paragraph)[] = q.choices.map((c) =>
      new Paragraph({
        spacing: { before: 40, after: 40 },
        indent: { left: 360 },
        children: [
          new TextRun({ text: `${c.key}. `, bold: true, size: 20, font: "Candara" }),
          new TextRun({ text: c.text, size: 20, font: "Candara" }),
        ],
      })
    );

    const answerPara = new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({ text: `Answer: `, bold: true, size: 20, font: "Candara", color: "006400" }),
        new TextRun({ text: q.answer, size: 20, font: "Candara", color: "006400" }),
      ],
    });

    const explanationPara = q.explanation
      ? new Paragraph({
          spacing: { before: 60, after: 200 },
          children: [
            new TextRun({ text: `Explanation: `, bold: true, size: 20, font: "Candara", italics: true }),
            new TextRun({ text: q.explanation, size: 20, font: "Candara", italics: true }),
          ],
        })
      : new Paragraph({ spacing: { after: 200 } });

    rows.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: "888888" },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "888888" },
          left: { style: BorderStyle.SINGLE, size: 6, color: "888888" },
          right: { style: BorderStyle.SINGLE, size: 6, color: "888888" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                children: [questionPara, ...optionsLines, answerPara, explanationPara],
              }),
            ],
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({ text: "AI Generated Questions", bold: true, size: 28, font: "Candara" }),
            ],
          }),
          ...rows,
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "AI_Generated_Questions.docx");
    toast.success("Questions exported as Word document");
  });
}

export function QuestionsBottomSheet({ isOpen, onClose, questions, isDark }: QuestionsBottomSheetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleExport = () => {
    exportToWord(questions);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/ai/save-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: questions[0]?.question?.slice(0, 60) || "Untitled Quiz",
          questions,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      toast.success("Quiz saved! Find it in Saved → Quizzes");
    } catch {
      toast.error("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10030]"
          onClick={onClose}
        >
          {/* Overlay */}
          <div className={cn(
            "absolute inset-0",
            isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/40 backdrop-blur-sm"
          )} />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden",
              isDark ? "bg-[#050505] border-t border-white/10" : "bg-[#FCFCFC] border-t border-gray-200"
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-gray-300")} />
            </div>

            {/* Header */}
            <div className={cn(
              "flex items-center justify-between px-5 py-3 border-b",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isDark ? "bg-white/10" : "bg-indigo-50"
                )}>
                  <FileText size={16} weight="bold" className={isDark ? "text-white" : "text-indigo-500"} />
                </div>
                <div>
                  <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                    Questions ({questions.length})
                  </h2>
                  <p className={cn("text-[10px] font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
                    {currentIndex + 1} of {questions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    saved
                      ? "text-emerald-500"
                      : isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
                  )}
                  title={saved ? "Saved" : "Save Quiz"}
                >
                  <BookmarkSimple size={18} weight={saved ? "fill" : "regular"} />
                </button>
                <button
                  onClick={handleExport}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
                  )}
                  title="Export to Word"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={onClose}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Question content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
              {current && <QuestionView key={currentIndex} question={current} index={currentIndex} isDark={isDark} />}
            </div>

            {/* Footer navigation */}
            <div className={cn(
              "flex items-center justify-between px-5 py-4 border-t",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  currentIndex === 0
                    ? isDark ? "text-gray-600" : "text-gray-300"
                    : isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-100"
                )}
              >
                <ArrowLeft size={16} weight="bold" />
                Prev
              </button>
              <span className={cn(
                "text-xs font-medium",
                isDark ? "text-gray-500" : "text-gray-400"
              )}>
                {currentIndex + 1} / {questions.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  currentIndex === questions.length - 1
                    ? isDark ? "text-gray-600" : "text-gray-300"
                    : isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-100"
                )}
              >
                Next
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuestionView({ question, index, isDark }: { question: QuestionData; index: number; isDark: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  // Determine the correct answer text: if answer is a letter key (A,B,C,D,E), map to option text
  const correctAnswerText = useMemo(() => {
    const ans = question.answer;
    if (!ans) return "";
    // If answer is a single letter A-E, get the corresponding option
    if (/^[A-Ea-e]$/.test(ans.trim())) {
      const idx = ans.trim().toUpperCase().charCodeAt(0) - 65;
      return question.options[idx] || ans;
    }
    return ans;
  }, [question.answer, question.options]);

  const isCorrect = selected === correctAnswerText;

  return (
    <div>
      {/* Question text */}
      <div className={cn(
        "text-sm font-bold leading-relaxed mb-5",
        isDark ? "text-white" : "text-gray-900"
      )}>
        <span className="text-indigo-500 mr-2">Q{index + 1}.</span>
        {question.question}
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {(question.options || []).map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelectedOption = selected === opt;
          const isAnswer = opt === correctAnswerText;
          let optionClass = isDark
            ? "border-white/10 bg-white/[0.03] text-gray-300"
            : "border-gray-200 bg-gray-50/50 text-gray-700";

          if (selected) {
            if (isAnswer) {
              optionClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
            } else if (isSelectedOption && !isCorrect) {
              optionClass = "border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300";
            } else {
              optionClass = isDark
                ? "border-white/5 bg-white/[0.02] text-gray-500"
                : "border-gray-100 bg-gray-50 text-gray-400";
            }
          }

          return (
            <button
              key={i}
              onClick={() => !selected && setSelected(opt)}
              disabled={!!selected}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all",
                "active:scale-[0.98]",
                optionClass
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                selected
                  ? isAnswer
                    ? "bg-emerald-500 text-white"
                    : isSelectedOption && !isCorrect
                      ? "bg-rose-500 text-white"
                      : isDark ? "bg-white/5 text-gray-500" : "bg-gray-200 text-gray-400"
                  : isDark ? "bg-white/10 text-gray-400" : "bg-gray-200 text-gray-500"
              )}>
                {selected && isAnswer ? <Check size={14} weight="bold" /> : letter}
              </span>
              <span className="flex-1 pt-0.5">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {selected && question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-5 p-4 rounded-2xl text-sm leading-relaxed border",
            isCorrect
              ? isDark
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
              : isDark
                ? "bg-amber-500/5 border-amber-500/20 text-amber-300"
                : "bg-amber-50 border-amber-200 text-amber-800"
          )}
        >
          <p className="font-bold mb-1">{isCorrect ? "✓ Correct!" : "✗ Incorrect"}</p>
          {question.explanation}
        </motion.div>
      )}

      {/* Try Again button */}
      {selected && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelected(null)}
          className={cn(
            "mt-4 w-full py-3 rounded-xl text-sm font-bold transition-colors",
            isDark
              ? "bg-white/10 text-white hover:bg-white/15"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          )}
        >
          Try Again
        </motion.button>
      )}
    </div>
  );
}
