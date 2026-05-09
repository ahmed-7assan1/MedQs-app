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

interface Attachment {
  url: string;
  type: "image" | "audio" | "file";
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
  const files = attachments.filter((a) => a.type === "file");
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

          {/* Audio */}
          {audio.map((a, i) => (
            <div key={i} className="p-2 min-w-[240px]">
              <TelegramAudioPlayer url={a.url} />
            </div>
          ))}

          {/* Files */}
          {files.map((f, i) => (
            <a
              key={i}
              href={`${f.url}&download=true`}
              className={cn(
                "flex items-center gap-3 p-3 hover:bg-white/5 transition-all",
                !hasContent && !images.length && !audio.length ? "" : "border-t border-white/5"
              )}
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 shrink-0">
                <FileText size={22} weight="bold" className="text-white/70" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-white truncate">Document</p>
                <p className="text-[10px] text-white/40 font-bold">Tap to download</p>
              </div>
              <DownloadSimple size={18} className="text-white/40 ml-auto shrink-0" />
            </a>
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
