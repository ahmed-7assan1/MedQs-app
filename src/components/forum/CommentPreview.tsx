"use client";

import { useState, useEffect } from "react";
import { ChatCircle } from "@phosphor-icons/react";
import { formatDistanceToNow } from "@/lib/utils";
import Image from "next/image";

interface PreviewComment {
  id: string;
  content: string;
  createdAt: string;
  likedByMe?: boolean;
  _count?: { likes: number };
  author: {
    id: string;
    name: string;
    nickname?: string | null;
    image?: string | null;
  };
}

interface Props {
  postId: string;
  totalComments: number;
  currentUserId?: string;
  onViewAll: () => void;
}

export function CommentPreview({ postId, totalComments, currentUserId, onViewAll }: Props) {
  const [comments, setComments] = useState<PreviewComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/posts/${postId}/comments?top=2`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setComments(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  if (loading || comments.length === 0) return null;

  return (
    <div className="border-t border-white/[0.04] px-4 py-3 space-y-3">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2.5">
          <div className="flex-shrink-0 mt-0.5">
            {c.author?.image ? (
              <Image
                src={c.author.image}
                alt=""
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#534AB7]/30 flex items-center justify-center text-[10px] font-bold text-white/70">
                {(c.author?.name || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-white/70 truncate">
                {c.author?.nickname || c.author?.name || "User"}
              </span>
              <span className="text-[9px] text-white/30 whitespace-nowrap">
                {formatTimeAgo(c.createdAt)}
              </span>
            </div>
            <p className="text-[12px] text-white/50 leading-relaxed mt-0.5 line-clamp-2">
              {c.content}
            </p>
            {c._count?.likes ? (
              <span className="text-[10px] text-white/30 mt-0.5 inline-block">
                {c._count.likes} {c._count.likes === 1 ? "like" : "likes"}
              </span>
            ) : null}
          </div>
        </div>
      ))}
      {totalComments > 2 && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors font-bold mt-1"
        >
          <ChatCircle size={14} weight="bold" />
          View all comments ({totalComments})
        </button>
      )}
    </div>
  );
}

function formatTimeAgo(date: string) {
  try {
    const str = formatDistanceToNow(new Date(date)).toLowerCase();
    const parts = str.split(" ");
    if (parts[0] === "just") return "Just now";
    return parts[0] + (parts[0].includes("ago") ? "" : " ago");
  } catch {
    return "";
  }
}
