"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAudioStore } from "@/lib/store";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Settings2, Headphones, Music, Share2, Info, Loader2,
  ExternalLink, ChevronUp, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface SpotifyMetadata {
  title: string;
  artist: string;
  image: string;
  duration_ms?: number;
  preview_url?: string;
  type: string;
}

interface CustomAudioPlayerProps {
  url: string;
  title?: string;
  autoPlay?: boolean;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  if (match) return match[1];
  
  // Fallback for other youtube domains or formats
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "unknown"; // At least we know it's YouTube
  }
  return null;
}

export function CustomAudioPlayer({ url, title: initialTitle, autoPlay = false }: CustomAudioPlayerProps) {
  const [mounted, setMounted] = useState(false);
  const [metadata, setMetadata] = useState<SpotifyMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  // Local Metadata & UI State
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const isSpotify = url.includes("spotify.com");
  const ytId = extractYouTubeId(url);
  const isYoutube = !!ytId;

  useEffect(() => {
    setMounted(true);
    if (isSpotify) {
      setLoading(true);
      console.log("[AudioPlayer] Fetching Spotify metadata for:", url);
      fetch(`/api/v1/spotify/metadata?url=${encodeURIComponent(url)}`)
        .then(r => r.json())
        .then(data => {
          console.log("[AudioPlayer] Received data:", data);
          if (!data.error) {
            setMetadata(data);
          } else {
            console.error("[AudioPlayer] API Error:", data.error, data.details);
          }
        })
        .catch(err => console.error("[AudioPlayer] Fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [url, isSpotify]);

  const spotifyEmbedUrl = useMemo(() => {
    if (!isSpotify) return null;
    const match = url.match(/spotify\.com\/(track|episode|album|show|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }, [url, isSpotify]);

  // Use preview URL if it's a Spotify track, otherwise use original URL
  const audioSource = (isSpotify && metadata?.preview_url) ? metadata.preview_url : (isSpotify ? null : url);

  const { 
    setTrack, 
    currentTrack, 
    isPlaying: globalPlaying, 
    setIsPlaying: setGlobalPlaying,
    currentTime: storeCurrentTime,
    duration: storeDuration
  } = useAudioStore();

  const isCurrent = currentTrack?.url === url;
  const currentTime = isCurrent ? storeCurrentTime : 0;
  const duration = isCurrent ? storeDuration : 0;

  const togglePlay = useCallback(() => {
    const trackData = {
      id: url,
      url,
      title: metadata?.title || initialTitle || "Lecture Audio Record",
      artist: isYoutube ? "YouTube Audio Record" : (metadata?.artist || "MedOneX Academic Audio"),
      image: metadata?.image,
      isSpotify
    };

    // If it's a new track or the global player is stopped
    if (!isCurrent) {
      setTrack(trackData);
      return;
    }

    // Toggle same track
    if (isSpotify && !metadata?.preview_url && !globalPlaying) {
      setShowEmbed(true);
      toast.success("Opening official Spotify player for full track...");
    }
    
    setGlobalPlaying(!globalPlaying);
  }, [isSpotify, isYoutube, metadata, url, isCurrent, globalPlaying, setGlobalPlaying, setTrack, initialTitle]);

  // Sync local playing state with global
  const playing = isCurrent && globalPlaying;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    // We would need a setSeek in store to actually seek global player
    // For now we just allow the local UI to move but it won't actually seek the audio
    // unless we implement global seek
  };

  const handleSkip = (amount: number) => {
    // same as seek
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!mounted) return <div className="h-48 w-full animate-pulse bg-white/5 rounded-3xl" />;

  return (
    <div className="group relative w-full overflow-hidden rounded-[32px] bg-gradient-to-br from-[#121212] to-[#1e1e1e] border border-white/5 shadow-2xl p-6 md:p-8">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 h-64 w-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {showEmbed ? (
            <motion.div 
              key="embed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-primary uppercase tracking-widest">Spotify Full Player</span>
                <button 
                  onClick={() => setShowEmbed(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-[10px] font-bold text-white/60 hover:text-white transition-all"
                >
                  <SkipBack className="h-3 w-3" /> Back to MedOneX UI
                </button>
              </div>
              <iframe
                src={spotifyEmbedUrl!}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-2xl"
              ></iframe>
            </motion.div>
          ) : (
            <motion.div 
              key="custom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              {/* Album / Track Image */}
              <div className="relative group/img shrink-0">
                <div className={cn(
                  "h-40 w-40 md:h-48 md:w-48 rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-transform duration-500",
                  playing ? "scale-105" : "scale-100"
                )}>
                  {loading ? (
                    <div className="h-full w-full flex items-center justify-center bg-white/5">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    </div>
                  ) : metadata?.image ? (
                    <img src={metadata.image} className="h-full w-full object-cover" alt="Cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <Headphones className="h-16 w-16 text-primary opacity-40" />
                    </div>
                  )}
                </div>
                
                {/* Floating Play Overlay */}
                <button 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-2xl"
                >
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white shadow-xl">
                    {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                  </div>
                </button>

                {isSpotify && !metadata?.preview_url && (
                  <button 
                    onClick={() => setShowEmbed(true)}
                    className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all z-20 border-4 border-[#121212]"
                    title="Switch to Full Spotify Player"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Track Info & Controls */}
              <div className="flex-1 w-full flex flex-col justify-center min-w-0">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                      {isSpotify ? (metadata?.type ? `Spotify ${metadata.type}` : "Spotify Record") : (isYoutube ? "YouTube Record" : "MedOneX Native")}
                    </span>
                    {isSpotify && !metadata?.preview_url && (
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tight flex items-center gap-1">
                        <Info className="h-3 w-3" /> External Stream Only
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white truncate">
                    {loading ? (
                      <span className="opacity-20">Loading track...</span>
                    ) : (metadata?.title || initialTitle || "Lecture Audio Record")}
                  </h2>
                  <p className="text-sm font-bold text-white/50 mt-1 truncate">
                    {loading ? (
                      <span className="opacity-20">Fetching artist...</span>
                    ) : (metadata?.artist || "MedOneX Academic Audio")}
                  </p>
                </div>

                {/* Scrubber */}
                <div className="w-full space-y-2 mb-6">
                  <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer group/seek">
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary transition-all duration-100" 
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-white/40 tracking-tighter">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleSkip(-10)}
                      className="p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <SkipBack className="h-5 w-5" />
                    </button>
                    
                    <button 
                      onClick={togglePlay}
                      className="h-16 w-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      {playing ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                    </button>

                    <button 
                      onClick={() => handleSkip(10)}
                      className="p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <SkipForward className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-3 mr-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                      <Volume2 className="h-4 w-4 text-white/40" />
                      <input 
                        type="range" 
                        min={0} max={1} step={0.01} 
                        value={volume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setVolume(v);
                        }}
                        className="w-20 accent-primary"
                      />
                    </div>

                    <div className="relative">
                      <button 
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black text-white/60 hover:text-white transition-colors"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        {playbackRate}x
                      </button>
                      
                      <AnimatePresence>
                        {showSpeedMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full mb-3 right-0 bg-[#282828] border border-white/10 shadow-2xl rounded-2xl p-2 min-w-[100px] z-[100]"
                          >
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => {
                                  setPlaybackRate(rate);
                                  setShowSpeedMenu(false);
                                }}
                                className={cn(
                                  "w-full px-4 py-2 text-left text-xs font-bold rounded-lg transition-colors",
                                  playbackRate === rate ? "bg-primary text-white" : "hover:bg-white/5 text-white/60 hover:text-white"
                                )}
                              >
                                {rate}x
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                        toast.success("Link copied!");
                      }}
                      className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white/5 border border-white/5 text-white/60 hover:text-white transition-all"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Maximize2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
