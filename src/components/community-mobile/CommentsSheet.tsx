"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PaperAirplaneIcon,
  HeartIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";
import type { Comment } from "./types";
import { cn } from "./utils";

interface CommentsSheetProps {
  postId: string;
  comments: Comment[];
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onLikeComment: (commentId: string) => void;
}

export function CommentsSheet({
  postId,
  comments: initialComments,
  onClose,
  onAddComment,
  onLikeComment,
}: CommentsSheetProps) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddComment(postId, text);
    setComments((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        author: {
          id: "me",
          name: "You",
          avatar: "M",
          avatarColor: "var(--brand)",
        },
        text,
        time: "Just now",
        likes: 0,
        liked: false,
      },
    ]);
    setText("");
    setReplyTo(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          maxHeight: "85vh",
          background: "var(--bg-primary)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--text-muted)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Comments {comments.length > 0 && `(${comments.length})`}
          </span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <XMarkIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
          {comments.length === 0 ? (
            <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id}>
                <div className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: c.author.avatarColor || "var(--brand)",
                      color: "#fff",
                    }}
                  >
                    {c.author.avatar || c.author.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {c.author.name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.time}</span>
                    </div>
                    {c.text ? (
                      <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {c.text}
                      </p>
                    ) : c.audioSeconds ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-[2px]">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div
                              key={i}
                              className="community-wave-bar"
                              style={{
                                height: `${Math.floor(Math.random() * 16) + 4}px`,
                                background: "var(--brand)",
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {c.audioSeconds}s
                        </span>
                      </div>
                    ) : c.attachment ? (
                      <div className="flex items-center gap-2 mt-1 rounded-lg p-2" style={{ background: "var(--bg-secondary)" }}>
                        <ArrowDownTrayIcon className="h-3.5 w-3.5" style={{ color: c.attachment.color }} />
                        <span className="text-xs truncate flex-1" style={{ color: "var(--text-primary)" }}>
                          {c.attachment.name}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{c.attachment.size}</span>
                      </div>
                    ) : null}
                    <button
                      onClick={() => onLikeComment(c.id)}
                      className="flex items-center gap-1 mt-1 text-xs"
                      style={{ color: c.liked ? "#ef4444" : "var(--text-muted)" }}
                    >
                      <HeartIcon className={cn("h-3 w-3", c.liked ? "text-red-500" : "text-gray-400 dark:text-white/40")} />
                      <span>{c.likes > 0 ? c.likes : ""}</span>
                    </button>
                    {c.replies && c.replies.length > 0 && (
                      <div className="mt-2 ml-2 pl-3 border-l-2" style={{ borderColor: "var(--border-glass)" }}>
                        {c.replies.map((r) => (
                          <div key={r.id} className="flex gap-2 mb-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{
                                background: r.author.avatarColor || "var(--brand)",
                                color: "#fff",
                              }}
                            >
                              {r.author.avatar || r.author.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                  {r.author.name}
                                </span>
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{r.time}</span>
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                {r.replyTo && <span className="font-medium" style={{ color: "var(--brand)" }}>@{r.replyTo} </span>}
                                {r.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="flex items-center gap-3 px-5 py-3 border-t"
          style={{
            borderColor: "var(--border-glass)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Add a comment..."
            className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none border"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              borderColor: "var(--border-glass)",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: "var(--brand)" }}
          >
            <PaperAirplaneIcon className="h-4 w-4 text-white" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
