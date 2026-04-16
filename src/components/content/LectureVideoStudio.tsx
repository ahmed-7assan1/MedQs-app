"use client";

import { useMemo, useState } from "react";
import {
  Heart, MessageSquare, Share2, Send, PlayCircle,
  Plus, Trash2, ChevronDown, ChevronUp, Link2, Video, Loader2, X
} from "lucide-react";
import toast from "react-hot-toast";
import { CustomVideoPlayer } from "./CustomVideoPlayer";

type VideoItem = {
  id: string;
  title: string;
  url: string;
  sourceType: string;
  sharingEnabled: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByMe?: boolean;
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; nickname?: string | null; image?: string | null };
};

function getEmbed(url: string) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (yt) return { kind: "youtube", cleanUrl: `https://www.youtube.com/watch?v=${yt[1]}` };
  const gd = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gd) return { kind: "drive" };
  if (url.match(/\.(mp4|webm|ogg)$/i)) return { kind: "html5" };
  if (url.includes("/embed/")) return { kind: "embed" };
  return null;
}

export function LectureVideoStudio({
  lectureId,
  initialVideos,
  selectedVideoId,
  isAdmin = false,
}: {
  lectureId: string;
  initialVideos: VideoItem[];
  selectedVideoId?: string;
  isAdmin?: boolean;
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [activeId, setActiveId] = useState(selectedVideoId || initialVideos[0]?.id || "");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Admin: add video
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);

  const active = useMemo(() => videos.find((v) => v.id === activeId) ?? null, [videos, activeId]);

  async function loadComments(videoId: string) {
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${videoId}/comments`);
    const data = await res.json().catch(() => []);
    setComments(Array.isArray(data) ? data : []);
    setCommentsLoaded(true);
  }

  async function toggleLike() {
    if (!active) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/like`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Like failed");
    setVideos((prev) =>
      prev.map((v) =>
        v.id === active.id
          ? { ...v, likedByMe: data.liked, likesCount: Math.max(0, v.likesCount + (data.liked ? 1 : -1)) }
          : v
      )
    );
  }

  async function shareVideo() {
    if (!active) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/share`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Share failed");
    const url = `${window.location.origin}${window.location.pathname}?v=${active.id}`;
    await navigator.clipboard.writeText(url).catch(() => { });
    setVideos((prev) => prev.map((v) => (v.id === active.id ? { ...v, sharesCount: data.sharesCount ?? v.sharesCount + 1 } : v)));
    toast.success("Link copied!");
  }

  async function postComment() {
    if (!active || !commentInput.trim()) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentInput.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Comment failed");
    setComments((prev) => [...prev, data]);
    setVideos((prev) => prev.map((v) => (v.id === active.id ? { ...v, commentsCount: v.commentsCount + 1 } : v)));
    setCommentInput("");
  }

  async function addVideo() {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return toast.error("Fill in title and URL");
    setAddingVideo(true);
    try {
      const res = await fetch(`/api/v1/lectures/${lectureId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newVideoTitle.trim(), url: newVideoUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Failed to add video");
      setVideos((prev) => [...prev, { ...data, likedByMe: false }]);
      setNewVideoTitle("");
      setNewVideoUrl("");
      setShowAddVideo(false);
      toast.success("Video added!");
    } finally {
      setAddingVideo(false);
    }
  }

  async function deleteVideo(videoId: string) {
    if (!confirm("Delete this video from the playlist?")) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${videoId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete");
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    if (activeId === videoId) setActiveId(videos.find((v) => v.id !== videoId)?.id ?? "");
    toast.success("Removed");
  }

  if (!videos.length && !isAdmin) {
    return <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No videos uploaded yet.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* ── Playlist sidebar ── */}
      <aside className="rounded-2xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture Playlist</p>
          {isAdmin && (
            <button
              onClick={() => setShowAddVideo((s) => !s)}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              {showAddVideo ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {showAddVideo ? "Cancel" : "Add"}
            </button>
          )}
        </div>

        {/* Admin: add video form */}
        {isAdmin && showAddVideo && (
          <div className="mb-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Title</label>
              <input
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="e.g. Part 1 — Introduction"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Link2 className="h-3 w-3" /> URL
              </label>
              <input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={addVideo}
              disabled={addingVideo}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 hover:bg-primary/90 transition-colors"
            >
              {addingVideo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
              {addingVideo ? "Adding..." : "Add to Playlist"}
            </button>
          </div>
        )}

        {videos.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No videos yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {videos.map((v, i) => {
              const isActive = activeId === v.id;
              return (
                <div key={v.id} className="group relative">
                  <button
                    onClick={() => {
                      setActiveId(v.id);
                      setCommentsLoaded(false);
                      setComments([]);
                    }}
                    className={`w-full overflow-hidden rounded-xl border text-left transition-all duration-200 ${
                      isActive
                        ? "border-red-500/40 bg-red-500/10 shadow-sm"
                        : "border-border bg-card hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r transition-all ${isActive ? "bg-red-500" : "bg-transparent"}`} />

                    <div className="flex items-start gap-3 px-3 py-3 pl-4">
                      {/* Number badge */}
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isActive ? <PlayCircle className="h-4 w-4" /> : i + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        {isActive && (
                          <span className="mb-1 inline-block rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-500">
                            Now Playing
                          </span>
                        )}
                        <p className={`line-clamp-2 text-[13px] font-semibold leading-snug ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                          {v.title}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {v.likesCount} ♥ · {v.commentsCount} 💬
                        </p>
                      </div>
                    </div>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => deleteVideo(v.id)}
                      className="absolute right-2 top-2 hidden rounded-lg p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group-hover:flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </aside>

      {/* ── Main video + interactions ── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-red-500" />
          <h2 className="font-display text-xl font-semibold">{active?.title}</h2>
        </div>

        {/* Player */}
        <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
          <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
            <div className="absolute inset-0">
              {active ? (
                <CustomVideoPlayer key={activeId} url={active.url} title={active.title} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/50">
                  Select a video from the playlist
                </div>
              )}
            </div>
          </div>

          {/* Action bar */}
          {active && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card px-3 py-2.5">
              <button
                onClick={() => void toggleLike()}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 ${active.likedByMe
                  ? "border-red-500/30 bg-red-500/10 text-red-500"
                  : "border-border hover:bg-muted"
                  }`}
              >
                <Heart className={`h-3.5 w-3.5 ${active.likedByMe ? "fill-current" : ""}`} />
                {active.likesCount}
              </button>

              <button
                onClick={() => void shareVideo()}
                disabled={!active.sharingEnabled}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:scale-105"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share ({active.sharesCount})
              </button>

              <button
                onClick={() => {
                  if (!commentsLoaded) void loadComments(active.id);
                  setCommentsOpen((o) => !o);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-all hover:scale-105"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {active.commentsCount} comments
                {commentsOpen
                  ? <ChevronUp className="h-3 w-3 ml-0.5" />
                  : <ChevronDown className="h-3 w-3 ml-0.5" />}
              </button>
            </div>
          )}
        </div>

        {/* ── Comments (collapsible) ── */}
        {commentsOpen && active && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 animate-in slide-in-from-top-2 duration-200">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Comments
            </p>
            <div className="mb-3 flex gap-2">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void postComment()}
                placeholder="Write a comment..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => void postComment()}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-background px-3 py-2">
                    <p className="text-xs font-medium text-primary">{c.user.nickname || c.user.name}</p>
                    <p className="mt-0.5 text-sm">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
