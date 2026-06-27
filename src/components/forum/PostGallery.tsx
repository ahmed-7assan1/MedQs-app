"use client";

import { useState, useEffect } from "react";
import { 
  CaretLeft, 
  CaretRight, 
  ArrowsOut, 
  DownloadSimple, 
  X,
  Play,
  Microphone
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";
import { TelegramAudioPlayer } from "./TelegramAudioPlayer";
import Image from "next/image";

import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface Attachment {
  url: string;
  type: 'image' | 'file' | 'video' | 'audio';
  fileId?: string;
}

interface Props {
  attachments: Attachment[];
  layout?: 'grid' | 'carousel';
}

function isItemVideo(item: Attachment) {
  return (
    item.type === 'video' ||
    (typeof item.url === 'string' && (
      item.url.toLowerCase().split('?')[0].endsWith('.mp4') ||
      item.url.toLowerCase().split('?')[0].endsWith('.mov') ||
      item.url.toLowerCase().split('?')[0].endsWith('.webm') ||
      item.url.includes('t.me/') ||
      item.url.includes('/api/v1/telegram/')
    ))
  );
}

export function PostGallery({ attachments, layout = 'grid' }: Props) {
  const [activeLayout, setActiveLayout] = useState<'grid' | 'carousel'>(layout);
  const [viewIndex, setViewIndex] = useState<number | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(a => a.type === 'image' && !isItemVideo(a));
  const videos = attachments.filter(isItemVideo);
  const files = attachments.filter(a => a.type === 'file' && !isItemVideo(a));
  const audio = attachments.filter(a => a.type === 'audio');
  const media = [...images, ...videos];
  const Player = ReactPlayer as any;

  const handleDownload = (url: string) => {
    const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}download=true`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Audio Section */}
      {audio.length > 0 && (
        <div className="flex flex-col gap-2">
          {audio.map((item, i) => (
            <TelegramAudioPlayer key={i} url={item.url} />
          ))}
        </div>
      )}

      {/* Images Section */}
        {media.length > 0 && (
          <div className="relative group">
            {activeLayout === 'grid' ? (
              <div className={cn(
                "grid gap-0.5 overflow-hidden rounded-2xl border border-white/[0.05]",
                media.length === 1 ? "grid-cols-1" : 
                media.length === 2 ? "grid-cols-2 aspect-[16/9]" :
                media.length === 3 ? "grid-cols-2 aspect-[4/3]" : "grid-cols-2 aspect-square"
              )}>
                {media.slice(0, 4).map((item, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "relative cursor-pointer overflow-hidden bg-white/5 hover:opacity-90 transition-opacity flex items-center justify-center",
                      media.length === 3 && i === 0 ? "row-span-2" : "",
                      media.length > 4 && i === 3 ? "after:content-['+'+(media.length-4)] after:absolute after:inset-0 after:bg-black/60 after:flex after:items-center after:justify-center after:text-lg after:font-bold" : ""
                    )}
                    onClick={() => setViewIndex(i)}
                  >
                    {isItemVideo(item) ? (
                      <div className="relative w-full h-full">
                         <ProfessionalVideoPlayer src={item.url} className="w-full h-full" />
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <Image src={item.url} fill className="object-cover" alt="" unoptimized={item.url.includes("data:")} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative aspect-[4/5] max-h-[600px] overflow-hidden rounded-2xl border border-white/[0.05] bg-black/20">
                <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${(viewIndex || 0) * 100}%)` }}>
                  {media.map((item, i) => (
                    isItemVideo(item) ? (
                      <div key={i} className="w-full h-full shrink-0">
                        <ProfessionalVideoPlayer src={item.url} className="w-full h-full" />
                      </div>
                    ) : (
                      <div key={i} className="relative w-full h-full shrink-0">
                        <Image src={item.url} fill className="object-contain" alt="" unoptimized={item.url.includes("data:")} />
                      </div>
                    )
                  ))}
                </div>
              {media.length > 1 && (
                <>
                  <button 
                    onClick={() => setViewIndex(prev => Math.max(0, (prev || 0) - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white/40 backdrop-blur-md hover:bg-black/40 hover:text-white transition-all"
                  >
                    <CaretLeft size={20} weight="bold" />
                  </button>
                  <button 
                    onClick={() => setViewIndex(prev => Math.min(media.length - 1, (prev || 0) + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white/40 backdrop-blur-md hover:bg-black/40 hover:text-white transition-all"
                  >
                    <CaretRight size={20} weight="bold" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Layout Toggle - Floating */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setActiveLayout(activeLayout === 'grid' ? 'carousel' : 'grid')}
              className="px-2 py-1 rounded-lg bg-black/40 text-white/50 backdrop-blur-md hover:text-white transition-all text-[9px] font-black uppercase tracking-widest border border-white/5"
            >
              {activeLayout === 'grid' ? 'Slide View' : 'Grid View'}
            </button>
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/10">
                  <DownloadSimple size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white/80 truncate">Asset_{i + 1}.file</p>
                  <p className="text-[9px] text-white/20 uppercase font-black tracking-tighter">Secure Download</p>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(file.url)}
                className="p-2 text-white/20 hover:text-primary transition-all"
              >
                <DownloadSimple size={18} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Overlay View */}
      {viewIndex !== null && (
        <div className="fixed inset-0 z-modal flex flex-col bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <header className="flex items-center justify-between px-6 py-4 text-white border-b border-white/5 bg-black/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">MedQs Intelligence</span>
              <span className="text-[10px] font-bold text-white/20 uppercase">{viewIndex + 1} of {media.length} nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleDownload(media[viewIndex].url)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
              >
                <DownloadSimple size={16} weight="bold" />
                Get Asset
              </button>
              <button onClick={() => setViewIndex(null)} className="h-8 w-8 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all text-white/20">
                <X size={20} weight="bold" />
              </button>
            </div>
          </header>
          <div className="flex-1 relative flex items-center justify-center p-4 sm:p-10 overflow-hidden">
            {isItemVideo(media[viewIndex]) ? (
              <div className="w-full h-full max-w-5xl rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-black">
                <ProfessionalVideoPlayer src={media[viewIndex].url} className="w-full h-full" />
              </div>
            ) : media[viewIndex].type === 'image' ? (
              <div className="relative w-full h-full">
                <Image 
                  src={media[viewIndex].url} 
                  fill
                  className="object-contain shadow-2xl animate-in zoom-in-95 duration-300 rounded-lg" 
                  alt="" 
                  unoptimized={media[viewIndex].url.includes("data:")}
                />
              </div>
            ) : (
              <div className="w-full h-full max-w-5xl rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-white dark:bg-[#1A1A24]">
                <iframe 
                  src={attachments[viewIndex].url} 
                  className="w-full h-full border-none"
                  title="Document Preview"
                />
              </div>
            )}
            
            {media.length > 1 && (
              <>
                <button 
                  onClick={() => setViewIndex(prev => prev! > 0 ? prev! - 1 : media.length - 1)}
                  className="absolute left-4 sm:left-10 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all backdrop-blur-md border border-white/5"
                >
                  <CaretLeft size={24} weight="bold" />
                </button>
                <button 
                  onClick={() => setViewIndex(prev => prev! < media.length - 1 ? prev! + 1 : 0)}
                  className="absolute right-4 sm:right-10 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all backdrop-blur-md border border-white/5"
                >
                  <CaretRight size={24} weight="bold" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
