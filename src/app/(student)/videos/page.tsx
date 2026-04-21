"use client";

import { useState, useEffect } from "react";
import { 
  Search, Video, CheckCircle2, Play, 
  Loader2, X, Home, BookOpen, MessageSquare, User, Clapperboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  moduleName?: string;
  moduleId?: string;
  isCurriculum?: boolean;
}

export default function VideosHubPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [curriculumVideos, setCurriculumVideos] = useState<VideoResult[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  useEffect(() => {
    fetch("/api/v1/videos/instructors")
      .then(r => r.json())
      .then(data => setInstructors(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch("/api/v1/videos/curriculum")
      .then(r => r.json())
      .then(data => {
        setCurriculumVideos(Array.isArray(data) ? data : []);
        setLoadingCurriculum(false);
      })
      .catch(() => setLoadingCurriculum(false));
  }, []);

  // Debounced search
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

  const displayVideos = searchResults.length > 0 ? searchResults : curriculumVideos;

  return (
    <div className="min-h-screen bg-background pb-28 w-full overflow-x-hidden">

      {/* ─── STICKY HEADER — flush with top on mobile, global nav on desktop ─── */}
      <header className="sticky top-0 lg:top-14 z-40 bg-background/80 backdrop-blur-2xl border-b border-border/10 shadow-sm">
        
        {/* Title row + search toggle */}
        <div className="flex items-center justify-between px-4 h-12">
          <h1 className="text-[15px] font-bold tracking-tight text-foreground/90">Videos</h1>
          <button
            onClick={() => setSearchOpen(p => !p)}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-200",
              searchOpen
                ? "bg-primary/20 text-primary"
                : "bg-muted/30 text-muted-foreground"
            )}
          >
            {searchOpen
              ? <X className="h-4 w-4" />
              : <Search className="h-4 w-4" />
            }
          </button>
        </div>

        {/* Inline search bar — smooth collapse */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          searchOpen ? "max-h-16 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          <div className="px-4 pb-3">
            <div className="relative flex items-center bg-muted/40 border border-border/10 rounded-xl px-3 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/5 transition-all shadow-inner">
              <Search className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              <input
                autoFocus={searchOpen}
                type="text"
                placeholder="Search lectures or teachers..."
                value={globalQuery}
                onChange={e => setGlobalQuery(e.target.value)}
                className="flex-1 bg-transparent border-none py-2 px-2 text-xs outline-none placeholder:text-muted-foreground/20"
              />
              {isSearching && <Loader2 className="h-3 w-3 animate-spin text-primary/40 shrink-0" />}
            </div>
          </div>
        </div>

        {/* Instructors horizontal strip */}
        {instructors.length > 0 && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-3.5 pt-0.5">
            {instructors.map(inst => (
              <Link
                key={inst.id}
                href={`/videos/instructor/${inst.id || inst.youtubeId}`}
                className="flex-none flex flex-col items-center gap-1.5 group"
              >
                <div className="h-10 w-10 rounded-full overflow-hidden border border-border/20 group-hover:border-primary/40 transition-all duration-300 ring-4 ring-transparent group-hover:ring-primary/5 shadow-sm">
                  <img src={inst.thumbnail} className="h-full w-full rounded-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" alt="" />
                </div>
                <p className="text-[8px] font-bold text-muted-foreground/60 text-center truncate w-12 uppercase tracking-widest group-hover:text-primary transition-colors">
                  {inst.name.split(" ")[0]}
                </p>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ─── VIDEO GRID ─── */}
      <main className="px-4 py-4">
        {/* Loading skeleton - Premium Dark Style */}
        {loadingCurriculum && curriculumVideos.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-video bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 rounded-xl border border-white/[0.03]" />
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted/30 shrink-0" />
                  <div className="space-y-2.5 flex-1">
                    <div className="h-3 bg-muted/40 rounded w-full" />
                    <div className="h-2.5 bg-muted/20 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingCurriculum && displayVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 opacity-30">
            <Clapperboard className="h-14 w-14" />
            <p className="font-semibold text-sm">لا توجد فيديوهات بعد</p>
          </div>
        )}

        {/* Video cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8">
          {displayVideos.map(video => {
            const href = (video.lectureId && video.moduleId)
              ? `/modules/${video.moduleId}/lectures/${video.lectureId}/video`
              : `https://youtube.com/watch?v=${video.videoId}`;
            return (
              <div key={video.id + video.videoId} className="group flex flex-col gap-3">
                {/* Thumbnail */}
                <Link
                  href={href}
                  className="block relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 via-muted/20 to-muted/50 border border-white/[0.05] group-hover:border-primary/20 transition-all shadow-sm group-hover:shadow-md group-hover:shadow-primary/10"
                >
                  <img src={video.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {video.isCurriculum && (
                    <div className="absolute top-2 left-2">
                      <div className="px-2 py-0.5 bg-primary text-[8px] font-black text-white uppercase rounded-md shadow-lg">
                        Academic
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </Link>

                {/* Info row */}
                <div className="flex gap-2.5 px-0.5">
                  <Link href={`/videos/instructor/${video.channelId}`} className="h-8 w-8 rounded-full overflow-hidden flex-none border border-border mt-0.5 shrink-0">
                    <img src={video.channelThumbnail || "/placeholder-avatar.png"} className="h-full w-full object-cover" alt="" />
                  </Link>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <Link href={href} className="font-semibold text-[13.5px] leading-snug line-clamp-2 hover:text-primary transition-colors">
                      {video.title}
                    </Link>
                    <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        {video.channelTitle}
                        {video.source === "medqs" && <CheckCircle2 className="h-3 w-3 text-primary" />}
                      </span>
                      {(video.subjectName || video.moduleName) && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          <span className="text-primary/70 truncate max-w-[120px]">{video.moduleName || video.subjectName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
