"use client";

import { useState, useEffect, useMemo } from "react";

import { 
  Search, Play, Loader2, X, PlusCircle, CheckCircle2, Clapperboard,
  Video, LayoutGrid, List as ListIcon, Sparkles, Clock, Calendar,
  ChevronRight, ArrowRight, Star, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PostCardRedesigned } from "@/components/forum/PostCardRedesigned";

interface Instructor {
  id: string;
  youtubeId: string;
  name: string;
  thumbnail?: string;
}

interface VideoResult {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelThumbnail?: string;
  channelId: string;
  source: string;
  moduleId?: string;
  moduleName?: string;
}

export default function VideosHubPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [curriculumVideos, setCurriculumVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeSubject, setActiveSubject] = useState("All");
  const [posts, setPosts] = useState<any[]>([]);
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    // Parallel fetch initial data
    Promise.all([
      fetch("/api/v1/videos/instructors").then(r => r.json()),
      fetch("/api/v1/videos/curriculum").then(r => r.json()),
      fetch("/api/v1/feed?limit=10").then(r => r.json()), // Fetch community posts
      fetch("/api/v1/modules-all").then(r => r.json()), // Fetch modules for filters
    ]).then(([instData, currData, postData, modData]) => {
      setInstructors(Array.isArray(instData) ? instData : []);
      setCurriculumVideos(Array.isArray(currData) ? currData : []);
      setPosts(Array.isArray(postData) ? postData : []);
      
      if (Array.isArray(modData)) {
        const uniqueNames = Array.from(new Set(modData.map((m: any) => m.name)));
        setModules(["All", ...uniqueNames.slice(0, 8)]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!globalQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/v1/videos/search?q=${encodeURIComponent(globalQuery)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch { } finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [globalQuery]);

  const displayVideos = useMemo(() => {
    let source = searchResults.length > 0 ? searchResults : curriculumVideos;
    if (activeSubject !== "All") {
      source = source.filter(v => v.moduleName === activeSubject);
    }
    return source;
  }, [searchResults, curriculumVideos, activeSubject]);

  const feedItems = useMemo(() => {
    const items: { type: "video" | "post"; data: any }[] = [];
    displayVideos.forEach((v, i) => {
      items.push({ type: "video", data: v });
      if ((i + 1) % 4 === 0 && posts[Math.floor(i / 4)]) {
        items.push({ type: "post", data: posts[Math.floor(i / 4)] });
      }
    });
    return items;
  }, [displayVideos, posts]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Premium Hero Section */}
      <div className="relative h-[280px] md:h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/20 via-[#1a0505] to-[#0a0a0a] z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492619334760-22c69e46a788?q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        
        <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-end pb-8 md:pb-12">
          <Link 
            href="/dashboard-app" 
            className="absolute top-8 left-6 md:left-8 flex items-center justify-center h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-105 transition-all shadow-lg backdrop-blur-md"
            aria-label="Back to Home"
          >
            <Home className="h-5 w-5" />
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-400/10 backdrop-blur-md border border-red-400/20 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <Video className="h-3.5 w-3.5" />
            Visual Learning Engine
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Videos.
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Immersive medical lectures from top educators. Master your curriculum with crystal clear visual explanations.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-8 relative z-30">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12">
          <div className="relative w-full lg:w-[500px]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500/50" />
            <input 
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Search lectures, topics, educators..." 
              className="w-full h-16 bg-[#1a1a1a] border border-white/5 rounded-2xl pl-14 pr-6 text-base font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-white/20"
            />
            {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-rose-500" />}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full lg:w-auto pb-2 lg:pb-0">
             {modules.map(mod => (
              <button
                key={mod}
                onClick={() => setActiveSubject(mod)}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-[13px] font-bold transition-all shrink-0 border whitespace-nowrap",
                  activeSubject === mod 
                    ? "bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                    : "bg-[#1a1a1a] border-white/5 text-white/40 hover:text-white hover:bg-[#252525] hover:border-red-500/30"
                )}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* Instructors Circle Row */}
        {instructors.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-black tracking-tight">Top Educators</h2>
            </div>
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-4">
              {instructors.map((inst) => (
                <div key={inst.id} className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer">
                   <div className="h-20 w-20 rounded-full border-2 border-white/5 p-1 group-hover:border-red-500 transition-all duration-500 overflow-hidden shadow-lg group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                     <div className="h-full w-full rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 bg-[#1a1a1a]">
                       <img 
                         src={inst.thumbnail || `https://ui-avatars.com/api/?name=${inst.name}&background=534AB7&color=fff`} 
                         alt={inst.name}
                         className="h-full w-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
                       />
                     </div>
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                     {inst.name.split(' ')[0]}
                   </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="space-y-16">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black tracking-tighter">
                {globalQuery ? `Found ${displayVideos.length} Videos` : (activeSubject === "All" ? "Featured Lectures" : `${activeSubject} Lectures`)}
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-video rounded-[32px] bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : feedItems.length === 0 ? (
               <div className="py-32 flex flex-col items-center justify-center text-white/10">
                <Clapperboard className="h-24 w-24 mb-6 opacity-20" />
                <p className="text-xl font-bold tracking-tight">No videos found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {feedItems.map((item, idx) => {
                   if (item.type === "post") {
                    return (
                      <motion.div 
                        key={`post-${item.data.id}`} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="rounded-[32px] overflow-hidden bg-white/[0.02] border border-white/5 p-2 flex flex-col"
                      >
                        <div className="px-6 pt-4 pb-2 text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">
                          From the community
                        </div>
                        <PostCardRedesigned post={item.data} />
                      </motion.div>
                    );
                  }

                  const video = item.data;
                  const href = (video.lectureId && video.moduleId)
                    ? `/modules/${video.moduleId}/lectures/${video.lectureId}/video`
                    : `https://youtube.com/watch?v=${video.videoId}`;

                  return (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      href={href} 
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function VideoCard({ video, href }: { video: VideoResult, href: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUnmuted, setIsUnmuted] = useState(false);

  return (
    <motion.div 
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => { setIsHovered(false); setIsUnmuted(false); }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col p-4 rounded-[40px] bg-[#1a1a1a] hover:bg-[#222] border border-white/5 hover:border-red-400/20 transition-all shadow-2xl overflow-hidden"
    >
      <Link href={href} className="relative aspect-video rounded-[32px] overflow-hidden mb-5 border border-white/5 bg-black block">
        {/* Thumbnail Layer */}
        <div className={cn("absolute inset-0 transition-opacity duration-700", isHovered ? "opacity-0" : "opacity-100")}>
          <img 
            src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" 
            alt={video.title} 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <div className="h-16 w-16 rounded-full bg-white text-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] transform translate-y-8 group-hover:translate-y-0 transition-all duration-500">
              <Play className="h-7 w-7 fill-current ml-1.5" />
            </div>
          </div>
        </div>

        {/* Hover Autoplay Iframe Layer */}
        {isHovered && video.videoId && (
          <div className="absolute inset-0 z-0 bg-black animate-in fade-in duration-1000 delay-300">
            <iframe 
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=${isUnmuted ? 0 : 1}&controls=0&modestbranding=1&playsinline=1`}
              className="w-full h-full object-cover pointer-events-none scale-150"
              allow="autoplay; encrypted-media"
            />
          </div>
        )}


        {video.source === "medqs" && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-[10px] font-black text-white uppercase tracking-widest z-20">
            Official
          </div>
        )}
      </Link>
      
      <div className="px-2 space-y-2">
        <div className="flex items-start gap-3">
          <img 
            src={video.channelThumbnail || `https://ui-avatars.com/api/?name=${video.channelTitle}&background=534AB7&color=fff`} 
            className="h-9 w-9 rounded-full border border-white/10 object-cover" 
            alt="" 
          />
          <div className="flex-1 min-w-0">
            <Link href={href} className="font-bold text-[17px] leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
              {video.title}
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2 px-12">
          <span className="text-xs font-medium text-white/40 truncate">{video.channelTitle}</span>
          <span className="h-1 w-1 rounded-full bg-white/10" />
          <span className="text-xs font-bold text-red-500/60 truncate uppercase tracking-tighter">{video.moduleName || "Medical"}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/[0.03] flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
          <Clock className="h-3.5 w-3.5" /> 45:00
        </div>
        <ArrowRight className="h-4 w-4 text-red-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
      </div>
    </motion.div>
  );
}
