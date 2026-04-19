"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Search, Video, Users, CheckCircle2, Play, 
  Loader2, Filter, Heart, ArrowRight, Sparkles, BookOpen,
  ChevronRight, Calendar, Bookmark, LayoutGrid, List,
  ChevronLeft, MoreHorizontal, X, SearchCode, Eye, EyeOff,
  GraduationCap, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

interface Instructor {
  id: string;
  youtubeId: string;
  name: string;
  handle?: string;
  thumbnail?: string;
  subscribers?: string;
  followersCount: number;
  isFollowing: boolean;
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
  lectureId?: string;
  lectureTitle?: string;
  subjectName?: string;
  moduleId?: string;
  isCurriculum?: boolean;
}

export default function VideosHubPage() {
  const [hideEducators, setHideEducators] = useState(false);
  const [showAllInstructors, setShowAllInstructors] = useState(false);
  const [instructorQuery, setInstructorQuery] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  
  const [curriculumVideos, setCurriculumVideos] = useState<VideoResult[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("hide_educators");
    if (cached === "true") setHideEducators(true);

    fetch("/api/v1/videos/instructors")
      .then(r => r.json())
      .then(data => {
        setInstructors(Array.isArray(data) ? data : []);
        setLoadingInstructors(false);
      })
      .catch(() => setLoadingInstructors(false));

    fetch("/api/v1/videos/curriculum")
      .then(r => r.json())
      .then(data => {
        setCurriculumVideos(Array.isArray(data) ? data : []);
        setLoadingCurriculum(false);
      })
      .catch(() => setLoadingCurriculum(false));
  }, []);

  // Instant Search with Debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!globalQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
       performSearch();
    }, 400);

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [globalQuery]);

  async function performSearch() {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/v1/videos/search?q=${encodeURIComponent(globalQuery)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch { } finally { setIsSearching(false); }
  }

  const toggleHideEducators = () => {
    const newVal = !hideEducators;
    setHideEducators(newVal);
    localStorage.setItem("hide_educators", String(newVal));
  };

  const filteredInstructors = instructors.filter(inst => 
    inst.name.toLowerCase().includes(instructorQuery.toLowerCase()) || 
    (inst.handle && inst.handle.toLowerCase().includes(instructorQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-24 w-full overflow-x-hidden pt-0 animate-in fade-in duration-500">
      {/* ─── 1. MINIMAL HEADER ─── */}
      <header className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 px-4 h-12 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Videos
        </h1>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsSearching(!isSearching)}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          <button 
            onClick={() => setShowAllInstructors(!showAllInstructors)}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-all",
              showAllInstructors && "rotate-180 text-primary"
            )}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ─── 2. SEARCH BAR (COLLAPSIBLE) ─── */}
      {isSearching && (
        <div className="px-4 py-3 bg-muted/20 border-b border-border/30 animate-in slide-in-from-top-2 duration-300">
          <div className="relative flex items-center bg-card border border-border/60 rounded-lg px-3 py-1 focus-within:ring-1 focus-within:ring-primary/20">
            <Search className="h-4 w-4 text-muted-foreground/50 mr-2" />
            <input 
              type="text"
              autoFocus
              placeholder="ابحث عن دروس، فصول، أو معلمين..."
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              className="flex-1 bg-transparent border-none py-2 text-[15px] outline-none placeholder:text-muted-foreground/30 font-bold"
            />
            {globalQuery && (
              <button onClick={() => setGlobalQuery("")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── 3. INSTRUCTORS (COLLAPSIBLE) ─── */}
      {showAllInstructors && (
        <section className="px-4 py-6 border-b border-border/30 bg-muted/10 animate-in fade-in slide-in-from-top-4 duration-500">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4 px-1">Authority Sources</p>
           <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {instructors.map((inst) => (
                 <Link 
                  key={inst.id} 
                  href={`/videos/instructor/${inst.id || inst.youtubeId}`} 
                  className="flex-none w-16 group flex flex-col items-center gap-2"
                 >
                    <div className="h-14 w-14 rounded-full overflow-hidden border border-border group-hover:border-primary transition-all p-0.5">
                       <img src={inst.thumbnail} className="h-full w-full rounded-full object-cover" alt="" />
                    </div>
                    <p className="text-[9px] font-bold text-center truncate w-full opacity-60 uppercase">{inst.name}</p>
                 </Link>
              ))}
           </div>
        </section>
      )}

      {/* ─── 4. VIDEO FEED ─── */}
      <main className="px-4 py-6 space-y-12">
        {/* Search Results / Curriculum Feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
          {(searchResults.length > 0 ? searchResults : curriculumVideos).map((video) => {
             const TargetLink = (video.lectureId && video.moduleId)
               ? `/modules/${video.moduleId}/lectures/${video.lectureId}/video` 
               : `https://youtube.com/watch?v=${video.videoId}`;
             return (
               <div key={video.id + (video.videoId || video.title)} className="group flex flex-col gap-3">
                  {/* Thumbnail with slight rounding (8px) */}
                  <Link href={TargetLink} className="block relative aspect-video rounded-[8px] overflow-hidden bg-muted border border-border/10 group-hover:border-primary/20 transition-all shadow-sm">
                     <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                     {video.isCurriculum && (
                        <div className="absolute top-2 left-2">
                           <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[8px] font-black text-white uppercase rounded-[4px] shadow-lg">
                              Academic
                           </div>
                        </div>
                     )}
                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-10 w-10 text-white fill-current" />
                     </div>
                  </Link>
                  
                  {/* Info Row */}
                  <div className="flex gap-3 px-0.5">
                     <Link href={`/videos/instructor/${video.channelId}`} className="h-9 w-9 rounded-full overflow-hidden flex-none border border-border mt-0.5">
                        <img src={video.channelThumbnail || "/placeholder-avatar.png"} className="h-full w-full object-cover" alt="" />
                     </Link>
                     <div className="flex flex-col gap-1 min-w-0">
                        <Link href={TargetLink} className="font-bold text-[15px] leading-tight line-clamp-2 transition-colors hover:text-primary">
                          {video.title}
                        </Link>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground font-medium">
                           <span className="flex items-center gap-1">
                              {video.channelTitle} {video.source === "medqs" && <CheckCircle2 className="h-3 w-3 text-primary" />}
                           </span>
                           {(video.subjectName || video.moduleName) && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <span className="text-primary/70">{video.moduleName || video.subjectName}</span>
                              </>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
             );
          })}
        </div>

        {/* Empty State */}
        {!loadingCurriculum && searchResults.length === 0 && curriculumVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 opacity-20">
            <Video className="h-16 w-16 mb-4" />
            <p className="font-semibold text-sm italic">No videos to show</p>
          </div>
        )}

        {/* Loading State */}
        {loadingCurriculum && curriculumVideos.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-video bg-muted rounded-[8px]" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
