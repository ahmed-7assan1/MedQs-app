"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "@/lib/utils";
import { CommentThread } from "./CommentThread";
import { PostGallery } from "./PostGallery";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";
import { TelegramAudioPlayer } from "./TelegramAudioPlayer";
import toast from "react-hot-toast";
import Image from "next/image";
import { 
  ThumbsUp, Heart, Handshake, Brain, Question, Lightbulb, Flag, Prohibit, CircleNotch
} from "@phosphor-icons/react";
import { useThemeStore } from "@/lib/store";
import { ReportModal } from "../social/ReportModal";
import { getYouTubeId, getYouTubeThumbnail, extractYouTubeIds, stripYouTubeLinks, fetchYouTubeTitle } from "@/lib/video-utils";
import YouTubePlayer from "../social/YouTubePlayer";

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

const REACTION_ICONS: Record<string, React.ReactNode> = {
  "❤️": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  "😂": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  "😮": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><ellipse cx="12" cy="16" rx="3.5" ry="2.5"/></svg>,
  "😢": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  "😡": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="9" x2="11" y2="10.5"/><line x1="16" y1="9" x2="13" y2="10.5"/><path d="M15 15a3 3 0 0 1-6 0"/></svg>,
  "👍": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  "🔥": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>,
  "💯": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
};
const EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🔥", "💯"];

function getTimeAgo(date: string) {
  try {
    const d = new Date(date);
    const str = formatDistanceToNow(d).toLowerCase();
    const parts = str.split(" ");
    if (parts[0] === "just") return "just now";
    return str;
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
      flexShrink: 0,
    }}>{initials}</div>
  );
}

function parseAttachments(raw: any): any[] {
  if (!raw) return [];
  if (typeof raw === "string") { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : p ? [p] : []; } catch { return []; } }
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw.url) return [raw];
  if (typeof raw === "object") return Object.values(raw).filter((v: any) => v && typeof v === "object");
  return [];
}

function sanitizeUrl(url: string) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("localhost:3000")) return url.split("localhost:3000")[1];
  return url;
}

function getMediaType(url?: string): "image" | "video" | "audio" | null {
  if (!url) return null;
  if (url.includes("type=video")) return "video";
  if (url.includes("type=audio")) return "audio";
  if (url.includes("type=image")) return "image";
  return null;
}

