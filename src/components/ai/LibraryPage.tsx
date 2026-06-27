"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BookOpen, Spinner, Star, Clock, User, X, ChatDots, Bell,
  UserCircle, ArrowLeft, FloppyDisk, StarFour
} from "@phosphor-icons/react";
import toast from "react-hot-toast";

// ─── Types ───
interface LibQuiz { id: string; title: string; questionCount: number; solverCount: number; createdAt: string; creatorId: string; }
interface LibFlashcardSet { id: string; title: string; cardCount: number; createdAt: string; creatorId: string; }
interface QuizDetail { id: string; title: string; questions: any[]; creatorId: string; solverCount: number; avgRating: number; ratingCount: number; ratings: { userId: string; rating: number }[]; comments: { id: string; userId: string; text: string; createdAt: string }[]; createdAt: string; }
interface FcSetDetail { id: string; title: string; flashcards: { front: string; back: string }[]; creatorId: string; avgRating: number; ratingCount: number; ratings: { userId: string; rating: number }[]; comments: { id: string; userId: string; text: string; createdAt: string }[]; createdAt: string; }
interface NotificationItem { type: string; itemId: string; itemTitle: string; actorId: string; text: string; rating?: number; createdAt: string; }

type Tab = "explore" | "my-publications" | "notifications";
type SubTab = "quizzes" | "flashcards";

interface LibraryPageProps { isOpen: boolean; onClose: () => void; isDark: boolean; onOpenQuiz: (quiz: any) => void; }

function Stars({ rating, onRate, isDark, readonly }: { rating: number; onRate?: (n: number) => void; isDark: boolean; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onRate?.(s)} disabled={readonly}
          className="transition-all active:scale-90 disabled:active:scale-100">
          <Star size={16} weight={s <= rating ? "fill" : "regular"} className={s <= rating ? "text-amber-400" : isDark ? "text-gray-600" : "text-gray-300"} />
        </button>
      ))}
    </div>
  );
}

