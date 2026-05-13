"use client";
import { useState } from "react";
import { X, ChatCircle, Globe, Users, CircleNotch } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { SharedQuestionBlock } from "./SharedQuestionBlock";
import type { QuestionWithChoices } from "@/types";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionWithChoices;
  forums: { id: string; name: string; type: string }[];
  currentUserId: string;
}

export function QuickShareModal({ isOpen, onClose, question, forums, currentUserId }: Props) {
  const [content, setContent] = useState("Can anyone help me understand this question better?");
  const [selectedForumId, setSelectedForumId] = useState(forums[0]?.id || "");
  const [isPosting, setIsPosting] = useState(false);

  const handleShare = async () => {
    if (!selectedForumId) return toast.error("Please select a forum");
    setIsPosting(true);
    try {
      const res = await fetch(`/api/v1/forums/${selectedForumId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sharedQuestion: question,
          isForumPost: true,
        }),
      });

      if (res.ok) {
        toast.success("Shared to community!");
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to share");
      }
    } catch {
      toast.error("Handshake failed");
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-[#161523] border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ChatCircle size={24} weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Share to Community</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Ask peers or discuss logic</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all">
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            {/* Question Preview */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Included Question</p>
              <SharedQuestionBlock question={question} className="bg-white/[0.02]" />
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Your Message</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Why are you sharing this? Ask a specific doubt..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 min-h-[100px] resize-none"
              />
            </div>

            {/* Forum Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Target Forum</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {forums.map((forum) => (
                  <button
                    key={forum.id}
                    onClick={() => setSelectedForumId(forum.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      selectedForumId === forum.id 
                        ? "bg-indigo-500/20 border-indigo-500/50 text-white" 
                        : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      selectedForumId === forum.id ? "bg-indigo-500 text-white" : "bg-white/5"
                    )}>
                      {forum.type === "GLOBAL" ? <Globe size={16} /> : <Users size={16} />}
                    </div>
                    <span className="text-xs font-bold truncate">{forum.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isPosting || !selectedForumId}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
            >
              {isPosting ? <CircleNotch size={16} className="animate-spin" /> : "Broadcast"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
