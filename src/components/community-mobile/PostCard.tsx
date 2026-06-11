"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  MapPinIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import type { Post } from "./types";
import { RichText } from "./RichText";
import { ImageCarousel } from "./ImageCarousel";
import { YouTubePlayer } from "./YouTubePlayer";
import { AttachmentCard } from "./AttachmentCard";
import { formatCount } from "./utils";

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onComment: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
}

export function PostCard({ post, onLike, onReact, onComment, onSave, onShare, onDelete, onPin }: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const images = post.media.filter((m) => m.type === "image");
  const youtube = post.media.find((m) => m.type === "youtube");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="community-glass-card rounded-2xl overflow-hidden"
    >
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            background: post.author.avatarColor || "var(--brand)",
            color: "#fff",
          }}
        >
          {post.author.avatar || post.author.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {post.author.name}
            </span>
            {post.author.verified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--brand)" className="flex-shrink-0">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            {post.author.role && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: "var(--brand-soft)",
                  color: "var(--brand)",
                }}
              >
                {post.author.role}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>{post.timestamp}</span>
            {post.pinned && (
              <>
                <span>&middot;</span>
                <MapPinIcon className="h-[10px] w-[10px]" style={{ color: "var(--brand)" }} />
                <span style={{ color: "var(--brand)" }}>Pinned</span>
              </>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          >
            <EllipsisVerticalIcon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-10 z-20 community-glass-card rounded-xl py-1 min-w-[150px] shadow-2xl"
                onClick={() => setMenuOpen(false)}
              >
                {post.isOwner && onPin && (
                  <button
                    onClick={() => onPin(post.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <MapPinIcon className="h-3.5 w-3.5" /> {post.pinned ? "Unpin" : "Pin"}
                  </button>
                )}
                {post.isOwner && onDelete && (
                  <button
                    onClick={() => onDelete(post.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: "#ef4444" }}
                  >
                    <TrashIcon className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
                <button
                  onClick={() => onShare(post.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ShareIcon className="h-3.5 w-3.5" /> Share
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        {post.text && <RichText text={post.text} collapsed />}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium"
                style={{ color: "var(--brand)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {images.length > 0 && <ImageCarousel images={images} />}
      {youtube && <YouTubePlayer videoId={youtube.youtubeId!} thumbnail={youtube.thumbnail} duration={youtube.duration} caption={youtube.caption} />}

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <div className="px-4 pt-3 space-y-2">
          {post.attachments.map((att, i) => (
            <AttachmentCard key={i} attachment={att} />
          ))}
        </div>
      )}

      {/* Reactions row */}
      {post.reactions.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
          {post.reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onReact(post.id, r.emoji)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all"
              style={{
                background: r.reacted ? "var(--brand-soft)" : "var(--bg-secondary)",
                color: r.reacted ? "var(--brand)" : "var(--text-secondary)",
              }}
            >
              <span>{r.emoji}</span>
              <span>{formatCount(r.count)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between px-4 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{formatCount(post.commentCount)} comments</span>
        <div className="flex items-center gap-3">
          <span>{formatCount(post.shareCount)} shares</span>
          {post.viewCount && <span>{post.viewCount} views</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-around border-t px-2 py-1" style={{ borderColor: "var(--border-glass)" }}>
        <ActionBtn
          icon={<HeartIcon className="h-[18px] w-[18px] text-gray-400 dark:text-white/40" />}
          activeIcon={<HeartIcon className="h-[18px] w-[18px] text-red-500" />}
          active={false}
          label="Like"
          onClick={() => onLike(post.id)}
        />
        <ActionBtn
          icon={<ChatBubbleOvalLeftIcon className="h-[18px] w-[18px] text-gray-400 dark:text-white/40" />}
          label="Comment"
          onClick={() => onComment(post.id)}
        />
        <ActionBtn
          icon={<ShareIcon className="h-[18px] w-[18px] text-gray-400 dark:text-white/40" />}
          label="Share"
          onClick={() => onShare(post.id)}
        />
        <ActionBtn
          icon={<BookmarkIcon className="h-[18px] w-[18px] text-gray-400 dark:text-white/40" />}
          activeIcon={<BookmarkIcon className="h-[18px] w-[18px]" style={{ color: "var(--brand)" }} />}
          active={post.saved || false}
          label="Save"
          onClick={() => onSave(post.id)}
        />
      </div>
    </motion.div>
  );
}

function ActionBtn({
  icon,
  activeIcon,
  active,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
    >
      {active && activeIcon ? activeIcon : icon}
      <span className="text-xs font-medium" style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}>
        {label}
      </span>
    </button>
  );
}
