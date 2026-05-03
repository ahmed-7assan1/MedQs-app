"use client";

import { useState, useEffect } from "react";
import { 
  Play, Loader2, Home, Star, Check, 
  Users, Video, ArrowLeft, Heart, Share2, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface ChannelInfo {
  id: string;
  name: string;
  thumbnail: string;
  subscribers: string;
  description: string;
  banner?: string;
}

interface VideoResult {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelThumbnail?: string;
  moduleId?: string;
  lectureId?: string;
  subjectName?: string;
}

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/channels/${params.channelId}`)
      .then(r => r.json())
      .then(data => {
        if (data.channel) setChannel(data.channel);
        if (data.videos) setVideos(data.videos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.channelId]);

  const handleFollow = async () => {
    if (!channel) return;
    setFollowingLoading(true);
    try {
      const res = await fetch("/api/v1/youtube/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: channel.id })
      });
      const data = await res.json();
      if (data.ok) {
        setIsFollowing(true);
        toast.success(`Following ${channel.name} on YouTube!`);
      } else {
        toast.error(data.error || "Failed to follow");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setFollowingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <h1 className="text-2xl font-black mb-4">Channel not found</h1>
        <Link href="/videos" className="text-red-500 hover:underline">Back to Videos</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Banner */}
      <div className="relative h-[200px] md:h-[300px] w-full overflow-hidden bg-[#1a1a1a]">
        {channel.banner ? (
          <img src={channel.banner} className="w-full h-full object-cover opacity-60" alt="" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 to-slate-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        
        <Link 
          href="/videos" 
          className="absolute top-20 left-6 flex items-center justify-center h-10 w-10 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all shadow-xl backdrop-blur-md z-30"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="container mx-auto px-6 -mt-16 relative z-30">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-12">
          {/* Avatar */}
          <div className="h-32 w-32 md:h-40 md:w-40 rounded-[40px] border-4 border-[#0a0a0a] overflow-hidden shadow-2xl bg-[#1a1a1a] shrink-0">
            <img src={channel.thumbnail} className="h-full w-full object-cover" alt={channel.name} />
          </div>
          
          <div className="flex-1 space-y-4 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">{channel.name}</h1>
              <div className="bg-blue-500 rounded-full p-1"><Check className="h-3 w-3 text-white" /></div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-white/40 uppercase tracking-widest">
               <span className="flex items-center gap-2"><Users className="h-4 w-4 text-red-500" /> {channel.subscribers} Subscribers</span>
               <span className="flex items-center gap-2"><Video className="h-4 w-4 text-red-500" /> {videos.length} Lectures in Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-2">
             <button 
              onClick={handleFollow}
              disabled={isFollowing || followingLoading}
              className={cn(
                "px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-xl",
                isFollowing 
                  ? "bg-white/10 text-white/40 border border-white/5 cursor-default" 
                  : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
              )}
             >
               {followingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className={cn("h-4 w-4", isFollowing && "fill-current")} />}
               {isFollowing ? "Following" : "Follow"}
             </button>
             <button className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all">
                <Share2 className="h-5 w-5" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-12">
           {/* Videos Grid */}
           <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <h2 className="text-xl font-black uppercase tracking-widest">Available Lectures</h2>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input placeholder="Search in channel..." className="bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-red-500/50 transition-all" />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {videos.map(video => (
                    <VideoCard key={video.id} video={video} />
                 ))}
                 {videos.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/20">
                       <Video className="h-16 w-16 mb-4 opacity-10" />
                       <p className="font-bold uppercase tracking-widest">No matching lectures found</p>
                    </div>
                 )}
              </div>
           </section>

           {/* About / Sidebar */}
           <aside className="space-y-8">
              <div className="rounded-[32px] bg-white/[0.02] border border-white/5 p-8 space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500">About the Educator</h3>
                 <p className="text-sm leading-relaxed text-white/60 font-medium whitespace-pre-wrap line-clamp-[10]">
                    {channel.description || "No description provided."}
                 </p>
                 <div className="pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Global Rank</span>
                       <span className="text-sm font-black text-red-500">Top 1%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Students Impacted</span>
                       <span className="text-sm font-black">1.2M+</span>
                    </div>
                 </div>
              </div>

              <div className="p-1">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 px-4">Verification Status</h3>
                 <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                       <Check className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Official MedOneX Partner</span>
                 </div>
              </div>
           </aside>
        </div>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: VideoResult }) {
  const href = video.lectureId && video.moduleId 
    ? `/modules/${video.moduleId}/lectures/${video.lectureId}/video`
    : `https://youtube.com/watch?v=${video.videoId}`;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group relative bg-white/[0.03] border border-white/5 rounded-3xl p-4 hover:bg-white/[0.06] transition-all overflow-hidden"
    >
      <Link href={href} className="relative aspect-video rounded-2xl overflow-hidden mb-4 block">
        <img src={video.thumbnail} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-2xl">
            <Play className="h-5 w-5 fill-current ml-1" />
          </div>
        </div>
      </Link>
      
      <div className="space-y-3 px-1">
        <Link href={href} className="font-bold text-sm leading-tight line-clamp-2 hover:text-red-500 transition-colors">
          {video.title}
        </Link>
        <div className="flex items-center justify-between">
           <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{video.subjectName || "Medical"}</span>
           <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Watch Now</span>
        </div>
      </div>
    </motion.div>
  );
}
