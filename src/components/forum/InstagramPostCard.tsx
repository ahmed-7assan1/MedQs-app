"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Heart, 
  ChatCircle, 
  PaperPlaneTilt, 
  BookmarkSimple,
  DotsThree,
  CheckCircle,
  Clock
} from "@phosphor-icons/react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { PostGallery } from "./PostGallery";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  post: any;
  currentUserId?: string;
}

export function InstagramPostCard({ post, currentUserId }: Props) {
  const [liked, setLiked] = useState(post.likedByMe || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [saved, setSaved] = useState(false);

  const handleLike = async () => {
    const newState = !liked;
    setLiked(newState);
    setLikeCount((prev: number) => newState ? prev + 1 : prev - 1);
    
    try {
      await fetch(`/api/v1/posts/${post.id}/like`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newState ? 'like' : null })
      });
    } catch (err) {
      // Revert on error
      setLiked(!newState);
      setLikeCount((prev: number) => newState ? prev - 1 : prev + 1);
    }
  };

  const sanitizeUrl = (url: string) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes("localhost:3000")) return url.split("localhost:3000")[1];
    return url;
  };

  const attachments = (() => {
    let list: any[] = [];
    let raw = post.attachments;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    if (Array.isArray(raw)) {
      list = raw.map((a: any) => ({ ...a, url: sanitizeUrl(a.url) }));
    }
    const imgUrl = sanitizeUrl(post.imageUrl);
    if (imgUrl && !list.some(a => a.url === imgUrl)) {
      list.unshift({ url: imgUrl, type: 'image' });
    }
    return list;
  })();

  return (
    <div className="bg-black border-b border-white/5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/u/${post.author.id}`} className="h-9 w-9 rounded-full overflow-hidden border border-white/10 bg-white/5">
            <img 
              src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.author.name || "User")}`} 
              className="h-full w-full object-cover" 
              alt="" 
            />
          </Link>
          <div className="flex flex-col">
            <Link href={`/profile/u/${post.author.id}`} className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-white">{post.author.name}</span>
              {post.author.rank && <CheckCircle size={14} weight="fill" className="text-blue-400" />}
            </Link>
            <span className="text-[10px] text-white/40 font-medium">{post.university?.name || "MedOneX Student"}</span>
          </div>
        </div>
        <button className="text-white/60">
          <DotsThree size={24} weight="bold" />
        </button>
      </div>

      {/* Media */}
      <div className="w-full aspect-square sm:aspect-video bg-white/[0.02] overflow-hidden">
        {attachments.length > 0 ? (
          <PostGallery attachments={attachments} />
        ) : (
          <div className="h-full w-full flex items-center justify-center p-8 text-center text-white/10 italic text-sm">
            {/* If no image, we just show the content text here or nothing if it's below */}
            <span dir="auto">{post.content.slice(0, 100)}...</span>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <motion.button 
              whileTap={{ scale: 1.4 }}
              onClick={handleLike}
              className={cn("transition-colors", liked ? "text-red-500" : "text-white")}
            >
              <Heart size={26} weight={liked ? "fill" : "bold"} />
            </motion.button>
            <Link href={`/forum/post/${post.id}`} className="text-white">
              <ChatCircle size={26} weight="bold" />
            </Link>
            <button className="text-white">
              <PaperPlaneTilt size={26} weight="bold" />
            </button>
          </div>
          <button 
            onClick={() => setSaved(!saved)}
            className={cn("transition-colors", saved ? "text-yellow-500" : "text-white")}
          >
            <BookmarkSimple size={26} weight={saved ? "fill" : "bold"} />
          </button>
        </div>

        {/* Likes */}
        <div className="text-[13px] font-bold text-white mb-1">
          {likeCount.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div className="text-[13px] leading-relaxed text-white/90">
          <span className="font-bold mr-2">{post.author.name}</span>
          <div dir="auto" className="inline prose prose-invert prose-sm max-w-none text-[13px]">
            <ReactMarkdown>
              {post.content.length > 150 ? post.content.slice(0, 150) + "..." : post.content}
            </ReactMarkdown>
            {post.content.length > 150 && (
               <button className="text-white/40 ml-1 font-medium">more</button>
            )}
          </div>
        </div>

        {/* Comments info */}
        {post._count?.comments > 0 && (
          <Link href={`/forum/post/${post.id}`} className="text-[13px] text-white/40 mt-1 block font-medium">
            View all {post._count.comments} comments
          </Link>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter">
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </span>
        </div>
      </div>
    </div>
  );
}
