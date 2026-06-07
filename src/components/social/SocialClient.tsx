"use client";

import { useState, useEffect, useMemo, memo, useRef, useCallback } from "react";
import Link from "next/link";
import { PostCard } from "./PostCard";
import { PostComposer, FloatingPostIsland } from "./PostComposer";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinRoomModal } from "./JoinRoomModal";
import { PostDetailModal } from "@/components/forum/PostDetailModal";
import { ForumPostListSkeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCommunityShareStore } from "@/lib/store";
import { InfiniteScrollContainer } from "@/components/ui/InfiniteScrollContainer";

interface SocialCircle { id: string; name: string; type: string; status: string; _count: { posts: number } }
interface Room {
  id: string; name: string; isPublic: boolean; inviteCode: string;
  memberLimit: number; image?: string; _count: { members: number; posts: number };
  members?: any[]; isMember?: boolean; ownerId?: string;
}

const IC = {
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  explore: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  rooms: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bookmark: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  heart: (f: boolean) => f
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="#e84040" stroke="#e84040" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  globe: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  image: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  mic: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  fire: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

function CircleItem({ circle, active, onClick }: { circle: SocialCircle; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 14, border: "none", cursor: "pointer",
        background: active ? "var(--nav-active)" : "transparent",
        color: active ? "var(--primary)" : "var(--text-sec)",
        fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: active ? 700 : 500,
        transition: "all 0.15s", textAlign: "left",
      }}
      onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.background = "transparent"; }}
    >
      <span style={{ color: active ? "var(--primary)" : "var(--text-sec)", display: "flex" }}>
        {circle.type === "GLOBAL" ? IC.globe : IC.rooms}
      </span>
      <span style={{ flex: 1, textAlign: "left" }}>{circle.name}</span>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{circle._count.posts}</span>
    </button>
  );
}

function RoomItemSmall({ room, currentUserId }: { room: Room; currentUserId: string }) {
  const isOwner = room.ownerId === currentUserId;
  return (
    <Link href={`/rooms/${room.id}`} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      borderRadius: 14, textDecoration: "none", transition: "background 0.15s",
    }}
      onMouseEnter={e => (e.target as HTMLElement).style.background = "var(--nav-active)"}
      onMouseLeave={e => (e.target as HTMLElement).style.background = "transparent"}
    >
      <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(91,94,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#5b5ef7", fontSize: 16 }}>
        {room.isPublic ? IC.globe : IC.lock}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.name}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{room._count.members} members</div>
      </div>
    </Link>
  );
}

function TimeWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--card-border)",
      borderRadius: 20, padding: "16px 18px", boxShadow: "var(--shadow)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>{timeStr}</span>
            <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(52,211,153,0.15)", color: "#34d399", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Active</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{dateStr}</span>
        </div>
        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} style={{ fontSize: 28 }}>☀️</motion.div>
      </div>
    </div>
  );
}

function PullToRefresh({ onRefresh, children }: { onRefresh: () => void; children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

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
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
    setPullDistance(0);
  }, [onRefresh, refreshing]);

  if (typeof window !== "undefined" && !("ontouchstart" in window)) return <>{children}</>;

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
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#5b5ef7" }} />
            ) : (
              <motion.div animate={{ rotate: pullDistance > threshold * 0.6 ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-sec)" }}><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>
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
          const relativeY = touch.clientY - rect.top;
          if (relativeY < 80) target.setAttribute("data-pull-start", String(touch.clientY));
        }}
        onTouchMove={(e) => {
          if (!isAtTop || refreshing) return;
          const startY = e.currentTarget.getAttribute("data-pull-start");
          if (!startY) return;
          const diff = e.touches[0].clientY - Number(startY);
          if (diff > 0) { setPullDistance(diff); if (diff > 15) e.preventDefault(); }
        }}
        onTouchEnd={async (e) => {
          e.currentTarget.removeAttribute("data-pull-start");
          if (pullDistance > threshold) { e.preventDefault(); await doRefresh(); }
          setPullDistance(0);
        }}
        style={{ transform: `translateY(${Math.min(pullDistance, threshold)}px)`, transition: refreshing ? "transform 0.3s ease" : "transform 0.1s ease" }}
      >
        {children}
      </div>
    </div>
  );
}

