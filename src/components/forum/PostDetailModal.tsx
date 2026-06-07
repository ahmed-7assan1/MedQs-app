"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "@/lib/utils";
import { CommentThread } from "./CommentThread";
import toast from "react-hot-toast";
import Image from "next/image";

const ICONS = {
  heart: (filled: boolean) => filled
    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#e84040" stroke="#e84040" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  bookmark: (saved: boolean) => saved
    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#5b5ef7" stroke="#5b5ef7" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  trash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  play: <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  music: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  send: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  more: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>,
  emoji: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  download: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  link: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  twitter: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  facebook: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  whatsapp: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
};

const EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🔥", "💯"];

function getTimeAgo(date: string) {
  try {
    const d = new Date(date);
    const str = formatDistanceToNow(d).toLowerCase();
    const parts = str.split(" ");
    if (parts[0] === "just") return "Just now";
    return parts[0] + (parts[0].includes("ago") ? "" : " ago");
  } catch { return ""; }
}

interface PostDetailModalProps {
  post: any;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserUniversityId?: string;
  isOpen: boolean;
  onClose: () => void;
}

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff",
      fontSize: size * 0.35, fontWeight: "600",
      flexShrink: 0, fontFamily: "'Cairo', sans-serif",
    }}>{initials}</div>
  );
}

function MediaBlock({ type, url }: { type: string; url: string }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (type === "image") return (
    <div style={{ borderRadius: 16, overflow: "hidden", maxHeight: 480, position: "relative" }}>
      <img src={url} alt="media" style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 480 }} />
    </div>
  );

  if (type === "video") return (
    <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", background: "#000", maxHeight: 400 }}>
      <video ref={videoRef} src={url} style={{ width: "100%", maxHeight: 400, display: "block" }} onClick={() => { playing ? videoRef.current?.pause() : videoRef.current?.play(); setPlaying(!playing); }} />
      {!playing && (
        <button onClick={() => { videoRef.current?.play(); setPlaying(true); }}
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 64, height: 64, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {ICONS.play}
        </button>
      )}
    </div>
  );

  if (type === "audio") return (
    <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(91,94,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a5a8ff" }}>{ICONS.music}</div>
        <div>
          <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 14 }}>Audio file</p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>3:42 min</p>
        </div>
      </div>
      <audio ref={videoRef as any} src={url} style={{ width: "100%", height: 36 }} controls />
    </div>
  );

  return null;
}

function AttachmentBlock({ file }: { file: { name: string; size: string } }) {
  const ext = file.name.split(".").pop()?.toUpperCase() || "";
  const colors: Record<string, string> = { PDF: "#e84040", DOCX: "#2563eb", XLSX: "#10a37f", ZIP: "#f5a623", default: "#6b7280" };
  const color = colors[ext] || colors.default;
  return (
    <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {ICONS.file}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111" }}>{file.name}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{ext} · {file.size}</p>
        </div>
      </div>
      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 8, borderRadius: 8, display: "flex", alignItems: "center" }}>
        {ICONS.download}
      </button>
    </div>
  );
}

function ReactionBar({ reactions, onReact }: { reactions: Record<string, number>; onReact: (emoji: string) => void }) {
  const total = Object.values(reactions).reduce((a, b) => a + b, 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {Object.entries(reactions).map(([emoji, count]) => (
        <button key={emoji} onClick={() => onReact(emoji)}
          style={{ background: "#f3f4f6", border: "1.5px solid #e5e7eb", borderRadius: 20, padding: "4px 10px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", fontFamily: "'Cairo',sans-serif" }}>
          {emoji} <span style={{ color: "#374151", fontWeight: 600 }}>{count.toLocaleString()}</span>
        </button>
      ))}
      <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>{total.toLocaleString()} reactions</span>
    </div>
  );
}