const REACTIONS_UI = [
  { key: "❤️", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, color: "#ef4444" },
  { key: "😂", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><circle cx="12" cy="12" r="10" fill="#f59e0b"/><circle cx="9" cy="10" r="1.5" fill="#fff"/><circle cx="15" cy="10" r="1.5" fill="#fff"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#fff" strokeWidth="1.5" fill="none"/></svg>, color: "#f59e0b" },
  { key: "😮", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#8b5cf6" stroke="none"><circle cx="12" cy="12" r="10" fill="#8b5cf6"/><circle cx="9" cy="10" r="1.5" fill="#fff"/><circle cx="15" cy="10" r="1.5" fill="#fff"/><ellipse cx="12" cy="16" rx="3" ry="2.5" fill="#fff"/></svg>, color: "#8b5cf6" },
  { key: "🔥", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#f97316" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" fill="#f97316"/></svg>, color: "#f97316" },
  { key: "💯", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981" stroke="none"><circle cx="12" cy="12" r="10" fill="#10b981"/><polyline points="7 13 10 16 17 8" stroke="#fff" strokeWidth="2" fill="none"/></svg>, color: "#10b981" },
];

function ReactionBar({ reactions, onReact, T }: { reactions: Record<string, number>; onReact: (emoji: string) => void; T: Record<string, string> }) {
  const total = Object.values(reactions).reduce((a, b) => a + b, 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {REACTIONS_UI.filter(r => (reactions[r.key] || 0) > 0).map(({ key, icon, color }) => {
        const count = reactions[key] || 0;
        return (
          <button key={key} onClick={() => onReact(key)}
            style={{ background: `${color}12`, border: `1.5px solid ${color}30`, borderRadius: 20, padding: "4px 10px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}>
            {icon} <span style={{ color, fontWeight: 700 }}>{count.toLocaleString()}</span>
          </button>
        );
      })}
      <span style={{ fontSize: 12, color: T.text3, marginRight: 4 }}>{total.toLocaleString()} reactions</span>
    </div>
  );
}

function ShareSheet({ postUrl, onClose, isDark, T }: { postUrl: string; onClose: () => void; isDark: boolean; T: Record<string, string> }) {
  const [copied, setCopied] = useState(false);
  const platforms = [
    { name: "Twitter / X", icon: ICONS.twitter, color: "#000" },
    { name: "WhatsApp", icon: ICONS.whatsapp, color: "#25D366" },
    { name: "Facebook", icon: ICONS.facebook, color: "#1877F2" },
  ];
  return (
    <div style={{ padding: "4px 0" }}>
      <p style={{ margin: "0 0 12px", fontSize: 14, color: T.text2, fontWeight: 500 }}>Share via</p>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {platforms.map(p => (
          <button key={p.name} onClick={() => window.open(p.name === "Twitter / X" ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}` : p.name === "WhatsApp" ? `https://wa.me/?text=${encodeURIComponent(postUrl)}` : `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, "_blank")}
            style={{ flex: 1, padding: "10px 8px", border: `1.5px solid ${T.border2}`, borderRadius: 12, background: T.surface, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
            onMouseLeave={e => (e.currentTarget.style as any).borderColor = T.border2}>
            <span style={{ color: p.color }}>{p.icon}</span>
            <span style={{ fontSize: 11, color: T.text }}>{p.name}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: T.surface, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>
          {postUrl}
        </div>
        <button onClick={() => { navigator.clipboard.writeText(postUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ padding: "8px 14px", background: copied ? "#10a37f" : T.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}>
          {copied ? "✓ Copied" : <>{ICONS.link} Copy</>}
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel, deleting, isDark, T }: { onConfirm: () => void; onCancel: () => void; deleting?: boolean; isDark: boolean; T: Record<string, string> }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: isDark ? "rgba(239,68,68,0.2)" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#e84040" }}>
        {ICONS.trash}
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 6px", color: T.text }}>Delete post?</p>
      <p style={{ fontSize: 14, color: T.text2, margin: "0 0 20px" }}>This action cannot be undone</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} disabled={deleting} style={{ flex: 1, padding: "10px", border: `1.5px solid ${T.border2}`, borderRadius: 10, background: T.bg, cursor: deleting ? "default" : "pointer", fontSize: 14, color: T.text, opacity: deleting ? 0.5 : 1 }}>Cancel</button>
        <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: "#e84040", color: "#fff", cursor: deleting ? "default" : "pointer", fontSize: 14, fontWeight: 600, opacity: deleting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {deleting ? <CircleNotch size={16} weight="bold" className="animate-spin" /> : null}
          {deleting ? "Deleting..." : "Delete"}
        </button>
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
  const { theme } = useThemeStore();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [saved, setSaved] = useState(false);
  const [sheet, setSheet] = useState<"share" | "delete" | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"post" | "comments">("post");
  const commentRef = useRef<HTMLDivElement>(null);
  const [commentCount, setCommentCount] = useState(post._count?.comments ?? post.comments ?? 0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showLikePicker, setShowLikePicker] = useState(false);
  const [showYtVideo, setShowYtVideo] = useState(false);
  const [activeYtIndex, setActiveYtIndex] = useState(0);
  const [ytTitles, setYtTitles] = useState<Record<string, string>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const [reactions, setReactions] = useState<{ type: string; userId: string }[]>(
    Array.isArray(post.reactions) ? post.reactions : []
  );

  const T = {
    bg: isDark ? "rgba(0,0,0,0.94)" : "rgba(255,255,255,0.85)",
    surface: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.035)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    border2: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
    text: isDark ? "#e8ebf4" : "#111",
    text2: isDark ? "rgba(255,255,255,0.55)" : "#6b7280",
    text3: isDark ? "rgba(255,255,255,0.35)" : "#9ca3af",
    overlay: "rgba(0,0,0,0.6)",
    primary: "#5b5ef7",
    tabActive: isDark ? "#8b8eff" : "#5b5ef7",
    tabInactive: isDark ? "rgba(255,255,255,0.4)" : "#6b7280",
    accentBg: isDark ? "rgba(91,94,247,0.2)" : "#eef0ff",
  };

  const REACTION_ITEMS = [
    { type: "LIKE", icon: <ThumbsUp size={18} weight="bold" />, label: "Like", color: "#3b82f6" },
    { type: "LOVE", icon: <Heart size={18} weight="fill" />, label: "Love", color: "#ef4444" },
    { type: "SUPPORT", icon: <Handshake size={18} weight="bold" />, label: "Support", color: "#10b981" },
    { type: "SMART", icon: <Brain size={18} weight="bold" />, label: "Smart", color: "#6366f1" },
    { type: "CONFUSED", icon: <Question size={18} weight="bold" />, label: "Confused", color: "#f59e0b" },
    { type: "IDEA", icon: <Lightbulb size={18} weight="fill" />, label: "Idea", color: "#eab308" },
  ] as const;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(post.reactions)) {
        setReactions(post.reactions);
      }
      setMyReaction(currentUserId ? post.reactions?.find((r: any) => r.userId === currentUserId)?.type || null : null);
      setCommentCount(post._count?.comments ?? post.comments ?? 0);
      setDeleted(false);
      setShowYtVideo(false);
      setActiveYtIndex(0);
      setActiveTab("post");
      setSheet(null);
      setNewComment("");
      setShowEmojis(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, post.id]);

  useEffect(() => {
    ytIds.forEach(async (id) => {
      if (!ytTitles[id]) {
        const title = await fetchYouTubeTitle(id);
        setYtTitles(prev => ({ ...prev, [id]: title }));
      }
    });
  }, []);

  const handleReact = async (type: string | null) => {
    if (!currentUserId) return toast.error("Sign in to react");
    setShowLikePicker(false);
    if (type === myReaction) type = null;
    const prevReactions = [...reactions];
    const prevMyReaction = myReaction;
    if (!type) {
      setReactions(prev => prev.filter(r => r.userId !== currentUserId));
      setMyReaction(null);
    } else {
      const idx = prevReactions.findIndex(r => r.userId === currentUserId);
      if (idx !== -1) {
        const updated = [...prevReactions];
        updated[idx] = { ...updated[idx], type };
        setReactions(updated);
      } else {
        setReactions([...prevReactions, { type, userId: currentUserId }]);
      }
      setMyReaction(type);
    }
    try {
      const res = await fetch(`/api/v1/posts/${post.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        setReactions(prevReactions);
        setMyReaction(prevMyReaction);
      }
    } catch {
      setReactions(prevReactions);
      setMyReaction(prevMyReaction);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    const text = newComment.trim();
    setNewComment("");
    try {
      const res = await fetch(`/api/v1/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        setCommentCount(c => c + 1);
        setRefreshKey(k => k + 1);
        setActiveTab("comments");
        setTimeout(() => commentRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 200);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to post comment");
        setNewComment(text);
      }
    } catch {
      toast.error("Network error");
      setNewComment(text);
    }
  };

  const handleBlockUser = async () => {
    try {
      const res = await fetch("/api/v1/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: post.authorId }),
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

  const canDelete = post.authorId === currentUserId ||
    currentUserRole === "SUPER_ADMIN" ||
    (currentUserRole === "ADMIN" && currentUserUniversityId === post.universityId);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post deleted");
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
      setSheet(null);
    }
  };

  const avatarInitials = post.author?.name?.slice(0, 2).toUpperCase() || "US";
  const avatarColor = post.author?.color || "#5b5ef7";
  const postOwner = post.author?.name || "User";
  const postHandle = `@${post.author?.name?.toLowerCase().replace(/\s+/g, "") || "user"}`;
  const postTime = getTimeAgo(post.createdAt);

  const postText = post.content || post.text || "";
  const hashtags = post.hashtags || (postText.match(/#[a-zA-Z0-9_]+/g) || []);
  const ytIds = extractYouTubeIds(post.content || post.text || "");
  const ytId = ytIds[activeYtIndex] || null;

  const attachments = useMemo(() => {
    function detectType(url: string): "image" | "video" | "audio" | "file" {
      if (url.includes("type=image")) return "image";
      if (url.includes("type=video")) return "video";
      if (url.includes("type=audio")) return "audio";
      if (/\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?|$)/i.test(url)) return "image";
      if (/\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url)) return "video";
      if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url)) return "audio";
      return "file";
    }
    const list = parseAttachments(post.attachments).map((a: any) => {
      const url = sanitizeUrl(a.url);
      return { url, type: detectType(url), fileId: a.fileId, name: a.name, size: a.size };
    });
    const img = sanitizeUrl(post.imageUrl);
    if (img && !list.some((a: any) => a.url === img)) {
      const t = detectType(img);
      if (t === "image") list.unshift({ url: img, type: "image" });
      else list.push({ url: img, type: t || "file" });
    }
    return list;
  }, [post.attachments, post.imageUrl]);

  const inlineTelegramVideo = useMemo(() => {
    if (attachments.length > 0) return null;
    if (!postText) return null;
    const match = postText.match(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)/i);
    return match ? match[0] : null;
  }, [postText, attachments]);

  const mediaUrls = useMemo(() => attachments.filter((a: any) => a.type === "image" || a.type === "video" || a.type === "audio"), [attachments]);
  const fileAttachments = useMemo(() => attachments.filter((a: any) => a.type === "file"), [attachments]);

  const reactionCounts = reactions.reduce((acc: Record<string, number>, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const postUrl = typeof window !== "undefined" ? `${window.location.origin}/social?post=${post.id}` : "";

  if (deleted) return (
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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 md:left-[calc(200px+16px+20px)] md:right-[calc(320px+16px+20px)] z-[401] overflow-hidden"
            style={{ height: "85vh", width: "auto" }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, background: T.bg, borderRadius: "20px 20px 0 0", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`, borderBottom: "none", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: isDark ? "rgba(239,68,68,0.2)" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#e84040" }}>{ICONS.trash}</div>
              <p style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Post deleted</p>
              <p style={{ color: T.text2 }}>Post has been deleted successfully</p>
              <button onClick={() => { setDeleted(false); setSheet(null); }}
                style={{ padding: "10px 28px", background: T.primary, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                Restore preview
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 md:left-[calc(200px+16px+20px)] md:right-[calc(320px+16px+20px)] z-[401] overflow-hidden"
            style={{ height: "85vh", width: "auto" }}
          >
            <div style={{ width: "100%", background: T.bg, borderRadius: "20px 20px 0 0", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`, borderBottom: "none", boxShadow: isDark ? "0 -8px 48px rgba(0,0,0,0.5)" : "0 -8px 48px rgba(0,0,0,0.08)", position: "relative", height: "100%", display: "flex", flexDirection: "column", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", overflow: "hidden" }}>

              {/* Animated ambient layer */}
              {isDark && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
                  background: "linear-gradient(135deg, #1a0533 0%, #0d0a2e 20%, #0a1628 50%, #0d0a2e 80%, #1a0533 100%)",
                  backgroundSize: "200% 200%", animation: "ambientShift 12s ease infinite",
                  mixBlendMode: "overlay" as any, opacity: 0.15
                }} />
              )}

              {/* Drag handle */}
              <div style={{ padding: "10px 0 2px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: T.text3 }} />
              </div>

              {/* Header */}
              <div style={{ padding: "4px 20px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: T.bg, zIndex: 10, flexShrink: 0 }}>
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
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: T.text }}>{postOwner}</p>
                    <p style={{ margin: 0, fontSize: 12, color: T.text2 }}>{postHandle} · {postTime}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, position: "relative" }}>
                  {canDelete && (
                    <button onClick={() => setSheet(s => s === "delete" ? null : "delete")}
                      style={{ background: sheet === "delete" ? (isDark ? "rgba(239,68,68,0.2)" : "#fee2e2") : "none", border: "none", borderRadius: 10, padding: "8px", cursor: "pointer", color: "#e84040", display: "flex", alignItems: "center", transition: "all 0.15s" }}>
                      {ICONS.trash}
                    </button>
                  )}
                  {post.authorId !== currentUserId && (
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setShowOptions(o => !o)}
                        style={{ background: showOptions ? T.surface : "none", border: "none", borderRadius: 10, padding: "8px", cursor: "pointer", color: T.text2, display: "flex", alignItems: "center", transition: "all 0.15s" }}>
                        {ICONS.more}
                      </button>
                      {showOptions && (
                        <>
                          <div style={{ position: "fixed", inset: 0, zIndex: 400 }} onClick={() => setShowOptions(false)} />
                          <div style={{
                            position: "absolute", left: 0, top: "100%", marginTop: 4, width: 180,
                            background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 12,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 401,
                            overflow: "hidden", padding: "4px",
                          }}>
                            <button onClick={() => { setShowOptions(false); setShowReportModal(true); }}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#d97706", borderRadius: 8, transition: "all 0.15s", fontWeight: 600 }}
                              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(217,119,6,0.15)" : "#fef3c7"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}>
                              <Flag size={16} weight="bold" /> Report post
                            </button>
                            <button onClick={() => { setShowOptions(false); setShowBlockConfirm(true); }}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", borderRadius: 8, transition: "all 0.15s", fontWeight: 600 }}
                              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(239,68,68,0.15)" : "#fef2f2"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}>
                              <Prohibit size={16} weight="bold" /> Block @{post.author?.name}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <button onClick={onClose} style={{ background: "none", border: "none", borderRadius: 10, padding: "8px", cursor: "pointer", color: T.text2, display: "flex" }}>{ICONS.close}</button>
                </div>
              </div>

              {/* Inline panels */}
              {sheet === "delete" && (
                <div style={{ margin: "0 20px 0", background: isDark ? "rgba(239,68,68,0.1)" : "#fff5f5", border: `1.5px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"}`, borderRadius: 14, padding: "16px", animation: "fadeIn 0.2s ease" }}>
                  <DeleteConfirm isDark={isDark} T={T} onConfirm={handleDelete} onCancel={() => setSheet(null)} deleting={deleting} />
                </div>
              )}
              {sheet === "share" && (
                <div style={{ margin: "0 20px 4px", background: isDark ? "rgba(91,94,247,0.1)" : "#f8f9ff", border: `1.5px solid ${isDark ? "rgba(91,94,247,0.3)" : "#e0e7ff"}`, borderRadius: 14, padding: "16px", animation: "fadeIn 0.2s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>Share Post</span>
                    <button onClick={() => setSheet(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.text2, display: "flex" }}>{ICONS.close}</button>
                  </div>
                  <ShareSheet isDark={isDark} T={T} postUrl={postUrl} onClose={() => setSheet(null)} />
                </div>
              )}

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 20px", flexShrink: 0 }}>
                {["post", "comments"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as "post" | "comments")}
                    style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? T.tabActive : T.tabInactive, borderBottom: activeTab === tab ? `2.5px solid ${T.primary}` : "2.5px solid transparent", transition: "all 0.2s" }}>
                    {tab === "post" ? "Post" : `Comments (${commentCount})`}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div ref={activeTab === "comments" ? commentRef : null} style={{ overflowY: "auto", padding: "16px 20px", flex: 1, minHeight: 0 }}>
                {activeTab === "post" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {postText && (
                      <div>
                        <p dir="auto" style={{ margin: 0, fontSize: 15, color: T.text, lineHeight: 1.8, whiteSpace: "pre-line" }}>{stripYouTubeLinks(postText)}</p>
                        {hashtags.length > 0 && (
                          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            {hashtags.map((h: string) => (
                              <span key={h} style={{ fontSize: 13, color: T.primary, background: isDark ? "rgba(91,94,247,0.2)" : "#eef0ff", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{h}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {ytIds.length > 0 && (
                      <>
                        {showYtVideo ? (
                          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginTop: 8, background: T.bg, aspectRatio: "16/9" }}>
                            <YouTubePlayer videoId={ytIds[activeYtIndex]} />
                          </div>
                        ) : (
                          <div onClick={() => setShowYtVideo(true)}
                            style={{ position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer", marginTop: 8, background: T.bg, aspectRatio: "16/9", maxHeight: 350 }}>
                            <img src={getYouTubeThumbnail(ytIds[activeYtIndex])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.3)"; }}>
                              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(255,0,0,0.4)" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              </div>
                            </div>
                            {ytIds.length > 1 && (
                              <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {ytIds.map((id, i) => (
                                  <button key={id} onClick={e => { e.stopPropagation(); setActiveYtIndex(i); }}
                                    style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s", background: i === activeYtIndex ? "rgba(255,0,0,0.9)" : "rgba(0,0,0,0.6)", color: "#fff", whiteSpace: "nowrap" }}>
                                    {i === activeYtIndex ? "▶ " : ""}{ytTitles[id] || `Video ${i + 1}`}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {!ytId && inlineTelegramVideo && (
                      <div style={{ borderRadius: 16, overflow: "hidden", background: "#000" }}>
                        <ProfessionalVideoPlayer src={inlineTelegramVideo} className="w-full max-h-[400px]" />
                      </div>
                    )}
                    {!ytId && !inlineTelegramVideo && mediaUrls.length > 0 && (
                      <PostGallery attachments={mediaUrls.map((a: any) => ({
                        url: a.url,
                        type: getMediaType(a.url) || a.type || "image",
                        fileId: a.fileId,
                      }))} />
                    )}
                    {!ytId && !inlineTelegramVideo && mediaUrls.length === 0 && post.imageUrl && (() => {
                      const fallbackUrl = sanitizeUrl(post.imageUrl);
                      const isActualImage = fallbackUrl.includes("type=image") || /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?|$)/i.test(fallbackUrl);
                      if (!isActualImage) return null;
                      return (
                        <div style={{ borderRadius: 16, overflow: "hidden", maxHeight: 480, position: "relative" }}>
                          <img src={fallbackUrl} alt="" style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 480 }} />
                        </div>
                      );
                    })()}

                    {post.mediaCaption && <p style={{ margin: 0, fontSize: 12, color: T.text2, textAlign: "center" }}>{post.mediaCaption}</p>}

                    {/* Reactions bar */}
                    <ReactionBar reactions={reactionCounts} onReact={(emoji) => handleReact(emoji)} T={T} />

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 16, paddingTop: 4, borderTop: `1px solid ${T.border}`, fontSize: 13, color: T.text2 }}>
                      <span>{reactions.length} Likes</span>
                      <span>{commentCount} Comments</span>
                      <span>0 Shares</span>
                    </div>

                    {/* Action bar — icons only */}
                    <div style={{ display: "flex", gap: 2, paddingTop: 2 }}>
                      <div style={{ position: "relative" }}
                        onMouseEnter={() => { if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) setShowLikePicker(true); }}
                        onMouseLeave={() => { if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) setShowLikePicker(false); }}
                      >
                        <button onClick={(e) => {
                          const coarse = typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
                          if (coarse) { e.preventDefault(); setShowLikePicker(s => !s); return; }
                          handleReact(myReaction ? null : "LIKE");
                        }}
                          style={{ width: 42, height: 38, border: "none", borderRadius: 10, cursor: "pointer", background: myReaction ? T.accentBg : "transparent", color: myReaction ? T.primary : T.text3, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                          {myReaction ? (REACTION_ITEMS.find(r => r.type === myReaction)?.icon || ICONS.heart(false)) : ICONS.heart(false)}
                        </button>
                        <AnimatePresence>
                          {showLikePicker && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 8, display: "flex", alignItems: "center", gap: 4, background: T.bg, border: `1px solid ${T.border2}`, borderRadius: 20, padding: "6px 10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20 }}
                            >
                              {REACTION_ITEMS.map(item => (
                                <button key={item.type} onClick={() => handleReact(item.type)}
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: "50%", transition: "all 0.15s", color: item.color, display: "flex", alignItems: "center", justifyContent: "center" }}
                                  onMouseEnter={e => (e.target as HTMLElement).style.transform = "scale(1.25)"}
                                  onMouseLeave={e => (e.target as HTMLElement).style.transform = "scale(1)"}
                                >
                                  {item.icon}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button onClick={() => setActiveTab("comments")}
                        style={{ width: 42, height: 38, border: "none", borderRadius: 10, cursor: "pointer", background: "transparent", color: T.text3, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                        {ICONS.comment}
                      </button>
                      <button onClick={() => setSheet(s => s === "share" ? null : "share")}
                        style={{ width: 42, height: 38, border: "none", borderRadius: 10, cursor: "pointer", background: "transparent", color: sheet === "share" ? T.primary : T.text3, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                        {ICONS.share}
                      </button>
                      <button onClick={() => setSaved(s => !s)}
                        style={{ width: 42, height: 38, border: "none", borderRadius: 10, cursor: "pointer", background: "transparent", color: saved ? T.primary : T.text3, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                        {ICONS.bookmark(saved)}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "comments" && (
                  <CommentThread
                    key={refreshKey}
                    postId={post.id}
                    currentUserId={currentUserId}
                    initialCount={commentCount}
                  />
                )}
              </div>

              {/* Comment Input */}
              <div style={{ padding: "12px 20px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.bg }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <Avatar initials={avatarInitials} color={avatarColor} size={36} />
                  <div style={{ flex: 1, position: "relative" }}>
                    <textarea dir="auto"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                      placeholder="Add a comment..."
                      rows={1}
                      style={{ width: "100%", borderRadius: 14, border: `1.5px solid ${T.border2}`, padding: "10px 14px", fontSize: 14, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "border 0.2s", background: T.surface, color: T.text }}
                      onFocus={e => e.target.style.borderColor = T.primary}
                      onBlur={e => e.target.style.borderColor = T.border2}
                    />
                  </div>
                  <button onClick={handleSubmitComment}
                    style={{ width: 40, height: 40, borderRadius: "50%", background: newComment.trim() ? T.primary : T.border2, border: "none", cursor: newComment.trim() ? "pointer" : "default", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
                    {ICONS.send}
                  </button>
                </div>
              </div>

            </div>

            <ReportModal open={showReportModal} onClose={() => setShowReportModal(false)} targetType="POST" targetId={post.id} />

            {showBlockConfirm && (
              <div style={{
                position: "fixed", inset: 0, zIndex: 500,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowBlockConfirm(false)} />
                <div style={{
                  background: T.bg, borderRadius: 16, padding: 24, width: 320,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.2)", position: "relative", zIndex: 1,
                  textAlign: "center",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#ef4444" }}>
                    <Prohibit size={24} weight="bold" />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 4px", color: T.text }}>Block user?</p>
                  <p style={{ fontSize: 13, color: T.text2, margin: "0 0 20px" }}>Their posts will be hidden from you.</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowBlockConfirm(false)}
                      style={{ flex: 1, padding: "10px", border: `1.5px solid ${T.border2}`, borderRadius: 10, background: T.bg, cursor: "pointer", fontSize: 13, color: T.text }}>
                      Cancel
                    </button>
                    <button onClick={handleBlockUser}
                      style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      Block
                    </button>
                  </div>
                </div>
              </div>
            )}

            <style>{`
              @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
              * { box-sizing: border-box; }
              ::-webkit-scrollbar { width: 4px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(255,255,255,0.15)" : "#c4c7cc"}; border-radius: 4px; }
              @keyframes ambientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function QuestionCarousel({ questions }: { questions: any[] }) {
  const [qIdx, setQIdx] = useState(0);
  if (!questions || questions.length === 0) return null;
  const q = questions[qIdx];
  return (
    <div style={{ background: "#f8f9ff", border: "1.5px solid #e0e7ff", borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" style={{ verticalAlign: "middle", marginLeft: 6 }}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Question {qIdx + 1}/{questions.length}
        </span>
        {questions.length > 1 && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setQIdx(i => Math.max(0, i - 1))} disabled={qIdx === 0}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: qIdx === 0 ? "#f3f4f6" : "#fff", cursor: qIdx === 0 ? "default" : "pointer", color: qIdx === 0 ? "#d1d5db" : "#374151", fontSize: 13 }}>
              ←
            </button>
            <button onClick={() => setQIdx(i => Math.min(questions.length - 1, i + 1))} disabled={qIdx === questions.length - 1}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: qIdx === questions.length - 1 ? "#f3f4f6" : "#fff", cursor: qIdx === questions.length - 1 ? "default" : "pointer", color: qIdx === questions.length - 1 ? "#d1d5db" : "#374151", fontSize: 13 }}>
              →
            </button>
          </div>
        )}
      </div>
      {q && (
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#111" }}>{q.body || q.question}</p>
          {q.choices && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.choices.map((c: string, i: number) => {
                const isAnswer = q.answer === c || q.answer === String(i);
                return (
                  <div key={i} style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${isAnswer ? "#10b981" : "#e5e7eb"}`, background: isAnswer ? "#ecfdf5" : "#fafafa", fontSize: 13, color: "#374151" }}>
                    {isAnswer ? "✓ " : ""}{c}
                  </div>
                );
              })}
            </div>
          )}
          {q.explanation && (
            <p style={{ marginTop: 8, fontSize: 12, color: "#6b7280", background: "#f3f4f6", padding: "8px 12px", borderRadius: 8 }}>{q.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

function FlashcardViewer({ cards }: { cards: any[] }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!cards || cards.length === 0) return null;
  const card = cards[idx];
  return (
    <div>
      <div onClick={() => setFlipped(!flipped)} style={{ minHeight: 160, borderRadius: 16, border: "1.5px solid #e5e7eb", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 20, fontSize: 14, color: "#374151", textAlign: "center", transition: "all 0.3s", userSelect: "none" }}>
        {flipped ? (card.back || card.answer || "") : (card.front || card.question || "")}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{idx + 1} / {cards.length}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={idx === 0}
            style={{ padding: "4px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: idx === 0 ? "default" : "pointer", fontSize: 12, color: idx === 0 ? "#d1d5db" : "#374151" }}>
            ← Previous
          </button>
          <button onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} disabled={idx === cards.length - 1}
            style={{ padding: "4px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: idx === cards.length - 1 ? "default" : "pointer", fontSize: 12, color: idx === cards.length - 1 ? "#d1d5db" : "#374151" }}>
            Next →
          </button>
        </div>
      </div>
      <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>Tap to flip</p>
    </div>
  );
}