export function SocialClient({
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
  const setSharedQuestion = useCommunityShareStore((s) => s.setSharedQuestion);
  const [dark, setDark] = useState(true);
  const [activeCircle, setActiveCircle] = useState<SocialCircle | null>(circles[0] ?? null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [myRooms, setMyRooms] = useState<Room[]>(initialRooms);
  const [activePost, setActivePost] = useState<any>(null);

  const t = dark ? {
    bg: "#0f0f17", card: "#16161f", cardBorder: "#2a2a3a", sidebar: "#13131c",
    primary: "#7577f9", primaryLight: "#1e1e2e", text: "#f1f0ff",
    textSec: "#9ca3af", textMuted: "#6b7280", inputBg: "#1e1e2e",
    inputBorder: "#2a2a3a", divider: "#1e1e2e", tagBg: "#1e1e2e",
    tagText: "#a5a8ff", roomOnline: "#34d399", navActive: "#1e1e2e",
    shadow: "0 2px 12px rgba(0,0,0,0.3)", avatarBorder: "#16161f",
  } : {
    bg: "#f4f5fb", card: "#ffffff", cardBorder: "#ececf5", sidebar: "#ffffff",
    primary: "#5b5ef7", primaryLight: "#eef0ff", text: "#111827",
    textSec: "#6b7280", textMuted: "#9ca3af", inputBg: "#f8f9fa",
    inputBorder: "#e5e7eb", divider: "#f1f3f5", tagBg: "#eef0ff",
    tagText: "#5b5ef7", roomOnline: "#10a37f", navActive: "#eef0ff",
    shadow: "0 2px 12px rgba(91,94,247,0.07)", avatarBorder: "#fff",
  };

  const myJoinedRooms = myRooms.filter((r) => r.isMember || r.ownerId === currentUserId);
  const publicRooms = myRooms.filter((r) => r.isPublic && !r.isMember && r.ownerId !== currentUserId);

  const navItems = [
    { id: "home", icon: IC.home, label: "Home" },
    { id: "explore", icon: IC.explore, label: "Explore" },
    { id: "rooms", icon: IC.rooms, label: "Rooms" },
    { id: "saved", icon: IC.bookmark, label: "Saved" },
    { id: "notifs", icon: IC.bell, label: "Notifications" },
  ];

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

  const loadMore = () => { if (activeCircle) loadPosts(activeCircle.id, true); };
  useEffect(() => { if (activeCircle) loadPosts(activeCircle.id); }, [activeCircle?.id]);

  useEffect(() => {
    if (!activeCircle) return;
    const { subscribeToForumsRealtime } = require("@/lib/firebase/realtime-service");
    const unsubscribe = subscribeToForumsRealtime(activeCircle.id, (realtimePosts: any[]) => {
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
    return () => unsubscribe();
  }, [activeCircle?.id]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch('/api/v1/social/trending');
        if (res.ok) { const data = await res.json(); setTrendingTags(Array.isArray(data) ? data : []); }
      } catch (e) {}
    };
    fetchTrends();
  }, []);

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

  const handlePost = async (content: string, imageUrl: string, options?: any): Promise<boolean> => {
    const destId = options.forumId || options.roomId;
    if (!destId) return false;
    try {
      const endpoint = options.roomId ? `/api/v1/rooms/${options.roomId}/posts` : `/api/v1/forums/${options.forumId}/posts`;
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl, ...options }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || "Failed to create post"); }
      const newPost = await res.json();
      const { broadcastPost } = require("@/lib/firebase/realtime-service");
      if (options.forumId) broadcastPost(options.forumId, newPost);
      if (!options.roomId && options.forumId === activeCircle?.id) setPosts((p: any) => [newPost, ...p]);
      else toast.success(options.roomId ? "Posted to your Room feed!" : "Posted successfully!");
      return true;
    } catch (err: any) { toast.error(err.message || "Failed to post"); return false; }
  };

  const handleRoomCreated = (room: Room) => {
    setMyRooms((r: any) => [{ ...room, isMember: true }, ...r]);
    toast.success("Room created successfully!");
  };

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

  const themeCSS = `
    :root {
      --bg: ${t.bg}; --card: ${t.card}; --card-border: ${t.cardBorder};
      --sidebar: ${t.sidebar}; --primary: ${t.primary}; --primary-light: ${t.primaryLight};
      --text: ${t.text}; --text-sec: ${t.textSec}; --text-muted: ${t.textMuted};
      --input-bg: ${t.inputBg}; --input-border: ${t.inputBorder}; --divider: ${t.divider};
      --tag-bg: ${t.tagBg}; --tag-text: ${t.tagText}; --room-online: ${t.roomOnline};
      --nav-active: ${t.navActive}; --shadow: ${t.shadow}; --avatar-border: ${t.avatarBorder};
    }
  `;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Cairo', sans-serif", color: "var(--text)", transition: "background 0.3s, color 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{themeCSS}</style>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 4px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) { .right-sidebar, .left-sidebar { display: none !important; } }
        input:focus, textarea:focus { outline: none; }
      `}</style>

      {/* Top Nav Bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--sidebar)", borderBottom: "1px solid var(--card-border)",
        padding: "0 20px", height: 60,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <button onClick={() => setMobileSidebarOpen(true)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--text)", padding: 6, borderRadius: 10 }}
          className="mobile-menu-btn"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <style>{`@media (max-width: 640px) { .mobile-menu-btn { display: flex !important; } }`}</style>

        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, color: "var(--primary)" }}>MedQS</span>
        </div>

        <div style={{ flex: 1, maxWidth: 360, position: "relative" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>{IC.explore}</div>
          <input placeholder="Search posts, rooms, people..." style={{
            width: "100%", height: 38, borderRadius: 20,
            border: "1px solid var(--input-border)", background: "var(--input-bg)",
            paddingLeft: 40, paddingRight: 16, fontSize: 13,
            fontFamily: "'Cairo', sans-serif", color: "var(--text)",
          }} />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setDark(!dark)} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--input-bg)", border: "1px solid var(--input-border)",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--text)", transition: "all 0.2s",
          }}>{dark ? IC.sun : IC.moon}</button>
          <button style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
            borderRadius: 20, border: "none", background: "var(--primary)",
            color: "#fff", fontFamily: "'Cairo', sans-serif",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>{IC.plus} New Post</button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#5b5ef7", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, border: "2px solid var(--avatar-border)" }}>
            {currentUserName?.slice(0, 2).toUpperCase() || "US"}
          </div>
        </div>
      </header>

      {/* Layout */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 16px", display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* Left Sidebar */}
        <aside className="left-sidebar" style={{ width: 220, flexShrink: 0, position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 20, padding: "8px 8px", boxShadow: "var(--shadow)" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => {
                if (item.id === "home") { const f = circles[0]; if (f) setActiveCircle(f); }
                else if (item.id === "rooms") setShowCreateRoom(true);
              }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 14, border: "none", cursor: "pointer",
                background: item.id === "home" ? "var(--nav-active)" : "transparent",
                color: item.id === "home" ? "var(--primary)" : "var(--text-sec)",
                fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: item.id === "home" ? 700 : 500,
                transition: "all 0.15s", textAlign: "left",
              }}>
                <span style={{ display: "flex", color: item.id === "home" ? "var(--primary)" : "var(--text-sec)" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Circles */}
          <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 20, padding: "14px 14px", boxShadow: "var(--shadow)" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Circles</p>
            {circles.map(c => (
              <button key={c.id} onClick={() => setActiveCircle(c)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "7px 4px", borderRadius: 10, cursor: "pointer",
                background: activeCircle?.id === c.id ? "var(--nav-active)" : "transparent",
                border: "none", fontFamily: "'Cairo', sans-serif", textAlign: "left",
                transition: "background 0.15s",
              }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: activeCircle?.id === c.id ? "var(--primary)" : "var(--text-muted)", flexShrink: 0 }}></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: activeCircle?.id === c.id ? 700 : 600, color: activeCircle?.id === c.id ? "var(--primary)" : "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c._count.posts}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => setShowJoinRoom(true)} style={{ padding: "8px", borderRadius: 12, border: "1px dashed var(--card-border)", background: "none", color: "var(--primary)", fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + Join Room
            </button>
            <button onClick={() => setShowCreateRoom(true)} style={{ padding: "8px", borderRadius: 12, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + Create Room
            </button>
          </div>

          {/* My Rooms Quick Links */}
          {myJoinedRooms.length > 0 && (
            <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 20, padding: "14px 14px", boxShadow: "var(--shadow)" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>My Rooms</p>
              {myJoinedRooms.slice(0, 4).map(room => (
                <RoomItemSmall key={room.id} room={room} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </aside>

        {/* Feed */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Mobile Nav */}
          <div style={{ display: "none" }}
            className="mobile-feed-header"
          >
            <style>{`@media (max-width: 640px) { .mobile-feed-header { display: flex !important; align-items: center; gap: 12; } }`}</style>
            <button onClick={() => setMobileSidebarOpen(true)} style={{ background: "var(--nav-active)", border: "none", borderRadius: 12, padding: "8px 10px", cursor: "pointer", color: "var(--primary)", display: "flex", alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", flex: 1 }}>{activeCircle?.name || "Feed"}</h2>
            <button onClick={() => setDark(!dark)} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--input-bg)", border: "1px solid var(--input-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}>
              {dark ? IC.sun : IC.moon}
            </button>
          </div>

          {/* Rooms tab strip */}
          <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 20, padding: "10px 14px", display: "flex", gap: 8, overflowX: "auto", boxShadow: "var(--shadow)" }}>
            <button style={{ padding: "6px 16px", borderRadius: 20, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>All</button>
            {myJoinedRooms.slice(0, 6).map(room => (
              <button key={room.id} style={{ padding: "6px 16px", borderRadius: 20, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--text-sec)", fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--tag-bg)"; (e.target as HTMLElement).style.color = "var(--tag-text)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = "var(--input-bg)"; (e.target as HTMLElement).style.color = "var(--text-sec)"; }}
              >{room.name}</button>
            ))}
          </div>

          {/* Sort Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "var(--primary)", display: "flex" }}>{IC.trending}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{activeCircle?.name || "Feed"}</span>
            </div>
            <div style={{ display: "flex", gap: 4, background: "var(--input-bg)", borderRadius: 12, padding: 3 }}>
              <button onClick={() => setSortBy("recent")} style={{
                padding: "4px 12px", borderRadius: 10, border: "none",
                background: sortBy === "recent" ? "var(--card)" : "transparent",
                color: sortBy === "recent" ? "var(--primary)" : "var(--text-muted)",
                fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>Recent</button>
              <button onClick={() => setSortBy("top")} style={{
                padding: "4px 12px", borderRadius: 10, border: "none",
                background: sortBy === "top" ? "var(--card)" : "transparent",
                color: sortBy === "top" ? "var(--primary)" : "var(--text-muted)",
                fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>Top</button>
            </div>
          </div>

          {/* Post Composer */}
          <PostComposer
            user={{ name: currentUserName ?? "Student", id: currentUserId, image: currentUserImage }}
            onPost={handlePost}
            circles={circles}
            rooms={myJoinedRooms}
          />

          {/* Feed */}
          <PullToRefresh onRefresh={() => activeCircle && loadPosts(activeCircle.id)}>
            {loading ? (
              <ForumPostListSkeleton count={4} />
            ) : posts.length > 0 ? (
              <InfiniteScrollContainer
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoadingMore}
                className="flex flex-col gap-4"
                endComponent={
                  <div style={{ padding: "40px 20px", textAlign: "center", opacity: 0.4 }}>
                    {IC.rooms}
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>You've reached the end</p>
                  </div>
                }
              >
                <div className="flex flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {sortedPosts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      currentUserUniversityId={currentUserUniversityId}
                    />
                  ))}
                </div>
              </InfiniteScrollContainer>
            ) : (
              <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 20, padding: "60px 20px", textAlign: "center", boxShadow: "var(--shadow)" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>No posts yet</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Be the first to post in {activeCircle?.name || "this circle"}!</p>
              </div>
            )}
          </PullToRefresh>

          <FloatingPostIsland
            user={{ name: currentUserName ?? "Student", id: currentUserId, image: currentUserImage }}
            onPost={handlePost}
            circles={circles}
            rooms={myJoinedRooms}
          />
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar" style={{ width: 280, flexShrink: 0, position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <TimeWidget />

          {/* Trending */}
          <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 20, padding: "16px 16px", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <span style={{ color: "var(--primary)", display: "flex" }}>{IC.trending}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Trending</span>
            </div>
            {trendingTags.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No trends yet</p>
            ) : trendingTags.map((item: any, i: number) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = "var(--nav-active)"}
                onMouseLeave={e => (e.target as HTMLElement).style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", width: 20, textAlign: "center", fontWeight: 700 }}>{i + 1}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>#{item.name}</span>
                      {item.hot && <span style={{ color: "#e84040", display: "flex" }}>{IC.fire}</span>}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.count || item.posts} discussions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Study Rooms */}
          <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 20, padding: "16px 16px", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--primary)", display: "flex" }}>{IC.rooms}</span>
                <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Study Rooms</span>
              </div>
              <button onClick={() => setShowCreateRoom(true)} style={{ fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>All</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myJoinedRooms.length > 0 ? myJoinedRooms.slice(0, 3).map(room => (
                <Link key={room.id} href={`/rooms/${room.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, transition: "all 0.15s", background: "var(--nav-active)" }}
                    onMouseEnter={e => (e.target as HTMLElement).style.background = "var(--tag-bg)"}
                    onMouseLeave={e => (e.target as HTMLElement).style.background = "var(--nav-active)"}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(91,94,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#5b5ef7" }}>
                      {room.isPublic ? IC.globe : IC.lock}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{room.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{room._count.members} members</div>
                    </div>
                  </div>
                </Link>
              )) : (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No rooms joined yet</p>
              )}
            </div>
            <button onClick={() => setShowJoinRoom(true)} style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 12, border: "1px dashed var(--card-border)", background: "none", color: "var(--primary)", fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + Join a Room
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "85%", maxWidth: 320, zIndex: 210, background: "var(--card)", borderRight: "1px solid var(--card-border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: "var(--primary)" }}>MedQS</span>
                <button onClick={() => setMobileSidebarOpen(false)} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--nav-active)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-sec)" }}>
                  {IC.close}
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, padding: "0 4px" }}>Circles</p>
                <div style={{ marginBottom: 20 }}>
                  {circles.map(c => (
                    <button key={c.id} onClick={() => { setActiveCircle(c); setMobileSidebarOpen(false); }} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 8px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: activeCircle?.id === c.id ? "var(--nav-active)" : "transparent",
                      color: activeCircle?.id === c.id ? "var(--primary)" : "var(--text)",
                      fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: activeCircle?.id === c.id ? 700 : 500,
                      textAlign: "left", transition: "all 0.15s",
                    }}>
                      <span style={{ color: activeCircle?.id === c.id ? "var(--primary)" : "var(--text-muted)" }}>{c.type === "GLOBAL" ? IC.globe : IC.rooms}</span>
                      {c.name}
                    </button>
                  ))}
                </div>

                {publicRooms.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, padding: "0 4px" }}>Discover</p>
                    <div style={{ marginBottom: 20 }}>
                      {publicRooms.map(r => (
                        <Link key={r.id} href={`/rooms/${r.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 12, textDecoration: "none", color: "var(--text)", fontSize: 14 }}
                          onClick={() => setMobileSidebarOpen(false)}>
                          <span style={{ color: "var(--text-muted)", display: "flex" }}>{IC.globe}</span>
                          {r.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--divider)", paddingTop: 16 }}>
                  <button onClick={() => { setShowJoinRoom(true); setMobileSidebarOpen(false); }} style={{ padding: "10px", borderRadius: 12, border: "1px dashed var(--card-border)", background: "none", color: "var(--primary)", fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    + Join Room
                  </button>
                  <button onClick={() => { setShowCreateRoom(true); setMobileSidebarOpen(false); }} style={{ padding: "10px", borderRadius: 12, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    + Create Room
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateRoomModal isOpen={showCreateRoom} onClose={() => setShowCreateRoom(false)} onSuccess={handleRoomCreated} />
      <JoinRoomModal isOpen={showJoinRoom} onClose={() => setShowJoinRoom(false)} />

      {/* Post Detail Modal */}
      {activePost && (
        <PostDetailModal
          post={activePost}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          currentUserUniversityId={currentUserUniversityId}
          isOpen={!!activePost}
          onClose={() => setActivePost(null)}
        />
      )}
    </div>
  );
}