function ShareSheet({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const platforms = [
    { name: "Twitter / X", icon: ICONS.twitter, color: "#000" },
    { name: "WhatsApp", icon: ICONS.whatsapp, color: "#25D366" },
    { name: "Facebook", icon: ICONS.facebook, color: "#1877F2" },
  ];
  return (
    <div style={{ padding: "4px 0" }}>
      <p style={{ margin: "0 0 12px", fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Share via</p>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {platforms.map(p => (
          <button key={p.name} style={{ flex: 1, padding: "10px 8px", border: "1.5px solid #e5e7eb", borderRadius: 12, background: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}>
            <span style={{ color: p.color }}>{p.icon}</span>
            <span style={{ fontSize: 11, color: "#374151", fontFamily: "'Cairo',sans-serif" }}>{p.name}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>
          https://social.app/post/001
        </div>
        <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ padding: "8px 14px", background: copied ? "#10a37f" : "#5b5ef7", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Cairo',sans-serif", transition: "background 0.2s" }}>
          {copied ? "✓ Copied" : <>{ICONS.link} Copy</>}
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#e84040" }}>
        {ICONS.trash}
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 6px", color: "#111" }}>Delete post?</p>
      <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>This action cannot be undone</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "'Cairo',sans-serif", color: "#374151" }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: "#e84040", color: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "'Cairo',sans-serif", fontWeight: 600 }}>Delete</button>
      </div>
    </div>
  );
}

export function PostDetailModal({
  post,
  currentUserId,
  currentUserRole,
  currentUserUniversityId,
  isOpen,
  onClose,
}: PostDetailModalProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>(
    post.reactions || { "❤️": 0, "😂": 0, "😮": 0, "🔥": 0 }
  );
  const [sheet, setSheet] = useState<"share" | "delete" | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<number, boolean>>({});
  const [deleted, setDeleted] = useState(false);
  const [activeTab, setActiveTab] = useState<"post" | "comments">("post");
  const commentRef = useRef<HTMLDivElement>(null);
  const [realComments, setRealComments] = useState<
    { id: number; user: string; handle: string; avatar: string; color: string; text: string; time: string; likes: number; liked: boolean }[]
  >([]);
  const [commentCount, setCommentCount] = useState(post._count?.comments ?? post.comments ?? 0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleReact = (emoji: string) => {
    setReactions(r => ({ ...r, [emoji]: (r[emoji] || 0) + 1 }));
  };

  const handleLike = () => {
    setLiked(l => !l);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    const c = { id: Date.now(), user: "You", handle: "@me", avatar: "Yo", color: "#5b5ef7", text: newComment.trim(), time: "Just now", likes: 0, liked: false };
    setRealComments(cs => [...cs, c]);
    setCommentCount((prev: number) => prev + 1);
    setNewComment("");
    setActiveTab("comments");
    setTimeout(() => commentRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 100);
  };

  const toggleCommentLike = (id: number) => {
    setCommentLikes(cl => ({ ...cl, [id]: !cl[id] }));
    setRealComments(cs => cs.map((c: any) => c.id === id ? { ...c, likes: c.likes + (commentLikes[id] ? -1 : 1) } : c));
  };

  const canDelete = post.isOwner ||
    post.authorId === currentUserId ||
    currentUserRole === "SUPER_ADMIN" ||
    (currentUserRole === "ADMIN" && currentUserUniversityId === post.universityId);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleted(true);
        toast.success("Post deleted");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const avatarInitials = post.author?.name?.slice(0, 2).toUpperCase() || "US";
  const avatarColor = post.author?.color || "#5b5ef7";
  const postOwner = post.author?.name || "User";
  const postHandle = `@${post.author?.name?.toLowerCase().replace(/\s+/g, "") || "user"}`;
  const postTime = getTimeAgo(post.createdAt);

  const postText = post.content || post.text || "";
  const hashtags = post.hashtags || (postText.match(/#[a-zA-Z0-9_]+/g) || []);
  const mediaType = post.mediaType || (post.imageUrl ? "image" : post.attachments ? "image" : null);
  const mediaUrl = post.mediaUrl || post.imageUrl || null;

  if (deleted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[400] bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}
            className="fixed inset-4 md:inset-x-auto md:top-8 md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[401] max-w-[560px] w-full overflow-hidden"
          >
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />

            <div style={{ width: "100%", maxWidth: 560, background: "#fff", borderRadius: 24, boxShadow: "0 8px 48px rgba(0,0,0,0.12)", overflow: "hidden", position: "relative", maxHeight: "100%", display: "flex", flexDirection: "column" }}>

              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f3f5", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {post.author?.image ? (
                    <Image
                      src={post.author.image}
                      alt=""
                      width={44}
                      height={44}
                      style={{ borderRadius: "50%", objectFit: "cover", width: 44, height: 44 }}
                    />
                  ) : (
                    <Avatar initials={avatarInitials} color={avatarColor} size={44} />
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111" }}>{postOwner}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{postHandle} · {postTime}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {canDelete && (
                    <button onClick={() => setSheet(s => s === "delete" ? null : "delete")}
                      style={{ background: sheet === "delete" ? "#fee2e2" : "none", border: "none", borderRadius: 10, padding: "8px", cursor: "pointer", color: "#e84040", display: "flex", alignItems: "center", transition: "all 0.15s" }}>
                      {ICONS.trash}
                    </button>
                  )}
                  <button onClick={onClose} style={{ background: "none", border: "none", borderRadius: 10, padding: "8px", cursor: "pointer", color: "#6b7280", display: "flex" }}>{ICONS.close}</button>
                </div>
              </div>

              {/* Inline panel: delete confirm or share */}
              {sheet === "delete" && (
                <div style={{ margin: "0 20px 0", background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: 14, padding: "16px", animation: "fadeIn 0.2s ease" }}>
                  <DeleteConfirm onConfirm={handleDelete} onCancel={() => setSheet(null)} />
                </div>
              )}
              {sheet === "share" && (
                <div style={{ margin: "0 20px 4px", background: "#f8f9ff", border: "1.5px solid #e0e7ff", borderRadius: 14, padding: "16px", animation: "fadeIn 0.2s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Share post</span>
                    <button onClick={() => setSheet(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex" }}>{ICONS.close}</button>
                  </div>
                  <ShareSheet onClose={() => setSheet(null)} />
                </div>
              )}

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid #f1f3f5", padding: "0 20px", flexShrink: 0 }}>
                {["post", "comments"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as "post" | "comments")}
                    style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? "#5b5ef7" : "#6b7280", borderBottom: activeTab === tab ? "2.5px solid #5b5ef7" : "2.5px solid transparent", fontFamily: "'Cairo',sans-serif", transition: "all 0.2s" }}>
                    {tab === "post" ? "Post" : `Comments (${commentCount})`}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div ref={activeTab === "comments" ? commentRef : null} style={{ maxHeight: 520, overflowY: "auto", padding: "16px 20px", flex: 1 }}>
                {activeTab === "post" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Text */}
                    {postText && (
                      <div>
                        <p style={{ margin: 0, fontSize: 15, color: "#111", lineHeight: 1.8, whiteSpace: "pre-line" }}>{postText}</p>
                        {hashtags.length > 0 && (
                          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            {hashtags.map((h: string) => (
                              <span key={h} style={{ fontSize: 13, color: "#5b5ef7", background: "#eef0ff", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{h}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Media */}
                    {mediaUrl && <MediaBlock type={mediaType || "image"} url={mediaUrl} />}
                    {post.mediaCaption && <p style={{ margin: 0, fontSize: 12, color: "#6b7280", textAlign: "center" }}>{post.mediaCaption}</p>}
                    {/* Attachment */}
                    {post.attachment && <AttachmentBlock file={post.attachment} />}
                    {/* Reactions */}
                    <ReactionBar reactions={reactions} onReact={handleReact} />
                    {/* Stats */}
                    <div style={{ display: "flex", gap: 16, paddingTop: 4, borderTop: "1px solid #f1f3f5" }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{post.likes ?? (post._count?.likes ?? 0)} Likes</span>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{commentCount} Comments</span>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{post.shares ?? 0} Shares</span>
                    </div>
                  </div>
                )}

                {activeTab === "comments" && (
                  <div>
                    {realComments.length === 0 ? (
                      <CommentThread
                        postId={post.id}
                        currentUserId={currentUserId}
                        initialCount={commentCount}
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {realComments.map(c => (
                          <div key={c.id} style={{ display: "flex", gap: 10 }}>
                            <Avatar initials={c.avatar} color={c.color} size={36} />
                            <div style={{ flex: 1, background: "#f8f9fa", borderRadius: "0 14px 14px 14px", padding: "10px 14px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <div>
                                  <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{c.user}</span>
                                  <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>{c.handle}</span>
                                </div>
                                <span style={{ fontSize: 11, color: "#9ca3af" }}>{c.time}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{c.text}</p>
                              <button onClick={() => toggleCommentLike(c.id)}
                                style={{ marginTop: 6, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: commentLikes[c.id] ? "#e84040" : "#6b7280", fontFamily: "'Cairo',sans-serif" }}>
                                {ICONS.heart(commentLikes[c.id])} {c.likes}
                              </button>
                            </div>
                          </div>
                        ))}
                        <CommentThread
                          postId={post.id}
                          currentUserId={currentUserId}
                          initialCount={commentCount}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f3f5", display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={handleLike}
                  style={{ flex: 1, padding: "10px", border: "none", borderRadius: 12, cursor: "pointer", background: liked ? "#fee2e2" : "#f3f4f6", color: liked ? "#e84040" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontFamily: "'Cairo',sans-serif", transition: "all 0.15s", fontWeight: liked ? 700 : 400 }}>
                  {ICONS.heart(liked)} Like
                </button>
                <button onClick={() => setActiveTab("comments")}
                  style={{ flex: 1, padding: "10px", border: "none", borderRadius: 12, cursor: "pointer", background: "#f3f4f6", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontFamily: "'Cairo',sans-serif", transition: "all 0.15s" }}>
                  {ICONS.comment} Comment
                </button>
                <button onClick={() => setSheet(s => s === "share" ? null : "share")}
                  style={{ flex: 1, padding: "10px", border: "none", borderRadius: 12, cursor: "pointer", background: sheet === "share" ? "#eef0ff" : "#f3f4f6", color: sheet === "share" ? "#5b5ef7" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontFamily: "'Cairo',sans-serif", transition: "all 0.15s" }}>
                  {ICONS.share} Share
                </button>
                <button onClick={() => setSaved(s => !s)}
                  style={{ flex: 1, padding: "10px", border: "none", borderRadius: 12, cursor: "pointer", background: saved ? "#eef0ff" : "#f3f4f6", color: saved ? "#5b5ef7" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontFamily: "'Cairo',sans-serif", transition: "all 0.15s", fontWeight: saved ? 700 : 400 }}>
                  {ICONS.bookmark(saved)} {saved ? "Saved" : "Save"}
                </button>
              </div>

              {/* Comment Input */}
              <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #f1f3f5", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <Avatar initials="Yo" color="#5b5ef7" size={36} />
                  <div style={{ flex: 1, position: "relative" }}>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                      placeholder="Add a comment..."
                      rows={1}
                      style={{ width: "100%", borderRadius: 14, border: "1.5px solid #e5e7eb", padding: "10px 44px 10px 14px", fontSize: 14, fontFamily: "'Cairo',sans-serif", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "border 0.2s", background: "#f8f9fa" }}
                      onFocus={e => e.target.style.borderColor = "#5b5ef7"}
                      onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                    />
                    <div style={{ position: "absolute", left: 10, bottom: 10, display: "flex", gap: 4 }}>
                      <button onClick={() => setShowEmojis(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2, display: "flex" }}>{ICONS.emoji}</button>
                    </div>
                    {showEmojis && (
                      <div style={{ position: "absolute", bottom: "110%", left: 0, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 8, display: "flex", gap: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 20 }}>
                        {EMOJIS.map(em => (
                          <button key={em} onClick={() => { setNewComment(c => c + em); setShowEmojis(false); }}
                            style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 6, transition: "background 0.1s" }}
                            onMouseEnter={e => (e.target as HTMLElement).style.background = "#f3f4f6"}
                            onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={handleSubmitComment}
                    style={{ width: 40, height: 40, borderRadius: "50%", background: newComment.trim() ? "#5b5ef7" : "#e5e7eb", border: "none", cursor: newComment.trim() ? "pointer" : "default", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
                    {ICONS.send}
                  </button>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
              * { box-sizing: border-box; }
              ::-webkit-scrollbar { width: 4px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