export function LibraryPage({ isOpen, onClose, isDark, onOpenQuiz }: LibraryPageProps) {
  const [tab, setTab] = useState<Tab>("explore");
  const [subTab, setSubTab] = useState<SubTab>("quizzes");
  const [userId, setUserId] = useState<string | null>(null);

  // Explore state
  const [quizzes, setQuizzes] = useState<LibQuiz[]>([]);
  const [fcSets, setFcSets] = useState<LibFlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetail | null>(null);
  const [selectedSet, setSelectedSet] = useState<FcSetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [fcUserRating, setFcUserRating] = useState(0);
  const [fcCommentText, setFcCommentText] = useState("");
  const [fcCommenting, setFcCommenting] = useState(false);
  const [viewingCards, setViewingCards] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // My publications state
  const [myQuizzes, setMyQuizzes] = useState<LibQuiz[]>([]);
  const [myFcSets, setMyFcSets] = useState<LibFlashcardSet[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => setUserId(s?.user?.id || null)).catch(() => {});
  }, []);

  const fetchExplore = async () => {
    setLoading(true); setSelectedQuiz(null); setSelectedSet(null);
    try {
      if (subTab === "quizzes") {
        const r = await fetch("/api/v1/ai/library/quizzes");
        if (r.ok) { const d = await r.json(); setQuizzes(d.quizzes || []); }
      } else {
        const r = await fetch("/api/v1/ai/library/flashcard-sets");
        if (r.ok) { const d = await r.json(); setFcSets(d.flashcardSets || []); }
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchMyPublications = async () => {
    setMyLoading(true);
    try {
      const [qr, fr] = await Promise.all([
        fetch("/api/v1/ai/saved-quizzes").then(r => r.ok ? r.json() : { quizzes: [] }),
        fetch("/api/v1/ai/saved-flashcard-sets").then(r => r.ok ? r.json() : { flashcardSets: [] }),
      ]);
      setMyQuizzes((qr.quizzes || []).filter((q: any) => q.published));
      setMyFcSets((fr.flashcardSets || []).filter((s: any) => s.published));
    } catch {} finally { setMyLoading(false); }
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const r = await fetch("/api/v1/ai/library/notifications");
      if (r.ok) { const d = await r.json(); setNotifications(d.notifications || []); }
    } catch {} finally { setNotifLoading(false); }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (tab === "explore") fetchExplore();
    else if (tab === "my-publications") fetchMyPublications();
    else fetchNotifications();
  }, [isOpen, tab, subTab]);

  const openQuizDetail = async (id: string) => {
    setDetailLoading(true); setSelectedQuiz(null);
    try { const r = await fetch(`/api/v1/ai/library/quizzes/${id}`); if (r.ok) { const d = await r.json(); setSelectedQuiz(d); setUserRating(d.ratings?.find((x: any) => x.userId === userId)?.rating || 0); } }
    catch {} finally { setDetailLoading(false); }
  };

  const openSetDetail = async (id: string) => {
    setDetailLoading(true); setSelectedSet(null);
    try { const r = await fetch(`/api/v1/ai/library/flashcard-sets/${id}`); if (r.ok) { const d = await r.json(); setSelectedSet(d); setFcUserRating(d.ratings?.find((x: any) => x.userId === userId)?.rating || 0); } }
    catch {} finally { setDetailLoading(false); }
  };

  const handleRate = async (id: string, rating: number, type: "quiz" | "flashcard") => {
    const ep = type === "quiz" ? `/api/v1/ai/library/quizzes/${id}/rate` : `/api/v1/ai/library/flashcard-sets/${id}/rate`;
    try { const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }) }); if (r.ok) { if (type === "quiz") setUserRating(rating); else setFcUserRating(rating); toast.success("Rated!"); } }
    catch { toast.error("Failed to rate"); }
  };

  const handleComment = async (id: string, text: string, type: "quiz" | "flashcard") => {
    if (!text.trim() || !userId) return;
    const ep = type === "quiz" ? `/api/v1/ai/library/quizzes/${id}/comment` : `/api/v1/ai/library/flashcard-sets/${id}/comment`;
    const setter = type === "quiz" ? setCommenting : setFcCommenting;
    const textSetter = type === "quiz" ? setCommentText : setFcCommentText;
    setter(true);
    try { const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim() }) }); if (r.ok) { textSetter(""); toast.success("Comment added!"); if (type === "quiz") openQuizDetail(id); else openSetDetail(id); } }
    catch { toast.error("Failed to comment"); } finally { setter(false); }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const backToList = () => { setSelectedQuiz(null); setSelectedSet(null); setViewingCards(false); setCardIndex(0); setCardFlipped(false); };

  const renderComments = (comments: any[], onComment: (text: string) => void, loading: boolean) => (
    <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-100")}>
      <h3 className={cn("text-sm font-bold mb-3", isDark ? "text-white" : "text-gray-900")}>Comments</h3>
      {userId && (
        <div className="flex gap-2 mb-3">
          <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
            className={cn("flex-1 px-3 py-2 rounded-xl text-sm border outline-none transition-all",
              isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")} />
          <button onClick={() => handleComment(selectedQuiz?.id || selectedSet?.id || "", commentText, selectedQuiz ? "quiz" : "flashcard")}
            disabled={!commentText.trim() || commenting}
            className={cn("px-3 py-2 rounded-xl text-sm font-bold transition-all", commentText.trim() ? "bg-indigo-500 text-white hover:bg-indigo-600" : isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400")}>
            {commenting ? <Spinner size={14} className="animate-spin" /> : "Post"}
          </button>
        </div>
      )}
      <div className="space-y-2">
        {comments?.length === 0 && <p className={cn("text-xs text-center py-4", isDark ? "text-gray-500" : "text-gray-400")}>No comments yet</p>}
        {comments?.map((c: any) => (
          <div key={c.id} className={cn("p-3 rounded-xl", isDark ? "bg-black/10 backdrop-blur-lg" : "bg-white/40 backdrop-blur-lg")}>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[10px] font-bold", isDark ? "text-gray-400" : "text-gray-500")}>{c.userId?.slice(0, 8)}...</span>
              <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <p className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-700")}>{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={cn("fixed inset-0 z-max overflow-y-auto", isDark ? "bg-[#050505]" : "bg-[#FCFCFC]")}>
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {(selectedQuiz || selectedSet) ? (
                  <button onClick={backToList} className={cn("p-2 rounded-xl", isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-white/80 text-gray-500")}>
                    <ArrowLeft size={20} />
                  </button>
                ) : null}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDark ? "bg-white/10" : "bg-indigo-50")}>
                  <BookOpen size={20} weight="bold" className={isDark ? "text-white" : "text-indigo-500"} />
                </div>
                <h1 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {selectedQuiz ? selectedQuiz.title : selectedSet ? selectedSet.title : "Library"}
                </h1>
              </div>
              <button onClick={() => { onClose(); backToList(); }} className={cn("p-2 rounded-xl", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-white/80")}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs (only when not in detail view) */}
            {!selectedQuiz && !selectedSet && (
              <div className={cn("flex gap-1 mb-4 p-1 rounded-xl", isDark ? "bg-black/20 backdrop-blur-xl" : "bg-white/50 backdrop-blur-xl")}>
                {(["explore", "my-publications", "notifications"] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn("flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                      tab === t ? (isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm") : (isDark ? "text-gray-500" : "text-gray-400"))}>
                    {t === "explore" ? <StarFour size={14} /> : t === "my-publications" ? <UserCircle size={14} /> : <Bell size={14} />}
                    {t === "explore" ? "Explore" : t === "my-publications" ? "My Pubs" : "Activity"}
                  </button>
                ))}
              </div>
            )}

            {/* Sub-tab for explore */}
            {!selectedQuiz && !selectedSet && tab === "explore" && (
              <div className={cn("flex gap-1 mb-4 p-1 rounded-lg", isDark ? "bg-black/10 backdrop-blur-lg" : "bg-white/40 backdrop-blur-lg")}>
                {(["quizzes", "flashcards"] as SubTab[]).map(t => (
                  <button key={t} onClick={() => setSubTab(t)}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                      subTab === t ? (isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm") : (isDark ? "text-gray-500" : "text-gray-400"))}>
                    {t === "quizzes" ? "Quizzes" : "Flashcards"}
                  </button>
                ))}
              </div>
            )}

            {/* Sub-tab for my-publications */}
            {!selectedQuiz && !selectedSet && tab === "my-publications" && (
              <div className={cn("flex gap-1 mb-4 p-1 rounded-lg", isDark ? "bg-black/10 backdrop-blur-lg" : "bg-white/40 backdrop-blur-lg")}>
                {(["quizzes", "flashcards"] as SubTab[]).map(t => (
                  <button key={t} onClick={() => { setSubTab(t); fetchMyPublications(); }}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                      subTab === t ? (isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm") : (isDark ? "text-gray-500" : "text-gray-400"))}>
                    {t === "quizzes" ? "Quizzes" : "Flashcards"}
                  </button>
                ))}
              </div>
            )}

            {/* ─── Content ─── */}
            {selectedQuiz ? (
              <div className="space-y-5">
                <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl" : "border-gray-100 bg-white/50 backdrop-blur-xl")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                      <User size={14} /><span>{selectedQuiz.creatorId.slice(0, 8)}...</span>
                      <Clock size={14} /><span>{new Date(selectedQuiz.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{selectedQuiz.solverCount} solved</span>
                  </div>
                  <Stars rating={userRating} onRate={(n) => handleRate(selectedQuiz.id, n, "quiz")} isDark={isDark} />
                  <span className={cn("text-xs ml-2", isDark ? "text-gray-500" : "text-gray-400")}>{selectedQuiz.avgRating} ({selectedQuiz.ratingCount})</span>
                  <button onClick={() => { const q = selectedQuiz; onClose(); backToList(); onOpenQuiz({ id: q.id, title: q.title, questions: q.questions, shareCode: "" }); }}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20">
                    Solve Quiz ({selectedQuiz.questions?.length || 0} questions)
                  </button>
                </div>
                <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-100")}>
                  <h3 className={cn("text-sm font-bold mb-3", isDark ? "text-white" : "text-gray-900")}>Comments</h3>
                  {userId && (
                    <div className="flex gap-2 mb-3">
                      <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
                        className={cn("flex-1 px-3 py-2 rounded-xl text-sm border outline-none transition-all",
                          isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")} />
                      <button onClick={() => handleComment(selectedQuiz.id, commentText, "quiz")}
                        disabled={!commentText.trim() || commenting}
                        className={cn("px-3 py-2 rounded-xl text-sm font-bold transition-all", commentText.trim() ? "bg-indigo-500 text-white hover:bg-indigo-600" : isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400")}>
                        {commenting ? <Spinner size={14} className="animate-spin" /> : "Post"}
                      </button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {selectedQuiz.comments?.length === 0 && <p className={cn("text-xs text-center py-4", isDark ? "text-gray-500" : "text-gray-400")}>No comments yet</p>}
                    {selectedQuiz.comments?.map((c: any) => (
                      <div key={c.id} className={cn("p-3 rounded-xl", isDark ? "bg-black/10 backdrop-blur-lg" : "bg-white/40 backdrop-blur-lg")}>
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
                <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl" : "border-gray-100 bg-white/50 backdrop-blur-xl")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                      <User size={14} /><span>{selectedSet.creatorId.slice(0, 8)}...</span>
                      <Clock size={14} /><span>{new Date(selectedSet.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{selectedSet.flashcards?.length || 0} cards</span>
                  </div>
                  <Stars rating={fcUserRating} onRate={(n) => handleRate(selectedSet.id, n, "flashcard")} isDark={isDark} />
                  <span className={cn("text-xs ml-2", isDark ? "text-gray-500" : "text-gray-400")}>{selectedSet.avgRating} ({selectedSet.ratingCount})</span>
                  <button onClick={() => setViewingCards(true)}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/20">
                    View Flashcards ({selectedSet.flashcards?.length || 0} cards)
                  </button>
                </div>
                {renderComments(selectedSet.comments || [], setFcCommentText, fcCommenting)}
              </div>
            ) : selectedSet && viewingCards ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-full max-w-lg">
                  <button onClick={() => { setViewingCards(false); setCardIndex(0); setCardFlipped(false); }}
                    className={cn("flex items-center gap-1 text-xs font-bold mb-4", isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800")}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div className="cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setCardFlipped(!cardFlipped)}>
                    <motion.div className="relative w-full min-h-[260px]"
                      animate={{ rotateY: cardFlipped ? 180 : 0 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      style={{ transformStyle: "preserve-3d" }}>
                      <div className={cn("absolute inset-0 rounded-2xl border p-6 flex flex-col items-center justify-center text-center",
                        isDark ? "bg-[#1e1e2a] border-white/10" : "bg-amber-50 border-amber-200")}
                        style={{ backfaceVisibility: "hidden" }}>
                        <p className={cn("text-sm font-medium opacity-50 mb-4", isDark ? "text-gray-500" : "text-gray-400")}>Tap to reveal answer</p>
                        <p className={cn("text-base font-bold leading-relaxed", isDark ? "text-white" : "text-gray-900")}>{selectedSet.flashcards[cardIndex]?.front}</p>
                      </div>
                      <div className={cn("absolute inset-0 rounded-2xl border p-6 flex flex-col items-center justify-center text-center",
                        isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200")}
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                        <p className={cn("text-sm font-medium opacity-50 mb-4", isDark ? "text-gray-500" : "text-gray-400")}>Answer</p>
                        <p className={cn("text-base leading-relaxed", isDark ? "text-white" : "text-gray-900")}>{selectedSet.flashcards[cardIndex]?.back}</p>
                      </div>
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <button onClick={() => { if (cardIndex > 0) { setCardIndex(cardIndex - 1); setCardFlipped(false); } }}
                      disabled={cardIndex === 0}
                      className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", cardIndex === 0 ? (isDark ? "text-gray-600" : "text-gray-300") : (isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-white/80"))}>
                      Previous
                    </button>
                    <span className={cn("text-xs font-medium", isDark ? "text-gray-500" : "text-gray-400")}>{cardIndex + 1} / {selectedSet.flashcards.length}</span>
                    <button onClick={() => { if (cardIndex < selectedSet.flashcards.length - 1) { setCardIndex(cardIndex + 1); setCardFlipped(false); } }}
                      disabled={cardIndex === selectedSet.flashcards.length - 1}
                      className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", cardIndex === selectedSet.flashcards.length - 1 ? (isDark ? "text-gray-600" : "text-gray-300") : (isDark ? "text-white hover:bg-white/10" : "text-gray-900 hover:bg-white/80"))}>
                      Next
                    </button>
                  </div>
                </div>
              </div>
            ) : tab === "explore" ? (
              loading ? (
                <div className="flex justify-center py-20"><Spinner size={24} className="animate-spin text-indigo-500" /></div>
              ) : subTab === "quizzes" ? (
                quizzes.length === 0 ? (
                  <div className="text-center py-20">
                    <BookOpen size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                    <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No published quizzes yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quizzes.map(q => (
                      <button key={q.id} onClick={() => openQuizDetail(q.id)}
                        className={cn("w-full text-left p-4 rounded-2xl border transition-all", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl hover:bg-white/[0.05]" : "border-gray-100 bg-white/50 backdrop-blur-xl hover:bg-white/80")}>
                        <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{q.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{q.questionCount} questions</span>
                          <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{q.solverCount} solved</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                fcSets.length === 0 ? (
                  <div className="text-center py-20">
                    <FloppyDisk size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                    <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No published flashcard sets yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fcSets.map(s => (
                      <button key={s.id} onClick={() => openSetDetail(s.id)}
                        className={cn("w-full text-left p-4 rounded-2xl border transition-all", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl hover:bg-white/[0.05]" : "border-gray-100 bg-white/50 backdrop-blur-xl hover:bg-white/80")}>
                        <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{s.title}</p>
                        <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{s.cardCount} cards</span>
                      </button>
                    ))}
                  </div>
                )
              )
            ) : tab === "my-publications" ? (
              myLoading ? (
                <div className="flex justify-center py-20"><Spinner size={24} className="animate-spin text-indigo-500" /></div>
              ) : subTab === "quizzes" ? (
                myQuizzes.length === 0 ? (
                  <div className="text-center py-20">
                    <UserCircle size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                    <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No published quizzes</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myQuizzes.map(q => (
                      <button key={q.id} onClick={() => openQuizDetail(q.id)}
                        className={cn("w-full text-left p-4 rounded-2xl border transition-all", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl hover:bg-white/[0.05]" : "border-gray-100 bg-white/50 backdrop-blur-xl hover:bg-white/80")}>
                        <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{q.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{q.questionCount} questions</span>
                          <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{q.solverCount} solved</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                myFcSets.length === 0 ? (
                  <div className="text-center py-20">
                    <FloppyDisk size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                    <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No published flashcard sets</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myFcSets.map(s => (
                      <button key={s.id} onClick={() => openSetDetail(s.id)}
                        className={cn("w-full text-left p-4 rounded-2xl border transition-all", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl hover:bg-white/[0.05]" : "border-gray-100 bg-white/50 backdrop-blur-xl hover:bg-white/80")}>
                        <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{s.title}</p>
                        <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{s.cardCount} cards</span>
                      </button>
                    ))}
                  </div>
                )
              )
            ) : (
              /* Notifications tab */
              notifLoading ? (
                <div className="flex justify-center py-20"><Spinner size={24} className="animate-spin text-indigo-500" /></div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-20">
                  <Bell size={40} className={cn("mx-auto mb-3", isDark ? "text-gray-700" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No activity yet</p>
                  <p className={cn("text-xs mt-1", isDark ? "text-gray-600" : "text-gray-400")}>When someone rates or comments on your published items, it shows here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n, i) => (
                    <div key={`${n.type}-${n.itemId}-${i}`} className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-black/5 backdrop-blur-xl" : "border-gray-100 bg-white/50 backdrop-blur-xl")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          n.type.includes("rating") ? (isDark ? "bg-amber-500/10" : "bg-amber-50") : (isDark ? "bg-indigo-500/10" : "bg-indigo-50"))}>
                          {n.type.includes("rating") ? <Star size={14} weight="fill" className="text-amber-400" /> : <ChatDots size={14} className={isDark ? "text-indigo-400" : "text-indigo-500"} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-gray-900")}>
                            {n.type.includes("rating") ? `${n.rating}★ rating` : "New comment"}
                            <span className={cn("font-normal", isDark ? "text-gray-500" : "text-gray-400")}> on {n.itemTitle}</span>
                          </p>
                          {n.text && <p className={cn("text-xs mt-1", isDark ? "text-gray-400" : "text-gray-500")}>{n.text}</p>}
                          <p className={cn("text-[10px] mt-1", isDark ? "text-gray-600" : "text-gray-400")}>{formatTime(n.createdAt)}</p>
                        </div>
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
