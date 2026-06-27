"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BookOpen, Spinner, Star, Clock, User, Sparkle, X, ArrowLeft, FloppyDisk } from "@phosphor-icons/react";
import toast from "react-hot-toast";

interface LibraryQuiz {
  id: string;
  title: string;
  questionCount: number;
  solverCount: number;
  createdAt: string;
  creatorId: string;
}

interface QuizDetail {
  id: string;
  title: string;
  questions: any[];
  creatorId: string;
  solverCount: number;
  avgRating: number;
  ratingCount: number;
  ratings: { userId: string; rating: number }[];
  comments: { id: string; userId: string; text: string; createdAt: string }[];
  createdAt: string;
}

interface LibraryFlashcardSet {
  id: string;
  title: string;
  cardCount: number;
  createdAt: string;
  creatorId: string;
}

interface FlashcardSetDetail {
  id: string;
  title: string;
  flashcards: { front: string; back: string }[];
  creatorId: string;
  avgRating: number;
  ratingCount: number;
  ratings: { userId: string; rating: number }[];
  comments: { id: string; userId: string; text: string; createdAt: string }[];
  createdAt: string;
}

interface LibraryContentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onOpenQuiz: (quiz: any) => void;
}

export function LibraryContentPanel({ isOpen, onClose, isDark, onOpenQuiz }: LibraryContentPanelProps) {
  const [tab, setTab] = useState<"quizzes" | "flashcards">("quizzes");
  const [quizzes, setQuizzes] = useState<LibraryQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Flashcard state
  const [flashcardSets, setFlashcardSets] = useState<LibraryFlashcardSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<FlashcardSetDetail | null>(null);
  const [fcDetailLoading, setFcDetailLoading] = useState(false);
  const [fcUserRating, setFcUserRating] = useState(0);
  const [fcCommentText, setFcCommentText] = useState("");
  const [fcCommenting, setFcCommenting] = useState(false);
  const [viewingCards, setViewingCards] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => setUserId(s?.user?.id || null)).catch(() => {});
  }, []);

  const fetchQuizzes = () => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/v1/ai/library/quizzes")
      .then(r => r.json())
      .then(data => setQuizzes(data.quizzes || []))
      .catch(() => toast.error("Failed to load library"))
      .finally(() => setLoading(false));
  };

  const fetchFlashcardSets = () => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/v1/ai/library/flashcard-sets")
      .then(r => r.json())
      .then(data => setFlashcardSets(data.flashcardSets || []))
      .catch(() => toast.error("Failed to load flashcards"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    if (tab === "quizzes") fetchQuizzes();
    else fetchFlashcardSets();
  }, [isOpen, tab]);

  const openQuizDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedQuiz(null);
    try {
      const res = await fetch(`/api/v1/ai/library/quizzes/${id}`);
      const data = await res.json();
      setSelectedQuiz(data);
      const myRating = data.ratings?.find((r: any) => r.userId === userId);
      setUserRating(myRating?.rating || 0);
    } catch {
      toast.error("Failed to load quiz details");
    } finally {
      setDetailLoading(false);
    }
  };

  const openSetDetail = async (id: string) => {
    setFcDetailLoading(true);
    setSelectedSet(null);
    try {
      const res = await fetch(`/api/v1/ai/library/flashcard-sets/${id}`);
      const data = await res.json();
      setSelectedSet(data);
      const myRating = data.ratings?.find((r: any) => r.userId === userId);
      setFcUserRating(myRating?.rating || 0);
    } catch {
      toast.error("Failed to load flashcard set details");
    } finally {
      setFcDetailLoading(false);
    }
  };

  const handleQuizRate = async (rating: number) => {
    if (!selectedQuiz || !userId) return;
    try {
      await fetch(`/api/v1/ai/library/quizzes/${selectedQuiz.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setUserRating(rating);
      toast.success("Rating saved!");
    } catch {
      toast.error("Failed to rate");
    }
  };

  const handleSetRate = async (rating: number) => {
    if (!selectedSet || !userId) return;
    try {
      await fetch(`/api/v1/ai/library/flashcard-sets/${selectedSet.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setFcUserRating(rating);
      toast.success("Rating saved!");
    } catch {
      toast.error("Failed to rate");
    }
  };

  const handleQuizComment = async () => {
    if (!selectedQuiz || !commentText.trim() || !userId) return;
    setCommenting(true);
    try {
      await fetch(`/api/v1/ai/library/quizzes/${selectedQuiz.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setCommentText("");
      toast.success("Comment added!");
      openQuizDetail(selectedQuiz.id);
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setCommenting(false);
    }
  };

  const handleSetComment = async () => {
    if (!selectedSet || !fcCommentText.trim() || !userId) return;
    setFcCommenting(true);
    try {
      await fetch(`/api/v1/ai/library/flashcard-sets/${selectedSet.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fcCommentText.trim() }),
      });
      setFcCommentText("");
      toast.success("Comment added!");
      openSetDetail(selectedSet.id);
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setFcCommenting(false);
    }
  };

  const handleSolveQuiz = () => {
    if (selectedQuiz) {
      const q = selectedQuiz;
      onClose();
      setSelectedQuiz(null);
      onOpenQuiz({ id: q.id, title: q.title, questions: q.questions, shareCode: "" });
    }
  };

  const closeAll = () => {
    onClose();
    setSelectedQuiz(null);
    setSelectedSet(null);
    setViewingCards(false);
    setCardIndex(0);
    setCardFlipped(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-max flex items-end md:items-center justify-center"
          onClick={closeAll}
        >
          <div className={cn("absolute inset-0", isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/40 backdrop-blur-sm")} />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={e => e.stopPropagation()}
            className={cn(
              "relative w-full md:max-w-lg max-h-[88vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden md:mx-4",
              isDark ? "bg-[#121212] border-t md:border border-white/10" : "bg-white border-t md:border border-gray-200"
            )}
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-gray-300")} />
            </div>

            <div className={cn("flex items-center justify-between px-5 py-3 border-b", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-2.5">
                {selectedQuiz || selectedSet ? (
                  <button onClick={() => { setSelectedQuiz(null); setSelectedSet(null); setViewingCards(false); setCardIndex(0); setCardFlipped(false); }} className={cn("p-1.5 rounded-lg transition-colors", isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500")}>
                    <ArrowLeft size={18} weight="bold" />
                  </button>
                ) : null}
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-white/10" : "bg-indigo-50")}>
                  <BookOpen size={16} weight="bold" className={isDark ? "text-white" : "text-indigo-500"} />
                </div>
                <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {selectedQuiz ? selectedQuiz.title : selectedSet ? selectedSet.title : "MedOneX Library"}
                </h2>
              </div>
              <button onClick={closeAll} className={cn("p-2 rounded-xl", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                <X size={18} />
              </button>
            </div>

            {!selectedQuiz && !selectedSet && !viewingCards && (
              <div className={cn("flex gap-1 px-5 pt-3 pb-2 border-b", isDark ? "border-white/10" : "border-gray-200")}>
                <button
                  onClick={() => setTab("quizzes")}
                  className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", tab === "quizzes" ? (isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"))}
                >
                  Quizzes
                </button>
                <button
                  onClick={() => setTab("flashcards")}
                  className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", tab === "flashcards" ? (isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"))}
                >
                  Flashcards
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
              {selectedQuiz ? (
                <div className="space-y-5">
                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                        <User size={14} />
                        <span>{selectedQuiz.creatorId.slice(0, 8)}...</span>
                        <Clock size={14} />
                        <span>{new Date(selectedQuiz.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                        <Sparkle size={14} />
                        <span>{selectedQuiz.solverCount} solved</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => handleQuizRate(star)} className="transition-all active:scale-90">
                          <Star size={18} weight={star <= userRating ? "fill" : "regular"} className={star <= userRating ? "text-amber-400" : isDark ? "text-gray-600" : "text-gray-300"} />
                        </button>
                      ))}
                      <span className={cn("text-xs ml-2", isDark ? "text-gray-500" : "text-gray-400")}>
                        {selectedQuiz.avgRating} ({selectedQuiz.ratingCount})
                      </span>
                    </div>

                    <button
                      onClick={handleSolveQuiz}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Solve Quiz ({selectedQuiz.questions?.length || 0} questions)
                    </button>
                  </div>

                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-100")}>
                    <h3 className={cn("text-sm font-bold mb-3", isDark ? "text-white" : "text-gray-900")}>Comments</h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className={cn(
                          "flex-1 px-3 py-2 rounded-xl text-sm border outline-none transition-all",
                          isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300"
                        )}
                      />
                      <button
                        onClick={handleQuizComment}
                        disabled={!commentText.trim() || commenting}
                        className={cn("px-3 py-2 rounded-xl text-sm font-bold transition-all", commentText.trim() ? "bg-indigo-500 text-white hover:bg-indigo-600" : isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400")}
                      >
                        {commenting ? <Spinner size={14} className="animate-spin" /> : "Post"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedQuiz.comments?.length === 0 && (
                        <p className={cn("text-xs text-center py-4", isDark ? "text-gray-500" : "text-gray-400")}>No comments yet</p>
                      )}
                      {selectedQuiz.comments?.map((c: any) => (
                        <div key={c.id} className={cn("p-3 rounded-xl", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-[10px] font-bold", isDark ? "text-gray-400" : "text-gray-500")}>{c.userId.slice(0, 8)}...</span>
                            <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-700")}>{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedSet && !viewingCards ? (
                <div className="space-y-5">
                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                        <User size={14} />
                        <span>{selectedSet.creatorId.slice(0, 8)}...</span>
                        <Clock size={14} />
                        <span>{new Date(selectedSet.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                        <FloppyDisk size={14} />
                        <span>{selectedSet.flashcards?.length || 0} cards</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => handleSetRate(star)} className="transition-all active:scale-90">
                          <Star size={18} weight={star <= fcUserRating ? "fill" : "regular"} className={star <= fcUserRating ? "text-amber-400" : isDark ? "text-gray-600" : "text-gray-300"} />
                        </button>
                      ))}
                      <span className={cn("text-xs ml-2", isDark ? "text-gray-500" : "text-gray-400")}>
                        {selectedSet.avgRating} ({selectedSet.ratingCount})
                      </span>
                    </div>

                    <button
                      onClick={() => setViewingCards(true)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/20"
                    >
                      View Flashcards ({selectedSet.flashcards?.length || 0} cards)
                    </button>
                  </div>

                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-100")}>
                    <h3 className={cn("text-sm font-bold mb-3", isDark ? "text-white" : "text-gray-900")}>Comments</h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={fcCommentText}
                        onChange={e => setFcCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className={cn(
                          "flex-1 px-3 py-2 rounded-xl text-sm border outline-none transition-all",
                          isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300"
                        )}
                      />
                      <button
                        onClick={handleSetComment}
                        disabled={!fcCommentText.trim() || fcCommenting}
                        className={cn("px-3 py-2 rounded-xl text-sm font-bold transition-all", fcCommentText.trim() ? "bg-indigo-500 text-white hover:bg-indigo-600" : isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400")}
                      >
                        {fcCommenting ? <Spinner size={14} className="animate-spin" /> : "Post"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedSet.comments?.length === 0 && (
                        <p className={cn("text-xs text-center py-4", isDark ? "text-gray-500" : "text-gray-400")}>No comments yet</p>
                      )}
                      {selectedSet.comments?.map((c: any) => (
                        <div key={c.id} className={cn("p-3 rounded-xl", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-[10px] font-bold", isDark ? "text-gray-400" : "text-gray-500")}>{c.userId.slice(0, 8)}...</span>
                            <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-700")}>{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedSet && viewingCards ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-full max-w-lg">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => { setViewingCards(false); setCardIndex(0); setCardFlipped(false); }}
                        className={cn("flex items-center gap-1 text-xs font-bold", isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <span className={cn("text-xs font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
                        {cardIndex + 1} / {selectedSet.flashcards.length}
                      </span>
                    </div>

                    <div className="cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setCardFlipped(!cardFlipped)}>
                      <motion.div
                        className="relative w-full min-h-[260px]"
                        animate={{ rotateY: cardFlipped ? 180 : 0 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <div className={cn(
                          "absolute inset-0 rounded-2xl border p-6 flex flex-col items-center justify-center text-center",
                          isDark ? "bg-[#1e1e2a] border-white/10" : "bg-amber-50 border-amber-200"
                        )} style={{ backfaceVisibility: "hidden" }}>
                          <p className={cn("text-sm font-medium opacity-50 mb-4", isDark ? "text-gray-500" : "text-gray-400")}>Tap to reveal answer</p>
                          <p className={cn("text-base font-bold leading-relaxed", isDark ? "text-white" : "text-gray-900")}>
                            {selectedSet.flashcards[cardIndex]?.front}
                          </p>
                        </div>
                        <div className={cn(
                          "absolute inset-0 rounded-2xl border p-6 flex flex-col items-center justify-center text-center",
                          isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"
                        )} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                          <p className={cn("text-sm font-medium opacity-50 mb-4", isDark ? "text-gray-500" : "text-gray-400")}>Answer</p>
                          <p className={cn("text-base leading-relaxed", isDark ? "text-white" : "text-gray-900")}>
                            {selectedSet.flashcards[cardIndex]?.back}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => { if (cardIndex > 0) { setCardIndex(cardIndex - 1); setCardFlipped(false); } }}
                        disabled={cardIndex === 0}
                        className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", cardIndex === 0 ? (isDark ? "text-gray-600" : "text-gray-300") : (isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-100"))}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => { if (cardIndex < selectedSet.flashcards.length - 1) { setCardIndex(cardIndex + 1); setCardFlipped(false); } }}
                        disabled={cardIndex === selectedSet.flashcards.length - 1}
                        className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", cardIndex === selectedSet.flashcards.length - 1 ? (isDark ? "text-gray-600" : "text-gray-300") : (isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-gray-100"))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size={20} className="animate-spin text-indigo-500" />
                </div>
              ) : tab === "quizzes" && quizzes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={32} className={cn("mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No published quizzes yet</p>
                  <p className={cn("text-xs mt-1", isDark ? "text-gray-600" : "text-gray-400")}>Save and publish a quiz from the AI chat to see it here</p>
                </div>
              ) : tab === "flashcards" && flashcardSets.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={32} className={cn("mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No published flashcard sets yet</p>
                  <p className={cn("text-xs mt-1", isDark ? "text-gray-600" : "text-gray-400")}>Save a flashcard set from the AI chat to see it here</p>
                </div>
              ) : tab === "quizzes" ? (
                <div className="space-y-2">
                  {quizzes.map(q => (
                    <button key={q.id} onClick={() => openQuizDetail(q.id)} className={cn("w-full text-left p-4 rounded-2xl border transition-all", isDark ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]" : "border-gray-100 bg-gray-50/50 hover:bg-gray-100")}>
                      <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{q.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{q.questionCount} questions</span>
                        <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{q.solverCount} solved</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {flashcardSets.map(s => (
                    <button key={s.id} onClick={() => openSetDetail(s.id)} className={cn("w-full text-left p-4 rounded-2xl border transition-all", isDark ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]" : "border-gray-100 bg-gray-50/50 hover:bg-gray-100")}>
                      <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{s.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{s.cardCount} cards</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
