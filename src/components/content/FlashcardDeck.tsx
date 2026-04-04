"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export function FlashcardDeck({ flashcards }: { flashcards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = flashcards[index];

  function next() {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (i + 1) % flashcards.length), 150);
  }

  function prev() {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (i - 1 + flashcards.length) % flashcards.length), 150);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{index + 1} / {flashcards.length}</span>
        <div className="flex gap-0.5">
          {flashcards.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 w-4 rounded-full transition-colors",
                i === index ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <button
          onClick={() => { setFlipped(false); setIndex(0); }}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Restart
        </button>
      </div>

      {/* Card */}
      <div
        className="relative mx-auto cursor-pointer"
        style={{ perspective: "1000px", height: "180px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-500",
            flipped ? "[transform:rotateY(180deg)]" : ""
          )}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl border border-border bg-background p-6 text-center backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Question</p>
              <p className="text-base font-medium leading-relaxed">{card.front}</p>
              <p className="mt-4 text-xs text-muted-foreground">Click to reveal answer</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-6 text-center [transform:rotateY(180deg)] backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-widest text-primary">Answer</p>
              <p className="text-base leading-relaxed">{card.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={prev}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          {flipped ? "Show question" : "Show answer"}
        </button>
        <button
          onClick={next}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
