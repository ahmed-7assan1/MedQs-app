"use client";
import { cn } from "@/lib/utils";
import type { QuestionWithChoices } from "@/types";
import { MarkdownBody } from "@/components/ui/MarkdownBody";
import { normalizeImageUrl } from "@/lib/markdown-helpers";

interface Props {
  question: Partial<QuestionWithChoices>;
  className?: string;
  showAnswer?: boolean;
}

export function SharedQuestionBlock({ question, className, showAnswer = false }: Props) {
  if (!question) return null;

  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-sm",
      className
    )}>
      <div className="p-4 space-y-4">
        {/* Header/Type */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-400">
            {question.questionType === "ESSAY" ? "Essay Question" : "Multiple Choice"}
          </span>
          {question.difficulty && (
             <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/40 uppercase tracking-wide">
              {question.difficulty.toLowerCase()}
            </span>
          )}
        </div>

        {/* Stem */}
        <div className="space-y-3">
          {question.imageUrl && (
            <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
              <img 
                src={normalizeImageUrl(question.imageUrl)} 
                alt="" 
                className="max-h-64 w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          {question.body && (
            <MarkdownBody 
              content={question.body} 
              className="text-sm font-medium leading-relaxed text-white/90"
            />
          )}
        </div>

        {/* Choices */}
        {question.choices && question.choices.length > 0 && (
          <div className="space-y-2 pt-2">
            {question.choices.map((choice: any) => {
              const isCorrect = showAnswer && choice.key === question.answer;
              return (
                <div 
                  key={choice.key}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all",
                    isCorrect 
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" 
                      : "border-white/5 bg-white/[0.02] text-white/60"
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                    isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-white/20"
                  )}>
                    {choice.key}
                  </span>
                  <MarkdownBody 
                    as="span" 
                    content={choice.text} 
                    inline 
                    className="flex-1 min-w-0"
                  />
                  {isCorrect && (
                    <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-500">Correct Answer</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showAnswer && question.explanation && (
          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.05] p-3 text-xs text-white/50 italic leading-relaxed">
             <p className="font-bold text-white/70 mb-1 not-italic uppercase tracking-widest text-[9px]">Author Explanation</p>
             <MarkdownBody content={question.explanation} />
          </div>
        )}
      </div>
    </div>
  );
}
