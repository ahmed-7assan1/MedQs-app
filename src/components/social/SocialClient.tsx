"use client";

import { useState, useEffect, useMemo, memo } from "react";
import Link from "next/link";
import { PostCard } from "./PostCard";
import { PostComposer, FloatingPostIsland } from "./PostComposer";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinRoomModal } from "./JoinRoomModal";
import {
  ChatCircle, Globe, Users, MagnifyingGlass, Plus, ArrowRight,
  List, X, Hash, Lock, Fire, 
  Crown, CaretRight, YoutubeLogo, Play
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { ForumPostListSkeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

import { useSearchParams } from "next/navigation";
import { useCommunityShareStore } from "@/lib/store";
import { InfiniteScrollContainer } from "@/components/ui/InfiniteScrollContainer";

interface SocialCircle { id: string; name: string; type: string; status: string; _count: { posts: number } }
interface Room {
  id: string; name: string; isPublic: boolean; inviteCode: string;
  memberLimit: number; image?: string; _count: { members: number; posts: number };
  members?: any[]; isMember?: boolean; ownerId?: string;
}

const GLASS = "bg-white dark:bg-[#161523]/80 backdrop-blur-[32px] border border-slate-200 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300";

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
  const [activeCircle, setActiveCircle] = useState<SocialCircle | null>(circles[0] ?? null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [threadQuery, setThreadQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");

  const filteredCircles = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    return q ? circles.filter((c: SocialCircle) => c.name.toLowerCase().includes(q)) : circles;
  }, [circles, threadQuery]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [myRooms, setMyRooms] = useState<Room[]>(initialRooms);

  const myJoinedRooms = myRooms.filter((r) => r.isMember || r.ownerId === currentUserId);
  const publicRooms = myRooms.filter((r) => r.isPublic && !r.isMember && r.ownerId !== currentUserId);

  const loadPosts = async (circleId: string, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else {
      setLoading(true);
      setPage(1);
      setHasMore(true);
    }
    
    const nextPage = isLoadMore ? page + 1 : 1;
    
    try {
      const res = await fetch(`/api/v1/forums/${circleId}/posts?page=${nextPage}`);
      if (!res.ok) {
        throw new Error("Failed to load posts");
      }
      
      const data = await res.json();
      
      const newPosts = Array.isArray(data) ? data : [];
      
      setPosts(prev => isLoadMore ? [...prev, ...newPosts] : newPosts);
      setHasMore(newPosts.length === 20); 
      if (isLoadMore) setPage(nextPage);
    } catch (err: any) { 
      console.error(err);
      toast.error("Failed to load posts from cloud"); 
    } finally { 
      setLoading(false); 
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (activeCircle) loadPosts(activeCircle.id, true);
  };

  useEffect(() => { if (activeCircle) loadPosts(activeCircle.id); }, [activeCircle?.id]);

  useEffect(() => {
    if (!activeCircle) return;
    const { subscribeToForumsRealtime } = require("@/lib/firebase/realtime-service");
    const unsubscribe = subscribeToForumsRealtime(activeCircle.id, (realtimePosts: any[]) => {
      setPosts(currentPosts => {
        let hasChanges = false;
        const merged = [...currentPosts];
        
        realtimePosts.forEach(rp => {
          const idx = merged.findIndex(p => p.id === rp.id);
          if (idx === -1) {
            merged.unshift(rp);
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return currentPosts;
      });
    });
    return () => unsubscribe();
  }, [activeCircle?.id]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch('/api/v1/social/trending');
        if (res.ok) {
          const data = await res.json();
          setTrendingTags(Array.isArray(data) ? data : []);
        }
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
          if (data && data.id) {
            setSharedQuestion({
              id: data.id,
              body: data.body,
              choices: data.choices,
              correctAnswer: data.answer,
              userAnswer: null,
              isCorrect: null,
              lectureId: data.lectureId
            });
            toast.success("Question ready to share!");
          }
        })
        .catch(() => {});
    }
  }, [searchParams, setSharedQuestion]);

  const handlePost = async (content: string, imageUrl: string, options?: any): Promise<boolean> => {
    const destId = options.forumId || options.roomId;
    if (!destId) return false;
    
    try {
      const endpoint = options.roomId ? `/api/v1/rooms/${options.roomId}/posts` : `/api/v1/forums/${options.forumId}/posts`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl, ...options }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create post");
      }
      const newPost = await res.json();
      
      // Broadcast via P2P/Failover channel as well
      const { broadcastPost } = require("@/lib/firebase/realtime-service");
      if (options.forumId) broadcastPost(options.forumId, newPost);

      // If we posted to the currently active forum, add it to the feed
      if (!options.roomId && options.forumId === activeCircle?.id) {
        setPosts((p) => [newPost, ...p]);
      } else if (options.roomId) {
        toast.success("Posted to your Room feed!");
      } else {
        toast.success("Posted successfully!");
      }
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
      return false;
    }
  };

  const handleRoomCreated = (room: Room) => {
    setMyRooms((r) => [{ ...room, isMember: true }, ...r]);
    toast.success("Room created successfully!");
  };


  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (sortBy === "top") {
        const scoreA = (a._count?.likes || 0) * 2 + (a._count?.comments || 0);
        const scoreB = (b._count?.likes || 0) * 2 + (b._count?.comments || 0);
        return scoreB - scoreA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0F] text-slate-900 dark:text-white transition-colors duration-500">
      {/* Static background - no animation for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-primary/8 dark:bg-primary/12 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-500/6 dark:bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-8">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-[calc(100vh-120px)]">
            <div className={cn(GLASS, "rounded-[32px] overflow-hidden flex flex-col h-full")}>
              {/* Sidebar Search */}
              <div className="p-6 border-b border-slate-100 dark:border-white/[0.05]">
                <div className="relative group">
                  <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                  <input
                    value={threadQuery}
                    onChange={(e) => setThreadQuery(e.target.value)}
                    placeholder="Search rooms..."
                    className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:border-primary/50 focus:ring-4 ring-primary/5 transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/20"
                  />
                </div>
              </div>

              {/* Destinations List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {/* General Forums */}
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/20 px-3 mb-3">Social Circles</p>
                  <div className="space-y-1.5">
                    {filteredCircles.filter((c: SocialCircle) => c.type === "GLOBAL").map((c: SocialCircle) => (
                      <CircleItem key={c.id} circle={c} active={activeCircle?.id === c.id} onClick={() => setActiveCircle(c)} />
                    ))}
                  </div>
                </div>

                {/* Private / Semester Forums */}
                {filteredCircles.filter((c: SocialCircle) => c.type !== "GLOBAL").length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/20 px-3 mb-3">Academic Circles</p>
                    <div className="space-y-1.5">
                      {filteredCircles.filter((c: SocialCircle) => c.type !== "GLOBAL").map((c: SocialCircle) => (
                        <CircleItem key={c.id} circle={c} active={activeCircle?.id === c.id} onClick={() => setActiveCircle(c)} />
                      ))}
                    </div>
                  </div>
                )}
                 {/* Public Discovery Rooms */}
                 {publicRooms.length > 0 && (
                   <div className="mb-6">
                     <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/20 px-3 mb-3">Discover Circles</p>
                     <div className="space-y-1.5">
                       {publicRooms.map((r: Room) => (
                         <Link key={r.id} href={`/rooms/${r.id}`} className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group">
                           <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                              <Globe size={18} weight="fill" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[13px] font-black text-slate-700 dark:text-white/70 group-hover:text-primary truncate">{r.name}</p>
                             <p className="text-[9px] text-slate-400 dark:text-white/20 font-black uppercase tracking-widest">{r._count.members} Students</p>
                           </div>
                         </Link>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-100 dark:border-white/[0.05] space-y-3">
                <button
                  onClick={() => setShowJoinRoom(true)}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm"
                >
                  <Hash size={16} weight="bold" />
                  Join Room
                </button>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-[0.15em] text-primary hover:bg-primary/20 transition-all shadow-lg shadow-primary/5"
                >
                  <Plus size={16} weight="bold" />
                  Create Room
                </button>
              </div>
            </div>
          </aside>

          {/* ── CENTER FEED ── */}
          <main className="flex flex-col gap-6 min-w-0 relative">
            {/* Mobile Navigation Bar */}
            <div className={cn(GLASS, "lg:hidden flex items-center justify-between rounded-2xl p-4 mb-2 shadow-lg")}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/15 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <List size={22} weight="bold" />
                </div>
                <p className="text-[15px] font-black text-slate-800 dark:text-white">{activeCircle?.name ?? "Social"}</p>
              </div>
              <button onClick={() => setMobileSidebarOpen(true)} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-primary/10 shadow-sm">
                Explore Rooms
              </button>
            </div>

            {/* Premium Post Composer */}
            <PostComposer
              user={{ name: currentUserName ?? "Student", id: currentUserId, image: currentUserImage }}
              onPost={handlePost}
              circles={circles}
              rooms={myJoinedRooms}
            />

            {/* Activity Feed */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30 flex items-center gap-2">
                  <Fire size={14} className="text-orange-500" weight="fill" />
                  {activeCircle?.name || "Social Feed"} Activity
                </h2>
                
                <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 ml-4 shadow-inner">
                  <button onClick={() => setSortBy("recent")} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", sortBy === "recent" ? "bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60")}>Recent</button>
                  <button onClick={() => setSortBy("top")} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", sortBy === "top" ? "bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60")}>Top</button>
                </div>
              </div>

              {loading ? (
                <ForumPostListSkeleton count={4} />
              ) : posts.length > 0 ? (
                <InfiniteScrollContainer
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  isLoading={isLoadingMore}
                  className="flex flex-col gap-6"
                  endComponent={
                    <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center">
                       <ChatCircle size={32} className="mb-3" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">Welcome to the beginning of {activeCircle?.name}</p>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-6">
                    {sortedPosts.map((post) => (
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn(GLASS, "rounded-[40px] py-24 flex flex-col items-center justify-center text-center")}>
                  <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <ChatCircle size={40} className="text-slate-300 dark:text-white/10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-700 dark:text-white/40">No conversations yet</h3>
                  <p className="text-sm text-slate-400 dark:text-white/20 mt-2 max-w-[240px]">Be the first to spark a discussion in {activeCircle?.name}!</p>
                </motion.div>
              )}
            </div>
            
            <FloatingPostIsland
              user={{ name: currentUserName ?? "Student", id: currentUserId, image: currentUserImage }}
              onPost={handlePost}
              circles={circles}
              rooms={myJoinedRooms}
            />
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="hidden lg:flex flex-col gap-8 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pb-10">
            {/* Elegant Time/Status Widget */}
            <TimeWidget />

            {/* Reels Entry Widget - Bold & Unmissable */}
            <div className="rounded-[28px] overflow-hidden relative group/reels shadow-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-white/5">
              <Link href="/videos/reels" className="relative block">
                {/* Background image - optimized size to 400px for speed */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=70&w=400" 
                    className="w-full h-full object-cover group-hover/reels:scale-105 transition-transform duration-700 transform-gpu" 
                    alt="Reels"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  {/* Live badge */}
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                  {/* Content over image */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/40">
                        <YoutubeLogo size={22} weight="fill" className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-black text-[15px] leading-none">OneX Studio</p>
                        <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">Medical Reels</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* CTA Button */}
                <div className="bg-gradient-to-r from-red-600 to-rose-500 p-4 flex items-center justify-between group-hover/reels:from-red-500 group-hover/reels:to-rose-400 transition-all">
                  <div>
                    <p className="text-white font-black text-[13px] uppercase tracking-widest">Explore Reels</p>
                    <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest">Short medical videos</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover/reels:bg-white/30 transition-all">
                    <Play size={20} weight="fill" className="text-white" />
                  </div>
                </div>
              </Link>
            </div>
            {/* Trending Hashtags Widget */}
            <div className={cn(GLASS, "rounded-[32px] p-6")}>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                  <Fire size={18} weight="fill" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">Trending Now</p>
              </div>
              <div className="space-y-4">
                {trendingTags.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                     <Hash size={24} className="mx-auto text-slate-300 dark:text-white/10" />
                     <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">No trends yet</p>
                  </div>
                ) : trendingTags.map((tag) => (
                  <button key={tag.id} className="w-full group flex items-center justify-between hover:translate-x-1 transition-transform">
                    <div className="flex flex-col items-start">
                      <p className="text-[14px] font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">#{tag.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">{tag.count} discussions</p>
                    </div>
                    <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <CaretRight size={14} className="text-slate-400 group-hover:text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Study Groups Widget */}
            <div className={cn(GLASS, "rounded-[32px] p-6 flex flex-col gap-5 shadow-inner")}>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Users size={18} className="text-primary" weight="fill" />
                    My Study Rooms
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-white/30 font-bold uppercase tracking-widest mt-1">{myJoinedRooms.length} Active Rooms</p>
                </div>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="h-9 w-9 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                >
                  <Plus size={18} weight="bold" />
                </button>
              </div>

              {myJoinedRooms.length > 0 ? (
                <div className="space-y-3.5">
                  {myJoinedRooms.map((room) => (
                    <RoomItemSmall key={room.id} room={room} currentUserId={currentUserId} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-14 w-14 bg-slate-100 dark:bg-white/5 rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Users size={24} className="text-slate-300 dark:text-white/10" />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">No joined rooms</p>
                  <button onClick={() => setShowJoinRoom(true)} className="mt-3 text-[12px] text-primary font-black hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Join one now <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>


          </aside>
        </div>
      </div>

      {/* Modals & Navigation */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl lg:hidden" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] z-[210] bg-white dark:bg-[#0F0E16] border-r border-slate-200 dark:border-white/10 lg:hidden flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2"><Users size={20} className="text-primary" /> Community</h3>
                <button onClick={() => setMobileSidebarOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5"><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-4 px-2">Rooms & Circles</p>
                   <div className="space-y-1.5">
                     {circles.map((c: SocialCircle) => <CircleItem key={c.id} circle={c} active={activeCircle?.id === c.id} onClick={() => { setActiveCircle(c); setMobileSidebarOpen(false); }} />)}
                   </div>
                 </div>

                 {publicRooms.length > 0 && (
                   <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-4 px-2">Discover Public Rooms</p>
                     <div className="space-y-1.5">
                        {publicRooms.map((r: Room) => (
                          <Link key={r.id} href={`/rooms/${r.id}`} className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 transition-all">
                             <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <Globe size={18} weight="fill" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-[13px] font-black text-white/70 truncate">{r.name}</p>
                               <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">{r._count.members} Students</p>
                             </div>
                          </Link>
                        ))}
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateRoomModal isOpen={showCreateRoom} onClose={() => setShowCreateRoom(false)} onSuccess={handleRoomCreated} />
      <JoinRoomModal isOpen={showJoinRoom} onClose={() => setShowJoinRoom(false)} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

const CircleItem = memo(({ circle, active, onClick }: { circle: SocialCircle; active: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all group border",
        active ? "bg-primary/10 border-primary/20 shadow-inner" : "hover:bg-slate-100 dark:hover:bg-white/5 border-transparent"
      )}
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm", active ? "bg-primary text-white shadow-primary/30" : "bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-white/20 group-hover:bg-slate-300 dark:group-hover:bg-white/10")}>
        {circle.type === "GLOBAL" ? <Globe size={18} weight="fill" /> : <Users size={18} weight="fill" />}
      </div>
      <div className="flex-1 text-left overflow-hidden">
        <p className={cn("text-[13px] font-black truncate transition-colors", active ? "text-primary" : "text-slate-700 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white/90")}>{circle.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
           <span className="text-[9px] text-slate-400 dark:text-white/20 font-black uppercase tracking-widest">{circle._count.posts} posts</span>
           <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
           <span className="text-[9px] text-slate-400 dark:text-white/20 font-black uppercase tracking-widest">{circle.type.toLowerCase()}</span>
        </div>
      </div>
    </button>
  );
});

const RoomItemSmall = memo(({ room, currentUserId }: { room: Room; currentUserId: string }) => {
  const isOwner = room.ownerId === currentUserId;
  return (
    <Link href={`/rooms/${room.id}`} className="block group">
      <div className="flex items-center gap-3.5 p-3.5 rounded-[22px] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] hover:border-primary/40 hover:bg-primary/[0.02] transition-all shadow-sm group-hover:shadow-md">
        <div className="h-11 w-11 rounded-[16px] overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner border border-white/10 relative">
          {room.image ? (
            <img src={room.image} className="w-full h-full object-cover" alt="" />
          ) : (
            room.isPublic ? <Globe size={20} className="text-primary" weight="fill" /> : <Lock size={20} className="text-amber-500" weight="fill" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-black text-slate-800 dark:text-white/90 truncate group-hover:text-primary transition-colors">{room.name}</p>
            {isOwner && <Crown size={12} className="text-amber-400 flex-shrink-0" weight="fill" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-slate-400 dark:text-white/30 font-black uppercase tracking-widest flex items-center gap-1">
              <Users size={10} /> {room._count.members} Members
            </span>
          </div>
        </div>
        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
           <ArrowRight size={14} weight="bold" />
        </div>
      </div>
    </Link>
  );
});


function TimeWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className={cn(GLASS, "rounded-[32px] p-6 group")}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">{timeStr}</p>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-white/30 font-black uppercase tracking-widest">{dateStr}</p>
        </div>
        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="text-4xl filter drop-shadow-lg">☀️</motion.div>
      </div>
    </div>
  );
}
