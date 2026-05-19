"use client";

import { useState } from "react";
import { Youtube, PlayCircle, MonitorPlay, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomVideoPlayer } from "./CustomVideoPlayer";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";

interface VideoSource {
  id: string;
  title: string;
  url: string;
  sourceType?: string;
  isTelegram?: boolean;
  telegramFileId?: string;
}

interface PremiumVideoPlayerProps {
  primaryUrl?: string;
  extraVideos?: VideoSource[];
  title?: string;
}

export function PremiumVideoPlayer({ primaryUrl, extraVideos = [], title }: PremiumVideoPlayerProps) {
  // Logic to determine the real source URL (Forum-style for Telegram)
  const getEffectiveUrl = (url: string, video?: VideoSource) => {
    if (video?.telegramFileId) {
      return `/api/v1/files/telegram/preview?fileId=${video.telegramFileId}`;
    }
    return url;
  };

  const initialUrl = getEffectiveUrl(primaryUrl || (extraVideos.length > 0 ? extraVideos[0].url : ""), extraVideos.find(v => v.url === primaryUrl) || extraVideos[0]);
  const firstTitle = primaryUrl ? title : (extraVideos.length > 0 ? extraVideos[0].title : title);

  const [activeUrl, setActiveUrl] = useState(initialUrl);
  const [activeTitle, setActiveTitle] = useState(firstTitle);

  if (!activeUrl && extraVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center">
        <MonitorPlay className="mb-4 h-12 w-12 text-white/20" />
        <p className="text-sm font-bold text-white/40 uppercase tracking-widest">No video resource attached</p>
      </div>
    );
  }

  const isTelegramProxy = (url: string) => url?.includes("/api/v1/telegram/video/") || url?.includes("/api/v1/files/telegram/");
  const isYouTube = (url: string) => url?.includes("youtube.com") || url?.includes("youtu.be");

  const getSourceIcon = (url: string) => {
    if (isTelegramProxy(url)) return Send;
    if (isYouTube(url)) return Youtube;
    return PlayCircle;
  };

  const getSourceLabel = (video: VideoSource) => {
    if (video.isTelegram || isTelegramProxy(video.url)) return "🛡️ Telegram";
    if (isYouTube(video.url)) return "YouTube";
    return video.title || "Video";
  };

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 shadow-2xl transition-shadow hover:border-white/20">

      {/* ── Top Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 px-6 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{activeTitle || "Clinical Stream"}</span>
        </div>
        <div className="flex items-center gap-2">
          {isTelegramProxy(activeUrl) && (
            <span className="rounded-full bg-indigo-600/20 border border-indigo-500/30 px-3 py-1 text-[9px] font-bold text-indigo-300 backdrop-blur-md uppercase tracking-widest flex items-center gap-1">
              <Send className="h-2.5 w-2.5" /> Secured via Telegram
            </span>
          )}
          <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-bold text-white/70 backdrop-blur-md border border-white/5 uppercase tracking-widest">
            Premium Player v3
          </span>
        </div>
      </div>

      {/* ── Video Stage ── */}
      <div className="relative w-full">
        <CustomVideoPlayer 
          key={activeUrl} 
          url={activeUrl} 
          title={activeTitle} 
        />
      </div>

      {/* ── Source Switcher (If multiple videos) ── */}
      {extraVideos.length > 0 && (
        <div className="p-4 px-6 border-t border-white/5 flex items-center gap-4 bg-black/60 backdrop-blur-md">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest shrink-0">Sources:</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {primaryUrl && (
              <SourceButton
                active={activeUrl === getEffectiveUrl(primaryUrl, extraVideos.find(v => v.url === primaryUrl))}
                onClick={() => { 
                  const eff = getEffectiveUrl(primaryUrl, extraVideos.find(v => v.url === primaryUrl));
                  setActiveUrl(eff); 
                  setActiveTitle(title || ""); 
                }}
                label="Main"
                icon={MonitorPlay}
              />
            )}
            {extraVideos.map((v) => (
              <SourceButton
                key={v.id}
                active={activeUrl === getEffectiveUrl(v.url, v)}
                onClick={() => { 
                  const eff = getEffectiveUrl(v.url, v);
                  setActiveUrl(eff); 
                  setActiveTitle(v.title || ""); 
                }}
                label={getSourceLabel(v)}
                icon={getSourceIcon(v.url)}
                isTelegram={v.isTelegram || isTelegramProxy(v.url)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SourceButton({ active, onClick, label, icon: Icon, isTelegram }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold transition-all whitespace-nowrap border",
        active
          ? isTelegram
            ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-900/20"
            : "bg-white/10 border-white/20 text-white shadow-lg"
          : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className={cn("h-3 w-3", active ? (isTelegram ? "text-indigo-400" : "text-primary") : "text-white/20")} />
      {label}
    </button>
  );
}
