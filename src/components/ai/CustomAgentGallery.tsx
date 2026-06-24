"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Robot, Star, Spinner, X, User, Clock, Sparkle, ChatDots, ArrowLeft } from "@phosphor-icons/react";
import toast from "react-hot-toast";

interface AgentItem {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  avgRating: number;
  ratingCount: number;
  usageCount: number;
  createdAt: string;
}

interface AgentDetail extends AgentItem {
  instructions: string;
  files: { name: string; type: string; data: string }[];
  links: string[];
  comments: { id: string; userId: string; text: string; createdAt: string }[];
}

interface CustomAgentGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onSelectAgent: (agent: any) => void;
}

export function CustomAgentGallery({ isOpen, onClose, isDark, onSelectAgent }: CustomAgentGalleryProps) {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AgentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => setUserId(s?.user?.id || null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/v1/ai/agents")
      .then(r => r.json())
      .then(data => setAgents(data.agents || []))
      .catch(() => toast.error("Failed to load agents"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/v1/ai/agents/${id}`);
      const data = await res.json();
      setSelected(data);
      const myRating = data.userRatings?.find((r: any) => r.userId === userId);
      setUserRating(myRating?.rating || 0);
    } catch {
      toast.error("Failed to load agent details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!selected || !userId) return;
    try {
      await fetch(`/api/v1/ai/agents/${selected.id}/rate`, {
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

  const handleComment = async () => {
    if (!selected || !commentText.trim() || !userId) return;
    setCommenting(true);
    try {
      await fetch(`/api/v1/ai/agents/${selected.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setCommentText("");
      toast.success("Comment added!");
      openDetail(selected.id);
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setCommenting(false);
    }
  };

  const startChat = () => {
    if (!selected) return;
    const a = selected;
    onClose();
    setSelected(null);
    onSelectAgent({ id: a.id, name: a.name, description: a.description, instructions: a.instructions, files: a.files, links: a.links });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10030] flex items-end md:items-center justify-center"
          onClick={() => { onClose(); setSelected(null); }}
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
                {selected ? (
                  <button onClick={() => setSelected(null)} className={cn("p-1.5 rounded-lg transition-colors", isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500")}>
                    <ArrowLeft size={18} weight="bold" />
                  </button>
                ) : null}
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-white/10" : "bg-indigo-50")}>
                  <Robot size={16} weight="bold" className={isDark ? "text-white" : "text-indigo-500"} />
                </div>
                <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {selected ? selected.name : "Custom MedOneX"}
                </h2>
              </div>
              <button onClick={() => { onClose(); setSelected(null); }} className={cn("p-2 rounded-xl", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
              {selected ? (
                <div className="space-y-5">
                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-100 bg-gray-50/50")}>
                    <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-500")}>{selected.description}</p>
                    <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
                      <span className="flex items-center gap-1"><User size={14} />{selected.creatorId.slice(0, 8)}...</span>
                      <span className="flex items-center gap-1"><Sparkle size={14} />{selected.usageCount} uses</span>
                    </div>
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => handleRate(star)} className="transition-all active:scale-90">
                          <Star size={18} weight={star <= userRating ? "fill" : "regular"} className={star <= userRating ? "text-amber-400" : isDark ? "text-gray-600" : "text-gray-300"} />
                        </button>
                      ))}
                      <span className={cn("text-xs ml-2", isDark ? "text-gray-500" : "text-gray-400")}>{selected.avgRating} ({selected.ratingCount})</span>
                    </div>
                    <button onClick={startChat} className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20">
                      Start Chat
                    </button>
                  </div>

                  <div className={cn("p-4 rounded-2xl border", isDark ? "border-white/10" : "border-gray-100")}>
                    <h3 className={cn("text-sm font-bold mb-3", isDark ? "text-white" : "text-gray-900")}>Comments</h3>
                    <div className="flex gap-2 mb-3">
                      <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className={cn("flex-1 px-3 py-2 rounded-xl text-sm border outline-none transition-all", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")} />
                      <button onClick={handleComment} disabled={!commentText.trim() || commenting} className={cn("px-3 py-2 rounded-xl text-sm font-bold transition-all", commentText.trim() ? "bg-indigo-500 text-white hover:bg-indigo-600" : isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400")}>
                        {commenting ? <Spinner size={14} className="animate-spin" /> : "Post"}
                      </button>
                    </div>
                    {selected.comments?.length === 0 && <p className={cn("text-xs text-center py-4", isDark ? "text-gray-500" : "text-gray-400")}>No comments yet</p>}
                    {selected.comments?.map((c: any) => (
                      <div key={c.id} className={cn("p-3 rounded-xl mb-2", isDark ? "bg-white/[0.03]" : "bg-gray-50")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[10px] font-bold", isDark ? "text-gray-400" : "text-gray-500")}>{c.userId.slice(0, 8)}...</span>
                          <span className={cn("text-[10px]", isDark ? "text-gray-600" : "text-gray-400")}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-700")}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12"><Spinner size={20} className="animate-spin text-indigo-500" /></div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12">
                  <Robot size={32} className={cn("mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} />
                  <p className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-500")}>No custom agents yet</p>
                  <p className={cn("text-xs mt-1", isDark ? "text-gray-600" : "text-gray-400")}>Create one from the sidebar to see it here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.map(a => (
                    <button key={a.id} onClick={() => openDetail(a.id)} className={cn("w-full text-left p-4 rounded-2xl border transition-all", isDark ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]" : "border-gray-100 bg-gray-50/50 hover:bg-gray-100")}>
                      <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{a.name}</p>
                      {a.description && <p className={cn("text-xs mt-1 truncate", isDark ? "text-gray-500" : "text-gray-400")}>{a.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={cn("text-[11px] flex items-center gap-1", isDark ? "text-gray-500" : "text-gray-400")}><Star size={11} weight="fill" className="text-amber-400" />{a.avgRating} ({a.ratingCount})</span>
                        <span className={cn("text-[11px]", isDark ? "text-gray-500" : "text-gray-400")}>{a.usageCount} uses</span>
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
