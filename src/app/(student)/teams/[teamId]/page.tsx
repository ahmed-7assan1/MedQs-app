"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Users, ShieldCheck, CheckCircle2, MoreHorizontal, MessageSquare, Plus, Activity, BookOpen } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

// Mock data (Normally fetched based on teamId)
const MOCK_TEAM = {
  id: "1",
  name: "Cardio Excellence",
  description: "Dedicated to the mastery of cardiology and ECG interpretations. We provide weekly summaries and case studies.",
  imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Cardio&backgroundColor=ef4444",
  followersCount: 1240,
  faculty: { name: "Human Medicine" },
  lecturesCount: 45,
  postsCount: 120,
  isFollowing: false
};

export default function TeamProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [isFollowing, setIsFollowing] = useState(MOCK_TEAM.isFollowing);
  
  // Note: in a real app, you would fetch the team data based on params.teamId

  return (
    <div className="min-h-screen bg-[#07080f] pb-32">
      {/* Cover Banner */}
      <div className="h-48 md:h-64 w-full bg-gradient-to-br from-[#131220] to-[#1a182b] relative border-b border-white/5">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
         
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
         {/* Profile Header section */}
         <div className="flex flex-col md:flex-row gap-6 md:items-end relative -mt-16 md:-mt-20 mb-8">
            {/* Avatar */}
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-3xl bg-black border-4 border-[#07080f] shadow-2xl overflow-hidden shrink-0 relative z-10">
               <img src={MOCK_TEAM.imageUrl} alt={MOCK_TEAM.name} className="h-full w-full object-cover" />
            </div>

            {/* Title & Actions */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 md:mt-0 md:pb-4">
               <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-2">
                     {MOCK_TEAM.name}
                     <CheckCircle2 className="h-6 w-6 text-primary" />
                  </h1>
                  <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-1 flex items-center gap-1.5">
                     <ShieldCheck className="h-4 w-4" /> {MOCK_TEAM.faculty.name}
                  </p>
               </div>

               {/* Action Buttons */}
               <div className="flex items-center gap-3">
                  <button 
                     onClick={() => setIsFollowing(!isFollowing)}
                     className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg ${
                        isFollowing 
                        ? "bg-white/10 text-white hover:bg-white/20 border border-white/10" 
                        : "btn-gradient text-white"
                     }`}
                  >
                     {isFollowing ? (
                        <>Following</>
                     ) : (
                        <><Plus className="h-4 w-4" /> Follow</>
                     )}
                  </button>
                  <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
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
               <div className="rounded-[24px] border border-white/5 bg-[#131220] p-6 shadow-xl">
                  <h3 className="text-lg font-black text-white mb-3">About the Team</h3>
                  <p className="text-white/60 font-medium leading-relaxed">
                     {MOCK_TEAM.description}
                  </p>
               </div>

               {/* Tabs placeholder for content (Lectures / Posts) */}
               <div>
                  <div className="flex items-center gap-6 border-b border-white/10 mb-6 px-2">
                     <button className="pb-4 border-b-2 border-primary text-white font-bold">Recent Updates</button>
                     <button className="pb-4 border-b-2 border-transparent text-white/40 font-bold hover:text-white transition-colors">Team Lectures</button>
                  </div>
                  
                  {/* Empty state for demo */}
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
                     <MessageSquare className="h-12 w-12 text-white/10 mx-auto mb-4" />
                     <p className="text-white/40 font-bold">No recent posts available.</p>
                  </div>
               </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="space-y-6">
               
               {/* Stats Card */}
               <div className="rounded-[24px] border border-white/5 bg-[#131220] p-6 shadow-xl space-y-4">
                  <h3 className="text-base font-black text-white uppercase tracking-widest text-white/40 mb-4">Team Stats</h3>
                  
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                           <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="font-bold text-white/80">Followers</span>
                     </div>
                     <span className="font-black text-white">{MOCK_TEAM.followersCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                           <BookOpen className="h-5 w-5 text-purple-500" />
                        </div>
                        <span className="font-bold text-white/80">Lectures</span>
                     </div>
                     <span className="font-black text-white">{MOCK_TEAM.lecturesCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                           <Activity className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span className="font-bold text-white/80">Posts</span>
                     </div>
                     <span className="font-black text-white">{MOCK_TEAM.postsCount}</span>
                  </div>
               </div>

            </div>
         </div>
      </div>
    </div>
  );
}
