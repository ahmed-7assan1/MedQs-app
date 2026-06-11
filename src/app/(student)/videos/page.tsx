"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, Play, Loader2, X, Clapperboard,
  Video, Clock, ArrowRight, Star, Home, ShieldCheck, Youtube
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PostCardRedesigned } from "@/components/forum/PostCardRedesigned";
import { InfiniteScrollContainer } from "@/components/ui/InfiniteScrollContainer";

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
  const [globalQuery, setGlobalQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [curriculumVideos, setCurriculumVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeSubject, setActiveSubject] = useState("All");
  const [posts, setPosts] = useState<any[]>([]);
  const [modules, setModules] = useState<string[]>([]);

  // Initial Fetch (Static data and Page 1)
  useEffect(() => {
    const init = async () => {
      try {
        const [instRes, currRes, postRes, modRes] = await Promise.all([
          fetch("/api/v1/videos/instructors"),
          fetch("/api/v1/videos/curriculum?page=1&limit=12"),
          fetch("/api/v1/feed?limit=10"),
          fetch("/api/v1/modules-all")
        ]);

        const instData = await instRes.json();
        const currData = await currRes.json();
        const postData = await postRes.json();
        const modData = await modRes.json();

        setInstructors(Array.isArray(instData) ? instData : []);
        setCurriculumVideos(currData?.items || []);
        setHasMore(currData?.hasMore ?? false);
        setPosts(Array.isArray(postData) ? postData : []);
        
        if (Array.isArray(modData)) {
          const uniqueNames = Array.from(new Set(modData.map((m: any) => m.name)));
          setModules(["All", ...uniqueNames.slice(0, 8)]);
        }
      } catch (err) {
        console.error("Failed to load videos:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Load More function
  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/v1/videos/curriculum?page=${nextPage}&limit=12`);
      const data = await res.json();
      if (data?.items) {
        setCurriculumVideos(prev => [...prev, ...data.items]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more videos:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ── Instant search (no debounce — filters locally + fires API simultaneously)
  const localFiltered = useMemo(() => {
    if (!globalQuery.trim()) return curriculumVideos;
    const q = globalQuery.toLowerCase();
    return curriculumVideos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.channelTitle.toLowerCase().includes(q) ||
      (v.moduleName || "").toLowerCase().includes(q)
    );
  }, [globalQuery, curriculumVideos]);

  useEffect(() => {
    if (!globalQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/v1/videos/search?q=${encodeURIComponent(globalQuery)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch { } finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [globalQuery]);

  const displayVideos = useMemo(() => {
    let source = searchResults.length > 0 ? searchResults : localFiltered;
    if (activeSubject !== "All") source = source.filter(v => v.moduleName === activeSubject);
    return source;
  }, [searchResults, localFiltered, activeSubject]);

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
    <div className="min-h-screen bg-background text-foreground pt-0 pb-32">
      {/* Hero */}
      <div className="relative h-[240px] md:h-[320px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/20 via-transparent to-[#07080f] z-10 hidden dark:block" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 via-transparent to-slate-50 z-10 dark:hidden" />
        <div className="absolute inset-0 dark:bg-black/20 bg-white/40 z-15" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492619334760-22c69e46a788?q=80&w=2000')] bg-cover bg-center opacity-30 dark:opacity-20" />
        
        <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-end pb-8 md:pb-10 pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400 mb-3 w-max">
            <Video className="h-3.5 w-3.5" />
            Visual Learning Engine
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter dark:text-white text-slate-900 mb-2 leading-none">
            Videos.
          </h1>
          <p className="text-xs md:text-base dark:text-white/40 text-slate-500 max-w-xl font-bold uppercase tracking-widest">
            Medical lectures from top educators worldwide.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-6 relative z-30 space-y-10">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Instant Search Bar */}
          <div className="relative w-full lg:w-[480px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500/40 group-focus-within:text-red-500 transition-colors" />
            <input 
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Search lectures, topics, educators..." 
              className="w-full h-14 bg-muted/30 border border-border rounded-2xl pl-12 pr-12 text-base font-bold focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-muted-foreground text-foreground"
            />
            <AnimatePresence>
              {globalQuery && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
                >
                  {isSearching && <Loader2 className="h-4 w-4 animate-spin text-red-500" />}
                  <button onClick={() => { setGlobalQuery(""); setSearchResults([]); }}>
                    <X className="h-4 w-4 dark:text-white/30 text-slate-400 hover:text-red-500 transition-colors" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Module Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:flex-1 pb-1">
            {modules.map(mod => (
              <button
                key={mod}
                onClick={() => setActiveSubject(mod)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border",
                  activeSubject === mod 
                    ? "bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20" 
                    : "bg-muted/30 border-border text-muted-foreground hover:border-red-400/50 hover:text-red-500"
                )}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* Top Educators */}
        {instructors.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-4 w-4 text-red-500" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] dark:text-white/40 text-slate-400">Top Educators</h2>
            </div>
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
              {instructors.map((inst) => (
                <Link 
                  key={inst.id} 
                  href={`/channels/${inst.youtubeId}`}
                  className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer"
                >
                  <div className="h-20 w-20 rounded-3xl border-2 dark:border-white/5 border-slate-200 p-1 group-hover:border-red-500 group-hover:rotate-3 transition-all duration-500 overflow-hidden shadow-sm">
                    <div className="h-full w-full rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 dark:bg-[#1a1a1a] bg-slate-100">
                      <img 
                        src={inst.thumbnail || `https://ui-avatars.com/api/?name=${inst.name}&background=6c5ff0&color=fff`} 
                        alt={inst.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest dark:text-white/30 text-slate-400 group-hover:text-red-500 transition-colors">
                    {inst.name.split(' ')[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Content Grid */}
        <section className="pt-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tighter dark:text-white text-slate-900">
              {globalQuery 
                ? <span>Results for <span className="text-red-500">"{globalQuery}"</span> — {displayVideos.length} found</span>
                : activeSubject === "All" ? "Featured Lectures" : `${activeSubject} Lectures`
              }
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-video rounded-[32px] dark:bg-white/5 bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : feedItems.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center dark:text-white/10 text-slate-200">
              <Clapperboard className="h-24 w-24 mb-6" />
              <p className="text-xl font-black uppercase tracking-widest">No signals found</p>
            </div>
          ) : (
            <InfiniteScrollContainer
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              endComponent={
                <div className="col-span-full py-10 text-center opacity-30">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">End of clinical curriculum</p>
                </div>
              }
            >
              {feedItems.map((item, idx) => {
                if (item.type === "post") {
                  return (
                    <motion.div 
                      key={`post-${item.data.id}`} 
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="rounded-[32px] overflow-hidden dark:bg-[#1a1a1a] bg-white dark:border-white/5 border-slate-200 border p-2 flex flex-col shadow-xl"
                    >
                      <div className="px-5 pt-4 pb-2 text-[10px] font-black text-red-500 uppercase tracking-[0.25em]">
                        Student Voice
                      </div>
                      <PostCardRedesigned post={item.data} />
                    </motion.div>
                  );
                }

                const video = item.data;
                const href = `/videos/reels?v=${video.id}`;

                return <VideoCard key={video.id} video={video} href={href} />;
              })}
            </InfiniteScrollContainer>
          )}
        </section>
      </div>

    </div>
  );
}

function VideoCard({ video, href }: { video: VideoResult, href: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col p-4 rounded-[28px] dark:bg-[#161523]/80 bg-white dark:hover:bg-white/[0.04] hover:bg-slate-50 border border-slate-200/60 dark:border-white/[0.04] transition-all shadow-sm hover:shadow-md dark:shadow-none overflow-hidden"
    >
      <Link href={href} className="relative aspect-video rounded-[24px] overflow-hidden mb-5 border dark:border-white/5 border-slate-200 dark:bg-black bg-slate-200 block">
        <div className={cn("absolute inset-0 transition-opacity duration-700", isHovered ? "opacity-0" : "opacity-100")}>
          <img 
            src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            alt={video.title} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl transform translate-y-6 group-hover:translate-y-0 transition-all duration-500">
              <Play className="h-7 w-7 fill-current ml-1" />
            </div>
          </div>
        </div>

        {isHovered && video.videoId && (
          <div className="absolute inset-0 z-0 bg-black animate-in fade-in duration-1000">
            <iframe 
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1`}
              className="w-full h-full scale-[1.35] pointer-events-none"
              allow="autoplay; encrypted-media"
            />
            {/* Overlay to catch clicks and hide any persistent YT UI */}
            <div className="absolute inset-0 z-10" />
          </div>
        )}

        {video.source === "medqs" && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 rounded-xl text-[10px] font-black text-white uppercase tracking-widest z-20 shadow-lg">
            OFFICIAL
          </div>
        )}
      </Link>
      
      <div className="px-2 space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-2xl overflow-hidden dark:border-white/10 border-slate-200 border shrink-0 bg-slate-100">
            <img 
              src={video.channelThumbnail || `https://ui-avatars.com/api/?name=${video.channelTitle}&background=6c5ff0&color=fff`} 
              className="h-full w-full object-cover" 
              alt="" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <Link href={href} className="font-black text-[16px] leading-tight line-clamp-2 dark:text-white text-slate-900 group-hover:text-red-500 transition-colors">
              {video.title}
            </Link>
            <Link 
              href={`/channels/${video.channelId}`}
              className="text-[11px] font-black uppercase tracking-widest dark:text-white/30 text-slate-400 mt-1 truncate hover:text-red-500 transition-colors block"
            >
              {video.channelTitle}
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {video.moduleName && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 dark:bg-red-500/10 bg-red-50 px-3 py-1 rounded-lg border border-red-500/10">
              {video.moduleName}
            </span>
          )}
        </div>
      </div>

        <div className="flex items-center gap-2">
          <Link 
            href={href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
             <Play className="h-3.5 w-3.5" /> Watch Now
          </Link>
          <Link 
            href={`/videos/reels?v=${video.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
             <Youtube className="h-3.5 w-3.5" /> Watch as Reel
          </Link>
        </div>
    </motion.div>
  );
}
