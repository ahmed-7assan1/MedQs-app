"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, Play, Users, CheckCircle2, 
  Heart, Loader2, Video, Bookmark, Sparkles, LayoutGrid,
  ChevronRight, GraduationCap, Share2, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
        toast.success(following ? `Followed ${data.instructor.name}!` : "Unfollowed");
      }
    } catch {
      toast.error("Operation failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Instructor not found</h1>
        <p className="text-muted-foreground mb-8">The requested educator could not be located in our system.</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20">
          Go Back
        </button>
      </div>
    );
  }

  const { instructor, videos } = data;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* 1. Profile Header */}
      <div className="relative border-b border-white/[0.02] overflow-hidden">
        {/* Banner Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-12 relative z-10">
          {/* Back Button */}
          <button 
           onClick={() => router.back()}
           className="mb-8 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
             <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
             Back to Hub
          </button>

          <div className="flex flex-col md:flex-row gap-8 md:items-center">
            {/* Avatar */}
            <div className="relative flex-shrink-0 mx-auto md:mx-0">
              <div className="h-32 w-32 md:h-44 md:w-44 rounded-full p-1 bg-gradient-to-br from-primary via-primary/50 to-primary/10 shadow-2xl relative">
                <div className="h-full w-full rounded-full bg-background p-1">
                  <img src={instructor.thumbnail} className="h-full w-full rounded-full object-cover" alt={instructor.name} />
                </div>
                {/* Online Indicator / Verified Icon */}
                <div className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background p-1 shadow-lg">
                  <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">{instructor.name}</h1>
                <p className="text-primary/70 font-semibold text-sm md:text-lg">
                  {instructor.handle || `@${instructor.name.toLowerCase().replace(/\s/g, "")}`}
                </p>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-center md:justify-start gap-8 lg:gap-12">
                <div className="space-y-0.5">
                  <p className="text-xl md:text-2xl font-black text-foreground">{instructor.subscribers || "0"}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Subscribers</p>
                </div>
                <div className="h-8 w-px bg-border/40" />
                <div className="space-y-0.5">
                  <p className="text-xl md:text-2xl font-black text-foreground">{instructor.followersCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">MedQs Fans</p>
                </div>
                <div className="h-8 w-px bg-border/40" />
                <div className="space-y-0.5">
                  <p className="text-xl md:text-2xl font-black text-foreground">{videos.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Lectures</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <button 
                  onClick={toggleFollow}
                  className={cn(
                    "flex-1 md:flex-none h-12 px-8 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5",
                    instructor.isFollowing 
                      ? "bg-muted text-foreground border border-white/[0.03]" 
                      : "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
                  )}
                >
                  <Heart className={cn("h-4.5 w-4.5", instructor.isFollowing && "fill-current text-red-500")} />
                  {instructor.isFollowing ? "Subscribed" : "Subscribe"}
                </button>
                <button className="h-12 w-12 rounded-2xl bg-card border border-white/[0.02] flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Videos Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Academic Lectures</h2>
            <p className="text-xs font-medium text-muted-foreground">High-yield content by {instructor.name}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-xl border border-white/[0.02] text-[10px] font-bold text-primary uppercase tracking-widest">
            <GraduationCap className="h-4 w-4" /> Academic Focus
          </div>
        </div>

        {videos.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => {
              const href = `/modules/${video.moduleId}/lectures/${video.lectureId}/video`;
              return (
                <div key={video.id} className="group flex flex-col gap-3">
                  {/* Thumbnail Card */}
                  <Link 
                    href={href} 
                    className="relative aspect-video rounded-2xl overflow-hidden bg-muted border border-white/[0.02] group-hover:border-primary/20 transition-all shadow-sm group-hover:shadow-md group-hover:shadow-primary/5"
                  >
                    <img src={video.thumbnail!} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={video.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/[0.05]">
                        <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {/* Badge */}
                    <div className="absolute top-2 left-2">
                       <span className="px-2 py-0.5 bg-primary/90 text-[8px] font-black text-white uppercase rounded-md shadow-lg backdrop-blur-sm">
                         {video.subjectName}
                       </span>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="px-1 space-y-1">
                    <Link href={href} className="font-bold text-[14px] leading-snug line-clamp-2 hover:text-primary transition-colors">
                      {video.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <Bookmark className="h-3 w-3" /> 
                      <span className="truncate">{video.lectureTitle}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-5 bg-card border border-dashed border-white/[0.03] rounded-[2.5rem]">
            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/30">
              <Video className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No linked videos</h3>
              <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                {instructor.name} has content, but none are currently linked to your active semester modules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
