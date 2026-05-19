"use client";

import { useState, useRef } from "react";
import { TelegramAudioPlayer } from "./TelegramAudioPlayer";
import {
  DownloadSimple,
  Image as ImageIcon,
  FileText,
  Microphone,
  CheckCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";
import { downloadFileInline } from "@/lib/download-helper";
import { CircleNotch } from "@phosphor-icons/react";

interface Attachment {
  url: string;
  type: "image" | "audio" | "file" | "video";
  fileId?: string;
}

interface Author {
  id: string;
  name: string;
  image?: string | null;
  role: string;
  rank?: { label: string; badge?: string | null } | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  attachments?: Attachment[] | string | null;
}

interface Props {
  message: Message;
  isMine: boolean;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function parseAttachments(raw: any): Attachment[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

export function MessageBubble({ message, isMine }: Props) {
  const attachments = parseAttachments(message.attachments);
  const images = attachments.filter((a) => a.type === "image");
  const audio = attachments.filter((a) => a.type === "audio");
  const videos = attachments.filter((a) => 
    a.type === "video" || 
    a.url.toLowerCase().split('?')[0].endsWith('.mp4') ||
    a.url.toLowerCase().split('?')[0].endsWith('.mov') ||
    a.url.toLowerCase().split('?')[0].endsWith('.webm')
  );
  const files = attachments.filter((a) => 
    a.type === "file" && 
    !videos.some(v => v.url === a.url)
  );
  const hasContent = message.content?.trim();

  const avatarUrl =
    message.author.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(message.author.name)}`;

  return (
    <div className={cn("flex gap-2 mb-1 max-w-[82%]", isMine ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {/* Avatar - only for others */}
      {!isMine && (
        <div className="flex-shrink-0 self-end mb-1">
          <img
            src={avatarUrl}
            alt={message.author.name}
            className="h-7 w-7 rounded-full object-cover border border-white/10"
          />
        </div>
      )}

      <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
        {/* Author name for others */}
        {!isMine && (
          <span className="text-[10px] font-black text-[#AFA9EC] ml-2 mb-0.5 uppercase tracking-widest">
            {message.author.name}
            {message.author.rank && (
              <span className="ml-1.5 text-[8px] opacity-60 normal-case">{message.author.rank.label}</span>
            )}
          </span>
        )}

        <div
          className={cn(
            "relative rounded-[18px] overflow-hidden shadow-lg",
            isMine
              ? "rounded-br-[4px] bg-gradient-to-br from-[#534AB7] to-[#6E62E5] text-white"
              : "rounded-bl-[4px] bg-[#1E1C33] border border-white/[0.06] text-white"
          )}
        >
          {/* Images */}
          {images.length > 0 && (
            <div
              className={cn(
                "grid gap-0.5",
                images.length === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
            >
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt=""
                  className="w-full max-h-[280px] object-cover cursor-pointer hover:brightness-90 transition-all"
                  onClick={() => window.open(img.url, "_blank")}
                />
              ))}
            </div>
          )}

          {videos.map((v, i) => (
            <div key={i} className="relative group w-full max-w-[320px]">
              <ProfessionalVideoPlayer src={v.url} className="w-full max-h-[400px]" />
            </div>
          ))}

          {/* Audio */}
          {audio.map((a, i) => (
            <div key={i} className="p-2 min-w-[240px]">
              <TelegramAudioPlayer url={a.url} />
            </div>
          ))}

          {/* Files */}
          {files.map((f, i) => (
            <MessageFileItem 
              key={i} 
              f={f} 
              hasBorder={!(!hasContent && !images.length && !audio.length && !videos.length)} 
            />
          ))}

          {/* Text */}
          {hasContent && (
            <p className="px-3 py-2 text-[14px] leading-relaxed font-medium whitespace-pre-wrap break-words max-w-[280px] sm:max-w-[360px]">
              {message.content}
            </p>
          )}

          {/* Timestamp */}
          <div className={cn("flex items-center gap-1 px-3 pb-2", hasContent || files.length ? "-mt-1" : "mt-1")}>
            <span className={cn("text-[10px] font-bold", isMine ? "text-white/50" : "text-white/30")}>
              {formatTime(message.createdAt)}
            </span>
            {isMine && <CheckCircle size={12} className="text-white/50" weight="fill" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageFileItem({ f, hasBorder }: { f: Attachment; hasBorder: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    setProgress(0);
    
    // Attempt to extract filename from URL or use a default one
    let filename = "attachment";
    try {
      const urlObj = new URL(f.url);
      const pathname = urlObj.pathname;
      const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
      if (lastSegment && lastSegment.includes('.')) {
        filename = decodeURIComponent(lastSegment);
      } else {
        const fileIdParam = urlObj.searchParams.get("fileId") || urlObj.searchParams.get("id");
        if (fileIdParam) filename = `attachment_${fileIdParam}`;
      }
    } catch (err) {
      // Ignored
    }

    await downloadFileInline(f.url, filename, (p) => setProgress(p));
    setDownloading(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={cn(
        "flex w-full items-center gap-3 p-3 hover:bg-white/5 transition-all text-left active:scale-[0.99] disabled:opacity-80",
        hasBorder ? "border-t border-white/5" : ""
      )}
    >
      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 shrink-0">
        {downloading ? (
          <CircleNotch size={22} className="text-white/70 animate-spin" />
        ) : (
          <FileText size={22} weight="bold" className="text-white/70" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-white truncate">Attachment</p>
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight">
          {downloading ? (progress > 0 && progress < 100 ? `Downloading ${progress}%` : "Downloading...") : "Tap to download"}
        </p>
      </div>
      {!downloading && <DownloadSimple size={18} className="text-white/40 ml-auto shrink-0" />}
    </button>
  );
}
