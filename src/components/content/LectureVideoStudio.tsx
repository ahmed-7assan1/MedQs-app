"use client";

import { useMemo, useState } from "react";
import { Heart, MessageSquare, Share2, Send, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";

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
  if (yt) return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1` };
  const gd = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gd) return { kind: "drive", embedUrl: `https://drive.google.com/file/d/${gd[1]}/preview` };
  if (url.match(/\.(mp4|webm|ogg)$/i)) return { kind: "html5", embedUrl: url };
  if (url.includes("/embed/")) return { kind: "embed", embedUrl: url };
  return null;
}

export function LectureVideoStudio({
  lectureId,
  initialVideos,
  selectedVideoId,
}: {
  lectureId: string;
  initialVideos: VideoItem[];
  selectedVideoId?: string;
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [activeId, setActiveId] = useState(selectedVideoId || initialVideos[0]?.id || "");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const active = useMemo(() => videos.find((v) => v.id === activeId) ?? null, [videos, activeId]);
  const embed = active ? getEmbed(active.url) : null;

  async function loadComments(videoId: string) {
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${videoId}/comments`);
    const data = await res.json().catch(() => []);
    setComments(Array.isArray(data) ? data : []);
  }

  async function toggleLike() {
    if (!active) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/like`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Like failed");
    setVideos((prev) =>
      prev.map((v) =>
        v.id === active.id
          ? {
              ...v,
              likedByMe: data.liked,
              likesCount: Math.max(0, v.likesCount + (data.liked ? 1 : -1)),
            }
          : v
      )
    );
  }

  async function shareVideo() {
    if (!active) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/share`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Share failed");
    const url = `${window.location.origin}/modules/${location.pathname.split("/")[2]}/lectures/${lectureId}/video?v=${active.id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setVideos((prev) => prev.map((v) => (v.id === active.id ? { ...v, sharesCount: data.sharesCount ?? v.sharesCount + 1 } : v)));
    toast.success("Video link copied");
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

  if (!videos.length) {
    return <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No videos uploaded yet.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-border bg-card p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture playlist</p>
        <div className="space-y-1.5">
          {videos.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setActiveId(v.id);
                void loadComments(v.id);
              }}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                activeId === v.id ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted"
              }`}
            >
              <p className="line-clamp-2 font-medium">{v.title}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {v.likesCount} likes · {v.commentsCount} comments · {v.sharesCount} shares
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">{active?.title}</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative aspect-video w-full bg-black">
            {embed?.kind === "html5" ? (
              <video src={embed.embedUrl} controls className="h-full w-full" />
            ) : embed ? (
              <iframe
                src={embed.embedUrl}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/70">Cannot preview this video source.</div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2.5">
            <button onClick={() => void toggleLike()} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">
              <Heart className={`h-3.5 w-3.5 ${active?.likedByMe ? "fill-current text-red-500" : ""}`} />
              {active?.likesCount ?? 0}
            </button>
            <button
              onClick={() => void shareVideo()}
              disabled={!active?.sharingEnabled}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Share2 className="h-3.5 w-3.5" />
              {active?.sharingEnabled ? `Share (${active?.sharesCount ?? 0})` : "Share disabled"}
            </button>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              {active?.commentsCount ?? 0} comments
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comments</p>
          <div className="mb-3 flex gap-2">
            <input
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button onClick={() => void postComment()} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </div>
          <div className="space-y-2">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-xs font-medium">{c.user.nickname || c.user.name}</p>
                  <p className="mt-1 text-sm">{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

