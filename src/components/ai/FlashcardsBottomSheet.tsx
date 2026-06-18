"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, ArrowLeft, ArrowRight, FloppyDisk, BookOpen, Check, Clock } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export interface FlashcardData {
  front: string;
  back: string;
}

interface FlashcardsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: FlashcardData[];
  isDark: boolean;
}

async function saveFlashcard(front: string, back: string) {
  const res = await fetch("/api/v1/ai/flashcards-from-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `Front: ${front}\nBack: ${back}` }),
  });
  if (!res.ok) throw new Error("Failed to save flashcard");
  return res.json();
}

export function FlashcardsBottomSheet({ isOpen, onClose, flashcards, isDark }: FlashcardsBottomSheetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSet, setSavingSet] = useState(false);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [setSavedState, setSetSavedState] = useState(false);
  const { data: session } = useSession();

  const current = flashcards[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  }, [currentIndex, flashcards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const handleSave = useCallback(async () => {
    if (saved.has(currentIndex)) return;
    setSaving(true);
    try {
      await saveFlashcard(current.front, current.back);
      setSaved((prev) => new Set(prev).add(currentIndex));
      toast.success("Saved to Spaced Repetition");
    } catch {
      toast.error("Failed to save flashcard");
    }
    setSaving(false);
  }, [current, currentIndex, saved]);

  const handleSaveSet = useCallback(async () => {
    if (!session?.user) {
      toast.error("Please sign in to save flashcard sets");
      return;
    }
    setSavingSet(true);
    try {
      const title = `Flashcard Set (${flashcards.length} cards)`;
      const res = await fetch("/api/v1/ai/save-flashcard-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, flashcards, shareCode: crypto.randomUUID().slice(0, 8) }),
      });
      if (!res.ok) throw new Error("Failed to save set");
      setSetSavedState(true);
      toast.success("Flashcard set saved!");
    } catch {
      toast.error("Failed to save flashcard set");
    }
    setSavingSet(false);
  }, [flashcards, session]);

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
          <div className={cn("absolute inset-0", isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/40 backdrop-blur-sm")} />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden",
              isDark ? "bg-[#121212] border-t border-white/10" : "bg-white border-t border-gray-200"
            )}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-gray-300")} />
            </div>

            <div className={cn("flex items-center justify-between px-5 py-3 border-b", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-white/10" : "bg-amber-50")}>
                  <BookOpen size={16} weight="bold" className={isDark ? "text-white" : "text-amber-500"} />
                </div>
                <div>
                  <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                    Flashcards ({flashcards.length})
                  </h2>
                  <p className={cn("text-[10px] font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
                    Tap card to flip
                  </p>
                </div>
              </div>
              <button onClick={onClose} className={cn("p-2 rounded-xl transition-colors", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 flex items-start justify-center">
              {current && (
                <motion.div
                  className="w-full max-w-lg cursor-pointer perspective-[1000px]"
                  style={{ perspective: "1000px" }}
                  onClick={() => setFlipped(!flipped)}
                >
                  <motion.div
                    className="relative w-full min-h-[260px]"
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Front */}
                    <div className={cn(
                      "absolute inset-0 rounded-2xl border p-6 flex flex-col items-center justify-center text-center",
                      "backface-hidden",
                      isDark ? "bg-[#1e1e2a] border-white/10" : "bg-amber-50 border-amber-200"
                    )} style={{ backfaceVisibility: "hidden" }}>
                      <p className={cn("text-sm font-medium opacity-50 mb-4", isDark ? "text-gray-500" : "text-gray-400")}>
                        Tap to reveal answer
                      </p>
                      <p className={cn("text-base font-bold leading-relaxed", isDark ? "text-white" : "text-gray-900")}>
                        {current.front}
                      </p>
                    </div>

                    {/* Back */}
                    <div className={cn(
                      "absolute inset-0 rounded-2xl border p-6 flex flex-col items-center justify-center text-center",
                      "backface-hidden",
                      isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"
                    )} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <p className={cn("text-sm font-medium opacity-50 mb-4", isDark ? "text-gray-500" : "text-gray-400")}>
                        Answer
                      </p>
                      <p className={cn("text-base leading-relaxed", isDark ? "text-white" : "text-gray-900")}>
                        {current.back}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>

            <div className={cn("flex items-center justify-between px-5 py-4 border-t", isDark ? "border-white/10" : "border-gray-200")}>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all", currentIndex === 0 ? (isDark ? "text-gray-600" : "text-gray-300") : (isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-100"))}
              >
                <ArrowLeft size={16} weight="bold" /> Prev
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveSet}
                  disabled={savingSet || setSavedState}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    setSavedState
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : isDark ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  )}
                >
                  <FloppyDisk size={14} weight={setSavedState ? "fill" : "regular"} />
                  {setSavedState ? "Saved Set" : savingSet ? "Saving..." : "Save Set"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || saved.has(currentIndex)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    saved.has(currentIndex)
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  )}
                >
                  {saved.has(currentIndex) ? <Check size={14} weight="bold" /> : <Clock size={14} />}
                  {saved.has(currentIndex) ? "Saved" : saving ? "Saving..." : "Save"}
                </button>
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all", currentIndex === flashcards.length - 1 ? (isDark ? "text-gray-600" : "text-gray-300") : (isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-100"))}
              >
                Next <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
