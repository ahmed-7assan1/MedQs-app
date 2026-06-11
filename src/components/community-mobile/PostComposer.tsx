"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Sparkle,
  Image as ImageIcon,
  X,
} from "@phosphor-icons/react";
import type { Post } from "./types";
import { cn } from "./utils";

interface PostComposerProps {
  currentUser: { name: string; avatarColor?: string; image?: string | null };
  onSubmit: (text: string) => void;
  onClose: () => void;
}

export function PostComposer({ currentUser, onSubmit, onClose }: PostComposerProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      onSubmit(text);
      setText("");
      onClose();
    } finally {
      setLoading(false);
    }
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
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: "var(--bg-primary)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button onClick={onClose} className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Cancel
          </button>
          <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>New Post</span>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            className="text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-40"
            style={{
              background: "var(--brand)",
              color: "#fff",
            }}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: currentUser.avatarColor || "var(--brand)",
              color: "#fff",
            }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1 text-base outline-none resize-none min-h-[120px]"
            style={{
              background: "transparent",
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
            autoFocus
          />
        </div>

        <div
          className="flex items-center gap-2 px-5 py-3 border-t"
          style={{
            borderColor: "var(--border-glass)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "var(--text-secondary)" }}>
            <ImageIcon size={18} />
          </button>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Add to your post</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
