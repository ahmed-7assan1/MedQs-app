"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BookmarkSimple, Question, Spinner, Copy, Check, ShareNetwork, Trash, GlobeHemisphereWest, Globe } from "@phosphor-icons/react";
import toast from "react-hot-toast";

interface SavedQuiz {
  id: string;
  title: string;
  questions: any[];
  shareCode: string;
  published: boolean;
  createdAt: string;
}

interface SavedContentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function SavedContentPanel({ isOpen, onClose, isDark }: SavedContentPanelProps) {
  const [tab, setTab] = useState<"quizzes" | "flashcards" | "images">("quizzes");
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/v1/ai/saved-quizzes")
      .then(r => r.json())
      .then(data => setQuizzes(data.quizzes || []))
      .catch(() => toast.error("Failed to load saved quizzes"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleCopyLink = (shareCode: string) => {
    const link = `${window.location.origin}/quiz/shared/${shareCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Share link copied!");
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/ai/saved-quizzes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setQuizzes(prev => prev.filter(q => q.id !== id));
      toast.success("Quiz deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const togglePublish = async (quiz: SavedQuiz) => {
    try {
      const { default: toast } = await import("react-hot-toast");
      const res = await fetch(`/api/v1/ai/saved-quizzes/${quiz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !quiz.published }),
      });
      if (!res.ok) throw new Error();
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, published: !q.published } : q));
      toast.success(quiz.published ? "Unpublished from Library" : "Published to MedOneX Library!");
    } catch {
      const { default: toast } = await import("react-hot-toast");
      toast.error("Failed to update");
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
          <div className={cn("absolute inset-0", isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/40 backdrop-blur-sm")} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={e => e.stopPropagation()}
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
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-white/10" : "bg-indigo-50")}>
                  <BookmarkSimple size={16} weight="bold" className={isDark ? "text-white" : "text-indigo-500"} />
                </div>
                <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>Saved</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn("flex rounded-xl p-0.5", isDark ? "bg-white/5" : "bg-gray-100")}>
                  {(["quizzes", "flashcards", "images"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all capitalize", tab === t ? (isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm") : isDark ? "text-gray-500" : "text-gray-400")}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size={20} className="animate-spin text-indigo-500" />
                </div>
              ) : tab === "quizzes" && quizzes.length === 0 ? (
                <div className="text-center py-12">
                  <Question size={32} className={cn("mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No saved quizzes yet</p>
                  <p className={cn("text-xs mt-1", isDark ? "text-gray-600" : "text-gray-400")}>Save a quiz from the AI chat to see it here</p>
                </div>
              ) : tab === "quizzes" ? (
                <div className="space-y-2">
                  {quizzes.map(q => (
                    <div key={q.id} className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{q.title}</p>
                            {q.published && (
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700")}>Published</span>
                            )}
                          </div>
                          <p className={cn("text-xs mt-0.5", isDark ? "text-gray-500" : "text-gray-400")}>{q.questions.length} questions · {new Date(q.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => togglePublish(q)}
                            className={cn("p-2 rounded-lg transition-colors", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}
                            title={q.published ? "Unpublish" : "Publish to Library"}
                          >
                            <GlobeHemisphereWest size={16} weight={q.published ? "fill" : "regular"} />
                          </button>
                          <button
                            onClick={() => handleCopyLink(q.shareCode)}
                            className={cn("p-2 rounded-lg transition-colors", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}
                            title="Copy share link"
                          >
                            <ShareNetwork size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className={cn("p-2 rounded-lg transition-colors", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}
                            title="Delete"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>Coming soon</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
