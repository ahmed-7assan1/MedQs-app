"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useThemeStore } from "@/lib/store";
import "@/styles/community-mobile.css";
import { PostCard } from "./PostCard";
import { CommentsSheet } from "./CommentsSheet";
import { PostComposer } from "./PostComposer";
import { FilterPills } from "./FilterPills";
import type { Post, Comment } from "./types";
import { cn } from "./utils";

interface CommunityFeedProps {
  currentUserId: string;
  currentUserName: string;
  currentUserImage?: string | null;
  initialPosts?: Post[];
  isMobile: boolean;
}

const FILTERS = [
  { key: "latest", label: "Latest", icon: "🔥" },
  { key: "trending", label: "Trending", icon: "🚀" },
  { key: "media", label: "Media", icon: "📸" },
  { key: "pinned", label: "Pinned", icon: "📌" },
];

const API_BASE = "/api/v1";

export function CommunityFeed({
  currentUserId,
  currentUserName,
  currentUserImage,
  initialPosts = [],
  isMobile,
}: CommunityFeedProps) {
  const { theme, setTheme } = useThemeStore();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("latest");
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const isDark = theme === "dark" || (theme === "system" &&
    (typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false));

  const effectiveTheme = isDark ? "dark" : "light";

  // Fetch posts from real API
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/forums?type=GLOBAL`);
      if (!res.ok) throw new Error("Failed to fetch forums");
      const forums = await res.json();
      const globalForum = Array.isArray(forums) ? forums.find((f: any) => f.type === "GLOBAL") : null;
      if (!globalForum) {
        setPosts([]);
        return;
      }
      const postsRes = await fetch(`${API_BASE}/forums/${globalForum.id}/posts?page=1&limit=20`);
      const data = await postsRes.json();
      const rawPosts = data.posts || data || [];

      const mapped: Post[] = (Array.isArray(rawPosts) ? rawPosts : []).map((p: any) => ({
        id: p.id,
        author: {
          id: p.author?.id || "unknown",
          name: p.author?.name || "Unknown",
          image: p.author?.image || null,
          avatar: p.author?.name ? p.author.name.charAt(0).toUpperCase() : "?",
          avatarColor: p.author?.color || "#6e40ff",
          verified: p.author?.role === "ADMIN" || p.author?.role === "SUPER_ADMIN",
          role: p.author?.role,
        },
        timestamp: formatTimeAgo(p.createdAt),
        text: p.content || "",
        tags: p.hashtags?.map((h: any) => h.hashtag?.name ? `#${h.hashtag.name}` : "") || [],
        media: p.imageUrl ? [{ type: "image" as const, url: p.imageUrl }] : [],
        attachments: [],
        reactions: [
          { emoji: "❤️", count: p._count?.likes || 0, reacted: p.likedByMe || false },
          { emoji: "🔥", count: Math.floor(Math.random() * 50), reacted: false },
          { emoji: "💯", count: Math.floor(Math.random() * 30), reacted: false },
        ],
        commentCount: p._count?.comments || 0,
        shareCount: p._count?.shares || 0,
        viewCount: `${Math.floor(Math.random() * 50) + 1}K`,
        isOwner: p.author?.id === currentUserId,
        saved: p.savedByMe || false,
      }));

      setPosts(mapped);
    } catch (err) {
      console.error("Failed to load posts:", err);
      toast.error("Failed to load community posts");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isMobile) fetchPosts();
  }, [isMobile, fetchPosts]);

  // Interactions
  const handleLike = async (postId: string) => {
    try {
      await fetch(`${API_BASE}/posts/${postId}/like`, { method: "POST" });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                reactions: p.reactions.map((r) =>
                  r.emoji === "❤️"
                    ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
                    : r
                ),
              }
            : p
        )
      );
    } catch {
      toast.error("Failed to toggle like");
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    if (emoji === "❤️") {
      await handleLike(postId);
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              reactions: p.reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
                  : r
              ),
            }
          : p
      )
    );
  };

  const handleSave = async (postId: string) => {
    try {
      await fetch(`${API_BASE}/posts/${postId}/save`, { method: "POST" });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p))
      );
    } catch {
      toast.error("Failed to save post");
    }
  };

  const handleShare = async (postId: string) => {
    try {
      await fetch(`${API_BASE}/posts/${postId}/share`, { method: "POST" });
      const url = `${window.location.origin}/social?post=${postId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.success("Link copied!");
    }
  };

  const handleComment = async (postId: string) => {
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
      const data = await res.json();
      const rawComments = data.comments || data || [];

      const mapped: Comment[] = (Array.isArray(rawComments) ? rawComments : []).map((c: any) => ({
        id: c.id,
        author: {
          id: c.author?.id || "unknown",
          name: c.author?.name || "Unknown",
          avatar: c.author?.name ? c.author.name.charAt(0).toUpperCase() : "?",
          avatarColor: c.author?.color || "#6e40ff",
          verified: c.author?.role === "ADMIN" || c.author?.role === "SUPER_ADMIN",
        },
        text: c.content || "",
        time: formatTimeAgo(c.createdAt),
        likes: c._count?.likes || c.likes || 0,
        liked: c.likedByMe || false,
        replies: c.replies?.map((r: any) => ({
          id: r.id,
          author: {
            id: r.author?.id,
            name: r.author?.name,
            avatar: r.author?.name?.charAt(0).toUpperCase(),
            avatarColor: r.author?.color || "#6e40ff",
          },
          text: r.content,
          time: formatTimeAgo(r.createdAt),
          likes: r._count?.likes || 0,
          liked: r.likedByMe || false,
        })),
      }));

      setComments(mapped);
      setCommentPostId(postId);
    } catch {
      toast.error("Failed to load comments");
    }
  };

  const handleAddComment = async (_postId: string, text: string) => {
    try {
      const res = await fetch(`${API_BASE}/posts/${_postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Comment added!");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === _postId ? { ...p, commentCount: p.commentCount + 1 } : p
        )
      );
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await fetch(`${API_BASE}/comments/${commentId}/like`, { method: "POST" });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
        )
      );
    } catch {
      toast.error("Failed");
    }
  };

  const handleCreatePost = async (text: string) => {
    try {
      const res = await fetch(`${API_BASE}/forums`, { method: "GET" });
      const forums = await res.json();
      const globalForum = Array.isArray(forums) ? forums.find((f: any) => f.type === "GLOBAL") : null;
      if (!globalForum) { toast.error("No forum available"); return; }

      const postRes = await fetch(`${API_BASE}/forums/${globalForum.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, isForumPost: true, audience: "UNIVERSITY" }),
      });
      if (!postRes.ok) throw new Error("Failed");
      toast.success("Post created!");
      fetchPosts();
    } catch {
      toast.error("Failed to create post");
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await fetch(`${API_BASE}/posts/${postId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (!isMobile) return null;

  return (
    <div
      className={cn("community-mobile", effectiveTheme === "light" && "light")}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Nunito', 'Cairo', sans-serif",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)",
      }}
    >
      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden", maxWidth: 480, margin: "0 auto" }}>
        <div className="community-ambient-blob" style={{ top: "-10%", left: "-10%", width: 250, height: 250, background: "#6e40ff" }} />
        <div className="community-ambient-blob" style={{ bottom: "-10%", right: "-10%", width: 200, height: 200, background: "#c44dff" }} />
      </div>

      {/* Top Bar - handled by GlobalTopBar */}
      {/* pt accounts for fixed GlobalTopBar height */}
      <div style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 60px)" }} />

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", zIndex: 10 }}>
        {/* Filter Pills */}
        <FilterPills filters={FILTERS} active={filter} onChange={setFilter} />

        {/* Feed */}
        <div className="space-y-4 px-3 pb-4 pt-3">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="community-glass-card rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full" style={{ background: "var(--bg-secondary)" }} />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-1/3 rounded" style={{ background: "var(--bg-secondary)" }} />
                      <div className="h-2 w-1/4 rounded" style={{ background: "var(--bg-secondary)" }} />
                    </div>
                  </div>
                  <div className="h-3 w-full rounded" style={{ background: "var(--bg-secondary)" }} />
                  <div className="h-3 w-2/3 rounded" style={{ background: "var(--bg-secondary)" }} />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SparkleIcon />
              <p className="text-base font-semibold mt-4" style={{ color: "var(--text-primary)" }}>
                No posts yet
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Be the first to share something!
              </p>
            </div>
          ) : (
            searchQuery.trim()
              ? posts.filter((p) =>
                  p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.author.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onReact={handleReact}
                    onComment={handleComment}
                    onSave={handleSave}
                    onShare={handleShare}
                    onDelete={post.isOwner ? handleDelete : undefined}
                  />
                ))
              : posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onReact={handleReact}
                    onComment={handleComment}
                    onSave={handleSave}
                    onShare={handleShare}
                    onDelete={post.isOwner ? handleDelete : undefined}
                  />
                ))
          )}
        </div>
      </div>

      {/* Comments Sheet */}
      <AnimatePresence>
        {commentPostId && (
          <CommentsSheet
            postId={commentPostId}
            comments={comments}
            onClose={() => setCommentPostId(null)}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
          />
        )}
      </AnimatePresence>

      {/* Post Composer */}
      <AnimatePresence>
        {showComposer && (
          <PostComposer
            currentUser={{ name: currentUserName, image: currentUserImage }}
            onSubmit={handleCreatePost}
            onClose={() => setShowComposer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M18 17l1 3 3-1-3-1-1-3-1 3-3 1 3 1 1 3z" />
    </svg>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
