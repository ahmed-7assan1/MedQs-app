"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { marked } from "marked";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { InfiniteScrollContainer } from "@/components/ui/InfiniteScrollContainer";
import { ForumPostListSkeleton } from "@/components/ui/skeleton";
import { useNotificationStore, useCommunityShareStore, useThemeStore } from "@/lib/store";
import type { NotificationItem } from "@/types";
import { MiniFloatingNav } from "./MiniFloatingNav";
import { ReportModal } from "./ReportModal";
import { PullToRefresh } from "./PullToRefresh";
import { Avatar } from "./Avatar";
import { ActionBtn } from "./ActionBtn";
import { getYouTubeId, getYouTubeThumbnail, getYouTubeEmbedUrl } from "@/lib/video-utils";

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
  quizData?: { type: string; options: string[]; correctAnswer?: string };
}
interface CommentData {
  id: string; text: string; createdAt: string; likes: number; liked: boolean;
  author: { id: string; name: string; image?: string };
}
interface TrendingTag {
  id: string; name: string; count: string; hot?: boolean;
}

// ─── Reaction Mapping ───────────────────────────────────────────────────────

const REACTION_ICONS: Record<string, React.ReactNode> = {
  "❤️": <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
};
const REACTION_EMOJI: Record<string, string> = {
  LIKE: "❤️",
};
const REVERSE_EMOJI: Record<string, string> = {
  "❤️": "LIKE",
};
const REACTION_LIST = ["❤️"];

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
      const url = m[1].startsWith("http") ? m[1] : null;
      if (url) {
        parts.push(<a key={m.index} href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: T.accentL, textDecoration: "none", fontWeight: 600 }}
          onClick={e => e.stopPropagation()}>{m[1]}</a>);
      } else {
        parts.push(m[1]);
      }
    } else if (m[2]) {
      parts.push(<span key={m.index} style={{ color: T.accent, fontWeight: 600 }}>{m[2]}</span>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

function renderMarkdown(text: string): string {
  if (!text.trim()) return "";
  return (marked.parse(text, { async: false }) as string)
    .replace(/(#\w+)/g, '<span style="color:' + T.accent + ';font-weight:600">$1</span>');
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
    // Check actual MIME type first (more reliable than URL parsing)
    if (a.type) {
      const t = a.type.toLowerCase();
      if (t.startsWith("image/") || t.startsWith("video/") || t.startsWith("audio/")) return false;
      return true; // application/*, text/*, model/* etc → file
    }
    // Fallback: URL-based detection for audio/video
    const mt = getMediaType(url);
    return mt !== "video" && mt !== "audio";
  }).map(a => ({ ...a, url: workerUrlToVercel(a.url) }));
}

// ─── Design Tokens + Font ───────────────────────────────────────

const FONT = "var(--font-cairo), var(--font-geist-sans), system-ui, sans-serif";

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

// ─── Post Card ───────────────────────────────────────────────────────────────

function PostCard({ post, onOpen, onReact, onLike, onSave, currentUserId, currentUserRole, currentUserUniversityId }: {
  post: any; onOpen: (p: any) => void; onReact: (p: any, emoji: string) => void;
  onLike: (p: any) => void; onSave: (p: any) => void; currentUserId?: string;
  currentUserRole?: string; currentUserUniversityId?: string;
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
  const [topComments, setTopComments] = useState<any[]>([]);
  const [topComLoaded, setTopComLoaded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showReactionDetail, setShowReactionDetail] = useState(false);
  const [reactionUsers, setReactionUsers] = useState<{ type: string; user: { name: string; image?: string } }[]>([]);
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [showYtVideo, setShowYtVideo] = useState(false);

  useEffect(() => {
    if (post._count?.comments > 0 && !topComLoaded) {
      fetch(`/api/v1/posts/${post.id}/comments?top=2`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setTopComments(data); })
        .catch(() => console.warn("Failed to load top comments"))
        .finally(() => setTopComLoaded(true));
    }
  }, [post.id, post._count?.comments]);

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

  const handleBlockUser = async () => {
    try {
      const res = await fetch("/api/v1/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: post.author.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.blocked ? "User blocked" : "User unblocked");
        setShowBlockConfirm(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } catch { toast.error("Network error"); }
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
        transition: "border-color .2s, box-shadow .3s, transform .2s",
        boxShadow: hov ? "0 8px 32px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-1px)" : "none",
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
            <div style={{ fontSize: 11, color: T.text3 }}>{timeAgo(post.createdAt)}{post.updatedAt && new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 2000 ? <span style={{ color: T.text4 }}> · Edited</span> : ""}</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.text4, padding: 6, borderRadius: 8, display: "flex" }}>
            {IC.more}
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.4)", minWidth: 150, padding: 4, marginTop: 4 }}>
              {(post.author?.id === currentUserId || currentUserRole === "SUPER_ADMIN" || (currentUserRole === "ADMIN" && currentUserUniversityId === post.universityId)) && (
                <>
                  {post.author?.id === currentUserId && (
                    <button onClick={e => { e.stopPropagation(); setEditing(true); setMenuOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: T.text1, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                      onMouseEnter={e => (e.target as HTMLElement).style.background = T.hover}
                      onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>{IC.pencil} Edit</button>
                  )}
                  <button onClick={handleDelete} disabled={deleting}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                    onMouseEnter={e => (e.target as HTMLElement).style.background = "rgba(232,64,64,.08)"}
                    onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>{IC.trash} {deleting ? "Deleting..." : "Delete"}</button>
                </>
              )}
              {post.author?.id !== currentUserId && (
                <>
                  <button onClick={e => { e.stopPropagation(); setShowReport(true); setMenuOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: "#f59e0b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                    onMouseEnter={e => (e.target as HTMLElement).style.background = "rgba(245,158,11,.1)"}
                    onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    Report
                  </button>
                  <button onClick={e => { e.stopPropagation(); setShowBlockConfirm(true); setMenuOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                    onMouseEnter={e => (e.target as HTMLElement).style.background = "rgba(232,64,64,.08)"}
                    onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    Block @{post.author?.name}
                  </button>
                </>
              )}
              <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/social?post=${post.id}`); toast.success("Link copied"); setMenuOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: T.text1, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
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
              style={{ width: "100%", minHeight: 80, padding: 12, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text1, fontSize: 14, fontFamily: FONT, resize: "vertical", outline: "none" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={e => { e.stopPropagation(); setEditing(false); setEditText(post.content); }}
                style={{ padding: "6px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
              <button onClick={handleEdit} disabled={saving}
                style={{ padding: "6px 16px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ margin: 0, fontSize: 14, color: T.text2, lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
            {(() => {
              const ytCandidate = post.link || post.content;
              const ytId = getYouTubeId(ytCandidate);
              if (ytId) return showYtVideo ? (
                <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginTop: 8, background: T.bg, aspectRatio: "16/9" }}>
                  <iframe src={getYouTubeEmbedUrl(ytId)} title="YouTube" style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 55, zIndex: 10, cursor: "default" }} />
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 55, zIndex: 10, cursor: "default" }} />
                  <div style={{ position: "absolute", top: 55, right: 0, width: 320, bottom: 55, zIndex: 10, cursor: "default" }} />
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 55, zIndex: 10, cursor: "default" }} />
                </div>
              ) : (
                <div onClick={e => { e.stopPropagation(); setShowYtVideo(true); }}
                  style={{ position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer", marginTop: 8, background: T.bg, aspectRatio: "16/9", maxHeight: 300 }}>
                  <img src={getYouTubeThumbnail(ytId)} alt="YouTube" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", transition: "background .2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.3)"; }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .2s", boxShadow: "0 4px 20px rgba(255,0,0,0.4)" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                </div>
              );
              if (post.link) return (
                <a href={post.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ fontSize: 13, color: T.accentL, textDecoration: "none", fontWeight: 600, wordBreak: "break-all", marginTop: 8 }}>{post.link}</a>
              );
              return null;
            })()}
            {(() => {
              const mediaUrls = collectMediaUrls(post);
              const fileAttachments = collectFiles(post);
              const fileUrls = new Set(fileAttachments.map(f => f.url));
              const imageUrls = mediaUrls.filter(u => getMediaType(u) === "image" && !fileUrls.has(u));
              const videoUrls = mediaUrls.filter(u => getMediaType(u) === "video");
              const audioUrls = mediaUrls.filter(u => getMediaType(u) === "audio");
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
                        <div style={{ borderRadius: 14, overflow: "hidden", background: T.bg, maxHeight: 300, cursor: "pointer" }}>
                          <img src={imageUrls[0]} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} onError={() => setBrokenImages(prev => new Set(prev).add(imageUrls[0]))} onClick={e => { e.stopPropagation(); setLightboxIndex(0); }} />
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
                            <div key={i} style={{ flex: "0 0 auto", width: 200, height: 200, borderRadius: 14, overflow: "hidden", background: T.bg, scrollSnapAlign: "start", cursor: "pointer" }}>
                              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: T.bg }} onError={() => setBrokenImages(prev => new Set(prev).add(url))} onClick={e => { e.stopPropagation(); setLightboxIndex(i); }} />
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
            {post.quizData && post.quizData.options?.length > 0 && (
              <div style={{ marginTop: 12, background: T.hover, borderRadius: 16, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 10, lineHeight: 1.5 }}>{post.content}</div>
                <div style={{ fontSize: 10, color: T.text4, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{post.quizData.correctAnswer ? "Quiz" : "Q&A"}</div>
                {post.quizData.options.map((opt: string, i: number) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: T.surface, marginBottom: 6, fontSize: 13, color: T.text2 }}>
                    {opt}
                  </div>
                ))}
              </div>
            )}
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
              <span style={{ display: "flex", color: userReactions.has(emoji) ? T.accent : T.text3 }}>{REACTION_ICONS[emoji]}</span> <span style={{ fontWeight: 600, fontSize: 11 }}>{count}</span>
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
                  style={{ padding: "6px", borderRadius: 16, border: "none", background: T.hover, cursor: "pointer", display: "flex", color: T.text2 }}>
                  {REACTION_ICONS[emoji]}
                </button>
              ))}
            </div>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12, color: T.text3 }}>
            <button onClick={e => { e.stopPropagation(); setShowReactionDetail(true); setLoadingReactions(true); fetch(`/api/v1/posts/${post.id}/reactions`).then(r => r.json()).then(d => setReactionUsers(d)).catch(() => {}).finally(() => setLoadingReactions(false)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: T.text3, fontFamily: FONT, fontWeight: 600, padding: 0 }}>{likeCount.toLocaleString()} likes</button> · {post._count?.comments || 0} comments
          </span>
        </div>
      </div>

      {/* Top comments preview */}
      {topComments.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 18px" }}>
          {topComments.map(c => (
            <div key={c.id} style={{ display: "flex", gap: 8, padding: "6px 0" }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {c.author?.image ? (
                  <img src={c.author.image} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                    {(c.author?.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text2 }}>{c.author?.nickname || c.author?.name || "User"}</span>
                  <span style={{ fontSize: 10, color: T.text4 }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: T.text3, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {c.content}
                </p>
              </div>
            </div>
          ))}
          {post._count?.comments > 2 && (
            <button onClick={e => { e.stopPropagation(); onOpen(post); }}
              style={{ background: "none", border: "none", color: T.text4, fontSize: 11, fontWeight: 600, cursor: "pointer", padding: "4px 0", fontFamily: FONT }}>
              View all comments ({post._count.comments})
            </button>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: "flex", padding: "10px 18px 14px", borderTop: topComments.length > 0 ? "none" : `1px solid ${T.border}`, gap: 4 }}>
        <ActionBtn icon={IC.heart(liked)} label={liked ? "Liked" : "Like"} active={liked} activeColor={T.red} activeBg="rgba(232,64,64,.08)" onClick={handleLike} />
        <ActionBtn icon={IC.comment} label="Comment" onClick={e => { e.stopPropagation(); onOpen(post); }} />
        <ActionBtn icon={IC.share} label="Share" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/social?post=${post.id}`); toast.success("Link copied"); }} />
        <ActionBtn icon={IC.bookmark(saved)} label={saved ? "Saved" : "Save"} active={saved} onClick={handleSave} />
      </div>

      {/* Report Modal */}
      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="POST"
        targetId={post.id}
      />

      {/* Block Confirm */}
      {showBlockConfirm && (
        <Portal>
          <div onClick={() => setShowBlockConfirm(false)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 380, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "modalIn .2s ease" }}>
              <div style={{ padding: "24px 22px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(232,64,64,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: T.red }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text1, margin: "0 0 4px" }}>Block @{post.author?.name}?</p>
                <p style={{ fontSize: 12, color: T.text3, margin: "0 0 20px" }}>They won't be able to see or interact with your posts.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowBlockConfirm(false)} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "var(--ox-glass-input)", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
                  <button onClick={handleBlockUser} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: T.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Block</button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Reaction Detail Modal */}
      {showReactionDetail && (
        <Portal>
          <div onClick={() => setShowReactionDetail(false)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 400, maxHeight: "70vh", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "modalIn .2s ease", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>Reactions</span>
                <button onClick={() => setShowReactionDetail(false)} style={{ background: "color-mix(in srgb, var(--ox-glass-bg), #fff 50%)", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex" }} aria-label="Close reactions">{IC.close}</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                {loadingReactions ? (
                  <div style={{ padding: "40px", textAlign: "center", color: T.text3, fontSize: 13 }}>Loading...</div>
                ) : reactionUsers.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: T.text3, fontSize: 13 }}>No reactions yet</div>
                ) : reactionUsers.map((r) => (
                  <div key={r.user?.name || r.type} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: T.hover, flexShrink: 0 }}>
                      {r.user?.image ? <img src={r.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{getInitials(r.user?.name || "U")}</div>}
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.text1 }}>{r.user?.name || "User"}</div>
                    <span style={{ display: "flex", color: T.accent }}>{REACTION_ICONS[r.type] || r.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Image Lightbox */}
      {lightboxIndex !== null && (() => {
        const mediaUrls = collectMediaUrls(post);
        const imageUrls = mediaUrls.filter(u => getMediaType(u) === "image");
        return (
          <Portal>
            <div onClick={() => setLightboxIndex(null)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,.95)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(16px)" }}>
              {imageUrls.length > 1 && (
                <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => i === null ? null : Math.max(0, i - 1)); }} style={{ position: "absolute", left: 20, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              )}
              <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
                <img src={imageUrls[lightboxIndex]} alt="" style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 12, display: "block" }} />
                <div style={{ textAlign: "center", marginTop: 12, color: "rgba(255,255,255,.6)", fontSize: 12, fontWeight: 600 }}>
                  {lightboxIndex + 1} / {imageUrls.length}
                </div>
              </div>
              {imageUrls.length > 1 && (
                <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => i === null ? null : Math.min(imageUrls.length - 1, i + 1)); }} style={{ position: "absolute", right: 20, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )}
            </div>
          </Portal>
        );
      })()}
    </div>
  );
}

// ─── Post Modal ──────────────────────────────────────────────────────────────

function PostModal({ post, onClose, currentUserId }: { post: any; onClose: () => void; currentUserId?: string }) {
  const [tab, setTab] = useState("post");
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [saved, setSaved] = useState(false);
  const [sheet, setSheet] = useState<null | "share" | "delete" | "options">(null);
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
  const [deleting, setDeleting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showYtVideo, setShowYtVideo] = useState(false);
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
    } catch (e) { console.warn("Failed to load comments", e); } finally { setComLoading(false); }
  };

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    const optimisticId = `opt-${Date.now()}`;
    const optimisticComment: CommentData = {
      id: optimisticId, text: newComment.trim(), createdAt: new Date().toISOString(),
      likes: 0, liked: false,
      author: { id: currentUserId || "", name: "You" },
    };
    setComments(cs => [...cs, optimisticComment]);
    setNewComment("");
    setTab("comments");
    setSubmitting(true);
    setTimeout(() => commentBodyRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 40);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: optimisticComment.text }),
      });
      if (!res.ok) throw new Error("Failed to comment");
      const saved = await res.json();
      setComments(cs => cs.map(c => c.id === optimisticId ? { ...c, id: saved.id || c.id } : c));
    } catch { setComments(cs => cs.filter(c => c.id !== optimisticId)); toast.error("Failed to post comment"); }
    finally { setSubmitting(false); }
  };

  const toggleCommentLike = async (id: string) => {
    setCommentLikes(cl => ({ ...cl, [id]: !cl[id] }));
    setComments(cs => cs.map(c => c.id === id ? { ...c, likes: c.likes + (commentLikes[id] ? -1 : 1) } : c));
    try { await fetch(`/api/v1/posts/${post.id}/comments/${id}/like`, { method: "POST" }); } catch (e) { console.warn("Like sync failed", e); }
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
    try { await fetch(`/api/v1/posts/${post.id}/reactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) }); } catch (e) { console.warn("Reaction sync failed", e); }
  };

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((c: number) => liked ? c - 1 : c + 1);
    try { await fetch(`/api/v1/posts/${post.id}/like`, { method: "POST" }); } catch (e) { console.warn("Like sync failed", e); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setDeleted(true);
      toast.success("Post deleted");
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const handleBlockUserPost = async () => {
    try {
      const res = await fetch("/api/v1/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: post.author.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.blocked ? "User blocked" : "User unblocked");
        setShowBlockConfirm(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } catch { toast.error("Network error"); }
  };

  if (deleted) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(232,64,64,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: T.red }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Post Deleted</p>
      <p style={{ fontSize: 13, color: T.text3 }}>This post has been successfully removed.</p>
      <button onClick={onClose} style={{ padding: "10px 24px", background: T.accent, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>Close</button>
    </div>
  );

  const authorInitials = getInitials(post.author?.name || "User");
  const authorColor = post.author?.color || getColor(post.author?.name || "User");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={authorInitials} color={authorColor} size={44} image={post.author?.image} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text1, fontFamily: FONT }}>{post.author?.name || "User"}</div>
            <div style={{ fontSize: 11, color: T.text3, fontFamily: FONT }}>@{post.author?.name?.toLowerCase().replace(" ", "_")} · {timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(post.isOwner || post.author?.id === currentUserId) && (
            <button onClick={() => setSheet(s => s === "delete" ? null : "delete")}
              style={{ background: sheet === "delete" ? "rgba(232,64,64,.1)" : "none", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.red, display: "flex", transition: "background .15s" }} aria-label="Delete post">
              {IC.trash}
            </button>
          )}
          {post.author?.id !== currentUserId && (
            <div style={{ position: "relative" }}>
              <button onClick={e => { e.stopPropagation(); setSheet(s => s === "options" ? null : "options"); }}
                style={{ background: sheet === "options" ? T.hover : "none", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex", transition: "background .15s" }} aria-label="More options">
                {IC.more}
              </button>
            {sheet === "options" && (
              <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.4)", minWidth: 150, padding: 4, marginTop: 4 }}>
                <button onClick={() => { setShowReport(true); setSheet(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: "#f59e0b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                  onMouseEnter={e => (e.target as HTMLElement).style.background = "rgba(245,158,11,.1)"}
                  onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  Report
                </button>
                <button onClick={() => { setShowBlockConfirm(true); setSheet(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", background: "none", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                  onMouseEnter={e => (e.target as HTMLElement).style.background = "rgba(232,64,64,.08)"}
                  onMouseLeave={e => (e.target as HTMLElement).style.background = "none"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  Block @{post.author?.name}
                </button>
              </div>
            )}
          </div>
          )}
            <button onClick={onClose}
              style={{ background: T.hover, border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex", transition: "background .15s" }} aria-label="Close post">{IC.close}</button>
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
              <button onClick={() => setSheet(null)} style={{ flex: 1, padding: "9px", border: `1px solid ${T.border}`, borderRadius: 10, background: "none", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 10, background: deleting ? T.border : T.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>{deleting ? "Deleting..." : "Delete"}</button>
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
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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
              {typeof window !== "undefined" ? window.location.origin : ""}/social?post={post.id}
            </div>
            <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: "8px 14px", background: copied ? T.green : T.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: FONT, letterSpacing: ".04em", transition: "background .2s" }}>
              {copied ? "✓ COPIED" : "COPY"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 18px", flexShrink: 0 }}>
        {[["post", "Post"], ["comments", `Comments (${comments.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "12px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: tab === key ? T.accentL : T.text3, borderBottom: `2px solid ${tab === key ? T.accent : "transparent"}`, fontFamily: FONT, transition: "all .2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {tab === "post" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ margin: 0, fontSize: 14, color: T.text2, lineHeight: 1.8, fontFamily: FONT }} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
            {(() => {
              const ytCandidate = post.link || post.content;
              const ytId = getYouTubeId(ytCandidate);
              if (ytId) return showYtVideo ? (
                <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginTop: 8, background: T.bg, aspectRatio: "16/9" }}>
                  <iframe src={getYouTubeEmbedUrl(ytId)} title="YouTube" style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 55, zIndex: 10, cursor: "default" }} />
                  <div style={{ position: "absolute", top: 55, right: 0, width: 320, bottom: 55, zIndex: 10, cursor: "default" }} />
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 55, zIndex: 10, cursor: "default" }} />
                </div>
              ) : (
                <div onClick={() => setShowYtVideo(true)}
                  style={{ position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer", marginTop: 8, background: T.bg, aspectRatio: "16/9", maxHeight: 350 }}>
                  <img src={getYouTubeThumbnail(ytId)} alt="YouTube" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.3)"; }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(255,0,0,0.4)" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                </div>
              );
              if (post.link) return (
                <a href={post.link} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: T.accentL, textDecoration: "none", fontWeight: 600, wordBreak: "break-all" }}>{post.link}</a>
              );
              return null;
            })()}
            {(() => {
              const mediaUrls = collectMediaUrls(post);
              const fileAttachments = collectFiles(post);
              const fileUrls = new Set(fileAttachments.map(f => f.url));
              const imageUrls = mediaUrls.filter(u => getMediaType(u) === "image" && !fileUrls.has(u));
              const videoUrls = mediaUrls.filter(u => getMediaType(u) === "video");
              const audioUrls = mediaUrls.filter(u => getMediaType(u) === "audio");
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
                          <div key={i} style={{ flex: imageUrls.length === 1 ? "1" : "0 0 auto", width: imageUrls.length === 1 ? "100%" : 280, borderRadius: 14, overflow: "hidden", background: T.bg, scrollSnapAlign: "start", maxHeight: 380, maxWidth: "100%" }}>
                            <img src={url} alt="" style={{ width: "100%", maxHeight: 380, objectFit: "contain", objectPosition: "center", display: "block", background: T.bg }} onError={() => setBrokenImages(prev => new Set(prev).add(url))} />
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
                  {post.quizData && post.quizData.options?.length > 0 && (
                    <div style={{ marginTop: 12, background: T.hover, borderRadius: 16, padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 10, lineHeight: 1.5 }}>{post.content}</div>
                      <div style={{ fontSize: 10, color: T.text4, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{post.quizData.correctAnswer ? "Quiz" : "Q&A"}</div>
                      {post.quizData.options.map((opt: string, i: number) => (
                        <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: T.surface, marginBottom: 6, fontSize: 13, color: T.text2 }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
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
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.text3 }}>
              <span>{likeCount.toLocaleString()} likes</span>
              <span>{comments.length} comments</span>
              <span>{post._count?.shares || 0} shares</span>
            </div>
            </div>
        )}

        {tab === "comments" && (
          <div ref={commentBodyRef} style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>
            {comLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: T.text3, fontSize: 13 }}>Loading comments...</div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.text3, fontSize: 13 }}>No comments yet. Be the first!</div>
            ) : comments.map(c => (
              <div key={c.id} style={{ display: "flex", gap: 10 }}>
                <Avatar initials={getInitials(c.author?.name || "U")} color={getColor(c.author?.name || "U")} size={34} image={c.author?.image} />
                <div style={{ flex: 1, background: T.hover, borderRadius: "0 14px 14px 14px", padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text1, fontFamily: FONT }}>{c.author?.name || "User"}</span>
                    <span style={{ fontSize: 10, color: T.text4, marginLeft: "auto" }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: T.text2, lineHeight: 1.65, fontFamily: FONT }}>{c.text}</p>
                  <button onClick={() => toggleCommentLike(c.id)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: commentLikes[c.id] ? T.red : T.text3, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, marginTop: 6, transition: "color .15s" }}>
                    {IC.heart(!!commentLikes[c.id])} {c.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", padding: "10px 18px", borderTop: `1px solid ${T.border}`, gap: 4, flexShrink: 0 }}>
        <ActionBtn icon={IC.heart(liked)} label={liked ? "Liked" : "Like"} active={liked} activeColor={T.red} activeBg="rgba(232,64,64,.1)" onClick={handleLike} />
      </div>

      {/* Comment input — pinned below body */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", padding: "12px 20px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0, background: "hsl(var(--card)/0.95)", boxShadow: "0 -4px 12px hsl(var(--card)/0.5)", position: "relative", zIndex: 2 }}>
        <Avatar initials="ME" color="hsl(var(--primary))" size={34} />
        <div style={{ flex: 1, background: T.surface, borderRadius: 16, border: `1px solid ${T.border2}`, padding: "10px 14px", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", transition: "border-color .15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border2; }}>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
            placeholder="Add a comment..."
            rows={1}
            style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 13, color: T.text1, fontFamily: FONT, resize: "none", lineHeight: 1.5 }} />
        </div>
        <button onClick={submitComment} disabled={!newComment.trim() || submitting}
          style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: newComment.trim() ? "hsl(var(--primary))" : T.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: newComment.trim() ? "pointer" : "default", flexShrink: 0, transition: "all .2s", transform: newComment.trim() ? "scale(1)" : "scale(0.95)", opacity: newComment.trim() ? 1 : 0.6 }}>
          {IC.send}
        </button>
      </div>

      {/* ReportModal */}
      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="POST"
        targetId={post.id}
      />

      {/* Block Confirm */}
      {showBlockConfirm && (
        <Portal>
          <div onClick={() => setShowBlockConfirm(false)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 380, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "modalIn .2s ease" }}>
              <div style={{ padding: "24px 22px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(232,64,64,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: T.red }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text1, margin: "0 0 4px" }}>Block @{post.author?.name}?</p>
                <p style={{ fontSize: 12, color: T.text3, margin: "0 0 20px" }}>They won't be able to see or interact with your posts.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowBlockConfirm(false)} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "var(--ox-glass-input)", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
                  <button onClick={handleBlockUserPost} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: T.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Block</button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
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
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "modalIn .2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Notifications</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}>Mark all read</button>
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
                    <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: T.text3 }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>
                    No notifications yet
                  </div>
                ) : notifications.slice(0, 50).map((n: NotificationItem) => (
                  <div key={n.id} onClick={() => { markRead(n.id); }}
                    style={{ display: "flex", gap: 12, padding: "14px 20px", cursor: "pointer", background: n.read ? "none" : "rgba(91,94,247,.05)", transition: "background .1s", borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => (e.target as HTMLElement).style.background = T.hover}
                    onMouseLeave={e => (e.target as HTMLElement).style.background = n.read ? "none" : "rgba(91,94,247,.05)"}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: n.read ? T.hover : T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: n.read ? T.text3 : "#fff" }}>
                      {n.channel === "comment" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> : n.channel === "reaction" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
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
          <button onClick={markAllRead} style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}>Mark all read</button>
        )}
      </div>
      <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "8px 0" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: T.text3, fontSize: 14 }}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: T.text3 }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>
            No notifications yet
          </div>
        ) : notifications.slice(0, 50).map((n: NotificationItem) => (
          <div key={n.id} onClick={() => { markRead(n.id); }}
            style={{ display: "flex", gap: 12, padding: "14px 20px", cursor: "pointer", background: n.read ? "none" : "rgba(91,94,247,.05)", transition: "background .1s", borderBottom: `1px solid ${T.border}` }}
            onMouseEnter={e => (e.target as HTMLElement).style.background = T.hover}
            onMouseLeave={e => (e.target as HTMLElement).style.background = n.read ? "none" : "rgba(91,94,247,.05)"}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: n.read ? T.hover : T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: n.read ? T.text3 : "#fff" }}>
              {n.channel === "comment" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> : n.channel === "reaction" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
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

// ─── Post Composer Modal ─────────────────────────────────────────────────────

function PostComposerModal({ isOpen, onClose, currentCircle, circles, currentUserName, onPost }: {
  isOpen: boolean; onClose: () => void;
  currentCircle?: SocialCircle | null; circles: SocialCircle[];
  currentUserName?: string; onPost: (content: string, circleId: string, extra?: any) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [activeCircle, setActiveCircle] = useState(currentCircle?.id || circles[0]?.id || "");
  const [mediaItems, setMediaItems] = useState<{ file: File; preview: string; type: "image" | "video" | "audio" | "file"; progress: number; uploading: boolean }[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [isPosting, setIsPosting] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [showQa, setShowQa] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const ddRef = useRef<HTMLDivElement>(null);

  const MAX_IMAGES = 10;
  const MAX_FILES = 3;
  const MAX_AUDIO = 1;
  const MAX_POLL_OPTIONS = 3;
  const MAX_QUIZ_OPTIONS = 20;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDropdownOpen(null);
    };
    if (dropdownOpen) { document.addEventListener("mousedown", handleClick); return () => document.removeEventListener("mousedown", handleClick); }
  }, [dropdownOpen]);

  const addFiles = (files: FileList | null, type: "image" | "video" | "audio" | "file") => {
    if (!files) return;
    const currentCount = mediaItems.filter(m => m.type === type).length;
    const maxMap = { image: MAX_IMAGES, video: MAX_IMAGES, audio: MAX_AUDIO, file: MAX_FILES } as const;
    const max = maxMap[type];
    if (currentCount >= max) { toast.error(`Max ${max} ${type}(s) allowed`); return; }
    const allowed = Math.min(files.length, max - currentCount);
    const items = Array.from(files).slice(0, allowed).map(file => ({ file, preview: URL.createObjectURL(file), type, progress: 0, uploading: false }));
    setMediaItems(prev => [...prev, ...items]);
    setShowPoll(false); setShowQuiz(false); setShowQa(false);
  };
  const removeItem = (idx: number) => {
    setMediaItems(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
  };
  const addPollOption = () => { if (pollOptions.length < MAX_POLL_OPTIONS) setPollOptions(p => [...p, ""]); };
  const addQuizOption = () => { if (quizOptions.length < MAX_QUIZ_OPTIONS) setQuizOptions(p => [...p, ""]); };

  const handleEnhance = async () => {
    if (!text.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/v1/ai/enhance-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text }) });
      if (!res.ok) throw new Error("Enhance failed");
      const data = await res.json();
      setText(data.enhanced);
      toast.success("Content enhanced");
    } catch { toast.error("Failed to enhance"); }
    finally { setEnhancing(false); }
  };

  const wrapSelection = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    setText(newText);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };

  const uploadFile = (item: typeof mediaItems[number], idx: number): Promise<{ url: string; type: string }> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", item.file);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setMediaItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], progress: pct, uploading: true }; return n; });
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const d = JSON.parse(xhr.responseText);
            if (d.success) {
              const t = d.type || item.type;
              const url = `${PREVIEW_BASE}?fileId=${d.fileId}&type=${t}`;
              setMediaItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], progress: 100, uploading: false }; return n; });
              resolve({ url, type: t });
            } else reject(new Error("Upload failed"));
          } catch { reject(new Error("Upload failed")); }
        } else reject(new Error("Upload failed"));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.open("POST", "/api/v1/debug/telegram-direct-upload");
      xhr.send(form);
    });

  const handleSubmit = async () => {
    const hasContent = text.trim() || mediaItems.length > 0 || showPoll || showQuiz || showQa;
    if (!hasContent) return;
    if (showQuiz) {
      if (!quizQuestion.trim()) { toast.error("Enter a quiz question"); return; }
      const valid = quizOptions.filter(o => o.trim());
      if (valid.length < 2) { toast.error("Add at least 2 quiz options"); return; }
      if (!correctAnswer) { toast.error("Select the correct answer"); return; }
    }
    if (showPoll && pollOptions.filter(o => o.trim()).length < 2) { toast.error("Add at least 2 poll options"); return; }
    if (showQa && !qaQuestion.trim()) { toast.error("Enter a question"); return; }
    setIsPosting(true);
    let imageUrl: string | undefined;
    const attachments: { url: string; name?: string; type?: string; size?: number }[] = [];
    for (let i = 0; i < mediaItems.length; i++) {
      try {
        const result = await uploadFile(mediaItems[i], i);
        attachments.push({ ...result, name: mediaItems[i].file.name, size: mediaItems[i].file.size });
        if (mediaItems[i].type === "image" && !imageUrl) imageUrl = result.url;
      } catch { toast.error(`Failed to upload ${mediaItems[i].file.name}`); return setIsPosting(false); }
    }
    let finalContent = text.trim();
    let quizData: any = undefined;
    if (showQa) {
      finalContent = qaQuestion.trim();
      quizData = { type: "qa", options: [] };
    } else if (showQuiz) {
      finalContent = quizQuestion.trim();
      quizData = { type: "qa", options: quizOptions.filter(o => o.trim()), correctAnswer };
    }
    const ok = await onPost(finalContent, activeCircle, {
      imageUrl,
      attachments: attachments.length > 0 ? attachments : undefined,
      pollOptions: showPoll ? pollOptions.filter(o => o.trim()) : undefined,
      quizData,
    });
    setIsPosting(false);
    if (ok) { onClose(); setText(""); setMediaItems([]); setShowPoll(false); setPollOptions(["", ""]); setShowQuiz(false); setQuizQuestion(""); setQuizOptions(["", ""]); setCorrectAnswer(""); setShowQa(false); setQaQuestion(""); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px", overflowY: "auto" }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()} style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 600, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 80px)" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                <Avatar initials={getInitials(currentUserName || "You")} color={T.accent} size={34} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: T.text1 }}>Create Post</span>
                <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.08)", color: T.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "background .15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}>{IC.close}</button>
              </div>
              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Markdown toolbar */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 0", borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
                  {[
                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>, action: () => wrapSelection("**", "**"), title: "Bold" },
                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 6H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H7"/></svg>, action: () => wrapSelection("*", "*"), title: "Italic" },
                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 4 10 4 18 14 14 14 18 20 10 20"/></svg>, action: () => wrapSelection("## ", ""), title: "Heading" },
                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/><path d="M10 14L20 4"/><polyline points="15 4 20 4 20 9"/></svg>, action: () => wrapSelection("[", "](url)"), title: "Link" },
                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, action: () => wrapSelection("\n- ", ""), title: "List" },
                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, action: () => wrapSelection("> ", ""), title: "Quote" },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} title={btn.title}
                      style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "none", color: T.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.color = T.text1; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = T.text3; }}>
                      {btn.icon}
                    </button>
                  ))}
                  <span style={{ flex: 1 }} />
                  <button onClick={handleEnhance} disabled={enhancing || !text.trim()} title="Enhance with AI"
                    style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "none", color: T.text3, cursor: enhancing || !text.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", opacity: enhancing || !text.trim() ? 0.4 : 1 }}
                    onMouseEnter={e => { if (text.trim() && !enhancing) { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.color = "#eab308"; } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = T.text3; }}>
                    {enhancing
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin .6s linear infinite" }}><circle cx="12" cy="12" r="10" strokeDasharray="40" strokeLinecap="round"/></svg>
                      : IC.ai}
                  </button>

                </div>
                {/* Edit / Preview toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
                  <button onClick={() => setShowPreview(false)}
                    style={{ padding: "3px 10px", borderRadius: 6, border: "none", background: !showPreview ? T.hover : "none", color: !showPreview ? T.text1 : T.text3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}>Edit</button>
                  <button onClick={() => setShowPreview(true)}
                    style={{ padding: "3px 10px", borderRadius: 6, border: "none", background: showPreview ? T.hover : "none", color: showPreview ? T.text1 : T.text3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}>Preview</button>
                </div>
                {/* Textarea */}
                {!showPreview && (
                <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)}
                  placeholder="What's on your mind?"
                  style={{ width: "100%", minHeight: 120, maxHeight: 300, background: "none", border: "none", outline: "none", fontSize: 14, color: T.text1, fontFamily: FONT, resize: "vertical", lineHeight: 1.6 }} />
                )}
                {/* Preview */}
                {showPreview && (
                  <div style={{ width: "100%", minHeight: 120, maxHeight: 300, overflowY: "auto", borderRadius: 10, background: T.bg, padding: 12, fontSize: 14, color: T.text2, fontFamily: FONT, lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: text.trim() ? marked.parse(text, { async: false }) as string : '<span style="color:' + T.text4 + '">Nothing to preview</span>' }} />
                )}
                {/* Media preview */}
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
                        {item.uploading && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <div style={{ width: "60%", height: 4, borderRadius: 2, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
                              <div style={{ width: `${item.progress}%`, height: "100%", background: "hsl(var(--primary))", borderRadius: 2, transition: "width .2s" }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{item.progress}%</span>
                          </div>
                        )}
                        {!item.uploading && (
                          <button onClick={() => removeItem(i)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.7)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✕</button>
                        )}
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
                        <input value={opt} onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} placeholder={`Option ${i + 1}`}
                          style={{ flex: 1, padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.text1, fontFamily: FONT, outline: "none" }} />
                        {i > 1 && <button onClick={() => setPollOptions(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>✕</button>}
                      </div>
                    ))}
                    {pollOptions.length < MAX_POLL_OPTIONS && <button onClick={addPollOption} style={{ alignSelf: "flex-start", padding: "4px 14px", border: `1px dashed ${T.border}`, borderRadius: 8, background: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontFamily: FONT }}>+ Add option</button>}
                  </div>
                )}
                {/* Quiz builder */}
                {showQuiz && (
                  <div style={{ background: T.bg, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>Create Quiz</span>
                      <button onClick={() => { setShowQuiz(false); setQuizOptions(["", ""]); setQuizQuestion(""); setCorrectAnswer(""); }}
                        style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: T.hover, color: T.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✕</button>
                    </div>
                    <input value={quizQuestion} onChange={e => setQuizQuestion(e.target.value)} placeholder="Quiz question"
                      style={{ width: "100%", padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.text1, fontFamily: FONT, outline: "none" }} />
                    <span style={{ fontSize: 11, color: T.text3 }}>Options (select the correct one):</span>
                    {quizOptions.map((opt, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="radio" name="correct" checked={correctAnswer === opt} onChange={() => setCorrectAnswer(opt)}
                          style={{ accentColor: T.accent, cursor: "pointer", flexShrink: 0 }} />
                        <input value={opt} onChange={e => { const n = [...quizOptions]; n[i] = e.target.value; setQuizOptions(n); }} placeholder={`Option ${i + 1}`}
                          style={{ flex: 1, padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.text1, fontFamily: FONT, outline: "none" }} />
                        {i > 1 && <button onClick={() => { setQuizOptions(p => p.filter((_, j) => j !== i)); if (correctAnswer === quizOptions[i]) setCorrectAnswer(""); }} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16 }}>✕</button>}
                      </div>
                    ))}
                    {quizOptions.length < MAX_QUIZ_OPTIONS && <button onClick={addQuizOption} style={{ alignSelf: "flex-start", padding: "4px 14px", border: `1px dashed ${T.border}`, borderRadius: 8, background: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontFamily: FONT }}>+ Add option</button>}
                  </div>
                )}
                {/* Q&A builder */}
                {showQa && (
                  <div style={{ background: T.bg, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>Ask a Question</span>
                      <button onClick={() => { setShowQa(false); setQaQuestion(""); }}
                        style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: T.hover, color: T.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✕</button>
                    </div>
                    <input value={qaQuestion} onChange={e => setQaQuestion(e.target.value)} placeholder="Type your question..."
                      style={{ width: "100%", padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, color: T.text1, fontFamily: FONT, outline: "none" }} />
                  </div>
                )}
              </div>
              {/* Footer */}
              <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                {/* Circle selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {circles.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => setActiveCircle(c.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: `1px solid ${activeCircle === c.id ? T.accent : T.border}`, background: activeCircle === c.id ? T.accent : "none", fontSize: 11, fontWeight: 600, color: activeCircle === c.id ? "#fff" : T.text2, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}>
                      {c.name}
                    </button>
                  ))}
                </div>
                {/* Action buttons + Post */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files, "image")} />
                  <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => addFiles(e.target.files, "video")} />
                  <input ref={audioRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={e => addFiles(e.target.files, "audio")} />
                  <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files, "file")} />
                  <div ref={ddRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
                  {[
                    { id: "media", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/><polygon points="23 7 16 12 23 17 23 7"/></svg>, label: "Media", onClick: () => { setDropdownOpen(dropdownOpen === "media" ? null : "media"); setShowPoll(false); }, active: dropdownOpen === "media" || mediaItems.some(m => m.type !== "file") },
                    { ref: fileRef, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: "File" },
                    { id: "poll", icon: IC.poll, label: "Poll", onClick: () => { setShowPoll(!showPoll); if (!showPoll) { setShowQuiz(false); setShowQa(false); setMediaItems([]); setDropdownOpen(null); } }, active: showPoll },
                    { id: "questions", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></svg>, label: "Questions", onClick: () => { setDropdownOpen(dropdownOpen === "questions" ? null : "questions"); setShowPoll(false); }, active: dropdownOpen === "questions" || showQuiz || showQa },
                  ].map((item: any, idx) => (
                    <button key={idx} onClick={() => item.onClick ? item.onClick() : item.ref?.current?.click()}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 10, border: "none", background: item.active ? "hsl(var(--primary) / 0.1)" : "none", color: item.active ? "hsl(var(--primary))" : T.text3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: FONT, transition: "all .15s" }}
                      onMouseEnter={e => { if (!item.active) { (e.target as HTMLElement).style.background = "hsl(var(--primary) / 0.05)"; (e.target as HTMLElement).style.color = "hsl(var(--primary))"; } }}
                      onMouseLeave={e => { if (!item.active) { (e.target as HTMLElement).style.background = "none"; (e.target as HTMLElement).style.color = T.text3; } }}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                  {/* Media dropdown */}
                  {dropdownOpen === "media" && (
                    <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 8px 30px rgba(0,0,0,.3)", zIndex: 10, minWidth: 140 }}>
                      <button onClick={() => { photoRef.current?.click(); setDropdownOpen(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, border: "none", background: "none", color: T.text1, fontSize: 12, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "background .15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.hover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>{IC.photo} Photo</button>
                      <button onClick={() => { videoRef.current?.click(); setDropdownOpen(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, border: "none", background: "none", color: T.text1, fontSize: 12, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "background .15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.hover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>{IC.video} Video</button>
                      <button onClick={() => { audioRef.current?.click(); setDropdownOpen(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, border: "none", background: "none", color: T.text1, fontSize: 12, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "background .15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.hover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>{IC.mic} Audio</button>
                    </div>
                  )}
                  {/* Questions dropdown */}
                  {dropdownOpen === "questions" && (
                    <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 8px 30px rgba(0,0,0,.3)", zIndex: 10, minWidth: 160 }}>
                      <button onClick={() => { setShowQuiz(true); setShowPoll(false); setShowQa(false); setMediaItems([]); setDropdownOpen(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, border: "none", background: showQuiz ? "hsl(var(--primary) / 0.1)" : "none", color: T.text1, fontSize: 12, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "background .15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.hover}
                        onMouseLeave={e => { if (!showQuiz) (e.currentTarget as HTMLElement).style.background = "none"; }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Quiz</button>
                      <button onClick={() => { setShowQa(true); setShowPoll(false); setShowQuiz(false); setMediaItems([]); setDropdownOpen(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, border: "none", background: showQa ? "hsl(var(--primary) / 0.1)" : "none", color: T.text1, fontSize: 12, cursor: "pointer", fontFamily: FONT, textAlign: "left", transition: "background .15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.hover}
                        onMouseLeave={e => { if (!showQa) (e.currentTarget as HTMLElement).style.background = "none"; }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 16 12 12 12 8"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Q&A</button>
                    </div>
                  )}
                  </div>
                  <button onClick={handleSubmit} disabled={isPosting}
                    style={{ marginLeft: "auto", padding: "7px 18px", borderRadius: 20, border: "none", background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: FONT, display: "flex", alignItems: "center", gap: 6, cursor: isPosting ? "wait" : "pointer", opacity: isPosting ? 0.6 : 1, transition: "all .2s", transform: isPosting ? "scale(0.97)" : "scale(1)", boxShadow: isPosting ? "none" : "0 4px 12px hsl(var(--primary) / 0.3)" }}>
                    {isPosting
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{ animation: "spin .6s linear infinite" }}><circle cx="12" cy="12" r="10" strokeDasharray="40" strokeLinecap="round"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                    {isPosting ? "Publishing..." : "Post"}
              </button>
            </div>
          </div>
          </motion.div>
        </motion.div>
      </Portal>
      )}
    </AnimatePresence>
  );
}

// ─── MOBILE REELS VIEW ──────────────────────────────────────────────────────

function MobileReelsView({ currentUserId, currentUserName, circles, activeCircle, onPost, onLike, onSave }: {
  currentUserId?: string; currentUserName?: string;
  circles: SocialCircle[]; activeCircle?: SocialCircle | null;
  onPost: (content: string, circleId: string, extra?: any) => Promise<boolean>;
  onLike: (post: any) => Promise<void>;
  onSave: (post: any) => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [reelsPosts, setReelsPosts] = useState<any[]>([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const REELS_LIMIT = 5;
  const reelsPageRef = useRef(1);
  const reelsHasMoreRef = useRef(true);
  const post = reelsPosts[index];
  const [showYtVideo, setShowYtVideo] = useState(false);
  const prevShowCreate = useRef(showCreate);

  // Refresh from page 1 when the create sheet closes (post was just created)
  useEffect(() => {
    if (prevShowCreate.current && !showCreate) {
      setIndex(0);
      reelsPageRef.current = 1;
      reelsHasMoreRef.current = true;
      fetchReelsPosts(false);
    }
    prevShowCreate.current = showCreate;
  }, [showCreate]);

  const fetchReelsPosts = async (isLoadMore = false) => {
    if (!activeCircle) return;
    if (isLoadMore && (!reelsHasMoreRef.current || reelsLoading)) return;
    setReelsLoading(true);
    const nextPage = isLoadMore ? reelsPageRef.current + 1 : 1;
    try {
      const res = await fetch(`/api/v1/forums/${activeCircle.id}/posts?page=${nextPage}&limit=${REELS_LIMIT}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      const newPosts = Array.isArray(data) ? data : [];
      setReelsPosts(prev => isLoadMore ? [...prev, ...newPosts] : newPosts);
      reelsHasMoreRef.current = newPosts.length === REELS_LIMIT;
      reelsPageRef.current = nextPage;
    } catch (err: any) {
      console.error(err);
    } finally { setReelsLoading(false); }
  };

  useEffect(() => {
    setIndex(0);
    setReelsPosts([]);
    reelsPageRef.current = 1;
    reelsHasMoreRef.current = true;
    if (activeCircle) fetchReelsPosts(false);
  }, [activeCircle?.id]);

  // Load more when approaching the last post
  useEffect(() => {
    if (index >= reelsPosts.length - 2 && reelsHasMoreRef.current && !reelsLoading && reelsPosts.length > 0) {
      fetchReelsPosts(true);
    }
  }, [index, reelsPosts.length, reelsLoading]);

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && index < reelsPosts.length - 1) setIndex(i => i + 1);
      if (diff < 0 && index > 0) setIndex(i => i - 1);
    }
    setTouchStart(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", flexShrink: 0, borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        <button onClick={() => setMobileSidebarOpen(true)}
          style={{ background: T.hover, border: `1px solid ${T.border}`, borderRadius: 12, padding: "8px 10px", cursor: "pointer", color: T.text1, display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div style={{ fontSize: 17, fontWeight: 900, color: T.text1, flex: 1 }}>OneX Community</div>
        <div style={{ position: "relative" }}>
          <NotificationPanel currentUserId={currentUserId} />
        </div>
      </div>

      {/* Main content area */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ flex: 1, position: "relative", overflow: "hidden", background: T.bg }}>
        {reelsPosts.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.text3, fontSize: 14, flexDirection: "column", gap: 8, padding: 40, textAlign: "center" }}>
            {reelsLoading ? (
              <div style={{ width: 24, height: 24, border: "2px solid " + T.border, borderTopColor: T.accent, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            ) : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.text4} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                <span>No posts yet</span>
              </>
            )}
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div key={post?.id || index}
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ height: "100%", display: "flex", flexDirection: "column", padding: "20px 20px 100px 20px", overflowY: "auto" }}>
                {/* Post author */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexShrink: 0 }}>
                  <Avatar initials={getInitials(post?.author?.name || "U")} color={getColor(post?.author?.name || "U")} size={38} image={post?.author?.image} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{post?.author?.name || "User"}</div>
                    <div style={{ fontSize: 11, color: T.text4 }}>{timeAgo(post?.createdAt)}</div>
                  </div>
                </div>
                {/* Content */}
                {post?.content && <div style={{ margin: 0, fontSize: 15, color: T.text2, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />}
                {(() => {
                  const ytCandidate = post?.link || post?.content || "";
                  const ytId = getYouTubeId(ytCandidate);
                  if (ytId) return showYtVideo ? (
                    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginTop: 8, background: T.bg, aspectRatio: "16/9" }}>
                      <iframe src={getYouTubeEmbedUrl(ytId)} title="YouTube" style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 55, zIndex: 10, cursor: "default" }} />
                      <div style={{ position: "absolute", top: 55, right: 0, width: 320, bottom: 55, zIndex: 10, cursor: "default" }} />
                      <div style={{ position: "absolute", bottom: 0, right: 0, width: 60, height: 55, zIndex: 10, cursor: "default" }} />
                    </div>
                  ) : (
                    <div onClick={() => setShowYtVideo(true)}
                      style={{ position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer", marginTop: 8, background: T.bg, aspectRatio: "16/9", maxHeight: 300 }}>
                      <img src={getYouTubeThumbnail(ytId)} alt="YouTube" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(255,0,0,0.4)" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      </div>
                    </div>
                  );
                  return null;
                })()}
                {/* Media & attachments: images, video, audio, files, link */}
                {(() => {
                  const mediaUrls = collectMediaUrls(post);
                  const fileAttachments = collectFiles(post);
                  const fileUrls = new Set(fileAttachments.map(f => f.url));
                  const imageUrls = mediaUrls.filter(u => getMediaType(u) === "image" && !fileUrls.has(u));
                  const videoUrls = mediaUrls.filter(u => getMediaType(u) === "video");
                  const audioUrls = mediaUrls.filter(u => getMediaType(u) === "audio");
                  return (
                    <>
                      {imageUrls.length > 0 && (
                        imageUrls.length === 1 ? (
                          <div style={{ borderRadius: 16, overflow: "hidden", marginTop: 12, maxHeight: 300, background: T.hover }}>
                            <img src={imageUrls[0]} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "contain", display: "block" }}
                              onError={e => { const t = e.currentTarget; t.style.display = "none"; }} />
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 4, marginTop: 12 }}>
                            {imageUrls.map((url, i) => (
                              <div key={i} style={{ flex: "0 0 auto", width: 200, height: 200, borderRadius: 14, overflow: "hidden", background: T.bg, scrollSnapAlign: "start" }}>
                                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: T.bg }}
                                  onError={e => { const t = e.currentTarget; t.style.display = "none"; }} />
                              </div>
                            ))}
                          </div>
                        )
                      )}
                      {videoUrls.map((url, i) => (
                        <div key={i} style={{ borderRadius: 16, overflow: "hidden", marginTop: 12, maxHeight: 300, background: T.hover }}>
                          <video src={url} controls style={{ width: "100%", display: "block", maxHeight: 300 }} />
                        </div>
                      ))}
                      {audioUrls.map((url, i) => (
                        <div key={url} style={{ borderRadius: 14, padding: 16, background: T.bg, textAlign: "center", marginTop: 12 }}>
                          <audio src={url} controls style={{ width: "100%" }} />
                        </div>
                      ))}
                      {fileAttachments.map((f, i) => (
                        <div key={f.url} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginTop: 12 }}>
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
                      {post?.link && (
                        <a href={post.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ fontSize: 13, color: T.accentL, textDecoration: "none", fontWeight: 600, wordBreak: "break-all", marginTop: 12, display: "block" }}>{post.link}</a>
                      )}
                    </>
                  );
                })()}
                {/* Quiz / Q&A */}
                {post?.quizData && post.quizData.options?.length > 0 && (
                  <div style={{ marginTop: 12, background: T.hover, borderRadius: 16, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 10, lineHeight: 1.5 }}>{post.content}</div>
                    <div style={{ fontSize: 10, color: T.text4, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{post.quizData.correctAnswer ? "Quiz" : "Q&A"}</div>
                    {post.quizData.options.map((opt: string, i: number) => (
                      <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: T.surface, marginBottom: 6, fontSize: 13, color: T.text2 }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
                {/* Poll */}
                {post?.pollOptions && post.pollOptions.length > 0 && (
                  <div style={{ marginTop: 12, background: T.hover, borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 10 }}>Poll</div>
                    {post.pollOptions.map((opt: string, i: number) => (
                      <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: T.surface, marginBottom: 6, fontSize: 13, color: T.text2 }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
                {/* Hashtags */}
                {post?.hashtags?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                    {post.hashtags.map((h: string) => (
                      <span key={h} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "hsl(var(--primary) / 0.08)", color: T.accent, fontWeight: 600 }}>#{h}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Right action buttons */}
            <div style={{ position: "absolute", right: 8, bottom: 100, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
              <ReelsActionBtn icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              } count={post?._count?.likes || 0} active={false}
                onClick={() => post && onLike(post)} />
              <ReelsActionBtn icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              } count={post?._count?.comments || 0} onClick={() => setShowComments(true)} />
              <ReelsActionBtn icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              } onClick={() => post && onSave(post)} />
              <ReelsActionBtn icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              } onClick={() => {
                if (!post) return;
                navigator.clipboard.writeText(`${window.location.origin}/social?post=${post.id}`);
                toast.success("Link copied");
              }} />
              <ReelsActionBtn icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              } onClick={() => setShowCreate(true)} />
            </div>

            {/* Index indicator */}
            <div style={{ position: "absolute", top: 8, right: 12, display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 16, background: T.hover, fontSize: 11, color: T.text3, fontWeight: 600 }}>
              {index + 1}/{reelsPosts.length}
              {reelsLoading && <div style={{ width: 10, height: 10, border: "1.5px solid " + T.border, borderTopColor: T.accent, borderRadius: "50%", animation: "spin .8s linear infinite" }} />}
            </div>
          </>
        )}
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)" }} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 201, background: T.surface, borderRight: `1px solid ${T.border}`, padding: 20, overflowY: "auto" }}>
              <button onClick={() => setMobileSidebarOpen(false)}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: T.hover, color: T.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                {IC.close}
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {["home", "explore", "rooms", "notifications", "saved"].map(id => (
                  <button key={id}
                    style={{ padding: "12px 14px", borderRadius: 12, border: "none", background: "none", color: T.text1, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: T.text3, display: "flex" }}>
                      {id === "home" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> :
                       id === "explore" ? IC.explore :
                       id === "rooms" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> :
                       id === "notifications" ? IC.notification : IC.bookmark(false)}
                    </span>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.text4, textTransform: "uppercase", letterSpacing: ".1em" }}>Circles</p>
                {circles.slice(0, 8).map(c => (
                  <div key={c.id} style={{ padding: "10px 14px", borderRadius: 10, background: activeCircle?.id === c.id ? T.hover : "none", color: T.text1, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: getColor(c.name), flexShrink: 0 }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Comments sheet */}
      <AnimatePresence>
        {showComments && (
          <ReelsCommentSheet post={post} currentUserId={currentUserId} onClose={() => setShowComments(false)} />
        )}
      </AnimatePresence>

      {/* Create post sheet */}
      <AnimatePresence>
        {showCreate && (
          <ReelsCreateSheet currentUserId={currentUserId} currentUserName={currentUserName} circles={circles} activeCircle={activeCircle} onPost={onPost} onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reels Action Button ─────────────────────────────────────────────────────

function ReelsActionBtn({ icon, count, active, onClick }: {
  icon: React.ReactNode; count?: number; active?: boolean; onClick?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <button onClick={onClick}
        style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${active ? T.accent : T.border}`, background: active ? "hsl(var(--primary) / 0.1)" : T.surface, color: active ? T.accent : T.text1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {icon}
      </button>
      {count !== undefined && <span style={{ fontSize: 10, color: T.text3, fontWeight: 600 }}>{count > 999 ? (count / 1000).toFixed(1) + "k" : count}</span>}
    </div>
  );
}

// ─── Reels Comment Sheet ─────────────────────────────────────────────────────

function ReelsCommentSheet({ post, currentUserId, onClose }: {
  post: any; currentUserId?: string; onClose: () => void;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const fetchCom = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments((Array.isArray(data) ? data : []).map((c: any) => ({
          id: c.id, text: c.text || c.content || "", createdAt: c.createdAt,
          likes: c._count?.likes || c.likes || 0, liked: c.likedByMe || false,
          author: c.author || { id: "?", name: "User" },
        })));
      }
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchCom(); }, []);

  const submit = async () => {
    if (!text.trim() || submitting) return;
    const opt: any = { id: `opt-${Date.now()}`, text: text.trim(), createdAt: new Date().toISOString(), likes: 0, liked: false, author: { id: currentUserId || "", name: "You" } };
    setComments(c => [...c, opt]); setText("");
    setTimeout(() => listRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: opt.text }) });
      if (res.ok) { const saved = await res.json(); setComments(c => c.map(x => x.id === opt.id ? { ...x, id: saved.id } : x)); }
      else setComments(c => c.filter(x => x.id !== opt.id));
    } catch { setComments(c => c.filter(x => x.id !== opt.id)); } finally { setSubmitting(false); }
  };

  const toggleLike = async (id: string) => {
    setCommentLikes(c => ({ ...c, [id]: !c[id] }));
    setComments(c => c.map(x => x.id === id ? { ...x, likes: x.likes + (commentLikes[id] ? -1 : 1) } : x));
    try { await fetch(`/api/v1/posts/${post.id}/comments/${id}/like`, { method: "POST" }); } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "75%", background: "hsl(var(--card))", borderRadius: "20px 20px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 0 8px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.text4 }} />
        </div>
        <div style={{ padding: "0 20px 12px", fontSize: 15, fontWeight: 700, color: T.text1, flexShrink: 0 }}>
          Comments ({comments.length})
        </div>
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, minHeight: 120 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: T.text3, fontSize: 13 }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.text3, fontSize: 13 }}>No comments yet</div>
          ) : comments.map((c: any) => (
            <div key={c.id} style={{ display: "flex", gap: 10 }}>
              <Avatar initials={getInitials(c.author?.name || "U")} color={getColor(c.author?.name || "U")} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{c.author?.name || "User"}</span>
                  <span style={{ fontSize: 10, color: T.text4 }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ margin: "2px 0 4px", fontSize: 13, color: T.text2, lineHeight: 1.5 }}>{c.text}</p>
                <button onClick={() => toggleLike(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: commentLikes[c.id] ? T.red : T.text3, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {IC.heart(!!commentLikes[c.id])} {c.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "12px 16px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment..." rows={1}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            style={{ flex: 1, padding: "10px 14px", borderRadius: 14, border: `1px solid ${T.border2}`, background: T.bg, fontSize: 13, color: T.text1, fontFamily: FONT, outline: "none", resize: "none", lineHeight: 1.5 }} />
          <button onClick={submit} disabled={!text.trim() || submitting}
            style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: text.trim() ? T.accent : T.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: text.trim() ? "pointer" : "default", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reels Create Sheet ──────────────────────────────────────────────────────

function ReelsCreateSheet({ currentUserId, currentUserName, circles, activeCircle, onPost, onClose }: {
  currentUserId?: string; currentUserName?: string;
  circles: SocialCircle[]; activeCircle?: SocialCircle | null;
  onPost: (content: string, circleId: string, extra?: any) => Promise<boolean>;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [circleId, setCircleId] = useState(activeCircle?.id || circles[0]?.id || "");
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || isPosting) return;
    setIsPosting(true);
    const ok = await onPost(text.trim(), circleId, {});
    setIsPosting(false);
    if (ok) { onClose(); setText(""); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "80%", background: "hsl(var(--card))", borderRadius: "20px 20px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 0 8px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.text4 }} />
        </div>
        <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: T.text1 }}>Create Post</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: T.hover, color: T.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{IC.close}</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <select value={circleId} onChange={e => setCircleId(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, fontSize: 13, color: T.text1, fontFamily: FONT, outline: "none" }}>
            {circles.map((c: SocialCircle) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your mind?" rows={5}
            style={{ width: "100%", minHeight: 120, borderRadius: 14, border: `1px solid ${T.border}`, background: T.bg, padding: "12px 14px", fontSize: 14, color: T.text1, fontFamily: FONT, outline: "none", resize: "none", lineHeight: 1.6 }} />
          <button onClick={handleSubmit} disabled={!text.trim() || isPosting}
            style={{ padding: "12px", borderRadius: 12, border: "none", background: isPosting ? T.border : T.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: isPosting ? "default" : "pointer", fontFamily: FONT }}>
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>
      </motion.div>
    </motion.div>
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
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "modalIn .2s ease", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 18 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>Create Room</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>Start a new study circle</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "color-mix(in srgb, var(--ox-glass-bg), #fff 50%)", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex" }}>{IC.close}</button>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Room name"
                style={{ width: "100%", padding: "11px 14px", background: "var(--ox-glass-input)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 14, color: T.text1, fontFamily: FONT, outline: "none" }} />
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
                style={{ width: "100%", padding: "11px 14px", background: "var(--ox-glass-input)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 14, color: T.text1, fontFamily: FONT, outline: "none" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--ox-glass-input)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 13, color: T.text2 }}>Public room</span>
                <button onClick={() => setIsPublic(!isPublic)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: isPublic ? T.accent : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background .2s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isPublic ? 22 : 2, transition: "left .2s" }} />
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: T.text2, flexShrink: 0 }}>Member limit:</span>
                <input type="number" value={memberLimit} onChange={e => setMemberLimit(Number(e.target.value))} min={2} max={100}
                  style={{ width: 70, padding: "6px 10px", background: "var(--ox-glass-input)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 14, color: T.text1, fontFamily: FONT, outline: "none", textAlign: "center" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "16px 22px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "var(--ox-glass-input)", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: saving ? "rgba(255,255,255,0.1)" : T.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer", fontFamily: FONT }}>
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
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "modalIn .2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 18 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>Join Room</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>Enter invite code</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "color-mix(in srgb, var(--ox-glass-bg), #fff 50%)", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex" }}>{IC.close}</button>
            </div>
            <div style={{ padding: "20px 22px" }}>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="Enter code"
                maxLength={8}
                style={{ width: "100%", padding: "14px", background: "var(--ox-glass-input)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 20, fontWeight: 700, color: T.text1, fontFamily: FONT, textAlign: "center", letterSpacing: ".3em", outline: "none", textTransform: "uppercase" }} />
              <p style={{ textAlign: "center", fontSize: 11, color: T.text3, marginTop: 12 }}>Ask the room owner for the invite code</p>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "16px 22px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "var(--ox-glass-input)", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
              <button onClick={handleJoin} disabled={loading || code.length < 4} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: loading ? "rgba(255,255,255,0.1)" : T.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: FONT }}>
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
  :root {
    --ox-bg: hsl(var(--background));
    --ox-surface: hsl(var(--card));
    --ox-hover: color-mix(in srgb, hsl(var(--card)), hsl(var(--foreground)) 8%);
    --ox-border: hsl(var(--border));
    --ox-border2: hsl(var(--input));
    --ox-accent: hsl(var(--primary));
    --ox-accentL: hsl(var(--primary) / 0.8);
    --ox-text1: hsl(var(--foreground));
    --ox-text2: hsl(var(--muted-foreground));
    --ox-text3: hsl(var(--muted-foreground));
    --ox-text4: hsl(var(--muted));
    --ox-red: hsl(var(--destructive));
    --ox-green: hsl(var(--success));
    --ox-text1: #0f0f0f;
    --ox-text2: #1f1f1f;
    --ox-text3: #555555;
    --ox-text4: #888888;
    --ox-glass-bg: rgba(255,255,255,0.97);
    --ox-glass-border: rgba(0,0,0,0.08);
    --ox-glass-input: rgba(0,0,0,0.04);
  }
  .dark {
    --ox-text1: #f0f0f0;
    --ox-text2: #d0d0d0;
    --ox-text3: #b0b0b0;
    --ox-text4: #888888;
    --ox-glass-bg: rgba(255,255,255,0.03);
    --ox-glass-border: rgba(255,255,255,0.08);
    --ox-glass-input: rgba(255,255,255,0.04);
  }
`;
const RESPONSIVE_CSS = `@media(max-width:1200px){.ox-grid{grid-template-columns:64px 1fr 280px!important;gap:12px!important}}@media(max-width:960px){.ox-sidebar{display:none!important}}@media(max-width:960px){.ox-grid{grid-template-columns:1fr!important;gap:0!important}}@media(max-width:960px){.ox-grid>aside:last-child{display:none!important}}@media(max-width:640px){.ox-container{padding:12px 8px 0!important}}@media(max-width:640px){.ox-feed-main{max-height:100vh!important;padding-right:0!important}}@media(max-width:480px){.ox-container{padding:12px 4px 0!important}}@media(max-width:480px){.ox-feed-main{max-height:100dvh!important}}@media(min-width:961px){.ox-mobile-fab{display:none!important}}@media(min-width:961px){.ox-new-post-btn{display:flex}}`;
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
  const [groups, setGroups] = useState<any>({ publicGroups: [], myMemberships: [], myRequests: [] });
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [showComposerModal, setShowComposerModal] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [online, setOnline] = useState(true);
  const [hideStatus, setHideStatus] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 961);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);


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

  // ─── Groups + Suggested Users ──────────────────────────────────────────────

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/v1/groups");
        if (res.ok) { const data = await res.json(); setGroups(data); }
      } catch {}
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await fetch("/api/v1/users/suggested");
        if (res.ok) { const data = await res.json(); setSuggestedUsers(Array.isArray(data) ? data : []); }
      } catch {}
    };
    fetchSuggested();
  }, []);

  // ─── Load hideOnlineStatus on mount ───────────────────────────────────────

  useEffect(() => {
    fetch("/api/v1/user/settings")
      .then(r => r.json())
      .then(data => { if (data?.hideOnlineStatus !== undefined) setHideStatus(data.hideOnlineStatus); })
      .catch(() => {});
  }, []);

  // ─── Presence Heartbeat ────────────────────────────────────────────────────

  useEffect(() => {
    const heartbeat = async () => {
      try {
        const res = await fetch("/api/v1/presence", { method: "POST" });
        if (res.ok) setOnline(true);
      } catch {}
    };
    heartbeat();
    const interval = setInterval(heartbeat, 120000);
    return () => clearInterval(interval);
  }, []);

  // ─── Post Actions ────────────────────────────────────────────────────────────

  const handlePost = async (content: string, circleId: string, extra?: { imageUrl?: string; attachments?: { url: string; name?: string; type?: string; size?: number }[]; pollOptions?: string[]; quizData?: any }): Promise<boolean> => {
    const optId = `opt-${Date.now()}`;
    const optPost: any = {
      id: optId, content, createdAt: new Date().toISOString(),
      author: { id: currentUserId, name: currentUserName, image: currentUserImage },
      _count: { likes: 0, comments: 0, shares: 0 },
      reactions: [], hashtags: [], likedByMe: false, isOwner: true,
      ...(extra?.quizData ? { quizData: { type: "qa", options: extra.quizData.options, correctAnswer: extra.quizData.correctAnswer } } : {}),
    };
    if (circleId === activeCircle?.id) setPosts(p => [optPost, ...p]);
    try {
      const imageUrl = extra?.imageUrl;
      const attachments = extra?.attachments || [];
      const body: any = { content: content || (extra?.pollOptions ? "Poll" : imageUrl ? "Shared media" : "") };
      if (imageUrl) body.imageUrl = imageUrl;
      if (attachments.length > 0) body.attachments = attachments;
      if (extra?.pollOptions && extra.pollOptions.length >= 2) {
        body.type = "POLL";
        body.pollOptions = extra.pollOptions;
      }
      if (extra?.quizData) {
        body.postType = "qa";
        body.poll = { question: content, options: extra.quizData.options };
        if (extra.quizData.correctAnswer) body.qaAnswer = extra.quizData.correctAnswer;
      }
      const res = await fetch(`/api/v1/forums/${circleId}/posts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const errText = await res.text(); let err; try { err = JSON.parse(errText); } catch { err = { error: errText }; } throw new Error(err.error || "Failed to create post"); }
      const newPost = await res.json();
      const { broadcastPost } = await import("@/lib/firebase/realtime-service");
      if (circleId) broadcastPost(circleId, newPost);
      setPosts(p => p.map(x => x.id === optId ? newPost : x));
      return true;
    } catch (err: any) { toast.error(err.message || "Failed to post"); setPosts(p => p.filter(x => x.id !== optId)); return false; }
  };

  const handleReact = async (post: any, type: string) => {
    try { await fetch(`/api/v1/posts/${post.id}/reactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) }); } catch (e) { console.warn("Reaction sync failed", e); }
  };

  const handleLike = async (post: any) => {
    try { await fetch(`/api/v1/posts/${post.id}/like`, { method: "POST" }); } catch (e) { console.warn("Like sync failed", e); }
  };

  const handleSave = async (post: any) => {
    try { await fetch(`/api/v1/posts/${post.id}/save`, { method: "POST" }); } catch (e) { console.warn("Save failed", e); }
  };

  const handleRoomCreated = (room: Room) => {
    setMyRooms(r => [{ ...room, isMember: true }, ...r]);
    toast.success("Room created!");
  };

  const handleGroupCreated = (group: any) => {
    setGroups((prev: any) => ({
      ...prev,
      myMemberships: [{ id: "new", role: "OWNER", group, _count: { members: 1 } }, ...prev.myMemberships],
    }));
    toast.success("Group created!");
  };

  // ─── Sort ────────────────────────────────────────────────────────────────────

  const sortedPosts = useMemo(() => {
    let filtered = posts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = posts.filter((p: any) =>
        p.content?.toLowerCase().includes(q) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
        p.author?.name?.toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a: any, b: any) => {
      if (sortBy === "top") {
        const scoreA = (a._count?.likes || 0) * 2 + (a._count?.comments || 0);
        const scoreB = (b._count?.likes || 0) * 2 + (b._count?.comments || 0);
        return scoreB - scoreA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, sortBy, searchQuery]);

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
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: T.bg, fontFamily: FONT, color: T.text1, overflow: "hidden" }}>
      {/* Prevent the underlying page from scrolling */}
      <style>{`html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden!important}`}</style>
      {/* Ambient moving light effect */}
      <style>{`
        @keyframes ambientDrift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(30px, -20px) scale(1.1); opacity: 0.4; }
          50% { transform: translate(-20px, 30px) scale(0.95); opacity: 0.35; }
          75% { transform: translate(40px, 10px) scale(1.05); opacity: 0.4; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        }
        @keyframes ambientDrift2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          25% { transform: translate(-40px, 30px) scale(1.15); opacity: 0.3; }
          50% { transform: translate(20px, -20px) scale(0.9); opacity: 0.25; }
          75% { transform: translate(-30px, -10px) scale(1.1); opacity: 0.3; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        }
        @keyframes ambientDrift3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          33% { transform: translate(20px, 40px) scale(1.2); opacity: 0.25; }
          66% { transform: translate(-40px, -20px) scale(0.85); opacity: 0.2; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
        }
        .ambient-orb-1 {
          position: fixed;
          top: -15%;
          right: -10%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          animation: ambientDrift 16s ease-in-out infinite;
          will-change: transform;
        }
        .ambient-orb-2 {
          position: fixed;
          bottom: -10%;
          left: -5%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          animation: ambientDrift2 20s ease-in-out infinite;
          will-change: transform;
        }
        .ambient-orb-3 {
          position: fixed;
          top: 40%;
          left: 30%;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.03) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          animation: ambientDrift3 24s ease-in-out infinite;
          will-change: transform;
        }
        .dark .ambient-orb-1 { background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%); }
        .dark .ambient-orb-2 { background: radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%); }
        .dark .ambient-orb-3 { background: radial-gradient(circle, rgba(255,255,255,0.015) 0%, transparent 70%); }
        @media (prefers-reduced-motion: reduce) {
          .ambient-orb-1, .ambient-orb-2, .ambient-orb-3 { animation: none !important; }
        }
      `}</style>
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />
      <div className="ambient-orb-3" />
      <style>{THEME_CSS}</style>
      <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />

      {isMobile ? (
        <MobileReelsView currentUserId={currentUserId} currentUserName={currentUserName}
          circles={circles} activeCircle={activeCircle} onPost={handlePost} onLike={handleLike} onSave={handleSave} />
      ) : (
      <div className="ox-container" style={{ width: "100%", height: "100%", margin: "0 auto", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "12px 16px 0" }}>
        <div className="ox-grid" style={{ display: "grid", gridTemplateColumns: "64px 1fr 320px", gap: 16, flex: 1, minHeight: 0 }}>

          {/* ── LEFT SIDEBAR — icons-only rail ── */}
          <aside className="ox-sidebar" style={{ position: "sticky", top: 10, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Fullscreen toggle */}
            <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen().catch(() => {}); }}
              style={{ width: 48, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.text3, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.accentL; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.text3; }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>

            {/* Dark Mode Toggle — below fullscreen */}
            <button onClick={async () => { const { theme, setTheme } = useThemeStore.getState(); setTheme(theme === "dark" ? "light" : "dark"); }}
              style={{ width: 48, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.text3, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.accentL; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.text3; }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>

            {/* Nav icons */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              {[
                { id: "home", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                { id: "explore", icon: IC.explore },
                { id: "rooms", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                { id: "notifications", icon: IC.notification },
                { id: "saved", icon: IC.bookmark(false) },
              ].map(nav => (
                <button key={nav.id} onClick={() => setActivePage(nav.id as any)}
                  style={{ width: 48, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, border: "none", cursor: "pointer", background: activePage === nav.id ? T.hover : "none", color: activePage === nav.id ? T.accentL : T.text3, transition: "all .15s" }}>
                  {nav.icon}
                </button>
              ))}
            </div>

            {/* Circles rail — moved to bottom */}
            <div style={{ flex: 1 }} />
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {sortedCircles.slice(0, 6).map(c => (
                <button key={c.id} onClick={() => setActiveCircle(c)}
                  style={{ width: 28, height: 28, borderRadius: 10, cursor: "pointer", padding: 0, border: activeCircle?.id === c.id ? "none" : `2px solid ${T.text3}`, background: activeCircle?.id === c.id ? T.accentL : T.hover, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                  <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{c.name.charAt(0).toUpperCase()}</span>
                </button>
              ))}
            </div>

          </aside>

          {/* ── CENTER FEED ── */}
          <main ref={feedRef} className="ox-feed-main" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0, overflowY: "auto", overflowX: "hidden", maxHeight: "100%", padding: "0 20px" }}>
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
                {/* Sticky wrapper: bar + dissolve tail */}
                <div style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  {/* Post trigger bar */}
                  <div onClick={() => setShowComposerModal(true)}
                    style={{ background: "linear-gradient(to bottom, hsl(var(--card)/0.8), hsl(var(--card)/0.55))", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px 16px", cursor: "pointer", color: T.text3, fontSize: 13, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transition: "border-color .15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.accent; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; }}>
                    <span style={{ width: 30, height: 30, borderRadius: "50%", background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{getInitials(currentUserName || "You")}</span>
                    <span>What's on your mind?</span>
                    <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.text4} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.text4} strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    </span>
                  </div>
                  {/* Dissolve tail — shadow-like fade matching page bg */}
                  <div style={{ height: 36, background: "linear-gradient(to bottom, hsl(var(--background)/0.8), transparent)", pointerEvents: "none" }} />
                </div>

                {/* Feed header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: T.accent }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {activeCircle?.name || "Feed"} Activity
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["RECENT", "TOP"].map(t => (
                      <button key={t} onClick={() => setSortBy(t.toLowerCase() as any)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: sortBy === t.toLowerCase() ? T.hover : "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT, color: sortBy === t.toLowerCase() ? T.text1 : T.text3, transition: "all .15s" }}>
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
                        {sortedPosts.map((post: any, idx: number) => (
                          <motion.div key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}>
                            <PostCard post={post} onOpen={(p) => setModalPost(p)} onReact={handleReact} onLike={handleLike} onSave={handleSave} currentUserId={currentUserId} currentUserRole={currentUserRole} currentUserUniversityId={currentUserUniversityId} />
                          </motion.div>
                        ))}
                      </div>
                    </InfiniteScrollContainer>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: "80px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.04), transparent 70%)", pointerEvents: "none" }} />
                      <div style={{ width: 56, height: 56, margin: "0 auto 20px", borderRadius: 20, background: "hsl(var(--primary) / 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </div>
                      <p style={{ fontSize: 17, fontWeight: 800, color: T.text1, marginBottom: 8, letterSpacing: "-0.01em" }}>No posts yet</p>
                      <p style={{ fontSize: 13, color: T.text3, lineHeight: 1.6 }}>Be the first to post in <strong style={{ color: T.text1 }}>{activeCircle?.name || "this circle"}</strong>!</p>
                    </motion.div>
                  )}
                </PullToRefresh>
              </>
            )}

            {activePage === "explore" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Trending */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(232,64,64,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e84040" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg></div>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>Discover Rooms</span>
                    </div>
                  </div>
                  {filteredRoomsC.length === 0 ? (
                    <p style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "40px 0" }}>No rooms available</p>
                  ) : filteredRoomsC.map((r: any) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.bg, borderRadius: 12, marginBottom: 12, cursor: "pointer", border: `1px solid ${T.border}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.border2}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, display: "flex", alignItems: "center", gap: 6 }}>{r.isPublic ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} {r.name}</div>
                        <div style={{ fontSize: 11, color: T.text3 }}>{r._count?.members || 0} members</div>
                      </div>
                      <button onClick={() => setShowJoinRoom(true)}
                        style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
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
                    style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                    {IC.plus} Create Room
                  </button>
                  <button onClick={() => setShowJoinRoom(true)}
                    style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                    {IC.arrow} Join Room
                  </button>
                </div>

                {myJoinedRooms.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase", marginBottom: 12 }}>My Rooms ({myJoinedRooms.length})</div>
                    {myJoinedRooms.map(room => (
                      <Link key={room.id} href={`/rooms/${room.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: T.bg, borderRadius: 12, cursor: "pointer", border: `1px solid ${T.border}`, marginBottom: 12 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.border2}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, display: "flex", alignItems: "center", gap: 6 }}>{room.isPublic ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} {room.name}</div>
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
                      <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: T.bg, borderRadius: 12, marginBottom: 12, cursor: "pointer", border: `1px solid ${T.border}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.border2}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, display: "flex", alignItems: "center", gap: 6 }}>{r.isPublic ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} {r.name}</div>
                          <div style={{ fontSize: 11, color: T.text3 }}>{r._count?.members || 0} members</div>
                        </div>
                        <button onClick={() => setShowJoinRoom(true)}
                          style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
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
                    <PostCard key={post.id} post={post} onOpen={(p) => setModalPost(p)} onReact={handleReact} onLike={handleLike} onSave={handleSave} currentUserId={currentUserId} currentUserRole={currentUserRole} currentUserUniversityId={currentUserUniversityId} />
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: "80px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.04), transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ width: 56, height: 56, margin: "0 auto 20px", borderRadius: 20, background: "hsl(var(--primary) / 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: T.text1, marginBottom: 8, letterSpacing: "-0.01em" }}>No saved posts</p>
                    <p style={{ fontSize: 13, color: T.text3, lineHeight: 1.6 }}>Save posts you want to read later</p>
                  </motion.div>
                )}
              </div>
            )}
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="ox-sidebar ox-right-sidebar" style={{ position: "sticky", top: 0, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(100vh - 100px)", overflowY: "auto", overflowX: "hidden", zIndex: 1, padding: "4px 0 4px 0", scrollbarWidth: "thin" }}>
            {/* Search Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, transition: "border-color .15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.accent}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search posts, tags, rooms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 12, color: T.text1, fontFamily: FONT }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", padding: 0, fontSize: 12 }}>✕</button>
              )}
            </div>

            {/* Trending */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-40%", right: "-20%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, hsl(0 100% 50% / 0.04), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, position: "relative" }}>
                <div style={{ width: 26, height: 26, borderRadius: 10, background: "linear-gradient(135deg, rgba(232,64,64,.15), rgba(232,64,64,.05))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e84040" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg></div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>Trending Now</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.text4 }} />
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.text4 }} />
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.text4 }} />
                </div>
              </div>
              {trendingTags.length === 0 ? (
                <p style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "24px 0" }}>No trends yet</p>
              ) : trendingTags.slice(0, 6).map((tag: any, i: number) => (
                <div key={tag.id} onClick={() => { setSearchQuery(`#${tag.name}`); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, cursor: "pointer", transition: "all .15s", border: "1px solid transparent", marginBottom: 4 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.text4, minWidth: 16 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>#{tag.name}</div>
                      <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>{tag.count || tag.posts || "0"} DISCUSSION{Number(tag.count || tag.posts || 0) !== 1 ? "S" : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {tag.hot && <span style={{ fontSize: 9, fontWeight: 700, color: "#e84040", letterSpacing: ".06em" }}>HOT</span>}
                    <span style={{ color: T.text4, fontSize: 16 }}>›</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Study Rooms */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: "-30%", left: "-20%", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, hsl(var(--primary) / 0.04), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 10, background: "hsl(var(--primary) / 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>My Study Rooms</span>
                </div>
                <button onClick={() => setShowCreateRoom(true)}
                  style={{ width: 28, height: 28, borderRadius: 10, background: "hsl(var(--primary) / 0.1)", border: "none", color: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, transition: "background .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--primary) / 0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "hsl(var(--primary) / 0.1)"; }}>+</button>
              </div>
              {myJoinedRooms.length > 0 ? (
                <>
                  <div style={{ fontSize: 10, color: T.text4, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{myJoinedRooms.length} ACTIVE ROOM{myJoinedRooms.length !== 1 ? "S" : ""}</div>
                  {myJoinedRooms.slice(0, 4).map(room => (
                    <Link key={room.id} href={`/rooms/${room.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.bg, borderRadius: 12, cursor: "pointer", border: `1px solid ${T.border}`, transition: "border-color .15s", marginBottom: 10 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.border2}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, display: "flex", alignItems: "center", gap: 6 }}>{room.isPublic ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} {room.name}</div>
                          <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>{room._count.members} MEMBER{room._count.members !== 1 ? "S" : ""}</div>
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.hover, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: 14 }}>›</div>
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <p style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "24px 0" }}>No rooms joined yet</p>
              )}
              <button onClick={() => setShowJoinRoom(true)}
                style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 12, border: `1px dashed ${T.border}`, background: "none", color: T.accent, fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + Join a Room
              </button>
            </div>

            {/* My Groups */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, hsl(var(--success) / 0.04), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 10, background: "hsl(var(--success) / 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>My Groups</span>
                </div>
                <button onClick={() => setShowCreateGroup(true)}
                  style={{ width: 28, height: 28, borderRadius: 10, background: "hsl(var(--success) / 0.1)", border: "none", color: "hsl(var(--success))", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, transition: "background .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--success) / 0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "hsl(var(--success) / 0.1)"; }}>+</button>
              </div>
              {groups.myMemberships.length > 0 ? (
                <>
                  <div style={{ fontSize: 10, color: T.text4, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{groups.myMemberships.length} GROUP{groups.myMemberships.length !== 1 ? "S" : ""}</div>
                  {groups.myMemberships.slice(0, 4).map((gm: any) => {
                    const isOwner = gm.role === "OWNER" || gm.group.ownerId === currentUserId;
                    return (
                      <div key={gm.id}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.bg, borderRadius: 12, cursor: "pointer", border: `1px solid ${T.border}`, transition: "border-color .15s", marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, display: "flex", alignItems: "center", gap: 6 }}>
                            {gm.group.isPublic
                              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                            {gm.group.name}
                          </div>
                          <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>{gm.group._count.members} MEMBER{gm.group._count.members !== 1 ? "S" : ""}</div>
                        </div>
                        {isOwner && (
                          <button onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/v1/groups/${gm.group.id}/requests`);
                              if (res.ok) { const data = await res.json(); setPendingRequests(data); setManageGroupId(gm.group.id); }
                              else toast.error("Failed to load requests");
                            } catch {}
                          }}
                            style={{ marginLeft: 8, padding: "4px 10px", borderRadius: 8, border: "none", background: T.hover, color: T.accent, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                            Manage
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <p style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "24px 0" }}>No groups yet. Create one!</p>
              )}
            </div>

            {/* Suggested Friends */}
            {suggestedUsers.length > 0 && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, maxHeight: 520, minHeight: 200, overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(245,166,35,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>Suggested Friends</span>
                </div>
                {suggestedUsers.slice(0, 5).map((u: any) => (
                  <div key={u.id}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, marginBottom: 4 }}>
                    <div style={{ position: "relative" }}>
                      <Avatar initials={getInitials(u.name)} color={getColor(u.name)} size={36} image={u.image} />
                      {u.isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: `2px solid ${T.surface}` }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text1, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Groups */}
            {groups.publicGroups.length > 0 && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, maxHeight: 520, minHeight: 200, overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(91,94,247,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: T.text3, textTransform: "uppercase" }}>Suggested Groups</span>
                </div>
                {groups.publicGroups.slice(0, 5).map((g: any) => (
                  <div key={g.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>{g._count.members} members</div>
                    </div>
                    <button onClick={async () => {
                      const res = await fetch(`/api/v1/groups/${g.id}/join`, { method: "POST" });
                      if (res.ok) {
                        toast.success(g.isPublic ? "Joined!" : "Request sent!");
                        const data = await fetch("/api/v1/groups").then(r => r.json());
                        setGroups(data);
                      } else {
                        const err = await res.json();
                        toast.error(err.error || "Failed");
                      }
                    }}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0 }}>
                      {g.isPublic ? "Join" : "Request"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
      )}

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
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, padding: "0 4px" }}>Circles</p>
                <div style={{ marginBottom: 20 }}>
                  {sortedCircles.map(c => (
                    <button key={c.id} onClick={() => { setActiveCircle(c); setMobileSidebarOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 12, border: "none", cursor: "pointer", background: activeCircle?.id === c.id ? T.hover : "none", color: activeCircle?.id === c.id ? T.accentL : T.text1, fontFamily: FONT, fontSize: 14, fontWeight: activeCircle?.id === c.id ? 700 : 500, textAlign: "left", transition: "all .15s" }}>
                      <span style={{ fontSize: 18 }}>{c.type === "GLOBAL" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}</span>
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
                          <span style={{ fontSize: 18 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></span>
                          {r.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                  <button onClick={() => { setShowCreateRoom(true); setMobileSidebarOpen(false); }}
                    style={{ padding: "10px", borderRadius: 12, border: "none", background: T.accent, color: "#fff", fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    + Create Room
                  </button>
                  <button onClick={() => { setShowJoinRoom(true); setMobileSidebarOpen(false); }}
                    style={{ padding: "10px", borderRadius: 12, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
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
      <InlineCreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} onSuccess={handleGroupCreated} />

      {/* Post Detail Modal */}
      {modalPost && (
        <Portal>
        <div onClick={() => { setModalPost(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, backdropFilter: "blur(20px)", animation: "fadeIn .2s ease" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(40px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 28, width: "100%", maxWidth: 520, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 100px rgba(0,0,0,0.5)", animation: "modalIn .25s ease", fontFamily: FONT }}>
            <PostModal post={modalPost} onClose={() => { setModalPost(null); }} currentUserId={currentUserId} />
          </div>
        </div>
        </Portal>
      )}

      <InlineCreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} onSuccess={handleGroupCreated} />
      <InlineGroupRequestsModal isOpen={manageGroupId !== null} groupId={manageGroupId} requests={pendingRequests} onClose={() => { setManageGroupId(null); setPendingRequests([]); }} onHandled={async () => {
        const res = await fetch("/api/v1/groups").then(r => r.json());
        setGroups(res);
      }} />

      <MiniFloatingNav />

      {/* Mobile FAB — new post */}
      <button onClick={() => setShowComposerModal(true)}
        className="ox-mobile-fab"
        style={{ position: "fixed", bottom: 80, right: 24, zIndex: 9998, width: 52, height: 52, borderRadius: 20, border: "none", background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 24px hsl(var(--primary) / 0.3)", transition: "transform .2s, box-shadow .2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 12px 32px hsl(var(--primary) / 0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 24px hsl(var(--primary) / 0.3)"; }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>

      {/* Post Composer Modal */}
      <PostComposerModal isOpen={showComposerModal} onClose={() => setShowComposerModal(false)}
        currentCircle={activeCircle} circles={circles} currentUserName={currentUserName} onPost={handlePost} />

    </div>
  );
}

// ─── Group Requests Modal ───────────────────────────────────────────────────

function InlineGroupRequestsModal({ isOpen, groupId, requests, onClose, onHandled }: {
  isOpen: boolean; groupId: string | null; requests: any[]; onClose: () => void; onHandled: () => void;
}) {
  if (!isOpen) return null;

  const handleAction = async (requestId: string, action: string) => {
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) { toast.success(action === "APPROVE" ? "Approved!" : "Rejected"); onHandled(); }
      else { const err = await res.json(); toast.error(err.error || "Failed"); }
    } catch { toast.error("Something went wrong"); }
  };

  return (
    <Portal>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "modalIn .2s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>Join Requests</span>
            <button onClick={onClose} style={{ background: "color-mix(in srgb, var(--ox-glass-bg), #fff 50%)", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex" }}>{IC.close}</button>
          </div>
          <div style={{ padding: "14px 18px", maxHeight: 300, overflowY: "auto" }}>
            {requests.length === 0 ? (
              <p style={{ textAlign: "center", padding: "30px 0", color: T.text3, fontSize: 13 }}>No pending requests</p>
            ) : requests.map((r: any) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 12, marginBottom: 4 }}>
                <Avatar initials={getInitials(r.user?.name || "?")} color={getColor(r.user?.name || "")} size={36} image={r.user?.image} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.text1 }}>{r.user?.name || "Unknown"}</span>
                <button onClick={() => handleAction(r.id, "APPROVE")}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                <button onClick={() => handleAction(r.id, "REJECT")}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: T.red, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Reject</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Create Group Modal ──────────────────────────────────────────────────────

function InlineCreateGroupModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: (g: any) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Group name is required");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed to create group");
      onSuccess(data);
      onClose();
      setName("");
      setDescription("");
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <Portal>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(16px)" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "var(--ox-glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--ox-glass-border)", borderRadius: 24, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: "modalIn .2s ease", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(16,163,127,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>Create Group</div>
                <div style={{ fontSize: 11, color: T.text3 }}>Start your own community group</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "color-mix(in srgb, var(--ox-glass-bg), #fff 50%)", border: "none", borderRadius: 10, padding: 7, cursor: "pointer", color: T.text3, display: "flex" }}>{IC.close}</button>
          </div>
          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "var(--ox-glass-input)", color: T.text1, fontSize: 14, fontWeight: 600, outline: "none", fontFamily: FONT }} />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "var(--ox-glass-input)", color: T.text2, fontSize: 13, outline: "none", fontFamily: FONT, resize: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--ox-glass-input)", borderRadius: 12, cursor: "pointer" }}
              onClick={() => setIsPublic(p => !p)}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isPublic ? T.accent : T.text3}`, display: "flex", alignItems: "center", justifyContent: "center", background: isPublic ? T.accent : "none" }}>
                {isPublic && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{isPublic ? "Public Group" : "Private Group"}</div>
                <div style={{ fontSize: 11, color: T.text3 }}>{isPublic ? "Anyone can join instantly" : "Members need to request to join"}</div>
              </div>
            </div>
            <button onClick={handleCreate} disabled={loading || !name.trim()}
              style={{ padding: "12px", borderRadius: 12, border: "none", background: loading ? T.border : T.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: FONT, transition: "all .15s" }}>
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
