"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { InfiniteScrollContainer } from "@/components/ui/InfiniteScrollContainer";
import { ForumPostListSkeleton } from "@/components/ui/skeleton";
import { useNotificationStore, useCommunityShareStore, useThemeStore } from "@/lib/store";
import type { NotificationItem } from "@/types";

// ─── Portal ─────────────────────────────────────────────────────────────────

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || "";
const PREVIEW_BASE = "/api/v1/files/telegram/preview";

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface SocialCircle {
  id: string; name: string; type: string; status: string; _count: { posts: number };
}
interface Room {
  id: string; name: string; isPublic: boolean; inviteCode: string;
  memberLimit: number; image?: string; _count: { members: number; posts: number };
  members?: any[]; isMember?: boolean; ownerId?: string; createdAt?: string;
}
interface PostData {
  id: string; content: string; createdAt: string; imageUrl?: string;
  link?: string; isAnonymous?: boolean; isOwner?: boolean;
  author: { id: string; name: string; image?: string };
  _count: { likes: number; comments: number; shares?: number };
  reactions: { type: string; userId: string; emoji?: string }[];
  likedByMe?: boolean; savedByMe?: boolean;
  attachments?: { url: string; name?: string; type?: string; size?: number }[];
  hashtags?: string[];
}
interface CommentData {
  id: string; text: string; createdAt: string; likes: number; liked: boolean;
  author: { id: string; name: string; image?: string };
}
interface TrendingTag {
  id: string; name: string; count: string; hot?: boolean;
}

// ─── Reaction Mapping ───────────────────────────────────────────────────────

