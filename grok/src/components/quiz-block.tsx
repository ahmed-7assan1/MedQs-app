import { useState } from "react";
import { Check, X, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type QuizQuestion = {
  q: string;
  choices: string[];
  answer: number;
  explanation?: string;
};
type QuizData = { title?: string; questions: QuizQuestion[] };

export function QuizBlock({ raw }: { raw: string }) {
  const data = safeParse<QuizData>(raw);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    return <FallbackBlock raw={raw} lang="quiz" />;
  }

  const total = data.questions.length;
  const correct = data.questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
    0,
  );
  const allAnswered = Object.keys(answers).length === total;

  return (
    <div dir="auto" className="my-4 rounded-2xl border border-border bg-card/60 p-4 not-prose">
      {data.title && (
        <h3 className="mb-3 text-base font-semibold text-foreground">{data.title}</h3>
      )}
      <ol className="space-y-4">
        {data.questions.map((q, qi) => {
          const chosen = answers[qi];
          return (
            <li key={qi} className="rounded-xl bg-background/60 p-3">
              <div className="mb-2 flex gap-2 text-[15px] font-medium text-foreground">
                <span className="text-muted-foreground">{qi + 1}.</span>
                <span>{q.q}</span>
              </div>
              <div className="space-y-1.5">
                {q.choices.map((c, ci) => {
                  const isChosen = chosen === ci;
                  const isCorrect = ci === q.answer;
                  const showResult = submitted;
                  return (
                    <button
                      key={ci}
                      type="button"
                      onClick={() => {
                        if (submitted) return;
                        setAnswers((p) => ({ ...p, [qi]: ci }));
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm transition",
                        "border-border hover:bg-accent",
                        isChosen && !showResult && "border-primary bg-primary/10",
                        showResult && isCorrect && "border-emerald-500/60 bg-emerald-500/10 text-emerald-200",
                        showResult && isChosen && !isCorrect && "border-red-500/60 bg-red-500/10 text-red-200",
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px]">
                        {String.fromCharCode(65 + ci)}
                      </span>
                      <span className="flex-1">{c}</span>
                      {showResult && isCorrect && <Check className="h-4 w-4" />}
                      {showResult && isChosen && !isCorrect && <X className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {submitted ? (
            <span>
              نتيجتك: <span className="font-semibold text-foreground">{correct} / {total}</span>
            </span>
          ) : (
            <span>{Object.keys(answers).length} / {total}</span>
          )}
        </div>
        <div className="flex gap-2">
          {submitted ? (
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              <RotateCw className="h-3.5 w-3.5" />
              إعادة
            </button>
          ) : (
            <button
              type="button"
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              تحقق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type FlashcardsData = {
  title?: string;
  cards: { front: string; back: string }[];
};

export function FlashcardsBlock({ raw }: { raw: string }) {
  const data = safeParse<FlashcardsData>(raw);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!data || !Array.isArray(data.cards) || data.cards.length === 0) {
    return <FallbackBlock raw={raw} lang="flashcards" />;
  }

  const card = data.cards[index];
  const total = data.cards.length;

  function go(delta: number) {
    setIndex((i) => (i + delta + total) % total);
    setFlipped(false);
  }

  return (
    <div dir="auto" className="my-4 rounded-2xl border border-border bg-card/60 p-4 not-prose">
      {data.title && (
        <h3 className="mb-3 text-base font-semibold text-foreground">{data.title}</h3>
      )}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "group relative flex min-h-[180px] w-full items-center justify-center rounded-xl border border-border bg-background/60 p-6 text-center transition hover:bg-background/80",
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {flipped ? "الإجابة" : "السؤال"}
          </span>
          <span className="text-lg font-medium text-foreground">
            {flipped ? card.back : card.front}
          </span>
          <span className="mt-2 text-[11px] text-muted-foreground opacity-70">
            اضغط للقلب
          </span>
        </div>
      </button>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </button>
        <span className="text-sm text-muted-foreground">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
        >
          التالي
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FallbackBlock({ raw, lang }: { raw: string; lang: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-black/50 p-4 text-sm">
      <code>{`\`\`\`${lang}\n${raw}\n\`\`\``}</code>
    </pre>
  );
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // try to extract first {...} block
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}