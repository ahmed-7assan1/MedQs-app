"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { PostCardRedesigned } from "./PostCardRedesigned";
import { PostComposerRedesigned } from "./PostComposerRedesigned";
import { TeamCreateModal } from "@/components/teams/TeamCreateModal";
import {
  ChatCircle,
  PaperPlaneTilt,
  CircleNotch,
  Globe,
  Users,
  PlusCircle,
  List,
  Clock,
  CalendarBlank,
  UserCircle,
  MagnifyingGlass,
  Plus,
  ArrowRight,
  DotsThreeVertical,
  BellSimple,
  Fire,
  X
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { PostWithMeta } from "@/types";
import { ForumPostListSkeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface Forum {
  id: string;
  name: string;
  type: string;
  status: string;
  _count: { posts: number };
  universityId?: string;
}

export function ForumClient({
  forums,
  teams = [],
  currentUserId,
  currentUserRole,
  currentUserUniversityId,
  initialForumId = null,
  initialPosts = [],
}: {
  forums: Forum[];
  teams?: any[];
  currentUserId: string;
  currentUserRole?: string;
  currentUserUniversityId?: string;
  initialForumId?: string | null;
  initialPosts?: PostWithMeta[];
}) {
  const [forumList, setForumList] = useState<Forum[]>(forums);
  const [activeForum, setActiveForum] = useState<Forum | null>(() => {
    if (initialForumId) return forums.find(f => f.id === initialForumId) || forums[0] || null;
    return forums[0] || null;
  });
  const [posts, setPosts] = useState<PostWithMeta[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState<"feed" | "discussions">("feed");
  const [threadQuery, setThreadQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const filteredForums = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    if (!q) return forumList;
    return forumList.filter((f) => f.name.toLowerCase().includes(q));
  }, [threadQuery, forumList]);

  const loadPosts = async (forumId: string) => {
    if (!forumId) return;
    setLoading(true);
    try {
      const endpoint = `/api/v1/forums/${forumId}/posts`;
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeForum && activeForum.id !== initialForumId) {
      loadPosts(activeForum.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeForum?.id]);

  useEffect(() => {
    // Load pending invites on mount
    fetch("/api/v1/forums/invites")
      .then(r => r.json())
      .then(d => setPendingInvites(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // ── Auto-refresh Polling (Real-time Feel) ──
  useEffect(() => {
    if (!activeForum) return;
    
    const pollInterval = setInterval(() => {
      // Only poll if tab is visible to save battery/bandwidth
      if (document.visibilityState === 'visible' && !loading && !posting) {
        loadPosts(activeForum.id);
      }
    }, 15000); // 15s polling

    return () => clearInterval(pollInterval);
  }, [activeForum?.id, loading, posting]);

  const handlePost = async (content: string, imageUrl: string, options?: any) => {
    const targetForumId = options?.forumId || activeForum?.id;
    if (!targetForumId) return false;
    
    setPosting(true);
    try {
      const res = await fetch(`/api/v1/forums/${targetForumId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          imageUrl: imageUrl || undefined,
          attachments: options?.attachments,
          isForumPost: true,
        }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        toast.success("Post broadcasted!");
        return true;
      }
      return false;
    } catch {
      toast.error("Handshake failed");
      return false;
    } finally {
      setPosting(false);
    }
  };

  const SidebarItem = ({ forum }: { forum: Forum }) => {
    const active = activeForum?.id === forum.id;
    return (
      <button
        onClick={() => {
          setActiveForum(forum);
          setMobileSidebarOpen(false);
        }}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group",
          active 
            ? "bg-[#534AB7]/20 border border-[#534AB7]/30 shadow-lg shadow-primary/5" 
            : "hover:bg-white/5 border border-transparent"
        )}
      >
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
          active ? "bg-primary text-white" : "bg-white/5 text-white/20 group-hover:bg-white/10"
        )}>
          {forum.type === "GLOBAL" ? <Globe size={20} /> : <Users size={20} />}
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <p className={cn("text-sm font-black truncate", active ? "text-white" : "text-white/40 group-hover:text-white/70")}>
            {forum.name}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
            {forum._count.posts} Active Transmissions
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0F] text-slate-900 dark:text-white selection:bg-primary/30 transition-colors duration-300">
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-8">
          
          {/* ── Left Column: Channels ── */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-24 h-[calc(100vh-120px)]">
            <div className="bg-[#161523]/60 backdrop-blur-xl border border-white/[0.05] rounded-[32px] overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-white/[0.05]">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30 mb-4">Public Rooms</h3>
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    value={threadQuery}
                    onChange={(e) => setThreadQuery(e.target.value)}
                    placeholder="Search Channels..." 
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredForums.map(f => <SidebarItem key={f.id} forum={f} />)}
              </div>

              <div className="p-4 border-t border-white/[0.05] bg-white/[0.02]">
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all">
                  <Plus size={16} weight="bold" />
                  Join New Classroom
                </button>
              </div>
            </div>
          </aside>

          {/* ── Center Column: Feed ── */}
          <main className="flex flex-col gap-8 min-w-0">
            {/* Mobile Header / Channel Toggle */}
            <div className="lg:hidden flex items-center justify-between bg-[#161523]/60 backdrop-blur-xl border border-white/[0.05] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <List size={20} weight="bold" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{activeForum?.name}</h4>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-tight">Active Node</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10"
              >
                Channels
              </button>
            </div>

            {/* Composer */}
            <PostComposerRedesigned 
              user={{ name: "Student", id: currentUserId }}
              onPost={handlePost}
              forums={forumList}
            />

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-[#161523]/60 backdrop-blur-xl border border-white/[0.05] rounded-2xl self-start">
              <button 
                onClick={() => setTab("feed")}
                className={cn(
                  "px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                  tab === "feed" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/30 hover:text-white/60"
                )}
              >
                Global Feed
              </button>
              <button 
                onClick={() => setTab("discussions")}
                className={cn(
                  "px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                  tab === "discussions" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/30 hover:text-white/60"
                )}
              >
                Peer signals
              </button>
            </div>

            {/* Feed Content */}
            <div className="flex flex-col gap-6">
              {loading ? (
                <ForumPostListSkeleton count={3} />
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <PostCardRedesigned 
                    key={post.id} 
                    post={post} 
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    currentUserUniversityId={currentUserUniversityId}
                  />
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
                  <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <ChatCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">No Transmissions</h3>
                  <p className="text-sm font-bold mt-2">Broadcast the first signal to initialize this node.</p>
                </div>
              )}
            </div>
          </main>

          {/* ── Right Column: Widgets ── */}
          <aside className="hidden lg:flex flex-col gap-8 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
            {/* Widget: Schedule (Mock) */}
            <div className="bg-white/70 dark:bg-[#161523]/60 backdrop-blur-xl border border-slate-200 dark:border-white/[0.05] rounded-[32px] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">Academic Pulse</h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest">Sunday, 25 June</p>
                </div>
                <CalendarBlank size={24} className="text-primary" />
              </div>
              <div className="space-y-4">
                {[
                  { title: "Mathematics Basic", time: "9:00 AM - 10:30 AM", room: "205", active: true },
                  { title: "Clinical Chemistry", time: "11:00 AM - 12:30 PM", room: "310" },
                  { title: "Pathology Review", time: "2:00 PM - 3:30 PM", room: "120" }
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border transition-all",
                    item.active ? "bg-primary/5 dark:bg-primary/10 border-primary/20 shadow-lg shadow-primary/5" : "bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.05]"
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">{item.title}</h4>
                      {item.active && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-white/40">{item.time}</p>
                    <p className="text-[9px] font-black text-primary/80 dark:text-primary/60 uppercase tracking-widest mt-2">Room {item.room}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2">
                Full Schedule <ArrowRight size={14} />
              </button>
            </div>

            {/* Widget: Study Groups */}
            <div className="bg-white/70 dark:bg-[#161523]/60 backdrop-blur-xl border border-slate-200 dark:border-white/[0.05] rounded-[32px] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">Study Groups</h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest">{teams.length} Groups</p>
                </div>
                <button 
                  onClick={() => setIsTeamModalOpen(true)}
                  className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 transition-all hover:scale-110"
                >
                  <Plus size={16} weight="bold" />
                </button>
              </div>
              <div className="space-y-4">
                {teams.length > 0 ? (
                  teams.map((team, i) => (
                    <Link href={`/teams/${team.id}`} key={i} className="block group cursor-pointer">
                      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] hover:border-primary/30 dark:hover:border-primary/30 transition-all">
                        <div className="flex -space-x-2">
                          {team.members.map((m: any, idx: number) => (
                            <img 
                              key={idx}
                              src={m.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.name}`} 
                              className="h-8 w-8 rounded-full border-2 border-white dark:border-[#161523] z-10 relative object-cover"
                              alt=""
                            />
                          ))}
                          {team._count.members > 4 && (
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/10 border-2 border-white dark:border-[#161523] flex items-center justify-center text-[9px] font-black z-0 relative text-slate-700 dark:text-white">
                              +{team._count.members - 4}
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-black text-slate-700 dark:text-white/80 group-hover:text-primary transition-colors line-clamp-1">{team.name}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-4 opacity-50">
                    <p className="text-xs font-bold text-slate-600 dark:text-white">No groups joined yet.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Channel Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] z-[210] bg-[#0F0E16] border-r border-white/10 lg:hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black text-white italic tracking-tighter">Nodes</h3>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-white/40">
                  <X size={24} weight="bold" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredForums.map(f => <SidebarItem key={f.id} forum={f} />)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(83, 74, 183, 0.4);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <TeamCreateModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)}
        universityId={currentUserUniversityId || ""}
        onSuccess={(newTeam) => {
          setIsTeamModalOpen(false);
          // In a real app we might mutate the teams array or router.refresh(), but the toast suffices
        }}
      />
    </div>
  );
}