const REACTION_EMOJI: Record<string, string> = {
  LIKE: "❤️", LOVE: "🔥", SUPPORT: "😮", SMART: "🤓", CONFUSED: "😂", IDEA: "💡",
};
const REVERSE_EMOJI: Record<string, string> = {
  "❤️": "LIKE", "🔥": "LOVE", "😮": "SUPPORT", "🤓": "SMART", "😂": "CONFUSED", "💡": "IDEA",
};
const REACTION_LIST = ["❤️", "🔥", "😮", "😂", "🤓", "💡"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMediaType(url?: string): "image" | "video" | "audio" | null {
  if (!url) return null;
  if (url.includes("type=video")) return "video";
  if (url.includes("type=audio")) return "audio";
  return "image";
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function fileIcon(type?: string): React.ReactNode {
  const props = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5" } as const;
  if (!type) return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  if (type.startsWith("image/")) return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
  if (type.startsWith("video/")) return <svg {...props}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
  if (type.startsWith("audio/")) return <svg {...props}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
  if (type.includes("pdf")) return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/><path d="M12 12v6"/></svg>;
  if (type.includes("word") || type.includes("doc")) return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
  if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="9" x2="12" y2="18"/><polyline points="9 12 12 9 15 12"/></svg>;
  return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}

function renderContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(https?:\/\/[^\s]+)|(#\w+)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) {
      parts.push(<a key={m.index} href={m[1]} target="_blank" rel="noopener noreferrer"
        style={{ color: T.accentL, textDecoration: "none", fontWeight: 600 }}
        onClick={e => e.stopPropagation()}>{m[1]}</a>);
    } else if (m[2]) {
      parts.push(<span key={m.index} style={{ color: T.accent, fontWeight: 600 }}>{m[2]}</span>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

function workerUrlToVercel(url?: string): string {
  if (!url || !WORKER_URL) return url || "";
  const prefix = `${WORKER_URL}/api/files/preview`;
  return url.startsWith(prefix) ? url.replace(prefix, "/api/v1/files/telegram/preview") : url;
}

function collectMediaUrls(post: PostData): string[] {
  const urls: string[] = [];
  if (post.imageUrl) { const u = workerUrlToVercel(post.imageUrl); if (u) urls.push(u); }
  if (post.attachments) {
    for (const a of post.attachments) {
      const u = workerUrlToVercel(a.url);
      if (u && !urls.includes(u)) urls.push(u);
    }
  }
  return urls;
}

function collectFiles(post: PostData): { url: string; name?: string; type?: string; size?: number }[] {
  if (!post.attachments) return [];
  return post.attachments.filter(a => {
    const url = workerUrlToVercel(a.url);
    if (url === post.imageUrl || url === workerUrlToVercel(post.imageUrl)) return false;
    const mt = getMediaType(url);
    const isMedia = mt === "image" || mt === "video" || mt === "audio";
    const isImageType = a.type?.startsWith("image/") || false;
    return !(isMedia || isImageType);
  }).map(a => ({ ...a, url: workerUrlToVercel(a.url) }));
}

// ─── Design Tokens (CSS Variables — respond to site theme) ─────────────────

const T = {
  bg: "var(--ox-bg)", surface: "var(--ox-surface)", hover: "var(--ox-hover)",
  border: "var(--ox-border)", border2: "var(--ox-border2)",
  accent: "var(--ox-accent)", accentL: "var(--ox-accentL)",
  text1: "var(--ox-text1)", text2: "var(--ox-text2)", text3: "var(--ox-text3)", text4: "var(--ox-text4)",
  red: "var(--ox-red)", green: "var(--ox-green)",
};

// ─── SVG Icons ──────────────────────────────────────────────────────────────

const IC = {
  heart: (f: boolean) => f
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="#e84040" stroke="#e84040" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  bookmark: (s: boolean) => s
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="#5b5ef7" stroke="#5b5ef7" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  more: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arrow: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  photo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  poll: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  mic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  house: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  globe: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  fire: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  pencil: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  x: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  emoji: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  ai: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  twitter: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  whatsapp: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  explore: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  notification: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function getColor(name: string) {
  const colors = ["#5b5ef7", "#10a37f", "#f59e0b", "#e84040", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 40, image, style }: {
  initials?: string; color?: string; size?: number; image?: string; style?: React.CSSProperties;
}) {
  if (image) return (
    <img src={image} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, ...style }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color || T.accent,
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      fontSize: size * 0.3, fontWeight: 700, flexShrink: 0, ...style,
    }}>{initials || "?"}</div>
  );
}

// ─── Action Button ───────────────────────────────────────────────────────────

function ActionBtn({ icon, label, active, activeColor = T.accentL, activeBg, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; activeColor?: string; activeBg?: string; onClick: (e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6, padding: "9px 6px", border: "none", borderRadius: 12,
        background: active ? (activeBg || "rgba(91,94,247,.1)") : hov ? T.hover : "none",
        color: active ? activeColor : hov ? T.accentL : T.text3,
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        fontFamily: "'Cairo', sans-serif", transition: "all .15s",
      }}>{icon}{label}</button>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────

function PostCard({ post, onOpen, onReact, onLike, onSave, currentUserId }: {
  post: any; onOpen: (p: any) => void; onReact: (p: any, emoji: string) => void;
  onLike: (p: any) => void; onSave: (p: any) => void; currentUserId?: string;
}) {
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [saved, setSaved] = useState(post.savedByMe || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [hov, setHov] = useState(false);
  const [showMoreReactions, setShowMoreReactions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || "");
  const [saving, setSaving] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!post.reactions) return;
    const counts: Record<string, number> = {};
    const userSet = new Set<string>();
    const reacji = post.reactions || [];
    reacji.forEach((r: any) => {
      const e = REACTION_EMOJI[r.type] || r.type;
      counts[e] = (counts[e] || 0) + 1;
      if (r.userId === currentUserId) userSet.add(e);
    });
    setReactions(counts);
    setUserReactions(userSet);
  }, [post.reactions, currentUserId]);

  if (isDeleted) return null;

  const handleReaction = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userReactions.has(emoji)) {
      setUserReactions(new Set());
      setReactions(p => ({ ...p, [emoji]: Math.max(0, (p[emoji] || 0) - 1) }));
    } else {
      const prev = [...userReactions];
      setUserReactions(new Set([emoji]));
      setReactions(p => {
        const next = { ...p, [emoji]: (p[emoji] || 0) + 1 };
        prev.forEach(pe => { next[pe] = Math.max(0, (next[pe] || 0) - 1); });
        return next;
      });
    }
    onReact(post, REVERSE_EMOJI[emoji] || emoji);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((c: number) => liked ? c - 1 : c + 1);
    onLike(post);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
    onSave(post);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setIsDeleted(true);
      toast.success("Post deleted");
    } catch { toast.error("Failed to delete post"); }
    finally { setDeleting(false); setMenuOpen(false); }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      if (!res.ok) throw new Error("Failed to edit");
      post.content = editText;
      setEditing(false);
      toast.success("Post updated");
    } catch { toast.error("Failed to update post"); }
    finally { setSaving(false); }
  };

  const authorInitials = getInitials(post.author?.name || "User");
  const authorColor = post.author?.color || getColor(post.author?.name || "User");

  const badge = post.author?.role === "CONTRIBUTOR" ? { label: "CONTRIBUTOR", color: "rgba(91,94,247,.15)", text: T.accentL }
    : post.author?.role === "TOP" ? { label: "TOP", color: "rgba(245,200,50,.12)", text: "#f5c842" }
    : post.author?.role === "MODERATOR" ? { label: "MOD", color: "rgba(16,163,127,.15)", text: "#34d399" }
    : null;

  return (
    <div onClick={() => !editing && onOpen(post)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setMenuOpen(false); }}
      style={{
        background: T.surface, border: `1px solid ${hov ? T.border2 : T.border}`,
        borderRadius: 20, overflow: "hidden", cursor: editing ? "default" : "pointer",
        transition: "border-color .2s",
      }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={authorInitials} color={authorColor} size={42} image={post.author?.image} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, lineHeight: 1.2 }}>
              {post.author?.name || "User"}
              {badge && (
                <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: ".05em", marginLeft: 7, background: badge.color, color: badge.text }}>{badge.label}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: T.text3 }}>{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.text4, padding: 6, borderRadius: 8, display: "flex" }}>
            {IC.more}
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.4)", minWidth: 150, padding: 4, marginTop: 4 }}>
              {post.author?.id === currentUserId && (
                <>
                  <button onClick={e => { e.stopPropagation(); setEditing(true); setMenuOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: T.text1, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
                    onMouseEnter={e => (e.target as HTMLElement).style.background = T.hover}
                    onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>{IC.pencil} Edit</button>
                  <button onClick={handleDelete} disabled={deleting}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
                    onMouseEnter={e => (e.target as HTMLElement).style.background = "rgba(232,64,64,.08)"}
                    onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>{IC.trash} {deleting ? "Deleting..." : "Delete"}</button>
                </>
              )}
              <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/social?post=${post.id}`); toast.success("Link copied"); setMenuOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: T.text1, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = T.hover}
                onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>{IC.link} Copy link</button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea value={editText} onChange={e => setEditText(e.target.value)}
              style={{ width: "100%", minHeight: 80, padding: 12, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text1, fontSize: 14, fontFamily: "'Cairo',sans-serif", resize: "vertical", outline: "none" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={e => { e.stopPropagation(); setEditing(false); setEditText(post.content); }}
                style={{ padding: "6px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>Cancel</button>
              <button onClick={handleEdit} disabled={saving}
                style={{ padding: "6px 16px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 14, color: T.text2, lineHeight: 1.75 }}>{renderContent(post.content)}</p>
            {post.link && (
              <a href={post.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{ fontSize: 13, color: T.accentL, textDecoration: "none", fontWeight: 600, wordBreak: "break-all" }}>{post.link}</a>
            )}
            {(() => {
              const mediaUrls = collectMediaUrls(post);
              const imageUrls = mediaUrls.filter(u => getMediaType(u) === "image");
              const videoUrls = mediaUrls.filter(u => getMediaType(u) === "video");
              const audioUrls = mediaUrls.filter(u => getMediaType(u) === "audio");
              const fileAttachments = collectFiles(post);
              return (
                <>
                  {imageUrls.length > 0 && (
                    imageUrls.length === 1 ? (
                      brokenImages.has(imageUrls[0]) ? (
                        <div style={{ borderRadius: 14, overflow: "hidden", background: T.bg, maxHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", color: T.text3, fontSize: 12, fontWeight: 600, flexDirection: "column", gap: 4, padding: "40px 0" }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          Image unavailable
                        </div>
                      ) : (
                        <div style={{ borderRadius: 14, overflow: "hidden", background: T.bg, maxHeight: 300 }}>
                          <img src={imageUrls[0]} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} onError={() => setBrokenImages(prev => new Set(prev).add(imageUrls[0]))} />
                        </div>
                      )
                    ) : (
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 4 }}>
                        {imageUrls.map((url, i) => (
                          brokenImages.has(url) ? (
                            <div key={i} style={{ flex: "0 0 auto", width: 140, height: 140, borderRadius: 14, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.text3, fontSize: 11, fontWeight: 600, flexDirection: "column", gap: 4, scrollSnapAlign: "start" }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              Deleted
                            </div>
                          ) : (
                            <div key={i} style={{ flex: "0 0 auto", width: 200, height: 200, borderRadius: 14, overflow: "hidden", background: T.bg, scrollSnapAlign: "start" }}>
                              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: T.bg }} onError={() => setBrokenImages(prev => new Set(prev).add(url))} />
                            </div>
                          )
                        ))}
                      </div>
                    )
                  )}
                  {videoUrls.map((url, i) => (
                    <div key={url} style={{ borderRadius: 14, overflow: "hidden", background: T.bg }}>
                      <video src={url} controls style={{ width: "100%", maxHeight: 400, display: "block", background: T.bg }} />
                    </div>
                  ))}
                  {audioUrls.map((url, i) => (
                    <div key={url} style={{ borderRadius: 14, padding: 16, background: T.bg, textAlign: "center" }}>
                      <audio src={url} controls style={{ width: "100%" }} />
                    </div>
                  ))}
                  {fileAttachments.map((f, i) => (
                    <div key={f.url} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: T.accent }}>{fileIcon(f.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || "File"}</div>
                        {f.size && <div style={{ fontSize: 11, color: T.text3 }}>{formatSize(f.size)}</div>}
                      </div>
                      <a href={f.url} download={f.name} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: T.surface, color: T.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        {IC.download} Download
                      </a>
                    </div>
                  ))}
                </>
              );
            })()}
            {post.hashtags && post.hashtags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {post.hashtags.map((h: string) => (
                  <span key={h} style={{ fontSize: 11, color: "#7c7fff", background: "rgba(91,94,247,.1)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{h}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reactions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
          {[...Object.entries(reactions)].filter(([, c]) => c > 0).map(([emoji, count]) => (
            <button key={emoji} onClick={e => handleReaction(emoji, e)}
              style={{
                display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20,
                border: `1px solid ${userReactions.has(emoji) ? T.accent : T.border}`,
                background: userReactions.has(emoji) ? "rgba(91,94,247,.1)" : "none",
                fontSize: 12, cursor: "pointer", color: T.text2, transition: "all .15s",
              }}>
              {emoji} <span style={{ fontWeight: 600, fontSize: 11 }}>{count}</span>
            </button>
          ))}
          <button onClick={e => { e.stopPropagation(); setShowMoreReactions(!showMoreReactions); }}
            style={{ padding: "4px 8px", borderRadius: 20, border: `1px solid ${T.border}`, background: "none", fontSize: 12, cursor: "pointer", color: T.text3, display: "flex", alignItems: "center", gap: 3 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
          </button>
          {showMoreReactions && (
            <div style={{ position: "relative", display: "inline-flex", gap: 4 }} onClick={e => e.stopPropagation()}>
              {REACTION_LIST.map(emoji => (
                <button key={emoji} onClick={e => { handleReaction(emoji, e); setShowMoreReactions(false); }}
                  style={{ padding: "4px 8px", borderRadius: 16, border: "none", background: T.hover, fontSize: 16, cursor: "pointer", lineHeight: 1 }}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12, color: T.text3 }}>
            {likeCount.toLocaleString()} likes · {post._count?.comments || 0} comments
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", padding: "10px 18px 14px", borderTop: `1px solid ${T.border}`, gap: 4 }}>
        <ActionBtn icon={IC.heart(liked)} label={liked ? "Liked" : "Like"} active={liked} activeColor={T.red} activeBg="rgba(232,64,64,.08)" onClick={handleLike} />
        <ActionBtn icon={IC.comment} label="Comment" onClick={e => { e.stopPropagation(); onOpen(post); }} />
        <ActionBtn icon={IC.share} label="Share" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/social?post=${post.id}`); toast.success("Link copied"); }} />
        <ActionBtn icon={IC.bookmark(saved)} label={saved ? "Saved" : "Save"} active={saved} onClick={handleSave} />
      </div>
    </div>
  );
}

// ─── Post Modal ──────────────────────────────────────────────────────────────

