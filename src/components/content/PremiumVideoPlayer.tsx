"use client";

import { useState } from "react";
import { Youtube, PlayCircle, ExternalLink, ShieldCheck, MonitorPlay, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoSource {
  id: string;
  title: string;
  url: string;
  sourceType?: string;
}

interface PremiumVideoPlayerProps {
  primaryUrl?: string;
  extraVideos?: VideoSource[];
  title?: string;
}

export function PremiumVideoPlayer({ primaryUrl, extraVideos = [], title }: PremiumVideoPlayerProps) {
  const [activeUrl, setActiveUrl] = useState(primaryUrl || (extraVideos.length > 0 ? extraVideos[0].url : ""));
  
  if (!activeUrl && extraVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center">
        <MonitorPlay className="mb-4 h-12 w-12 text-white/20" />
        <p className="text-sm font-bold text-white/40 uppercase tracking-widest">No video resource attached</p>
      </div>
    );
  }

  const getEmbedInfo = (url: string) => {
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: "youtube", embed: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1` };

    // Google Drive
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) return { type: "drive", embed: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };

    // Telegram (assuming we use a proxy or direct embed if supported)
    if (url.includes("t.me/") || url.includes("telegram.org")) {
       return { type: "telegram", embed: url };
    }

    return { type: "external", embed: url };
  };

  const currentMedia = getEmbedInfo(activeUrl);

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 shadow-2xl transition-all hover:border-white/20">
      {/* ── Top Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 px-6 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{title || "Clinical Stream"}</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-bold text-white/70 backdrop-blur-md border border-white/5 uppercase tracking-widest">Premium Player v2</span>
         </div>
      </div>

      {/* ── Video Stage ── */}
      <div className="relative aspect-video w-full bg-black">
        {currentMedia.type === "youtube" || currentMedia.type === "drive" ? (
          <iframe
            src={currentMedia.embed}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : currentMedia.type === "telegram" ? (
           <div className="flex flex-col items-center justify-center h-full space-y-4 px-6 text-center">
              <Zap className="h-12 w-12 text-indigo-500 animate-pulse" />
              <div>
                <h4 className="text-xl font-black text-white">Telegram Media Stream</h4>
                <p className="text-xs text-white/40 mt-2 max-w-sm">This video is hosted on Telegram. Click below to view the original source or use our secure proxy.</p>
              </div>
              <a href={activeUrl} target="_blank" className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-1 transition-all">
                 <ExternalLink className="h-4 w-4" /> Open Telegram Source
              </a>
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
             <ExternalLink className="h-12 w-12 text-white/10" />
             <a href={activeUrl} target="_blank" className="text-primary hover:underline font-bold">Open External Resource</a>
          </div>
        )}
      </div>

      {/* ── Source Switcher (If multiple videos) ── */}
      {(extraVideos.length > 0 || (primaryUrl && extraVideos.length > 0)) && (
        <div className="p-4 px-6 border-t border-white/5 flex items-center gap-4 bg-black/60 backdrop-blur-md">
           <span className="text-[9px] font-black text-white/30 uppercase tracking-widest shrink-0">Available Sources:</span>
           <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {primaryUrl && (
                <SourceButton 
                  active={activeUrl === primaryUrl} 
                  onClick={() => setActiveUrl(primaryUrl)}
                  title="Main Server"
                  icon={MonitorPlay}
                />
              )}
              {extraVideos.map((v) => (
                <SourceButton 
                  key={v.id}
                  active={activeUrl === v.url}
                  onClick={() => setActiveUrl(v.url)}
                  title={v.title}
                  icon={v.url.includes("youtube") ? Youtube : PlayCircle}
                />
              ))}
           </div>
        </div>
      )}
    </div>
  );
}

function SourceButton({ active, onClick, title, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold transition-all whitespace-nowrap border",
        active 
          ? "bg-white/10 border-white/20 text-white shadow-lg" 
          : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className={cn("h-3 w-3", active ? "text-primary" : "text-white/20")} />
      {title}
    </button>
  );
}
