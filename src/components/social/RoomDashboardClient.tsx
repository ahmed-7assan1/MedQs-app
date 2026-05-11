"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PostCard } from "./PostCard";
import { PostComposerRedesigned } from "../forum/PostComposerRedesigned";
import {
  ChatCircle, CheckSquare, Trophy, Users, Gear,
  ArrowLeft, Lock, Globe, Crown, Copy, Check,
  Plus, Trash, SignOut, Hash, CalendarBlank, Clock,
  Image as ImageIcon, SpotifyLogo, Timer, Play, Pause,
  ArrowClockwise, Sparkle, Target,
  SpeakerHigh, SpeakerSlash, TelegramLogo
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const GLASS = "bg-white/70 dark:bg-[#161523]/70 backdrop-blur-[40px] border border-slate-200/80 dark:border-white/[0.08] shadow-2xl transition-all duration-500";
const TABS = [
  { id: "feed", label: "Community", icon: ChatCircle },
  { id: "tasks", label: "My Goals", icon: CheckSquare },
  { id: "schedule", label: "Schedule", icon: CalendarBlank },
  { id: "leaderboard", label: "Rankings", icon: Trophy },
  { id: "ai", label: "AI Analysis", icon: Sparkle },
  { id: "members", label: "Students", icon: Users },
  { id: "settings", label: "Manage", icon: Gear, ownerOnly: true },
] as const;

type Tab = typeof TABS[number]["id"];

interface RoomPost { 
  id: string; content: string; attachments?: any; author: { id: string; name: string; image?: string }; 
  createdAt: string; sharedQuestion?: any; _count?: { likes: number; comments: number };
  likedByMe?: boolean;
}
interface RoomTask { id: string; title: string; description?: string; deadline?: string; completed: boolean }
interface RoomMember { userId: string; role: string; joinedAt: string; user: { id: string; name: string; image?: string; points: number; rank?: { label: string; badge?: string } } }
interface RoomSchedule { id: string; title: string; startTime: string; endTime: string; dayOfWeek: number; type: string }

interface Room {
  id: string; name: string; description?: string; inviteCode: string; image?: string;
  isPublic: boolean; memberLimit: number; ownerId: string;
  spotifyUrl?: string;          // Spotify song or playlist URL
  customAiConfig?: { telegramMediaUrl?: string } | null; // Telegram voice URL
  owner: { id: string; name: string; image?: string };
  members: RoomMember[];
  tasks: RoomTask[];
  posts: RoomPost[];
  schedule?: RoomSchedule[];
  _count: { members: number; posts: number; tasks: number };
}

export function RoomDashboardClient({ room, currentUserId, isMember, isOwner }: {
  room: Room; currentUserId: string; isMember: boolean; isOwner: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [posts, setPosts] = useState<RoomPost[]>(room.posts);
  const [tasks, setTasks] = useState<RoomTask[]>(room.tasks);
  const [members] = useState<RoomMember[]>(room.members);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(`muted-${room.id}`) === '1';
    return false;
  });
  const router = useRouter();

  const telegramMediaUrl = room.customAiConfig?.telegramMediaUrl;
  
  const spotifyData = React.useMemo(() => {
    if (!room.spotifyUrl) return null;
    const url = room.spotifyUrl;
    const isTrack = url.includes('/track/');
    const isPlaylist = url.includes('/playlist/');
    const isEpisode = url.includes('/episode/');
    const isShow = url.includes('/show/');
    const id = url.split('/').filter(Boolean).pop()?.split('?')[0];
    
    let type = 'playlist';
    if (isTrack) type = 'track';
    else if (isPlaylist) type = 'playlist';
    else if (isEpisode) type = 'episode';
    else if (isShow) type = 'show';
    
    return { id, type };
  }, [room.spotifyUrl]);

  const hasMedia = !!(spotifyData || telegramMediaUrl);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem(`muted-${room.id}`, next ? '1' : '0');
  };

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    setCodeCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this room?")) return;
    const res = await fetch(`/api/v1/rooms/${room.id}/leave`, { method: "DELETE" });
    if (res.ok) { toast.success("Left room"); router.push("/social"); }
    else { const d = await res.json(); toast.error(d.error); }
  };

  const handleDelete = async () => {
    if (!confirm("Permanent deletion cannot be undone. Proceed?")) return;
    const res = await fetch(`/api/v1/rooms/${room.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Room deleted"); router.push("/social"); }
    else { const d = await res.json(); toast.error(d.error); }
  };

  const handlePost = async (content: string, imageUrl: string, options?: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/rooms/${room.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl, ...options }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create post");
      }
      const newPost = await res.json();
      setPosts((p) => [newPost, ...p]);
      toast.success("Posted to Room!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to post");
      return false;
    }
  };

  const visibleTabs = TABS.filter(t => !("ownerOnly" in t) || (t as any).ownerOnly && isOwner || !("ownerOnly" in t));
  // Simpler:
  const visibleTabsClean = TABS.filter(t => !("ownerOnly" in t) || isOwner);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0F] text-slate-900 dark:text-white transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 40, 0], y: [0, 20, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 dark:bg-primary/15 blur-[140px] rounded-full" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 25, repeat: Infinity }} className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-12">
        {/* Header Navigation */}
        <div className="mb-8">
          <Link href="/social" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 hover:text-primary transition-all mb-6 group">
            <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
              <ArrowLeft size={14} weight="bold" />
            </div>
            Back to Social Hub
          </Link>

          <div className={cn(GLASS, "rounded-[40px] p-8 shadow-2xl relative overflow-hidden group")}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="h-24 w-24 rounded-[32px] overflow-hidden bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-inner border border-white/20 relative">
                  {room.image ? (
                    <img src={room.image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    room.isPublic 
                      ? <Globe size={44} className="text-primary" weight="fill" />
                      : <Lock size={44} className="text-amber-500" weight="fill" />
                  )}
                </div>
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{room.name}</h1>
                    {isOwner && <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5"><Crown size={12} weight="fill" /> Owner</span>}
                    <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", room.isPublic ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" : "bg-amber-500/10 text-amber-500 border-amber-500/10")}>
                      {room.isPublic ? "Public Circle" : "Private Circle"}
                    </span>
                  </div>
                  {room.description && <p className="text-[15px] text-slate-500 dark:text-white/40 mb-4 max-w-md font-medium">{room.description}</p>}
                  <div className="flex items-center justify-center md:justify-start gap-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                    <span className="flex items-center gap-2"><Users size={16} weight="fill" /> {room._count.members} Members</span>
                    <span className="flex items-center gap-2"><ChatCircle size={16} weight="fill" /> {room._count.posts} Posts</span>
                    <span className="flex items-center gap-2"><CheckSquare size={16} weight="fill" /> {room._count.tasks} Tasks</span>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col items-center md:items-end gap-3">
                {isOwner && (
                   <div className="hidden md:block">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-2 text-right">Owner Control Panel</p>
                   </div>
                )}
                {/* Glowing Action Button */}
                <button 
                  onClick={() => setActiveTab("ai")}
                  className="group relative flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Sparkle size={18} weight="fill" className="animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">Ask Dr. Q</span>
                </button>
              </div>
            </div>
          </div>

          {/* Media Player (Spotify or Telegram Audio) - Square Top Layout */}
          {hasMedia && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {room.spotifyUrl && (
                <div className={cn(GLASS, "rounded-[32px] overflow-hidden relative group aspect-square md:aspect-auto md:h-[152px]")}>
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <SpotifyLogo size={14} weight="fill" className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Signal Sync</span>
                  </div>
                  <button onClick={toggleMute} className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                    {isMuted ? <SpeakerSlash size={14} /> : <SpeakerHigh size={14} />}
                  </button>
                  <iframe
                    src={`https://open.spotify.com/embed/${spotifyData?.type}/${spotifyData?.id}?utm_source=generator&theme=0`}
                    width="100%" height="100%" frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ opacity: isMuted ? 0.2 : 1, filter: isMuted ? 'grayscale(1)' : 'none' }}
                  />
                </div>
              )}
              {telegramMediaUrl && (
                <div className="md:h-[152px] flex flex-col justify-center">
                   <RoomTelegramPlayer url={telegramMediaUrl} isMuted={isMuted} onToggleMute={toggleMute} />
                </div>
              )}
            </div>
          )}

          {/* Focus Timer */}
          <div className="mt-6">
             <div className={cn(GLASS, "rounded-[28px] p-5 flex items-center justify-between")}>
                <div className="flex items-center gap-4">
                   <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-all", isTimerRunning ? "bg-primary text-white animate-pulse" : "bg-slate-100 dark:bg-white/5 text-slate-400")}>
                      <Timer size={22} weight="bold" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Focus Timer</p>
                      <p className="text-xl font-black tabular-nums text-slate-800 dark:text-white">{formatTime(seconds)}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => setSeconds(0)} className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-primary transition-all">
                      <ArrowClockwise size={18} weight="bold" />
                   </button>
                   <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={cn("h-10 px-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all", isTimerRunning ? "bg-amber-500 text-white" : "bg-primary text-white")}>
                      {isTimerRunning ? "Pause" : "Start"}
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className={cn(GLASS, "rounded-[24px] p-2 flex gap-1.5 mb-8 overflow-x-auto no-scrollbar shadow-lg")}>
          {visibleTabsClean.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 min-w-max flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105"
                  : "text-slate-500 dark:text-white/30 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white/70"
              )}
            >
              <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "bold"} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeOut" }}>
              {activeTab === "feed" && (
                <div className="space-y-6">
                  {isMember && (
                <PostComposerRedesigned
                  user={{ name: room.owner.name, image: room.owner.image, id: currentUserId }}
                  onPost={handlePost}
                  placeholder="Share notes, resources, or questions..."
                />
              )}
                  <div className="space-y-6">
                    {posts.length === 0 ? (
                      <EmptyState icon={<ChatCircle size={48} />} text="No posts yet. Start the conversation!" />
                    ) : (
                      posts.map((post) => (
                        <PostCard key={post.id} post={{ ...post, roomId: room.id }} currentUserId={currentUserId} isRoomPost={true} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <TasksTab tasks={tasks} setTasks={setTasks} roomId={room.id} isMember={isMember} />
                  </div>
                  <div className="space-y-6">
                    <div className={cn(GLASS, "rounded-[32px] p-6 border-amber-500/20")}>
                      <div className="flex items-center gap-2 mb-4">
                        <Trophy size={18} className="text-amber-500" weight="fill" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Speed Bonus</p>
                      </div>
                      <p className="text-[13px] font-bold text-slate-700 dark:text-white/80 leading-relaxed">Complete tasks within <span className="text-amber-500">2 hours</span> of assignment to earn 2x points!</p>
                    </div>
                    <ScheduleSidebar roomId={room.id} />
                    <FocusTimer />
                    <SpotifyPlayer />
                  </div>
                </div>
              )}
              {activeTab === "schedule" && <ScheduleTab roomId={room.id} isMember={isMember} isOwner={isOwner} />}
              {activeTab === "leaderboard" && <LeaderboardTab members={members} currentUserId={currentUserId} />}
              {activeTab === "ai" && <AiAnalysisTab room={room} currentUserId={currentUserId} />}
              {activeTab === "members" && <MembersTab members={members} ownerId={room.ownerId} />}
              {activeTab === "settings" && isOwner && <SettingsTab room={room} onDelete={handleDelete} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Leave Action */}
        {isMember && !isOwner && (
          <div className="mt-12 flex justify-center">
            <button onClick={handleLeave} className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all shadow-sm">
              <SignOut size={18} weight="bold" /> Leave Room
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// ── Tasks Tab (Modernized) ───────────────────────────────────
function TasksTab({ tasks, setTasks, roomId, isMember }: { tasks: RoomTask[]; setTasks: any; roomId: string; isMember: boolean }) {
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);

  const addTask = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask }),
      });
      const data = await res.json();
      if (res.ok) { setTasks((t: RoomTask[]) => [data, ...t]); setNewTask(""); toast.success("Task added"); }
      else toast.error(data.error);
    } catch { toast.error("Failed to add task"); }
    finally { setAdding(false); }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const res = await fetch(`/api/v1/rooms/${roomId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    if (res.ok) setTasks((t: RoomTask[]) => t.map(task => task.id === taskId ? { ...task, completed: !completed } : task));
  };

  const deleteTask = async (taskId: string) => {
    const res = await fetch(`/api/v1/rooms/${roomId}/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) { setTasks((t: RoomTask[]) => t.filter(task => task.id !== taskId)); toast.success("Task removed"); }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {isMember && (
        <div className={cn(GLASS, "rounded-[28px] p-4 flex gap-4 shadow-lg focus-within:ring-2 ring-primary/20 transition-all")}>
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Create a new study goal..."
            className="flex-1 bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 text-[15px] font-medium focus:outline-none px-2"
          />
          <button onClick={addTask} disabled={adding || !newTask.trim()} className="h-11 w-11 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all">
            {adding ? <Clock size={20} className="animate-spin" /> : <Plus size={20} weight="bold" />}
          </button>
        </div>
      )}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <EmptyState icon={<CheckSquare size={48} />} text="No tasks listed. Ready for some productivity?" />
        ) : (
          tasks.map((task) => (
            <motion.div layout key={task.id} className={cn(GLASS, "rounded-[24px] p-5 flex items-center gap-4 shadow-sm transition-all", task.completed && "opacity-60 bg-slate-50/50 dark:bg-white/[0.01]")}>
              <button onClick={() => toggleTask(task.id, task.completed)} className={cn("h-7 w-7 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all shadow-sm", task.completed ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary")}>
                {task.completed && <Check size={16} weight="bold" className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[15px] font-bold text-slate-700 dark:text-white/80", task.completed && "line-through text-slate-400 dark:text-white/20")}>{task.title}</p>
                {task.deadline && <p className="text-[10px] text-slate-400 dark:text-white/20 font-black uppercase mt-1">Due {new Date(task.deadline).toLocaleDateString()}</p>}
              </div>
              {isMember && (
                <button onClick={() => deleteTask(task.id)} className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-300 dark:text-white/10 hover:text-red-500 hover:bg-red-500/5 transition-all">
                  <Trash size={18} />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Schedule Sidebar ────────────────────────────────────────
function ScheduleSidebar({ roomId }: { roomId: string }) {
  return (
    <div className={cn(GLASS, "rounded-[32px] p-6")}>
      <div className="flex items-center gap-2 mb-6">
        <CalendarBlank size={18} className="text-primary" weight="fill" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Upcoming Today</p>
      </div>
      <div className="space-y-4">
         <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-[13px] font-black text-slate-800 dark:text-white mb-1">Group Study Session</p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
               <Clock size={12} />
               <span>18:00 - 20:00</span>
            </div>
         </div>
         <button className="w-full py-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">
            View Full Schedule
         </button>
      </div>
    </div>
  );
}

// ── Schedule Tab (New Premium Feature) ────────────────────────
function ScheduleTab({ roomId, isMember, isOwner }: { roomId: string; isMember: boolean; isOwner: boolean }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className={cn(GLASS, "rounded-[32px] p-8 text-center")}>
        <div className="h-20 w-20 bg-primary/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-inner">
           <CalendarBlank size={40} className="text-primary" weight="fill" />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Room Schedule</h2>
        <p className="text-sm text-slate-500 dark:text-white/40 mb-8 max-w-sm mx-auto">Plan your group study sessions, lectures, and mock exams together.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
           {[ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday" ].map(day => (
             <div key={day} className="p-5 rounded-[24px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-4">{day}</p>
                <div className="space-y-3">
                   <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full" />
                   <div className="h-2 w-[60%] bg-slate-100 dark:bg-white/5 rounded-full" />
                </div>
                {isOwner && (
                  <button className="mt-6 w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary/50 transition-all">
                    Add Session
                  </button>
                )}
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard Tab (Modernized) ─────────────────────────────
function LeaderboardTab({ members, currentUserId }: { members: RoomMember[]; currentUserId: string }) {
  const sorted = [...members].sort((a, b) => (b.user.points ?? 0) - (a.user.points ?? 0));
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-6 mb-4">
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Rank / Student</p>
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Score</p>
      </div>
      {sorted.map((m, i) => (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={m.userId} className={cn(GLASS, "rounded-[24px] p-5 flex items-center gap-5 transition-all shadow-sm", m.userId === currentUserId && "ring-2 ring-primary/30 border-primary/20 bg-primary/[0.02]")}>
          <div className="w-10 text-center flex-shrink-0">
            {i < 3 ? <span className="text-2xl drop-shadow-md">{medals[i]}</span> : <span className="text-[15px] font-black text-slate-400 dark:text-white/20">#{i + 1}</span>}
          </div>
          <img src={m.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.name}`} className="h-12 w-12 rounded-[18px] object-cover border border-slate-200 dark:border-white/10 shadow-sm" alt="" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-black text-slate-800 dark:text-white truncate">{m.user.name}</p>
              {m.role === "OWNER" && <Crown size={14} className="text-amber-500" weight="fill" />}
            </div>
            <div className="flex items-center gap-3 mt-1">
               {m.user.rank && <p className="text-[9px] text-primary font-black uppercase tracking-widest">{m.user.rank.label}</p>}
               <span className="h-1 w-1 rounded-full bg-white/10" />
               <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">+{Math.floor(Math.random() * 50) + 10} Room Pts</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-primary tabular-nums tracking-tight">{(m.user.points ?? 0).toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 dark:text-white/20 font-black uppercase tracking-widest">Total XP</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Members Tab (Modernized) ─────────────────────────────────
function MembersTab({ members, ownerId }: { members: RoomMember[]; ownerId: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {members.map((m) => (
        <div key={m.userId} className={cn(GLASS, "rounded-[28px] p-5 flex items-center gap-4 shadow-sm hover:scale-[1.02] transition-all")}>
          <img src={m.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.name}`} className="h-12 w-12 rounded-[18px] object-cover border border-slate-200 dark:border-white/10" alt="" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-black text-slate-800 dark:text-white truncate">{m.user.name}</p>
              {m.userId === ownerId && <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase flex items-center gap-1"><Crown size={10} weight="fill" /> Owner</span>}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-widest mt-1">{m.user.rank?.label || "Community Member"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Telegram Audio Player for Room ──────────────────────────
function RoomTelegramPlayer({ url, isMuted, onToggleMute }: { url: string; isMuted: boolean; onToggleMute: () => void }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const bars = React.useMemo(() => Array.from({length: 36}, () => Math.random() * 0.65 + 0.2), []);

  // Extract direct audio URL from t.me links (pass through proxy if needed)
  const audioSrc = url.startsWith('http') ? `/api/v1/download-proxy?url=${encodeURIComponent(url)}` : url;

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = isMuted;
    const tu = () => setCurrent(a.currentTime);
    const lm = () => setDuration(a.duration || 0);
    const en = () => setPlaying(false);
    a.addEventListener('timeupdate', tu);
    a.addEventListener('loadedmetadata', lm);
    a.addEventListener('ended', en);
    return () => { a.removeEventListener('timeupdate', tu); a.removeEventListener('loadedmetadata', lm); a.removeEventListener('ended', en); };
  }, [isMuted]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  const fmt = (s: number) => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  const progress = duration > 0 ? current / duration : 0;

  return (
    <div className={cn(GLASS, "rounded-[28px] p-4 flex items-center gap-4")}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      <button onClick={toggle} className="h-11 w-11 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0">
        {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#229ED9]">Telegram Voice</span>
          <span className="text-[10px] text-white/30">{fmt(current)} / {fmt(duration)}</span>
        </div>
        <div className="flex items-end gap-[2px] h-7 cursor-pointer" onClick={(e) => {
          if (!audioRef.current || duration === 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
        }}>
          {bars.map((h, i) => (
            <div key={i} className={cn("flex-1 rounded-full transition-all", (i / bars.length) < progress ? "bg-[#229ED9]" : "bg-white/10")} style={{height: `${h*100}%`}} />
          ))}
        </div>
      </div>
      <button onClick={onToggleMute} className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-all shrink-0">
        {isMuted ? <SpeakerSlash size={18} /> : <SpeakerHigh size={18} />}
      </button>
    </div>
  );
}

// ── Settings Tab (Modernized) ────────────────────────────────
function SettingsTab({ room, onDelete }: { room: Room; onDelete: () => void }) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [isPublic, setIsPublic] = useState(room.isPublic);
  const [memberLimit, setMemberLimit] = useState(room.memberLimit);
  const [image, setImage] = useState(room.image || "");
  const [spotifyUrl, setSpotifyUrl] = useState(room.spotifyUrl || "");
  const [telegramMediaUrl, setTelegramMediaUrl] = useState(room.customAiConfig?.telegramMediaUrl || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setImage(`/api/v1/files/telegram/preview?fileId=${data.fileId}&type=image`);
        toast.success("Image uploaded!");
      }
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/v1/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, isPublic, memberLimit, image, spotifyUrl, telegramMediaUrl }),
    });
    setSaving(false);
    if (res.ok) toast.success("Settings saved!");
    else { const d = await res.json(); toast.error(d.error); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto">
     <div className={cn(GLASS, "flex-1 rounded-[32px] p-8 space-y-6 shadow-2xl")}>
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-black text-slate-800 dark:text-white">Room Settings</h3>
           <button 
             onClick={() => {
                navigator.clipboard.writeText(room.inviteCode);
                toast.success("Invite code copied!");
             }}
             className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
           >
              Code: {room.inviteCode} <Copy size={14} />
           </button>
        </div>

        <div className="flex items-center gap-6 pb-4">
           <div className="h-20 w-20 rounded-[28px] overflow-hidden bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 relative group">
              {image ? <img src={image} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={32} className="absolute inset-0 m-auto text-slate-300" />}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                 <Plus size={24} className="text-white" />
                 <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Clock size={24} className="text-white animate-spin" /></div>}
           </div>
           <div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Room Appearance</p>
              <p className="text-xs text-slate-500 dark:text-white/40">Upload a custom cover image to make your room stand out.</p>
           </div>
        </div>

        {/* Spotify URL */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 flex items-center gap-2">
            <SpotifyLogo size={14} className="text-emerald-500" weight="fill" /> Spotify Song or Playlist URL
          </label>
          <input value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/... or /playlist/..."
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white text-[13px] font-medium focus:outline-none focus:border-emerald-500/50 transition-all" />
        </div>

        {/* Telegram Audio URL */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 flex items-center gap-2">
            <TelegramLogo size={14} className="text-[#229ED9]" weight="fill" /> Telegram Voice Note URL
          </label>
          <input value={telegramMediaUrl} onChange={(e) => setTelegramMediaUrl(e.target.value)}
            placeholder="https://t.me/c/.../123 or direct audio file URL"
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white text-[13px] font-medium focus:outline-none focus:border-[#229ED9]/50 transition-all" />
          <p className="text-[10px] text-slate-400 dark:text-white/20">Paste a Telegram voice message link or a direct MP3/OGG URL. Members can mute locally.</p>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Circle Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white text-[15px] font-medium focus:outline-none focus:border-primary transition-all" />
        </div>



        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Purpose & Goals</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white text-[15px] font-medium focus:outline-none focus:border-primary transition-all resize-none" />
        </div>

        <div className="space-y-4 pt-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Member Capacity: <span className="text-primary">{memberLimit}</span></label>
          <input type="range" min={2} max={100} value={memberLimit} onChange={(e) => setMemberLimit(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full appearance-none accent-primary cursor-pointer" />
        </div>

        <button onClick={() => setIsPublic(!isPublic)} className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[24px] hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isPublic ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
              {isPublic ? <Globe size={22} weight="fill" /> : <Lock size={22} weight="fill" />}
            </div>
            <div className="text-left">
              <span className="text-sm font-black text-slate-800 dark:text-white">{isPublic ? "Public Discovery" : "Invite Only"}</span>
              <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest">{isPublic ? "Visible in social directory" : "Only accessible via code"}</p>
            </div>
          </div>
          <div className={cn("w-12 h-6 rounded-full flex items-center px-1 transition-colors", isPublic ? "bg-emerald-500" : "bg-amber-500")}>
            <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", isPublic ? "translate-x-6" : "translate-x-0")} />
          </div>
        </button>

        <button onClick={save} disabled={saving} className="w-full py-4 bg-primary text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-[24px] hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 shadow-lg shadow-primary/10">
          {saving ? "Saving Changes..." : "Save Preferences"}
        </button>
      </div>

      <div className="w-full lg:w-72 space-y-6">
        <div className={cn(GLASS, "rounded-[32px] p-8 border-red-500/20")}>
          <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4">Danger Zone</h3>
          <p className="text-[11px] text-slate-500 dark:text-white/30 font-medium leading-relaxed mb-6">Once deleted, all room content, chats, and progress records will be permanently erased.</p>
          <button onClick={onDelete} className="w-full py-3.5 bg-red-500/5 border border-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/10 transition-all">
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className={cn(GLASS, "rounded-[40px] py-20 flex flex-col items-center justify-center text-center gap-4 shadow-inner")}>
      <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-white/10 shadow-sm">{icon}</div>
      <p className="text-sm font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">{text}</p>
    </div>
  );
}

// ── Focus Timer (Persistent) ────────────────────────────────
function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("medqs-focus-timer");
    if (saved) {
      const { time, lastUpdated, active } = JSON.parse(saved);
      const elapsed = active ? Math.floor((Date.now() - lastUpdated) / 1000) : 0;
      setTimeLeft(Math.max(0, time - elapsed));
      setIsActive(active);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      toast.success("Focus session complete!");
    }
    
    localStorage.setItem("medqs-focus-timer", JSON.stringify({
      time: timeLeft,
      lastUpdated: Date.now(),
      active: isActive
    }));

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn(GLASS, "rounded-[32px] p-6 text-center group")}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Focus Session</p>
      <div className="text-4xl font-black text-slate-800 dark:text-white tabular-nums tracking-tighter mb-6 group-hover:scale-110 transition-transform duration-500">
        {format(timeLeft)}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setIsActive(!isActive)}
          className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isActive ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-primary text-white shadow-lg shadow-primary/20")}
        >
          {isActive ? "Pause" : "Start"}
        </button>
        <button 
          onClick={() => { setIsActive(false); setTimeLeft(25 * 60); }}
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 transition-all"
        >
          <ArrowClockwise size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Spotify Player ───────────────────────────────────────────
function SpotifyPlayer() {
  return (
    <div className={cn(GLASS, "rounded-[32px] p-4 overflow-hidden relative")}>
      <iframe 
        style={{ borderRadius: '24px' }}
        src="https://open.spotify.com/embed/playlist/37i9dQZF1DWZqd5YICuS9s?utm_source=generator&theme=0" 
        width="100%" 
        height="152" 
        frameBorder="0" 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy"
      ></iframe>
    </div>
  );
}

// ── AI Analysis Tab (New Premium Feature) ────────────────────
function AiAnalysisTab({ room, currentUserId }: { room: Room; currentUserId: string }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={cn(GLASS, "rounded-[40px] p-10 overflow-hidden relative")}>
        <div className="absolute -top-10 -right-10 h-64 w-64 bg-primary/10 blur-[100px] animate-pulse" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-32 w-32 rounded-[32px] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/40 flex-shrink-0">
               <Sparkle size={56} className="text-white" weight="fill" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-3">Personalized AI Performance Analysis</h2>
              <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed font-medium">Dr. Q is currently analyzing your interactions in <span className="text-primary font-bold">{room.name}</span> to provide curriculum-aligned academic insights.</p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
             <div className="p-6 rounded-[32px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-2">Academic Mastery</p>
                <div className="flex items-center gap-3">
                   <span className="text-4xl font-black text-slate-800 dark:text-white tabular-nums">78%</span>
                   <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">+4%</span>
                </div>
                <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-primary" style={{ width: '78%' }} />
                </div>
             </div>
             <div className="p-6 rounded-[32px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-2">Clinical Logic</p>
                <div className="flex items-center gap-3">
                   <span className="text-4xl font-black text-slate-800 dark:text-white tabular-nums">High</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-white/30 mt-4">Top 15% of peers in this room</p>
             </div>
             <div className="p-6 rounded-[32px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-2">Collaboration</p>
                <div className="flex items-center gap-3">
                   <span className="text-4xl font-black text-slate-800 dark:text-white tabular-nums">A+</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-white/30 mt-4">Exceptional engagement</p>
             </div>
          </div>

          <div className="mt-10 p-8 rounded-[32px] bg-primary/5 border border-primary/10 shadow-inner">
             <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 bg-primary/15 rounded-xl flex items-center justify-center text-primary">
                   <Target size={20} weight="fill" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Dr. Q's Strategy Recommendations</h4>
             </div>
             <ul className="space-y-4">
                {[
                  "Focus on Pathology sessions scheduled for this Wednesday.",
                  "Review the recent discussion on cardiovascular symptoms.",
                  "Your speed bonus eligibility is high; complete 2 more tasks to unlock."
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-4 text-xs font-bold text-slate-600 dark:text-white/60 leading-relaxed group">
                     <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                     {s}
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
