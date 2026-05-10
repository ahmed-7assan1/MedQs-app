"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Users, ShieldCheck, CheckCircle2, MoreHorizontal, MessageSquare, Plus, Activity, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TeamEditModal } from "@/components/teams/TeamEditModal";
import toast from "react-hot-toast";
import { UserPlus, UserMinus, ShieldAlert, Mail } from "lucide-react";

export default function TeamProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "tasks" | "flashcards" | "leaderboard" | "members">("feed");
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/teams/${params.teamId}`)
      .then(res => res.json())
      .then(data => {
        setTeam(data);
        setIsFollowing(data.isFollowing);
        setMyRole(data.myRole);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.teamId]);

  const isAdminOrLeader = myRole === "LEADER" || myRole === "ADMIN";

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${params.teamId}/follow`, { method: "POST" });
      const data = await res.json();
      if (data.following !== undefined) {
        setIsFollowing(data.following);
        setTeam((prev: any) => ({
          ...prev,
          followersCount: prev.followersCount + (data.following ? 1 : -1)
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "members") {
      setMembersLoading(true);
      fetch(`/api/v1/teams/${params.teamId}/members`)
        .then(res => res.json())
        .then(data => {
          setMembers(data);
          setMembersLoading(false);
        })
        .catch(() => setMembersLoading(false));
    }
  }, [activeTab, params.teamId]);

  const handleAddMember = async () => {
    const email = prompt("Enter the student's email to add:");
    if (!email) return;
    try {
      const res = await fetch(`/api/v1/teams/${params.teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "MEMBER" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Member added successfully!");
        setMembers(prev => [...prev, data]);
      } else {
        toast.error(data.error || "Failed to add member");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      await fetch(`/api/v1/teams/${params.teamId}/members/${userId}`, { method: "DELETE" });
      setMembers(prev => prev.filter(m => m.userId !== userId));
      toast.success("Member removed");
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  // ... rest of the component logic ...

  if (loading) return (
    <div className="min-h-screen bg-[#07080f] flex items-center justify-center">
       <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!team) return (
    <div className="min-h-screen bg-[#07080f] flex items-center justify-center">
       <div className="text-center">
          <Users className="h-12 w-12 text-white/10 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Team not found</h2>
          <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">Go Back</button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07080f] pb-32">
      {/* Cover Banner */}
      <div className="h-48 md:h-72 w-full bg-[#131220] relative border-b border-white/5 overflow-hidden">
         {team.coverUrl ? (
            <img src={team.coverUrl} className="w-full h-full object-cover opacity-80" alt="" />
         ) : (
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-[#07080f] to-transparent" />
         
         <div className="absolute top-6 left-6 z-10">
            <button 
               onClick={() => router.back()}
               className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition-all"
            >
               <ArrowLeft className="h-5 w-5" />
            </button>
         </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8 relative">
         {/* Stats Row for Mobile (at the top) */}
         <div className="flex md:hidden items-center justify-around py-4 border-b border-white/5 mb-6 text-center">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Followers</p>
               <p className="text-lg font-black text-white">{team.followersCount || 0}</p>
            </div>
            <div className="w-[1px] h-8 bg-white/5" />
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Lectures</p>
               <p className="text-lg font-black text-white">{team._count?.lectures || 0}</p>
            </div>
            <div className="w-[1px] h-8 bg-white/5" />
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Posts</p>
               <p className="text-lg font-black text-white">{team._count?.posts || 0}</p>
            </div>
         </div>

         {/* Profile Header section */}
         <div className="flex flex-col md:flex-row gap-6 md:items-end relative -mt-16 md:-mt-24 mb-8">
            {/* Avatar */}
            <div className="h-32 w-32 md:h-44 md:w-44 rounded-[32px] bg-black border-4 border-[#07080f] shadow-2xl overflow-hidden shrink-0 relative z-10">
               <img src={team.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${team.id}&backgroundColor=6c5ff0`} alt={team.name} className="h-full w-full object-cover" />
            </div>

            {/* Title & Actions */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 md:mt-0 md:pb-6">
               <div>
                  <h1 className="text-3xl md:text-5xl font-black text-white flex items-center gap-3">
                     {team.name}
                     <CheckCircle2 className="h-6 w-6 text-primary" />
                  </h1>
                  <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[11px] mt-2 flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 text-primary" /> {team.faculty?.name || "General Medical Team"}
                  </p>
               </div>

               {/* Action Buttons */}
               <div className="flex items-center gap-3">
                  {isAdminOrLeader && (
                    <button 
                       onClick={() => setIsEditModalOpen(true)}
                       className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider transition-all bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    >
                       Edit Profile
                    </button>
                  )}
                  <button 
                     onClick={handleFollow}
                     disabled={followLoading}
                     className={`flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider transition-all shadow-xl min-w-[140px] ${
                        isFollowing 
                        ? "bg-white/5 text-white hover:bg-white/10 border border-white/10" 
                        : "btn-gradient text-white"
                     }`}
                  >
                     {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? "Following" : "Follow Team"}
                  </button>
                  <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
                     <MoreHorizontal className="h-5 w-5" />
                  </button>
               </div>
            </div>
         </div>

         {/* Layout Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            
            {/* Main Content (Left) */}
            <div className="space-y-8">
               
               {/* About Section */}
               <div className="rounded-[32px] border border-white/5 bg-[#131220] p-8 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                     <Users className="h-32 w-32" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-4 uppercase tracking-widest text-primary">About the Team</h3>
                  <p className="text-white/60 font-medium leading-relaxed text-lg">
                     {team.description || "This team hasn't provided a description yet."}
                  </p>
               </div>

               {/* Tabs for content (Lectures / Posts / Members) */}
               <div className="space-y-6">
                  <div className="flex items-center gap-8 border-b border-white/10 px-2 overflow-x-auto no-scrollbar">
                     {(['feed', 'tasks', 'flashcards', 'leaderboard', 'members'] as const).map((tab) => (
                       <button 
                         key={tab}
                         onClick={() => setActiveTab(tab as any)}
                         className={`pb-4 border-b-2 font-black uppercase tracking-widest text-[12px] transition-all whitespace-nowrap ${
                           activeTab === tab ? "border-primary text-white" : "border-transparent text-white/40 hover:text-white"
                         }`}
                       >
                         {tab === 'feed' ? 'Community Feed' : tab}
                       </button>
                     ))}
                  </div>
                  
                  {activeTab === "members" ? (
                    <div className="space-y-4">
                       {isAdminOrLeader && (
                         <button 
                           onClick={handleAddMember}
                           className="w-full py-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                         >
                           <Plus className="h-4 w-4" /> Add New Member
                         </button>
                       )}

                       {membersLoading ? (
                         <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
                       ) : (
                         <div className="grid grid-cols-1 gap-3">
                           {members.map((m) => (
                             <div key={m.userId} className="p-4 rounded-2xl bg-[#131220] border border-white/5 flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-xl bg-white/5 overflow-hidden">
                                   <img src={m.user.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${m.userId}`} alt="" className="h-full w-full object-cover" />
                                 </div>
                                 <div>
                                   <p className="font-bold text-white text-sm">{m.user.name}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                     <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                       m.role === 'LEADER' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'
                                     }`}>
                                       {m.role}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                               {isAdminOrLeader && m.role !== 'LEADER' && (
                                 <button 
                                   onClick={() => removeMember(m.userId)}
                                   className="p-2 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                 >
                                   <UserMinus className="h-4 w-4" />
                                 </button>
                               )}
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  ) : activeTab === "tasks" ? (
                    <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
                       <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                       >
                          <Activity className="h-16 w-16 text-emerald-500/50 mx-auto mb-6" />
                       </motion.div>
                       <h3 className="text-xl font-black text-white mb-2">Simulation Tasks</h3>
                       <p className="text-white/40 font-bold uppercase tracking-[0.1em] text-xs">Clinical scenarios and OSCE stations assigned to this room will appear here.</p>
                       {isAdminOrLeader && (
                         <button className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-sm hover:bg-emerald-500/20 transition-all">
                           Create Task
                         </button>
                       )}
                    </div>
                  ) : activeTab === "flashcards" ? (
                    <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
                       <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                       >
                          <BookOpen className="h-16 w-16 text-indigo-500/50 mx-auto mb-6" />
                       </motion.div>
                       <h3 className="text-xl font-black text-white mb-2">Team Flashcards</h3>
                       <p className="text-white/40 font-bold uppercase tracking-[0.1em] text-xs">Shared spaced-repetition decks for collaborative studying.</p>
                       <button className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-sm hover:bg-indigo-500/20 transition-all">
                         Browse Decks
                       </button>
                    </div>
                  ) : activeTab === "leaderboard" ? (
                    <div className="rounded-[32px] border border-white/5 bg-[#16152A]/70 backdrop-blur-xl p-8">
                       <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                         <Activity className="text-amber-400 h-5 w-5" /> Active Rankings
                       </h3>
                       <div className="space-y-3">
                         {members.map((m, idx) => (
                           <div key={m.userId} className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                             <div className="flex items-center gap-4">
                               <div className="h-10 w-10 flex items-center justify-center font-black text-white/40 bg-white/5 rounded-xl">
                                 #{idx + 1}
                               </div>
                               <div className="h-10 w-10 rounded-full bg-white/5 overflow-hidden">
                                 <img src={m.user.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${m.userId}`} className="w-full h-full object-cover" />
                               </div>
                               <p className="font-bold text-sm text-white">{m.user.name}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-amber-400 font-black text-lg">{Math.floor(Math.random() * 500) + 100}</p>
                               <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Points</p>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  ) : (
                    <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.01] p-16 text-center">
                       <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                       >
                          <MessageSquare className="h-16 w-16 text-white/5 mx-auto mb-6" />
                       </motion.div>
                       <p className="text-white/20 font-black uppercase tracking-[0.2em] text-sm">No {activeTab} activity found yet</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Sidebar (Right) - Hidden on mobile, stats already at top */}
            <div className="hidden lg:block space-y-6">
               
               {/* Stats Card */}
               <div className="rounded-[32px] border border-white/5 bg-[#131220] p-8 shadow-xl space-y-6">
                  <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-4">Pulse Check</h3>
                  
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                           <Users className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Followers</p>
                           <p className="font-black text-white">{team.followersCount || 0}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                           <BookOpen className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Lectures</p>
                           <p className="font-black text-white">{team._count?.lectures || 0}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                           <Activity className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Posts</p>
                           <p className="font-black text-white">{team._count?.posts || 0}</p>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </div>

      {team && (
        <TeamEditModal 
          team={team}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={(updated) => setTeam((prev: any) => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}
