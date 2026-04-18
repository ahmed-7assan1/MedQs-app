"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Search, Video, Users, CheckCircle2, Play, 
  Loader2, Filter, Heart, ArrowRight, Sparkles, BookOpen,
  ChevronRight, Calendar, Bookmark, LayoutGrid, List,
  ChevronLeft, MoreHorizontal, X, SearchCode, Eye, EyeOff,
  GraduationCap
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
    <div className="min-h-screen bg-background pb-20 w-full overflow-x-hidden">
      {/* 1. Immersive Search Header (Full Width) */}
      <section className="relative pt-24 pb-16 overflow-hidden border-b border-border/40 bg-muted/20 w-full">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.1),transparent_70%)]" />
        <div className="w-full px-6 md:px-12 relative z-10 text-center space-y-8">
           <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight leading-loose italic uppercase">
                Content <span className="text-primary italic">Intelligence</span> Hub
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] opacity-50">
                Type anything to scan lectures, topics, or modules instantly.
              </p>
           </div>

           <div className="relative group max-w-3xl mx-auto">
             <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
             <div className="relative flex items-center bg-card/80 backdrop-blur-3xl border border-border/60 rounded-2xl shadow-2xl focus-within:border-primary/50 transition-all p-1.5 focus-within:shadow-primary/5">
                <div className="flex items-center flex-1">
                   <Search className="h-5 w-5 ml-4 text-muted-foreground/60" />
                   <input
                     type="text"
                     placeholder="Instant searching topics..."
                     value={globalQuery}
                     onChange={(e) => setGlobalQuery(e.target.value)}
                     className="flex-1 bg-transparent border-none placeholder:text-muted-foreground/40 text-lg font-bold px-4 py-3 outline-none focus:ring-0 focus-visible:ring-0"
                   />
                </div>
                {globalQuery && (
                   <button onClick={() => setGlobalQuery("")} className="mr-4 text-muted-foreground/40 hover:text-foreground">
                      <X className="h-4 w-4" />
                   </button>
                )}
                <div className="bg-primary/5 border border-primary/20 h-10 px-6 rounded-xl flex items-center gap-2">
                   {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Scanning Hub</span>
                </div>
             </div>
           </div>

           {hideEducators && (
              <button 
                onClick={toggleHideEducators}
                className="mx-auto mt-4 px-5 py-2 hover:scale-105 active:scale-95 bg-primary/5 border border-primary/10 rounded-full text-[9px] font-black text-primary/70 uppercase tracking-[0.2em] hover:bg-primary/10 transition-all flex items-center gap-2"
              >
                 <Eye className="h-3 w-3" /> Restore Curated Educators
              </button>
           )}
        </div>
      </section>

      {/* 2. Educator Navigation (Full Width) */}
      {!hideEducators && (
         <section className="bg-background border-b border-border/40 sticky top-14 z-30 py-6 w-full">
           <div className="w-full px-6 md:px-12 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 opacity-40">
                    <Users className="h-4 w-4 text-primary" /> Authority Sources
                 </h2>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowAllInstructors(!showAllInstructors)}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:scale-105 transition-all"
                    >
                      {showAllInstructors ? "Gallery Mode" : "Manage Educators"}
                    </button>
                    <button onClick={toggleHideEducators} className="h-8 w-8 rounded-xl hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all opacity-40">
                       <X className="h-4 w-4" />
                    </button>
                 </div>
              </div>

              {!showAllInstructors ? (
                 <div className="flex gap-8 overflow-x-auto no-scrollbar pb-2">
                    {instructors.map((inst) => (
                       <Link 
                        key={inst.id} 
                        href={`/videos/instructor/${inst.id || inst.youtubeId}`} 
                        className="flex-none w-16 md:w-24 group flex flex-col items-center gap-3 relative z-10"
                       >
                          <div className="relative h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden border-2 border-border/40 group-hover:border-primary/60 transition-all p-0.5 shadow-md">
                             <img src={inst.thumbnail} className="h-full w-full rounded-full object-cover grayscale-[20%] group-hover:grayscale-0" alt="" />
                          </div>
                          <p className="text-[10px] font-black tracking-tighter text-center truncate w-full opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all uppercase">{inst.name}</p>
                       </Link>
                    ))}
                 </div>
              ) : (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="relative max-w-sm">
                       <SearchCode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                       <input 
                         type="text" 
                         placeholder="Instant filter authority..."
                         value={instructorQuery}
                         onChange={(e) => setInstructorQuery(e.target.value)}
                         className="w-full h-10 pl-10 pr-6 rounded-xl bg-muted/40 border border-border text-[11px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary/40 outline-none"
                       />
                    </div>
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                       {filteredInstructors.map((inst) => (
                          <Link key={inst.id} href={`/videos/instructor/${inst.id || inst.youtubeId}`} className="p-3 rounded-2xl border border-border/40 hover:border-primary/40 hover:bg-card transition-all flex items-center gap-3">
                             <img src={inst.thumbnail} className="h-8 w-8 rounded-full object-cover border border-border shadow-sm" alt="" />
                             <h4 className="font-black text-[9px] truncate uppercase tracking-tighter opacity-70">{inst.name}</h4>
                          </Link>
                       ))}
                    </div>
                 </div>
              )}
           </div>
         </section>
      )}

      {/* 3. Main Grid (Full Width) */}
      <main className="w-full px-6 md:px-12 mt-16 space-y-20 overflow-hidden relative z-0">
        
        {/* Search Results */}
        {searchResults.length > 0 && (
           <section className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                    <Search className="h-5 w-5" />
                 </div>
                 <h2 className="text-xl md:text-2xl font-black font-display tracking-tight leading-none italic uppercase">Hub <span className="text-primary italic">Matches</span></h2>
              </div>

              <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                 {searchResults.map((video) => {
                    const TargetLink = (video.lectureId && video.moduleId)
                      ? `/modules/${video.moduleId}/lectures/${video.lectureId}/video` 
                      : `https://youtube.com/watch?v=${video.videoId}`;
                    return (
                       <div key={video.id + video.title} className="group flex flex-col gap-4">
                          <Link href={TargetLink} className="block relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-border/20 group-hover:border-primary/40 transition-all duration-700 z-10">
                             <img src={video.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                             {video.isCurriculum && (
                                <div className="absolute top-3 left-3">
                                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/90 backdrop-blur-xl rounded-xl text-[9px] font-black text-primary-foreground uppercase tracking-[0.2em] border border-white/20 shadow-xl shadow-primary/20">
                                      <GraduationCap className="h-3 w-3" /> Academic
                                   </div>
                                </div>
                             )}
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white shadow-2xl scale-50 group-hover:scale-100 transition-all duration-500">
                                   <Play className="h-6 w-6 fill-current ml-1" />
                                </div>
                             </div>
                          </Link>
                          
                          <div className="flex gap-4 px-1">
                             <Link href={`/videos/instructor/${video.channelId}`} className="h-10 w-10 rounded-full overflow-hidden flex-none border border-border mt-1 shadow-md z-10 hover:border-primary transition-colors">
                                <img src={video.channelThumbnail || "/placeholder-avatar.png"} className="h-full w-full object-cover" alt="" />
                             </Link>
                             <div className="flex flex-col gap-1.5 min-w-0">
                                <Link href={TargetLink} className="font-bold text-sm md:text-base leading-snug line-clamp-2 min-h-[44px] group-hover:text-primary transition-colors decoration-primary/40 group-hover:underline underline-offset-4 decoration-2 z-10">
                                  {video.title}
                                </Link>
                                <div className="flex flex-col text-[11px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                                   <span className="truncate flex items-center gap-2">
                                      {video.channelTitle} {video.source === "medqs" && <CheckCircle2 className="h-3.5 w-3.5 text-primary fill-primary/10" />}
                                   </span>
                                   {(video.subjectName || video.moduleName) && (
                                      <div className="flex items-center gap-2 text-[9px] italic mt-1 font-bold text-primary/60">
                                         <Bookmark className="h-3 w-3" /> {video.moduleName || video.subjectName}
                                      </div>
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </section>
        )}

        {/* Global Curriculum Feed */}
        {!searchResults.length && (
           <section className="space-y-12">
              <div className="flex items-end justify-between border-b border-border/40 pb-10">
                 <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-none italic uppercase">Semester <span className="metallic-text italic">Feed</span></h2>
                    <p className="text-muted-foreground text-[10px] font-bold opacity-40 uppercase tracking-[0.3em] px-1">Authority Learning Content Only</p>
                 </div>
              </div>

              {loadingCurriculum ? (
                 <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array(8).fill(0).map((_, i) => (
                      <div className="space-y-5 animate-pulse" key={i}>
                         <div className="aspect-video rounded-2xl bg-muted/40 border border-border/40 shadow-inner" />
                         <div className="h-5 bg-muted/40 rounded-full w-full" />
                         <div className="h-3 bg-muted/40 rounded-full w-2/3" />
                      </div>
                    ))}
                 </div>
              ) : curriculumVideos.length > 0 ? (
                 <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {curriculumVideos.map((video) => (
                       <div key={video.id} className="group flex flex-col gap-5">
                          <Link href={`/modules/${video.moduleId}/lectures/${video.lectureId}/video`} className="block relative aspect-video rounded-xl overflow-hidden bg-black shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] border border-border/40 group-hover:border-primary/60 transition-all duration-700 z-10">
                             <img src={video.thumbnail!} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 opacity-90 group-hover:opacity-100" alt="" />
                             <div className="absolute top-4 right-4 animate-in fade-in duration-700">
                                <div className="px-4 py-2 bg-black/60 backdrop-blur-3xl rounded-2xl border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.1em] transition-all group-hover:bg-primary group-hover:border-primary/50">
                                  {video.subjectName}
                                </div>
                             </div>
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 scale-75 group-hover:scale-100 ring-4 ring-white/10">
                                   <Play className="h-6 w-6 fill-current ml-1" />
                                </div>
                             </div>
                          </Link>
                          
                          <div className="flex gap-4 px-2">
                             <div className="h-11 w-11 rounded-full overflow-hidden flex-none border-2 border-border/60 mt-1 shadow-lg group-hover:border-primary/40 transition-colors">
                                <img src={video.channelThumbnail || "/placeholder-avatar.png"} className="h-full w-full object-cover" alt="" />
                             </div>
                             <div className="flex flex-col gap-1.5 min-w-0">
                                <Link href={`/modules/${video.moduleId}/lectures/${video.lectureId}/video`} className="font-bold text-sm md:text-base leading-tight font-display tracking-tight line-clamp-2 min-h-[44px] group-hover:text-primary transition-colors z-10">
                                  {video.title}
                                </Link>
                                <div className="flex flex-col text-[11px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                                   <span className="truncate flex items-center gap-2">
                                      {video.channelTitle} <span className="h-1 w-1 rounded-full bg-muted-foreground/30" /> Academic Source
                                   </span>
                                   <div className="flex items-center gap-2 text-[9px] italic mt-1 font-bold text-primary/60 font-display">
                                      <Bookmark className="h-3 w-3" /> {video.lectureTitle}
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="flex flex-col items-center justify-center py-40 border-4 border-dashed border-border/20 rounded-[64px] animate-in zoom-in duration-1000">
                    <Video className="h-14 w-14 text-primary/40 mb-4" />
                    <p className="text-muted-foreground font-bold">No semester videos found.</p>
                 </div>
              )}
           </section>
        )}
      </main>
    </div>
  );
}
