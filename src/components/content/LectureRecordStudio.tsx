"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Headphones,
  Trash2,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Settings2,
} from "lucide-react";
import { CustomAudioPlayer } from "./CustomAudioPlayer";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type RecordItem = {
  id: string;
  title: string;
  url: string;
  sourceType: string;
};

function getSpotifyEmbedUrl(url: string) {
  if (!url.includes("spotify.com")) return null;
  try {
    const u = new URL(url);
    const path = u.pathname; 
    if (path.includes("/embed/")) return url;
    return `https://open.spotify.com/embed${path}`;
  } catch (e) {
    return null;
  }
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds === Infinity) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function LectureRecordStudio({
  lectureId,
  initialRecords,
  selectedRecordId,
  isAdmin = false,
  hubUrl = "",
}: {
  lectureId: string;
  initialRecords: RecordItem[];
  selectedRecordId?: string;
  isAdmin?: boolean;
  hubUrl?: string;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [activeId, setActiveId] = useState(selectedRecordId || initialRecords[0]?.id || "");
  const active = useMemo(() => records.find((r) => r.id === activeId) ?? null, [records, activeId]);
  
  const spotifyEmbed = active ? getSpotifyEmbedUrl(active.url) : null;

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Sync Audio when active track changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [active?.url]);

  async function deleteRecord(id: string) {
    if (!confirm("Remove this audio track?")) return;
    try {
      const res = await fetch(`/api/v1/lectures/${lectureId}/records/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (activeId === id) {
        const remaining = records.filter((r) => r.id !== id);
        setActiveId(remaining[0]?.id || "");
      }
      toast.success("Track removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => toast.error("Could not play this audio source natively. Try external link."));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) audioRef.current.currentTime = val;
  };

  const handleSkip = (amount: number) => {
    if (!audioRef.current) return;
    const next = Math.max(0, Math.min(duration, currentTime + amount));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val > 0 && muted) toggleMute();
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
    setShowSpeedMenu(false);
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-16">
        <Headphones className="h-10 w-10 text-muted-foreground opacity-25" />
        <p className="text-sm text-muted-foreground">No audio records available.</p>
        <Link href={hubUrl} className="text-sm font-medium text-primary hover:underline">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT: Main Player Area */}
      <div className="flex-1 flex flex-col gap-4">
        {active ? (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            
            {/* Custom Premium Audio Player */}
            <div className="w-full bg-black/40 border-b border-white/5 p-6">
              <CustomAudioPlayer 
                key={active.id}
                url={active.url} 
                title={active.title} 
              />
            </div>

            <div className="p-4 md:p-6 bg-card flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{active.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 tracking-tight">
                    <span className="flex items-center gap-1.5 text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                      Audio Stream
                    </span>
                    {!spotifyEmbed && (
                      <>
                        <span>•</span>
                        <span>{formatTime(duration)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={active.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-muted/40 px-4 text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    Open Source
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => deleteRecord(active.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-transparent hover:border-destructive/20"
                      title="Remove record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* RIGHT: Playlist Area */}
      <div className="w-full lg:w-[340px] shrink-0">
        <div className="rounded-2xl border border-border bg-card/50 overflow-hidden flex flex-col shadow-sm sticky top-6">
          <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
            <div className="flex flex-col">
              <h3 className="font-semibold text-sm">Lecture Tracks</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{records.length} {records.length === 1 ? 'Track' : 'Tracks'}</p>
            </div>
            <Headphones className="h-4 w-4 text-primary" />
          </div>

          <div className="max-h-[480px] overflow-y-auto no-scrollbar">
            {records.map((r, i) => {
              const isActive = r.id === activeId;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveId(r.id)}
                  className={cn(
                    "w-full text-left p-3 pt-3.5 pb-3.5 flex items-start gap-3 transition-colors group relative border-b border-white/[0.05] last:border-0",
                    isActive ? "bg-primary/5" : "hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center justify-center w-6 opacity-60 font-mono text-xs mt-0.5 relative">
                    {isActive ? (
                      isPlaying ? (
                        <div className="flex items-end gap-[2px] h-3 w-3">
                          {[0, 1, 2].map((idx) => (
                            <motion.div
                              key={idx}
                              animate={{ height: ["20%", "100%", "20%"] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: idx * 0.1, ease: "easeInOut" }}
                              className="w-[2px] bg-primary rounded-full"
                            />
                          ))}
                        </div>
                      ) : (
                        <Play className="h-3.5 w-3.5 text-primary ml-0.5" />
                      )
                    ) : (
                      <span className="text-muted-foreground">{i + 1}</span>
                    )}
                  </div>

                  <div className="pr-2 flex-1 relative overflow-hidden">
                    <p className={cn(
                      "text-sm font-semibold truncate", 
                      isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                    )}>
                      {r.title}
                    </p>
                    <p className={cn(
                      "text-xs truncate mt-0.5 font-medium",
                      isActive ? "text-primary/70" : "text-muted-foreground opacity-70"
                    )}>
                      Audio Session
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

