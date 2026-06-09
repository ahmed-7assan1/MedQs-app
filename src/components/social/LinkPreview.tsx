"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CircleNotch, Link as LinkIcon } from "@phosphor-icons/react";
import { VidStackPlayer } from "@/components/content/VidStackPlayer";

interface LinkPreviewData {
  title: string;
  description: string;
  image: string;
  favicon: string;
  domain: string;
  url: string;
}

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;

export function LinkPreview({ content }: { content: string }) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const url = useMemo(() => {
    if (!content) return null;
    const urls = content.match(/https?:\/\/[^\s]+/g);
    if (!urls) return null;
    for (const u of urls) {
      const clean = u.replace(/[.,!?;:]+$/, "");
      if (!clean.match(YOUTUBE_REGEX) && !clean.includes('t.me/') && !clean.match(/\.(jpg|jpeg|png|gif|webp|mp4|mp3|pdf)$/i)) {
        return clean;
      }
    }
    return null;
  }, [content]);

  useEffect(() => {
    if (!url) { setPreview(null); setError(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch("/api/v1/link-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.title) {
          setPreview(data);
          setError(false);
        } else if (!cancelled) {
          setError(true);
        }
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  if (!url || error) return null;

  if (loading) {
    return (
      <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center gap-3 animate-pulse">
        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-2 w-1/2 rounded bg-slate-200 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-stretch gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all group overflow-hidden"
    >
      {preview.image && (
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-black/20">
          <img src={preview.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 mb-0.5">
          <img src={preview.favicon} alt="" className="h-4 w-4 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest truncate">{preview.domain}</span>
        </div>
        <p className="text-[13px] font-bold text-slate-800 dark:text-white/90 leading-tight line-clamp-1 group-hover:text-primary transition-colors">{preview.title}</p>
        {preview.description && (
          <p className="text-[11px] text-slate-500 dark:text-white/40 leading-tight line-clamp-1 mt-0.5">{preview.description}</p>
        )}
      </div>
    </a>
  );
}

export function YouTubePreview({ content }: { content: string }) {
  const url = useMemo(() => {
    if (!content) return null;
    const match = content.match(YOUTUBE_REGEX);
    if (!match) return null;
    const full = match[0];
    return full.startsWith("http") ? full : `https://${full}`;
  }, [content]);

  if (!url) return null;

  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black shadow-lg">
      <VidStackPlayer url={url} className="w-full" />
    </div>
  );
}