function PostModal({ post, onClose, currentUserId }: { post: any; onClose: () => void; currentUserId?: string }) {
  const [tab, setTab] = useState("post");
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [saved, setSaved] = useState(false);
  const [sheet, setSheet] = useState<null | "share" | "delete">(null);
  const [copied, setCopied] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState("");
  const [comLoading, setComLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const commentBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
    initReactions();
  }, []);

  const initReactions = () => {
    if (!post.reactions) return;
    const counts: Record<string, number> = {};
    const userSet = new Set<string>();
    (post.reactions || []).forEach((r: any) => {
      const e = REACTION_EMOJI[r.type] || r.type;
      counts[e] = (counts[e] || 0) + 1;
      if (r.userId === currentUserId) userSet.add(e);
    });
    setReactions(counts);
    setUserReactions(userSet);
  };

  const fetchComments = async () => {
    setComLoading(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((c: any) => ({
          id: c.id, text: c.text || c.content || "",
          createdAt: c.createdAt, likes: c._count?.likes || c.likes || 0,
          liked: c.likedByMe || false,
          author: c.author || { id: "?", name: "User" },
        }));
        setComments(mapped);
      }
    } catch {} finally { setComLoading(false); }
  };

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!res.ok) throw new Error("Failed to comment");
      const saved = await res.json();
      const newC: CommentData = {
        id: saved.id || Date.now().toString(),
        text: newComment.trim(), createdAt: new Date().toISOString(),
        likes: 0, liked: false,
        author: { id: currentUserId || "", name: "You" },
      };
      setComments(cs => [...cs, newC]);
      setNewComment("");
      setTab("comments");
      setTimeout(() => commentBodyRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 80);
    } catch { toast.error("Failed to post comment"); }
    finally { setSubmitting(false); }
  };

  const toggleCommentLike = async (id: string) => {
    setCommentLikes(cl => ({ ...cl, [id]: !cl[id] }));
    setComments(cs => cs.map(c => c.id === id ? { ...c, likes: c.likes + (commentLikes[id] ? -1 : 1) } : c));
    try { await fetch(`/api/v1/posts/${post.id}/comments/${id}/like`, { method: "POST" }); } catch {}
  };

  const handleReaction = async (emoji: string) => {
    const type = REVERSE_EMOJI[emoji];
    if (!type) return;
    if (userReactions.has(emoji)) {
      setUserReactions(new Set());
      setReactions(p => ({ ...p, [emoji]: Math.max(0, (p[emoji] || 0) - 1) }));
    } else {
      const prev = [...userReactions];
      setUserReactions(new Set([emoji]));
      setReactions(p => {
        const next = { ...p, [emoji]: (p[emoji] || 0) + 1 };
        prev.forEach(pe => { next[pe] = Math.max(0, (next[pe] || 0) - 1); });
        return next;
      });
    }
    try { await fetch(`/api/v1/posts/${post.id}/reactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) }); } catch {}
  };

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((c: number) => liked ? c - 1 : c + 1);
    try { await fetch(`/api/v1/posts/${post.id}/like`, { method: "POST" }); } catch {}
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setDeleted(true);
      toast.success("Post deleted");
    } catch { toast.error("Failed to delete"); }
  };

  if (deleted) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(232,64,64,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: T.red }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Post Deleted</p>
      <p style={{ fontSize: 13, color: T.text3 }}>This post has been successfully removed.</p>
      <button onClick={onClose} style={{ padding: "10px 24px", background: T.accent, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Cairo',sans-serif" }}>Close</button>
    </div>
  );

  const authorInitials = getInitials(post.author?.name || "User");
  const authorColor = post.author?.color || getColor(post.author?.name || "User");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={authorInitials} color={authorColor} size={44} image={post.author?.image} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{post.author?.name || "User"}</div>
            <div style={{ fontSize: 11, color: T.text3 }}>@{post.author?.name?.toLowerCase().replace(" ", "_")} · {timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(post.isOwner || post.author?.id === currentUserId) && (
            <button onClick={() => setSheet(s => s === "delete" ? null : "delete")}
              style={{ background: sheet === "delete" ? "rgba(232,64,64,.1)" : "none", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.red, display: "flex", transition: "background .15s" }}>
              {IC.trash}
            </button>
          )}
          <button onClick={onClose}
            style={{ background: "none", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex", transition: "color .15s" }}>
            {IC.close}
          </button>
        </div>
      </div>

      {/* Delete panel */}
      {sheet === "delete" && (
        <div style={{ margin: "0 18px", marginTop: 12, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, animation: "fadeSlide .2s ease", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,64,64,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: T.red }}>{IC.trash}</div>
            <p style={{ fontWeight: 700, fontSize: 15, color: T.text1, margin: "0 0 6px" }}>Delete Post?</p>
            <p style={{ fontSize: 12, color: T.text3, margin: "0 0 18px" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSheet(null)} style={{ flex: 1, padding: "9px", border: `1px solid ${T.border}`, borderRadius: 10, background: "none", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 10, background: T.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Share panel */}
      {sheet === "share" && (
        <div style={{ margin: "0 18px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, animation: "fadeSlide .2s ease", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>Share Post</span>
            <button onClick={() => setSheet(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, display: "flex" }}>{IC.close}</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              { label: "X / TWITTER", icon: IC.twitter, color: T.text1 },
              { label: "WHATSAPP",    icon: IC.whatsapp, color: "#25D366" },
              { label: "FACEBOOK",   icon: IC.facebook, color: "#1877F2" },
            ].map(p => (
              <button key={p.label} style={{ flex: 1, padding: "10px 8px", border: `1px solid ${T.border}`, borderRadius: 12, background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all .15s", color: p.color }}
                onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                {p.icon}
                <span style={{ fontSize: 10, fontWeight: 700, color: T.text2, letterSpacing: ".04em" }}>{p.label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: T.hover, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: T.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>
              https://medonex.app/social?post={post.id}
            </div>
            <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: "8px 14px", background: copied ? T.green : T.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Cairo',sans-serif", letterSpacing: ".04em", transition: "background .2s" }}>
              {copied ? "✓ COPIED" : "COPY"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 18px", flexShrink: 0 }}>
        {[["post", "Post"], ["comments", `Comments (${comments.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "12px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: tab === key ? T.accentL : T.text3, borderBottom: `2px solid ${tab === key ? T.accent : "transparent"}`, fontFamily: "'Cairo',sans-serif", transition: "all .2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div ref={tab === "comments" ? commentBodyRef : null} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {tab === "post" && (
          <>
            <p style={{ margin: 0, fontSize: 14, color: T.text2, lineHeight: 1.8 }}>{renderContent(post.content)}</p>
            {post.link && (
              <a href={post.link} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: T.accentL, textDecoration: "none", fontWeight: 600, wordBreak: "break-all" }}>{post.link}</a>
            )}
            {(() => {
              const mediaUrls = collectMediaUrls(post);
              const imageUrls = mediaUrls.filter(u => getMediaType(u) === "image");
              const videoUrls = mediaUrls.filter(u => getMediaType(u) === "video");
              const audioUrls = mediaUrls.filter(u => getMediaType(u) === "audio");
              const fileAttachments = collectFiles(post);
              return (
                <>
                  {imageUrls.length > 0 && (
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 4 }}>
                      {imageUrls.map((url, i) => (
                        brokenImages.has(url) ? (
                          <div key={i} style={{ flex: "0 0 auto", width: 140, height: 140, borderRadius: 14, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.text3, fontSize: 11, fontWeight: 600, flexDirection: "column", gap: 4, scrollSnapAlign: "start" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            Deleted
                          </div>
                        ) : (
                          <div key={i} style={{ flex: imageUrls.length === 1 ? "1" : "0 0 auto", width: imageUrls.length === 1 ? "100%" : 280, borderRadius: 14, overflow: "hidden", background: T.bg, scrollSnapAlign: "start", maxHeight: 380 }}>
                            <img src={url} alt="" style={{ width: "100%", maxHeight: 380, objectFit: "contain", display: "block", background: T.bg }} onError={() => setBrokenImages(prev => new Set(prev).add(url))} />
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  {videoUrls.map((url, i) => (
                    <div key={url} style={{ borderRadius: 14, overflow: "hidden", background: T.bg }}>
                      <video src={url} controls style={{ width: "100%", maxHeight: 450, display: "block", background: T.bg }} />
                    </div>
                  ))}
                  {audioUrls.map((url, i) => (
                    <div key={url} style={{ borderRadius: 14, padding: 20, background: T.bg, textAlign: "center" }}>
                      <audio src={url} controls style={{ width: "100%" }} />
                    </div>
                  ))}
                  {fileAttachments.map((f, i) => (
                    <div key={f.url} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: T.accent }}>{fileIcon(f.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || "File"}</div>
                        {f.size && <div style={{ fontSize: 11, color: T.text3 }}>{formatSize(f.size)}</div>}
                      </div>
                      <a href={f.url} download={f.name} target="_blank" rel="noopener noreferrer"
                        style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: T.surface, color: T.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        {IC.download} Download
                      </a>
                    </div>
                  ))}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {post.hashtags.map((h: string) => (
                        <span key={h} style={{ fontSize: 11, color: T.accent, background: "rgba(91,94,247,.1)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{h}</span>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {REACTION_LIST.map(emoji => {
                const count = reactions[emoji] || 0;
                const reacted = userReactions.has(emoji);
                return (
                  <button key={emoji} onClick={() => handleReaction(emoji)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, border: `1px solid ${reacted ? T.accent : T.border}`, background: reacted ? "rgba(91,94,247,.1)" : "none", fontSize: 12, cursor: "pointer", color: T.text2, transition: "all .15s" }}>
                    {emoji} {count > 0 && <span style={{ fontWeight: 600, fontSize: 11 }}>{count}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, paddingTop: 4, borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.text3 }}>
              <span>{likeCount.toLocaleString()} likes</span>
              <span>{comments.length} comments</span>
              <span>{post._count?.shares || 0} shares</span>
            </div>
          </>
        )}

        {tab === "comments" && (
          comLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: T.text3, fontSize: 13 }}>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.text3, fontSize: 13 }}>No comments yet. Be the first!</div>
          ) : comments.map(c => (
            <div key={c.id} style={{ display: "flex", gap: 10 }}>
              <Avatar initials={getInitials(c.author?.name || "U")} color={getColor(c.author?.name || "U")} size={34} image={c.author?.image} />
              <div style={{ flex: 1, background: T.hover, borderRadius: "0 14px 14px 14px", padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{c.author?.name || "User"}</span>
                  <span style={{ fontSize: 10, color: T.text4, marginLeft: "auto" }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.text2, lineHeight: 1.65 }}>{c.text}</p>
                <button onClick={() => toggleCommentLike(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: commentLikes[c.id] ? T.red : T.text3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Cairo',sans-serif", marginTop: 6, transition: "color .15s" }}>
                  {IC.heart(!!commentLikes[c.id])} {c.likes}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", padding: "10px 18px", borderTop: `1px solid ${T.border}`, gap: 4, flexShrink: 0 }}>
        <ActionBtn icon={IC.heart(liked)} label={liked ? "Liked" : "Like"} active={liked} activeColor={T.red} activeBg="rgba(232,64,64,.1)" onClick={handleLike} />
        <ActionBtn icon={IC.comment} label="Comment" onClick={() => setTab("comments")} />
        <ActionBtn icon={IC.share} label="Share" active={sheet === "share"} onClick={() => setSheet(s => s === "share" ? null : "share")} />
        <ActionBtn icon={IC.bookmark(saved)} label={saved ? "Saved" : "Save"} active={saved} onClick={() => setSaved(s => !s)} />
      </div>

      {/* Comment input */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", padding: "10px 18px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <Avatar initials="ME" color={T.accent} size={34} />
        <div style={{ flex: 1, background: T.hover, borderRadius: 14, border: `1px solid ${T.border2}`, padding: "10px 14px" }}>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
            placeholder="Add a comment..."
            rows={1}
            style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 13, color: T.text1, fontFamily: "'Cairo',sans-serif", resize: "none", lineHeight: 1.5 }} />
        </div>
        <button onClick={submitComment} disabled={!newComment.trim() || submitting}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: newComment.trim() ? T.accent : T.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: newComment.trim() ? "pointer" : "default", flexShrink: 0, transition: "background .2s" }}>
          {IC.send}
        </button>
      </div>
    </div>
  );
}

// ─── Pull to Refresh ─────────────────────────────────────────────────────────

function PullToRefresh({ onRefresh, children }: { onRefresh: () => void; children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isTouch, setIsTouch] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

  useEffect(() => { setIsTouch("ontouchstart" in window); }, []);

  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY <= 0);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const doRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setPullDistance(threshold);
    onRefresh();
    await new Promise(r => setTimeout(r, 600));
    setRefreshing(false);
    setPullDistance(0);
  }, [onRefresh, refreshing]);

  if (!isTouch) return <>{children}</>;

  return (
    <div className="relative" ref={contentRef}>
      <AnimatePresence>
        {(pullDistance > 5 || refreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ position: "absolute", insetInline: 0, top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 16, height: refreshing ? threshold : Math.min(pullDistance, threshold) }}
          >
            {refreshing ? (
              <div style={{ width: 20, height: 20, border: "2px solid #5b5ef7", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
            ) : (
              <motion.div animate={{ rotate: pullDistance > threshold * 0.6 ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: T.text3 }}><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onTouchStart={(e) => {
          if (!isAtTop || refreshing) return;
          const touch = e.touches[0];
          const target = e.currentTarget;
          const rect = target.getBoundingClientRect();
          if (touch.clientY - rect.top < 80) target.setAttribute("data-pull-start", String(touch.clientY));
        }}
        onTouchMove={(e) => {
          if (!isAtTop || refreshing) return;
          const startY = e.currentTarget.getAttribute("data-pull-start");
          if (!startY) return;
          const diff = e.touches[0].clientY - Number(startY);
          if (diff > 0) { setPullDistance(diff); if (diff > 15) e.preventDefault(); }
        }}
        onTouchEnd={async () => {
          document.querySelectorAll("[data-pull-start]").forEach(el => el.removeAttribute("data-pull-start"));
          if (pullDistance > threshold) { await doRefresh(); }
          setPullDistance(0);
        }}
        style={{ transform: `translateY(${Math.min(pullDistance, threshold)}px)`, transition: refreshing ? "transform 0.3s ease" : "transform 0.1s ease" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Notification Panel (Floating Modal) ────────────────────────────────────

function NotificationPanel({ currentUserId }: { currentUserId?: string }) {
  const [open, setOpen] = useState(false);
  const { notifications, unread, setNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    if (!currentUserId) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/v1/notifications");
        if (res.ok) { const data = await res.json(); setNotifications(data); }
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [currentUserId, setNotifications]);

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.hover, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.text2, transition: "all .15s" }}>
        {IC.bell}
        {unread > 0 && (
          <span style={{ position: "absolute", top: -3, right: -3, width: 18, height: 18, borderRadius: "50%", background: T.red, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <Portal>
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,5,12,.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,.6)", animation: "modalIn .2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Notifications</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: 600 }}>Mark all read</button>
                )}
                <button onClick={() => setOpen(false)}
                  style={{ background: T.hover, border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex" }}>
                  {IC.close}
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: T.text3, fontSize: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                  No notifications yet
                </div>
              ) : notifications.slice(0, 50).map((n: NotificationItem) => (
                <div key={n.id} onClick={() => { markRead(n.id); }}
                  style={{ display: "flex", gap: 12, padding: "14px 20px", cursor: "pointer", background: n.read ? "none" : "rgba(91,94,247,.05)", transition: "background .1s", borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => (e.target as HTMLElement).style.background = T.hover}
                  onMouseLeave={e => (e.target as HTMLElement).style.background = n.read ? "none" : "rgba(91,94,247,.05)"}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: n.read ? T.hover : T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: n.read ? T.text3 : "#fff", fontSize: 18 }}>
                    {n.channel === "comment" ? "💬" : n.channel === "reaction" ? "❤️" : "🔔"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: T.text1, lineHeight: 1.3 }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: T.text3, marginTop: 3 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: T.text4, marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, flexShrink: 0, marginTop: 6 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}

// ─── Clock Widget ────────────────────────────────────────────────────────────

function ClockWidget() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      let h = n.getHours(), m = n.getMinutes(), ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m} ${ampm}`);
      const days = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
      const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      setDate(`${days[n.getDay()]} ${n.getDate()} ${months[n.getMonth()]}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: T.text1, letterSpacing: "-.02em", lineHeight: 1 }}>{time}</div>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", background: "rgba(16,163,127,.15)", color: "#34d399" }}>ACTIVE</span>
          </div>
          <div style={{ fontSize: 11, color: T.text3, fontWeight: 600, letterSpacing: ".1em", marginTop: 6 }}>{date}</div>
        </div>
        <div style={{ fontSize: 28 }}>🔥</div>
      </div>
    </div>
  );
}

// ─── Notifications Page ─────────────────────────────────────────────────────

function NotificationsPage({ currentUserId }: { currentUserId?: string }) {
  const { notifications, unread, setNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    if (!currentUserId) return;
    const fetchNotifs = async () => {
      try { const res = await fetch("/api/v1/notifications"); if (res.ok) { const data = await res.json(); setNotifications(data); } } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [currentUserId, setNotifications]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Notifications</span>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: 600 }}>Mark all read</button>
        )}
      </div>
      <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "8px 0" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: T.text3, fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            No notifications yet
          </div>
        ) : notifications.slice(0, 50).map((n: NotificationItem) => (
          <div key={n.id} onClick={() => { markRead(n.id); }}
            style={{ display: "flex", gap: 12, padding: "14px 20px", cursor: "pointer", background: n.read ? "none" : "rgba(91,94,247,.05)", transition: "background .1s", borderBottom: `1px solid ${T.border}` }}
            onMouseEnter={e => (e.target as HTMLElement).style.background = T.hover}
            onMouseLeave={e => (e.target as HTMLElement).style.background = n.read ? "none" : "rgba(91,94,247,.05)"}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: n.read ? T.hover : T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: n.read ? T.text3 : "#fff", fontSize: 18 }}>
              {n.channel === "comment" ? "💬" : n.channel === "reaction" ? "❤️" : "🔔"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: T.text1, lineHeight: 1.3 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: T.text3, marginTop: 3 }}>{n.body}</div>
              <div style={{ fontSize: 11, color: T.text4, marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, flexShrink: 0, marginTop: 6 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Composer ────────────────────────────────────────────────────────────────

function Composer({ currentCircle, circles, currentUserName, onPost }: {
  currentCircle?: SocialCircle | null; circles: SocialCircle[];
  currentUserName?: string; onPost: (content: string, circleId: string, extra?: any) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [activeCircle, setActiveCircle] = useState(currentCircle?.id || circles[0]?.id || "");
  const [mediaItems, setMediaItems] = useState<{ file: File; preview: string; type: "image" | "video" | "audio" | "file" }[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [isPosting, setIsPosting] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null, type: "image" | "video" | "audio" | "file") => {
    if (!files) return;
    const newItems = Array.from(files).map(file => ({
      file, preview: URL.createObjectURL(file), type,
    }));
    setMediaItems(prev => [...prev, ...newItems]);
    setShowPoll(false);
  };

  const removeItem = (idx: number) => {
    setMediaItems(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addPollOption = () => { if (pollOptions.length < 6) setPollOptions(p => [...p, ""]); };

  const handleSubmit = async () => {
    if (!text.trim() && mediaItems.length === 0 && !showPoll) return;
    if (showPoll && pollOptions.filter(o => o.trim()).length < 2) { toast.error("Add at least 2 poll options"); return; }
    setIsPosting(true);
    const ok = await onPost(text.trim(), activeCircle, {
      mediaItems: mediaItems.map(m => ({ file: m.file, type: m.type })),
      mediaTypes: mediaItems.map(m => m.type),
      pollOptions: showPoll ? pollOptions.filter(o => o.trim()) : undefined,
    });
    setIsPosting(false);
    if (ok) { setText(""); setMediaItems([]); setShowPoll(false); setPollOptions(["", ""]); }
  };

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar initials={getInitials(currentUserName || "You")} color={T.accent} size={38} />
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder={`What's on your mind, ${currentUserName?.split(" ")[0] || "there"}?`}
          style={{ flex: 1, background: "none", border: "none", borderBottom: `1.5px solid ${T.accent}`, outline: "none", fontSize: 14, color: T.text2, paddingBottom: 8, fontFamily: "'Cairo',sans-serif" }} />
      </div>

      {/* Media preview grid */}
      {mediaItems.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0" }}>
          {mediaItems.map((item, i) => (
            <div key={i} style={{ position: "relative", flexShrink: 0, width: item.type === "file" ? 180 : 140, borderRadius: 12, overflow: "hidden", background: T.bg }}>
              {item.type === "image" && <img src={item.preview} alt="" style={{ width: "100%", height: 100, objectFit: "cover" }} />}
              {item.type === "video" && <video src={item.preview} style={{ width: "100%", height: 100, objectFit: "cover" }} />}
              {item.type === "audio" && <div style={{ padding: 16, textAlign: "center" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color: T.accent}}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>}
              {item.type === "file" && (
                <div style={{ padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>{fileIcon(item.file.type)}</div>
                  <div style={{ fontSize: 10, color: T.text2, marginTop: 6, wordBreak: "break-all", lineHeight: 1.2 }}>{item.file.name}</div>
                </div>
              )}
              <button onClick={() => removeItem(i)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.7)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Poll builder */}
      {showPoll && (
        <div style={{ background: T.bg, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8, border: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>Create Poll</span>
          {pollOptions.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <input value={opt} onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }}
                placeholder={`Option ${i + 1}`}
                style={{ flex: 1, padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.text1, fontFamily: "'Cairo',sans-serif", outline: "none" }} />
              {i > 1 && <button onClick={() => setPollOptions(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>✕</button>}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button onClick={addPollOption} style={{ alignSelf: "flex-start", padding: "4px 14px", border: `1px dashed ${T.border}`, borderRadius: 8, background: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>+ Add option</button>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {circles.slice(0, 5).map(c => (
          <button key={c.id} onClick={() => setActiveCircle(c.id)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: `1px solid ${activeCircle === c.id ? T.accent : T.border}`, background: activeCircle === c.id ? T.accent : "none", fontSize: 11, fontWeight: 600, color: activeCircle === c.id ? "#fff" : T.text2, cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "all .15s" }}>
            {c.name}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
        <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files, "image")} />
        <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => addFiles(e.target.files, "video")} />
        <input ref={audioRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={e => addFiles(e.target.files, "audio")} />
        <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files, "file")} />
        <button onClick={() => photoRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "none", background: "none", color: T.text3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "color .15s" }}
          onMouseEnter={e => (e.target as HTMLElement).style.color = T.accentL}
          onMouseLeave={e => (e.target as HTMLElement).style.color = T.text3}>
          {IC.photo} Photo
        </button>
        <button onClick={() => videoRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "none", background: "none", color: T.text3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "color .15s" }}
          onMouseEnter={e => (e.target as HTMLElement).style.color = T.accentL}
          onMouseLeave={e => (e.target as HTMLElement).style.color = T.text3}>
          {IC.video} Video
        </button>
        <button onClick={() => { setShowPoll(!showPoll); if (!showPoll) setMediaItems([]); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "none", background: showPoll ? "rgba(91,94,247,.1)" : "none", color: showPoll ? T.accentL : T.text3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "color .15s" }}
          onMouseEnter={e => (e.target as HTMLElement).style.color = T.accentL}
          onMouseLeave={e => (e.target as HTMLElement).style.color = showPoll ? T.accentL : T.text3}>
          {IC.poll} Poll
        </button>
        <button onClick={() => audioRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "none", background: "none", color: T.text3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "color .15s" }}
          onMouseEnter={e => (e.target as HTMLElement).style.color = T.accentL}
          onMouseLeave={e => (e.target as HTMLElement).style.color = T.text3}>
          {IC.mic} Audio
        </button>
        <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "none", background: "none", color: T.text3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "color .15s" }}
          onMouseEnter={e => (e.target as HTMLElement).style.color = T.accentL}
          onMouseLeave={e => (e.target as HTMLElement).style.color = T.text3}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> File
        </button>
        <button onClick={handleSubmit} disabled={isPosting}
          style={{ marginLeft: "auto", padding: "7px 16px 7px 14px", borderRadius: 20, border: "none", background: (text.trim() || mediaItems.length > 0 || showPoll) ? T.accent : T.border, color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6, cursor: isPosting ? "wait" : (text.trim() || mediaItems.length > 0 || showPoll) ? "pointer" : "default", opacity: isPosting ? .7 : 1, transition: "background .15s, opacity .15s" }}>
          {isPosting
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{ animation: "spin .6s linear infinite" }}><circle cx="12" cy="12" r="10" strokeDasharray="40" strokeLinecap="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
          {isPosting ? "Publishing..." : "Post"}
        </button>
      </div>
    </div>
  );
}

// ─── Inline Room Modals ──────────────────────────────────────────────────────

function InlineCreateRoomModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (room: any) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [memberLimit, setMemberLimit] = useState(10);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Room name is required");
    setSaving(true);
    try {
      const res = await fetch("/api/v1/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isPublic, memberLimit }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed to create room");
      toast.success("Room created!");
      onSuccess(data);
      onClose();
      setName(""); setDescription("");
    } catch { toast.error("Failed to create room"); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,5,12,.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 24, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.6)", animation: "modalIn .2s ease", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 18 }}>📚</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>Create Room</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>Start a new study circle</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: T.hover, border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex" }}>{IC.close}</button>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Room name"
                style={{ width: "100%", padding: "11px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 14, color: T.text1, fontFamily: "'Cairo',sans-serif", outline: "none" }} />
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
                style={{ width: "100%", padding: "11px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 14, color: T.text1, fontFamily: "'Cairo',sans-serif", outline: "none" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.text2 }}>Public room</span>
                <button onClick={() => setIsPublic(!isPublic)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: isPublic ? T.accent : T.border, cursor: "pointer", position: "relative", transition: "background .2s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isPublic ? 22 : 2, transition: "left .2s" }} />
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: T.text2, flexShrink: 0 }}>Member limit:</span>
                <input type="number" value={memberLimit} onChange={e => setMemberLimit(Number(e.target.value))} min={2} max={100}
                  style={{ width: 70, padding: "6px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text1, fontFamily: "'Cairo',sans-serif", outline: "none", textAlign: "center" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "16px 22px", borderTop: `1px solid ${T.border}` }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: saving ? T.border : T.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
                {saving ? "Creating..." : "Create Room"}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </AnimatePresence>
  );
}

function InlineJoinRoomModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length < 4) return toast.error("Invalid code");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/rooms/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed to join");
      toast.success("Joined room!");
      onClose();
    } catch { toast.error("Failed to join"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,5,12,.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 24, width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.6)", animation: "modalIn .2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 18 }}>🔗</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>Join Room</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>Enter invite code</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: T.hover, border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex" }}>{IC.close}</button>
            </div>
            <div style={{ padding: "20px 22px" }}>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="Enter code"
                maxLength={8}
                style={{ width: "100%", padding: "14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 20, fontWeight: 700, color: T.text1, fontFamily: "'Cairo',sans-serif", textAlign: "center", letterSpacing: ".3em", outline: "none", textTransform: "uppercase" }} />
              <p style={{ textAlign: "center", fontSize: 11, color: T.text3, marginTop: 12 }}>Ask the room owner for the invite code</p>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "16px 22px", borderTop: `1px solid ${T.border}` }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>Cancel</button>
              <button onClick={handleJoin} disabled={loading || code.length < 4} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: loading ? T.border : T.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "'Cairo',sans-serif" }}>
                {loading ? "Joining..." : "Join Room"}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </AnimatePresence>
  );
}

// ─── Theme Variables ─────────────────────────────────────────────────────────

const THEME_CSS = `
  :root, [data-theme=light] {
    --ox-bg: #f0f0f5; --ox-surface: #ffffff; --ox-hover: #f0f0f5;
    --ox-border: #e0e0ea; --ox-border2: #d0d0dd;
    --ox-accent: #5b5ef7; --ox-accentL: #7c7fff;
    --ox-text1: #1a1a2e; --ox-text2: #6b6f8c; --ox-text3: #9a9db0; --ox-text4: #b0b3c5;
    --ox-red: #e84040; --ox-green: #10a37f;
  }
  [data-theme=dark] {
    --ox-bg: #0d0e17; --ox-surface: #12131f; --ox-hover: #1a1b2e;
    --ox-border: #1e2038; --ox-border2: #2a2d4a;
    --ox-accent: #5b5ef7; --ox-accentL: #a5a8ff;
    --ox-text1: #c9cce0; --ox-text2: #8b8fac; --ox-text3: #4b4f72; --ox-text4: #3a3d5c;
    --ox-red: #e84040; --ox-green: #10a37f;
  }
`;
const TRIM_CSS = "*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}@keyframes modalIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}input::placeholder{color:#444}textarea::placeholder{color:#444}@media(max-width:960px){.ox-sidebar{display:none!important}}@media(max-width:960px){.ox-grid{grid-template-columns:1fr!important}}@media(max-width:640px){.ox-grid{gap:12px!important}}@media(max-width:640px){body>div>.ox-main-wrap{padding:80px 8px 16px!important}}";

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function OneXCommunity({
  circles, rooms: initialRooms, currentUserId, currentUserName, currentUserImage,
  currentUserRole, currentUserUniversityId,
}: {
  circles: SocialCircle[];
  rooms: Room[];
  currentUserId: string;
  currentUserName?: string;
  currentUserImage?: string;
  currentUserRole?: string;
  currentUserUniversityId?: string;
}) {
  const searchParams = useSearchParams();
  const setSharedQuestion = useCommunityShareStore(s => s.setSharedQuestion);
  const [activeCircle, setActiveCircle] = useState<SocialCircle | null>(circles[0] ?? null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [myRooms, setMyRooms] = useState<Room[]>(initialRooms);
  const [modalPost, setModalPost] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState<"home" | "explore" | "rooms" | "notifications" | "saved">("home");
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const myJoinedRooms = myRooms.filter(r => r.isMember || r.ownerId === currentUserId);
  const publicRooms = myRooms.filter(r => r.isPublic && !r.isMember && r.ownerId !== currentUserId);

  // ─── Load Posts ──────────────────────────────────────────────────────────────

  const loadPosts = async (circleId: string, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else { setLoading(true); setPage(1); setHasMore(true); }
    const nextPage = isLoadMore ? page + 1 : 1;
    try {
      const res = await fetch(`/api/v1/forums/${circleId}/posts?page=${nextPage}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      const newPosts = Array.isArray(data) ? data : [];
      setPosts(prev => isLoadMore ? [...prev, ...newPosts] : newPosts);
      setHasMore(newPosts.length === 20);
      if (isLoadMore) setPage(nextPage);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load posts");
    } finally { setLoading(false); setIsLoadingMore(false); }
  };

  const loadMore = useCallback(() => { if (activeCircle) loadPosts(activeCircle.id, true); }, [activeCircle?.id, page]);

  useEffect(() => { if (activeCircle) loadPosts(activeCircle.id); }, [activeCircle?.id]);

  // ─── Firebase Realtime ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeCircle) return;
    let unsubscribe: (() => void) | undefined;
    const init = async () => {
      try {
        const { subscribeToForumsRealtime } = await import("@/lib/firebase/realtime-service");
        unsubscribe = subscribeToForumsRealtime(activeCircle.id, (realtimePosts: any[]) => {
          setPosts(currentPosts => {
            let hasChanges = false;
            const merged = [...currentPosts];
            realtimePosts.forEach((rp: any) => {
              const idx = merged.findIndex((p: any) => p.id === rp.id);
              if (idx === -1) { merged.unshift(rp); hasChanges = true; }
            });
            if (hasChanges) return merged.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return currentPosts;
          });
        });
      } catch {}
    };
    init();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [activeCircle?.id]);

  // ─── Trending ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch("/api/v1/social/trending");
        if (res.ok) { const data = await res.json(); setTrendingTags(Array.isArray(data) ? data : []); }
      } catch {}
    };
    fetchTrends();
  }, []);

  // ─── Saved Posts ─────────────────────────────────────────────────────────────

  const loadSavedPosts = async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch("/api/v1/posts/saved");
      if (res.ok) { const data = await res.json(); setSavedPosts(Array.isArray(data) ? data : []); }
    } catch {} finally { setLoadingSaved(false); }
  };

  useEffect(() => { if (activePage === "saved") loadSavedPosts(); }, [activePage]);

  // ─── Shared Question ─────────────────────────────────────────────────────────

  useEffect(() => {
    const qid = searchParams.get("shareQuestion");
    if (qid) {
      fetch(`/api/v1/questions/${qid}`)
        .then(res => res.json())
        .then(data => {
          if (data?.id) {
            setSharedQuestion({ id: data.id, body: data.body, choices: data.choices, correctAnswer: data.answer, userAnswer: null, isCorrect: null, lectureId: data.lectureId });
            toast.success("Question ready to share!");
          }
        }).catch(() => {});
    }
  }, [searchParams, setSharedQuestion]);

  // ─── Post Actions ────────────────────────────────────────────────────────────

  const handlePost = async (content: string, circleId: string, extra?: { mediaItems?: { file: File; type: string }[]; pollOptions?: string[] }): Promise<boolean> => {
    try {
      let imageUrl: string | undefined;
      const attachments: { url: string; name?: string; type?: string; size?: number }[] = [];
      const items = extra?.mediaItems || [];
      const LARGE_THRESHOLD = 5 * 1024 * 1024; // 5MB — فوقها Worker، تحتها Vercel
      for (const item of items) {
        const form = new FormData();
        form.append("file", item.file);
        const isLarge = item.file.size > LARGE_THRESHOLD && !!WORKER_URL;
        const uploadUrl = isLarge ? `${WORKER_URL}/api/upload` : "/api/v1/debug/telegram-direct-upload";
        const uploadRes = await fetch(uploadUrl, { method: "POST", body: form });
        if (uploadRes.ok) {
          const d = await uploadRes.json();
          if (d.success) {
            const t = d.type || item.type || "image";
            const url = `${PREVIEW_BASE}?fileId=${d.fileId}&type=${t}`;
            attachments.push({ url, name: item.file.name, type: item.file.type, size: item.file.size });
            if (!imageUrl && (t === "image" || item.type === "image")) imageUrl = url;
          }
        } else {
          // Fallback: if Worker fails, try Vercel
          if (isLarge) {
            const fallbackRes = await fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: form });
            if (fallbackRes.ok) {
              const d = await fallbackRes.json();
              if (d.success) {
                const t = d.type || item.type || "image";
                const url = `${PREVIEW_BASE}?fileId=${d.fileId}&type=${t}`;
                attachments.push({ url, name: item.file.name, type: item.file.type, size: item.file.size });
                if (!imageUrl && (t === "image" || item.type === "image")) imageUrl = url;
              }
            }
          }
        }
      }
      const body: any = { content: content || (extra?.pollOptions ? "Poll" : imageUrl ? "Shared media" : "") };
      if (imageUrl) body.imageUrl = imageUrl;
      if (attachments.length > 0) body.attachments = attachments;
      if (extra?.pollOptions && extra.pollOptions.length >= 2) {
        body.type = "POLL";
        body.pollOptions = extra.pollOptions;
      }
      const res = await fetch(`/api/v1/forums/${circleId}/posts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Failed to create post"); }
      const newPost = await res.json();
      const { broadcastPost } = await import("@/lib/firebase/realtime-service");
      if (circleId) broadcastPost(circleId, newPost);
      if (circleId === activeCircle?.id) setPosts(p => [newPost, ...p]);
      toast.success("Posted!");
      return true;
    } catch (err: any) { toast.error(err.message || "Failed to post"); return false; }
  };

  const handleReact = async (post: any, type: string) => {
    try { await fetch(`/api/v1/posts/${post.id}/reactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) }); } catch {}
  };

  const handleLike = async (post: any) => {
    try { await fetch(`/api/v1/posts/${post.id}/like`, { method: "POST" }); } catch {}
  };

  const handleSave = async (post: any) => {
    try { await fetch(`/api/v1/posts/${post.id}/save`, { method: "POST" }); } catch {}
  };

  const handleRoomCreated = (room: Room) => {
    setMyRooms(r => [{ ...room, isMember: true }, ...r]);
    toast.success("Room created!");
  };

  // ─── Sort ────────────────────────────────────────────────────────────────────

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a: any, b: any) => {
      if (sortBy === "top") {
        const scoreA = (a._count?.likes || 0) * 2 + (a._count?.comments || 0);
        const scoreB = (b._count?.likes || 0) * 2 + (b._count?.comments || 0);
        return scoreB - scoreA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, sortBy]);

  const sortedCircles = useMemo(() => {
    const global = circles.filter(c => c.type === "GLOBAL");
    const semester = circles.filter(c => c.type === "SEMESTER");
    const other = circles.filter(c => c.type !== "GLOBAL" && c.type !== "SEMESTER");
    return [...global, ...semester, ...other];
  }, [circles]);

  const filteredRoomsC = useMemo(() => {
    if (!searchQuery.trim()) return publicRooms;
    const q = searchQuery.toLowerCase();
    return publicRooms.filter(r => r.name.toLowerCase().includes(q));
  }, [publicRooms, searchQuery]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Cairo', sans-serif", color: T.text1 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{THEME_CSS}</style>
      <style dangerouslySetInnerHTML={{ __html: TRIM_CSS }} />

      <div style={{ width: "100%", padding: "80px 12px 24px", margin: "0 auto" }}>
        <div className="ox-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 20 }}>

          {/* ── LEFT SIDEBAR ── */}
          <aside className="ox-sidebar" style={{ position: "sticky", top: 80, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Navigation */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { id: "home", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: "Home" },
                  { id: "explore", icon: IC.explore, label: "Explore" },
                  { id: "rooms", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: "Rooms" },
                  { id: "notifications", icon: IC.notification, label: "Notifications" },
                  { id: "saved", icon: IC.bookmark(false), label: "Saved" },
                ].map(nav => (
                  <button key={nav.id} onClick={() => setActivePage(nav.id as any)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12, border: "none", cursor: "pointer", background: activePage === nav.id ? T.hover : "none", color: activePage === nav.id ? T.accentL : T.text1, fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: activePage === nav.id ? 700 : 600, textAlign: "left", transition: "all .15s", width: "100%" }}>
                    <span style={{ color: activePage === nav.id ? T.accentL : T.text3, display: "flex" }}>{nav.icon}</span>
                    {nav.label}
                  </button>
                ))}
              </div>

              <div style={{ height: 1, background: T.border }} />

              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 14px" }}>
                <span style={{ color: T.text3, display: "flex" }}>{IC.search}</span>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search rooms..."
                  style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: T.text2, width: "100%", fontFamily: "'Cairo',sans-serif" }} />
              </div>

              {/* Social Circles */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase", paddingBottom: 4 }}>Social Circles</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
                  {sortedCircles.slice(0, 8).map(c => (
                    <div key={c.id} onClick={() => setActiveCircle(c)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", background: activeCircle?.id === c.id ? T.hover : "none", transition: "background .15s" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: c.type === "GLOBAL" ? "rgba(91,94,247,.2)" : "rgba(16,163,127,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        {c.type === "GLOBAL" ? "🌐" : "📚"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: activeCircle?.id === c.id ? T.accentL : T.text1, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
                        <span style={{ fontSize: 11, color: T.text3 }}>{c._count.posts} POSTS · {c.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: T.border }} />

              {/* Discover */}
              {filteredRoomsC.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase", paddingBottom: 4 }}>Discover Circles</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
                    {filteredRoomsC.slice(0, 5).map(r => (
                      <div key={r.id}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", transition: "background .15s" }}
                        onMouseEnter={e => (e.target as HTMLElement).style.background = T.hover}
                        onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,166,35,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🟡</div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text1, lineHeight: 1.2 }}>{r.name}</p>
                          <span style={{ fontSize: 11, color: T.text3 }}>{r._count.members} STUDENT{r._count.members !== 1 ? "S" : ""}</span>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
              )}
              <div style={{ height: 1, background: T.border }} />

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => setShowJoinRoom(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 12, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: ".04em", fontFamily: "'Cairo',sans-serif", transition: "all .15s" }}>
                  {IC.arrow} Join Room
                </button>
                <button onClick={() => setShowCreateRoom(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 12, border: "none", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: ".04em", fontFamily: "'Cairo',sans-serif", transition: "all .15s" }}>
                  {IC.plus} Create Room
                </button>
              </div>
            </div>
          </aside>

          {/* ── CENTER FEED ── */}
          <main style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            {/* Mobile header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}
              className="ox-mobile-header">
              <style>{`@media (min-width: 961px) { .ox-mobile-header { display: none !important; } }`}</style>
              <button onClick={() => setMobileSidebarOpen(true)}
                style={{ background: T.hover, border: `1px solid ${T.border}`, borderRadius: 12, padding: "8px 10px", cursor: "pointer", color: T.text1, display: "flex", alignItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: T.text1, flex: 1 }}>
                {activePage === "home" ? "OneX Community" :
                 activePage === "explore" ? "Explore" :
                 activePage === "rooms" ? "Rooms" :
                 activePage === "notifications" ? "Notifications" :
                 activePage === "saved" ? "Saved Posts" : "OneX Community"}
              </h2>
              <NotificationPanel currentUserId={currentUserId} />
            </div>

            {activePage === "home" && (
              <>
                {/* Composer */}
                <Composer currentCircle={activeCircle} circles={circles} currentUserName={currentUserName} onPost={handlePost} />

                {/* Feed header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: T.accent }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {activeCircle?.name || "Feed"} Activity
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["RECENT", "TOP"].map(t => (
                      <button key={t} onClick={() => setSortBy(t.toLowerCase() as any)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: sortBy === t.toLowerCase() ? T.hover : "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif", color: sortBy === t.toLowerCase() ? T.text1 : T.text3, transition: "all .15s" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posts */}
                <PullToRefresh onRefresh={() => activeCircle && loadPosts(activeCircle.id)}>
                  {loading ? (
                    <ForumPostListSkeleton count={4} />
                  ) : sortedPosts.length > 0 ? (
                    <InfiniteScrollContainer
                      onLoadMore={loadMore}
                      hasMore={hasMore}
                      isLoading={isLoadingMore}
                      className="flex flex-col gap-4"
                      endComponent={
                        <div style={{ padding: "40px 20px", textAlign: "center", opacity: 0.4 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.05em", color: T.text3 }}>You've reached the end</p>
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {sortedPosts.map((post: any) => (
                          <PostCard key={post.id} post={post} onOpen={(p) => setModalPost(p)} onReact={handleReact} onLike={handleLike} onSave={handleSave} currentUserId={currentUserId} />
                        ))}
                      </div>
                    </InfiniteScrollContainer>
                  ) : (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "60px 20px", textAlign: "center" }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: T.text1, marginBottom: 8 }}>No posts yet</p>
                      <p style={{ fontSize: 13, color: T.text3 }}>Be the first to post in {activeCircle?.name || "this circle"}!</p>
                    </div>
                  )}
                </PullToRefresh>
              </>
            )}

            {activePage === "explore" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Trending */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(232,64,64,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🔥</div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>Trending Now</span>
                  </div>
                  {trendingTags.length === 0 ? (
                    <p style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "40px 0" }}>No trends yet</p>
                  ) : trendingTags.slice(0, 10).map((tag: any, i: number) => (
                    <div key={tag.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, cursor: "pointer", transition: "background .15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.hover}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>#{tag.name}</div>
                        <div style={{ fontSize: 11, color: T.text3 }}>{tag.count || tag.posts || "0"} discussions</div>
                      </div>
                      <span style={{ color: T.text4, fontSize: 16 }}>›</span>
                    </div>
                  ))}
                </div>

                {/* Discover Rooms */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📚</div>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>Discover Rooms</span>
                    </div>
                  </div>
                  {filteredRoomsC.length === 0 ? (
                    <p style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "40px 0" }}>No rooms available</p>
                  ) : filteredRoomsC.map((r: any) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.bg, borderRadius: 12, marginBottom: 6, cursor: "pointer", border: `1px solid ${T.border}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.border2}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{r.isPublic ? "🌐" : "🔒"} {r.name}</div>
                        <div style={{ fontSize: 11, color: T.text3 }}>{r._count?.members || 0} members</div>
                      </div>
                      <button onClick={() => setShowJoinRoom(true)}
                        style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePage === "rooms" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowCreateRoom(true)}
                    style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                    {IC.plus} Create Room
                  </button>
                  <button onClick={() => setShowJoinRoom(true)}
                    style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                    {IC.arrow} Join Room
                  </button>
                </div>

                {myJoinedRooms.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase", marginBottom: 12 }}>My Rooms ({myJoinedRooms.length})</div>
                    {myJoinedRooms.map(room => (
                      <Link key={room.id} href={`/rooms/${room.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: T.bg, borderRadius: 12, cursor: "pointer", border: `1px solid ${T.border}`, marginBottom: 6 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.border2}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{room.isPublic ? "🌐" : "🔒"} {room.name}</div>
                            <div style={{ fontSize: 11, color: T.text3 }}>{room._count?.members || 0} MEMBERS</div>
                          </div>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: T.hover, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 14 }}>›</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {filteredRoomsC.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase", marginBottom: 12 }}>Public Rooms</div>
                    {filteredRoomsC.map(r => (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: T.bg, borderRadius: 12, marginBottom: 6, cursor: "pointer", border: `1px solid ${T.border}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.border2}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{r.isPublic ? "🌐" : "🔒"} {r.name}</div>
                          <div style={{ fontSize: 11, color: T.text3 }}>{r._count?.members || 0} members</div>
                        </div>
                        <button onClick={() => setShowJoinRoom(true)}
                          style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activePage === "notifications" && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden" }}>
                <NotificationsPage currentUserId={currentUserId} />
              </div>
            )}

            {activePage === "saved" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {loadingSaved ? (
                  <ForumPostListSkeleton count={3} />
                ) : savedPosts.length > 0 ? (
                  savedPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} onOpen={(p) => setModalPost(p)} onReact={handleReact} onLike={handleLike} onSave={handleSave} currentUserId={currentUserId} />
                  ))
                ) : (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "60px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: T.text1, marginBottom: 8 }}>No saved posts</p>
                    <p style={{ fontSize: 13, color: T.text3 }}>Save posts you want to read later</p>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="ox-sidebar" style={{ position: "sticky", top: 80, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            <ClockWidget />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <NotificationPanel currentUserId={currentUserId} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar initials={getInitials(currentUserName || "U")} color={T.accent} size={34} image={currentUserImage} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{currentUserName || "User"}</span>
              </div>
            </div>

            {/* Trending */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(232,64,64,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🔥</div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>Trending Now</span>
              </div>
              {trendingTags.length === 0 ? (
                <p style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "16px 0" }}>No trends yet</p>
              ) : trendingTags.slice(0, 5).map((tag: any, i: number) => (
                <div key={tag.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, cursor: "pointer", transition: "background .15s", border: "1px solid transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>#{tag.name}</div>
                    <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>{tag.count || tag.posts || "0"} DISCUSSION{i > 0 ? "S" : ""}</div>
                  </div>
                  <span style={{ color: T.text4, fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>

            {/* Study Rooms */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📚</div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>My Study Rooms</span>
                </div>
                <button onClick={() => setShowCreateRoom(true)}
                  style={{ width: 26, height: 26, borderRadius: 8, background: T.hover, border: "none", color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
              {myJoinedRooms.length > 0 ? (
                <>
                  <div style={{ fontSize: 10, color: T.text4, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{myJoinedRooms.length} ACTIVE ROOM{myJoinedRooms.length !== 1 ? "S" : ""}</div>
                  {myJoinedRooms.slice(0, 4).map(room => (
                    <Link key={room.id} href={`/rooms/${room.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.bg, borderRadius: 12, cursor: "pointer", border: `1px solid ${T.border}`, transition: "border-color .15s", marginBottom: 6 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.border2}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{room.isPublic ? "🌐" : "🔒"} {room.name}</div>
                          <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>{room._count.members} MEMBER{room._count.members !== 1 ? "S" : ""}</div>
                        </div>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: T.hover, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 14 }}>›</div>
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <p style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "16px 0" }}>No rooms joined yet</p>
              )}
              <button onClick={() => setShowJoinRoom(true)}
                style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 12, border: `1px dashed ${T.border}`, background: "none", color: T.accent, fontFamily: "'Cairo',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + Join a Room
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.6)", backdropFilter: "blur(12px)" }} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "85%", maxWidth: 320, zIndex: 210, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: T.accent }}>OneX Community</span>
                <button onClick={() => setMobileSidebarOpen(false)} style={{ width: 36, height: 36, borderRadius: "50%", background: T.hover, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.text3 }}>
                  {IC.close}
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, padding: "0 4px" }}>Circles</p>
                <div style={{ marginBottom: 20 }}>
                  {sortedCircles.map(c => (
                    <button key={c.id} onClick={() => { setActiveCircle(c); setMobileSidebarOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 12, border: "none", cursor: "pointer", background: activeCircle?.id === c.id ? T.hover : "none", color: activeCircle?.id === c.id ? T.accentL : T.text1, fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: activeCircle?.id === c.id ? 700 : 500, textAlign: "left", transition: "all .15s" }}>
                      <span style={{ fontSize: 18 }}>{c.type === "GLOBAL" ? "🌐" : "📚"}</span>
                      {c.name}
                    </button>
                  ))}
                </div>

                {filteredRoomsC.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, padding: "0 4px" }}>Discover</p>
                    <div style={{ marginBottom: 20 }}>
                      {filteredRoomsC.slice(0, 5).map(r => (
                        <div key={r.id}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 12, color: T.text1, fontSize: 14 }}>
                          <span style={{ fontSize: 18 }}>🟡</span>
                          {r.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                  <button onClick={() => { setShowCreateRoom(true); setMobileSidebarOpen(false); }}
                    style={{ padding: "10px", borderRadius: 12, border: "none", background: T.accent, color: "#fff", fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    + Create Room
                  </button>
                  <button onClick={() => { setShowJoinRoom(true); setMobileSidebarOpen(false); }}
                    style={{ padding: "10px", borderRadius: 12, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    + Join Room
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <InlineCreateRoomModal isOpen={showCreateRoom} onClose={() => setShowCreateRoom(false)} onSuccess={handleRoomCreated} />
      <InlineJoinRoomModal isOpen={showJoinRoom} onClose={() => setShowJoinRoom(false)} />

      {/* Post Detail Modal */}
      {modalPost && (
        <Portal>
        <div onClick={() => { setModalPost(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(5,5,12,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,.6)", animation: "modalIn .2s ease" }}>
            <PostModal post={modalPost} onClose={() => { setModalPost(null); }} currentUserId={currentUserId} />
          </div>
        </div>
        </Portal>
      )}

    </div>
  );
}
