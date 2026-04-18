"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Play, Users, CheckCircle2, 
  Heart, Loader2, Video, Bookmark, Sparkles, LayoutGrid,
  ChevronRight, GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface InstructorData {
  instructor: {
    id: string;
    youtubeId: string;
    name: string;
    handle?: string;
    thumbnail?: string;
    description?: string;
    subscribers?: string;
    followersCount: number;
    isFollowing: boolean;
  };
  videos: any[];
}

export default function InstructorProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<InstructorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/videos/instructor/${params.id}`)
      .then(r => r.json())
      .then(res => {
        if (res.error) toast.error(res.error);
        else setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function toggleFollow() {
    if (!data) return;
    try {
      const res = await fetch("/api/v1/videos/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: data.instructor.id })
      });
      if (res.ok) {
        const { following } = await res.json();
        setData(prev => prev ? {
          ...prev,
          instructor: {
            ...prev.instructor,
            isFollowing: following,
            followersCount: following ? prev.instructor.followersCount + 1 : prev.instructor.followersCount - 1
          }
        } : null);
        toast.success(following ? "Educator Followed!" : "Unfollowed");
      }
    } catch {
      toast.error("Operation failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-background">
        <h1 className="text-2xl font-black italic uppercase">Authority not found</h1>
        <button onClick={() => router.back()} className="text-primary font-black uppercase text-xs border-b-2 border-primary/20 pb-1">Return to Hub</button>
      </div>
    );
  }

  const { instructor, videos } = data;

  return (
    <div className="min-h-screen bg-background pb-32 w-full overflow-x-hidden">
      {/* 1. Immersive Authority Header (Full Width) */}
      <section className="relative pt-16 pb-24 border-b border-border/40 overflow-hidden w-full bg-muted/10">
        <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-background to-transparent" />
        <div className="w-full px-6 md:px-12 relative z-10">
          <button 
           onClick={() => router.back()}
           className="mb-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-all group"
          >
             <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1.5 transition-transform" /> Return to Discovery
          </button>

          <div className="flex flex-col md:flex-row gap-12 items-center md:items-end">
             {/* Thumbnail (YouTube Style Circle) */}
             <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 blur-[64px] rounded-full opacity-40 shrink-0" />
                <div className="relative h-40 w-40 md:h-56 md:w-56 rounded-full border-[6px] border-background shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden bg-card p-1">
                   <img src={instructor.thumbnail} className="h-full w-full rounded-full object-cover" alt="" />
                </div>
             </div>

             {/* Authority Meta */}
             <div className="flex-1 space-y-8 text-center md:text-left">
                <div className="space-y-3">
                   <div className="flex items-center justify-center md:justify-start gap-4">
                      <h1 className="text-4xl md:text-7xl font-black font-display tracking-tight leading-none italic uppercase">{instructor.name}</h1>
                      <CheckCircle2 className="h-10 w-10 text-primary fill-primary/5 hidden md:block" />
                   </div>
                   <p className="text-primary font-bold text-xl md:text-2xl opacity-60 italic">{instructor.handle || `@${instructor.name.toLowerCase().replace(/\s/g, "")}`}</p>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-12">
                   <div className="space-y-1">
                      <p className="text-3xl font-black leading-none">{instructor.subscribers}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">YT Authority</p>
                   </div>
                   <div className="h-10 w-px bg-border/40" />
                   <div className="space-y-1">
                      <p className="text-3xl font-black leading-none">{instructor.followersCount}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">MedQs Followers</p>
                   </div>
                </div>
             </div>

             {/* Action Bar */}
             <button 
               onClick={toggleFollow}
               className={cn(
                 "h-16 px-12 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-4",
                 instructor.isFollowing 
                   ? "bg-muted text-foreground border border-border/80 shadow-none hover:bg-muted/80" 
                   : "bg-primary text-primary-foreground shadow-primary/30 hover:scale-[1.03] active:scale-95 ring-4 ring-primary/10"
               )}
             >
               <Heart className={cn("h-5 w-5", instructor.isFollowing && "fill-current")} />
               {instructor.isFollowing ? "Following Source" : "Follow Advisor"}
             </button>
          </div>
        </div>
      </section>

      {/* 2. Structured Content Feed (Full Width) */}
      <main className="w-full px-6 md:px-12 mt-20 space-y-16">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-border/40">
            <div className="space-y-3">
               <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight italic uppercase">Semester <span className="text-primary italic">Featured</span></h2>
               <p className="text-muted-foreground text-[11px] font-bold opacity-50 uppercase tracking-[0.1em] max-w-xl italic">Instructional media by {instructor.name} specifically referenced in your active semester lectures.</p>
            </div>
            <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-2xl border border-border/40">
               <div className="px-6 py-2.5 bg-card rounded-xl text-[10px] font-black text-primary border border-border/80 flex items-center gap-3 uppercase tracking-widest">
                  <GraduationCap className="h-4 w-4" /> Academic Focus Only
               </div>
            </div>
         </div>

         {videos.length > 0 ? (
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 animate-in fade-in slide-in-from-bottom-12 duration-1000">
               {videos.map((video) => (
                  <div key={video.id} className="group flex flex-col gap-5">
                    <Link href={`/lectures/${video.lectureId}/video`} className="block relative aspect-video rounded-xl overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] border border-border/40 group-hover:border-primary/60 transition-all duration-700">
                       <img src={video.thumbnail!} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] opacity-90 group-hover:opacity-100" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                       
                       <div className="absolute top-4 left-4">
                          <div className="px-3 py-1.5 bg-white/10 backdrop-blur-3xl rounded-xl border border-white/20 text-[9px] font-black text-white uppercase tracking-widest shadow-2xl">
                            {video.subjectName}
                          </div>
                       </div>
                       
                       <div className="absolute inset-x-6 bottom-6 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-[0.2em] drop-shadow-lg">
                             <Sparkles className="h-4 w-4 text-primary fill-current" /> High Yield
                          </span>
                          <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ring-4 ring-white/10">
                             <Play className="h-6 w-6 fill-current ml-1" />
                          </div>
                       </div>
                    </Link>

                    <div className="px-2 space-y-3">
                       <h3 className="font-bold text-base md:text-lg leading-snug line-clamp-2 min-h-[44px] group-hover:text-primary transition-colors decoration-primary/40 group-hover:underline underline-offset-4 decoration-2">{video.title}</h3>
                       <div className="flex items-center gap-3">
                          <div className="px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-[10px] font-black text-primary/60 uppercase tracking-[0.1em] flex items-center gap-2 shadow-inner">
                             <Bookmark className="h-3 w-3" /> {video.lectureTitle}
                          </div>
                       </div>
                    </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-48 text-center space-y-10 bg-muted/5 rounded-[80px] border-4 border-dashed border-border/20 animate-in zoom-in duration-1000">
               <div className="relative">
                  <div className="absolute -inset-10 bg-primary/10 blur-[90px] rounded-full" />
                  <div className="relative h-28 w-28 rounded-[40px] bg-primary/5 text-primary/30 flex items-center justify-center border border-primary/10 shadow-inner">
                     <Video className="h-14 w-14" />
                  </div>
               </div>
               <div className="space-y-3 max-w-sm mx-auto">
                 <h3 className="text-3xl font-display font-black tracking-tight italic uppercase leading-none">Context Gap</h3>
                 <p className="text-muted-foreground text-xs font-bold leading-relaxed px-10 opacity-40 uppercase tracking-[0.1em]">
                   {instructor.name} has specialized instructional media, but no current videos have been linked to your academic modules for this semester.
                 </p>
               </div>
            </div>
         )}
      </main>
    </div>
  );
}
