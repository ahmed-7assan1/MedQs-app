"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface Attachment {
  url: string;
  type: 'image' | 'file' | 'video';
  fileId?: string;
}

interface Props {
  attachments: Attachment[];
  layout?: 'grid' | 'carousel';
}

export function PostGallery({ attachments, layout = 'grid' }: Props) {
  const [activeLayout, setActiveLayout] = useState<'grid' | 'carousel'>(layout);
  const [viewIndex, setViewIndex] = useState<number | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(a => a.type === 'image');
  const videos = attachments.filter(a => a.type === 'video');
  const files = attachments.filter(a => a.type === 'file');
  
  // Combine images and videos for the visual gallery
  const media = [...images, ...videos];

  const handleDownload = (url: string) => {
    const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}download=true`;
    // Create a hidden link and click it to trigger download without opening a new tab
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Images Section */}
        {media.length > 0 && (
          <div className="relative group">
            {activeLayout === 'grid' ? (
              <div className={cn(
                "grid gap-1 overflow-hidden rounded-2xl border border-white/[0.05]",
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
                      media.length > 4 && i === 3 ? "after:content-['+'+(media.length-4)] after:absolute after:inset-0 after:bg-black/60 after:flex after:items-center after:justify-center after:text-xl after:font-bold" : ""
                    )}
                    onClick={() => setViewIndex(i)}
                  >
                    {item.type === 'video' ? (
                      <div className="relative w-full h-full bg-black">
                         <ReactPlayer 
                           url={item.url} 
                           width="100%" 
                           height="100%" 
                           light={true} // Shows thumbnail until clicked
                           playIcon={
                             <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:scale-110 transition-transform">
                                <Maximize2 className="h-7 w-7 text-white" />
                             </div>
                           }
                           onClickPreview={() => setViewIndex(i)}
                         />
                      </div>
                    ) : (
                      <img src={item.url} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative aspect-[4/5] max-h-[600px] overflow-hidden rounded-2xl border border-white/[0.05] bg-black/20">
                <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${(viewIndex || 0) * 100}%)` }}>
                  {media.map((item, i) => (
                    item.type === 'video' ? (
                      <div key={i} className="w-full h-full shrink-0 bg-black flex items-center justify-center">
                        <ReactPlayer url={item.url} controls width="100%" height="100%" />
                      </div>
                    ) : (
                      <img key={i} src={item.url} className="w-full h-full object-contain shrink-0" alt="" />
                    )
                  ))}
                </div>
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setViewIndex(prev => Math.max(0, (prev || 0) - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setViewIndex(prev => Math.min(images.length - 1, (prev || 0) + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Layout Toggle - Floating */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setActiveLayout(activeLayout === 'grid' ? 'carousel' : 'grid')}
              className="p-1.5 rounded-lg bg-black/40 text-white/70 backdrop-blur-md hover:text-white transition-all text-[10px] font-bold"
            >
              {activeLayout === 'grid' ? 'Switch to Slider' : 'Switch to Grid'}
            </button>
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-[#534AB7]/10 text-[#534AB7]">
                  <Download className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Attachment {i + 1}</p>
                  <p className="text-[10px] text-white/20 uppercase font-black">Document File</p>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(file.url)}
                className="p-2 text-white/40 hover:text-[#534AB7] transition-all"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Overlay View */}
      {viewIndex !== null && (
        <div className="fixed inset-0 z-[999] flex flex-col bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <header className="flex items-center justify-between p-6 text-white border-b border-white/5">
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-widest text-[#AFA9EC]">MedQs Previewer</span>
              <span className="text-[10px] font-bold text-white/40">{viewIndex + 1} / {attachments.length} Assets</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleDownload(attachments[viewIndex].url)} 
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-xs font-bold"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button onClick={() => setViewIndex(null)} className="p-2.5 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-all">
                <X className="h-6 w-6" />
              </button>
            </div>
          </header>
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
            {media[viewIndex].type === 'video' ? (
              <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                <ReactPlayer 
                  url={media[viewIndex].url} 
                  controls 
                  playing
                  width="100%" 
                  height="100%" 
                  config={{ file: { attributes: { controlsList: 'nodownload' } } } as any}
                />
              </div>
            ) : media[viewIndex].type === 'image' ? (
              <img 
                src={media[viewIndex].url} 
                className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300" 
                alt="" 
              />
            ) : (
              <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white">
                <iframe 
                  src={attachments[viewIndex].url} 
                  className="w-full h-full border-none"
                  title="Document Preview"
                />
              </div>
            )}
            
            {attachments.length > 1 && (
              <>
                <button 
                  onClick={() => setViewIndex(prev => prev! > 0 ? prev! - 1 : attachments.length - 1)}
                  className="absolute left-6 p-5 rounded-full bg-white/5 hover:bg-white/10 transition-all backdrop-blur-md"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button 
                  onClick={() => setViewIndex(prev => prev! < attachments.length - 1 ? prev! + 1 : 0)}
                  className="absolute right-6 p-5 rounded-full bg-white/5 hover:bg-white/10 transition-all backdrop-blur-md"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
