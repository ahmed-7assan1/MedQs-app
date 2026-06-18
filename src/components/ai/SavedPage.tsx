"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BookOpen, Spinner, X, Trash, Copy, Globe, GlobeSimple,
  Clock, FileText, FloppyDisk
} from "@phosphor-icons/react";
import toast from "react-hot-toast";

interface SavedQuiz {
  id: string; title: string; questions: any[]; shareCode: string;
  published: boolean; createdAt: string;
}

interface SavedFlashcardSet {
  id: string; title: string; flashcards: any[]; shareCode: string;
  published: boolean; createdAt: string;
}

interface SavedPageProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function SavedPage({ isOpen, onClose, isDark }: SavedPageProps) {
  const [tab, setTab] = useState<"quizzes" | "flashcards">("quizzes");
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [fcSets, setFcSets] = useState<SavedFlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/v1/ai/saved-quizzes");
      if (r.ok) { const d = await r.json(); setQuizzes(d.quizzes || []); }
    } catch {} finally { setLoading(false); }
  };

  const fetchFlashcardSets = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/v1/ai/saved-flashcard-sets");
      if (r.ok) { const d = await r.json(); setQuizzes([]); setFcSets(d.flashcardSets || []); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (tab === "quizzes") fetchQuizzes();
    else fetchFlashcardSets();
  }, [isOpen, tab]);

  const togglePublish = async (id: string, published: boolean, type: "quiz" | "flashcard") => {
    const endpoint = type === "quiz"
      ? `/api/v1/ai/saved-quizzes/${id}`
      : `/api/v1/ai/saved-flashcard-sets/${id}`;
    try {
      const r = await fetch(endpoint, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (r.ok) {
        if (type === "quiz") setQuizzes(prev => prev.map(q => q.id === id ? { ...q, published: !published } : q));
        else setFcSets(prev => prev.map(s => s.id === id ? { ...s, published: !published } : s));
        toast.success(published ? "Unpublished" : "Published!");
      }
    } catch { toast.error("Failed to update"); }
  };

  const deleteItem = async (id: string, type: "quiz" | "flashcard") => {
    const endpoint = type === "quiz"
      ? `/api/v1/ai/saved-quizzes/${id}`
      : `/api/v1/ai/saved-flashcard-sets/${id}`;
    try {
      const r = await fetch(endpoint, { method: "DELETE" });
      if (r.ok) {
        if (type === "quiz") setQuizzes(prev => prev.filter(q => q.id !== id));
        else setFcSets(prev => prev.filter(s => s.id !== id));
        toast.success("Deleted");
      }
    } catch { toast.error("Failed to delete"); }
  };

  const copyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/quiz/shared/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={cn("fixed inset-0 z-[10030] overflow-y-auto",
            isDark ? "bg-[#0a0a0a]" : "bg-white"
          )}
        >
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-white/10" : "bg-indigo-50")}>
                  <BookOpen size={20} weight="bold" className={isDark ? "text-white" : "text-indigo-500"} />
                </div>
                <h1 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>Saved</h1>
              </div>
              <button onClick={onClose} className={cn("p-2 rounded-xl", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                <X size={20} />
              </button>
            </div>

            <div className={cn("flex gap-1 mb-6 p-1 rounded-xl", isDark ? "bg-white/[0.04]" : "bg-gray-100")}>
              {(["quizzes", "flashcards"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                    tab === t ? (isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm") : (isDark ? "text-gray-500" : "text-gray-400")
                  )}
                >
                  {t === "quizzes" ? "Quizzes" : "Flashcards"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Spinner size={24} className="animate-spin text-indigo-500" /></div>
            ) : tab === "quizzes" ? (
              quizzes.length === 0 ? (
                <div className="text-center py-20">
                  <FileText size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No saved quizzes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map(q => (
                    <div key={q.id} className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{q.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{q.questions?.length || 0} questions</span>
                            <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}><Clock size={10} className="inline mr-0.5" />{new Date(q.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", q.published ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600") : (isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"))}>
                          {q.published ? "Published" : "Private"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: isDark ? "#ffffff10" : "#e5e7eb" }}>
                        <button onClick={() => togglePublish(q.id, q.published, "quiz")}
                          className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                            isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                          {q.published ? <Globe size={12} /> : <GlobeSimple size={12} />} {q.published ? "Unpublish" : "Publish"}
                        </button>
                        <button onClick={() => copyShareLink(q.shareCode)}
                          className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                            isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                          <Copy size={12} /> Share
                        </button>
                        <button onClick={() => deleteItem(q.id, "quiz")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all ml-auto">
                          <Trash size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              fcSets.length === 0 ? (
                <div className="text-center py-20">
                  <FloppyDisk size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No saved flashcards</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fcSets.map(s => (
                    <div key={s.id} className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{s.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{s.flashcards?.length || 0} cards</span>
                            <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}><Clock size={10} className="inline mr-0.5" />{new Date(s.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", s.published ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600") : (isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"))}>
                          {s.published ? "Published" : "Private"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: isDark ? "#ffffff10" : "#e5e7eb" }}>
                        <button onClick={() => togglePublish(s.id, s.published, "flashcard")}
                          className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                            isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                          {s.published ? <Globe size={12} /> : <GlobeSimple size={12} />} {s.published ? "Unpublish" : "Publish"}
                        </button>
                        <button onClick={() => copyShareLink(s.shareCode)}
                          className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                            isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                          <Copy size={12} /> Share
                        </button>
                        <button onClick={() => deleteItem(s.id, "flashcard")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all ml-auto">
                          <Trash size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
