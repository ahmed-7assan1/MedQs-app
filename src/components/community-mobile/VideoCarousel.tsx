"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { extractYouTubeId } from "./utils";
import YouTubePlayer from "./YouTubePlayer";
import { subscribe, notify } from "./videoManager";

interface VideoCarouselProps {
  urls: string[];
}

let instanceCounter = 0;

export default function VideoCarousel({ urls }: VideoCarouselProps) {
  const instanceId = useRef(`vc-${++instanceCounter}`).current;
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pauseKey, setPauseKey] = useState(0);
  const prevIndexRef = useRef(activeIndex);
  const isVisibleRef = useRef(true);

  // Listen for global pause events from other carousels
  useEffect(() => {
    const unsub = subscribe((sourceId) => {
      if (sourceId === instanceId) return;
      videoRefs.current.forEach((v) => {
        if (v && !v.paused) v.pause();
      });
      setPauseKey((k) => k + 1);
    });
    return unsub;
  }, [instanceId]);

  // Pause all videos when this carousel scrolls out of viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          videoRefs.current.forEach((v) => {
            if (v && !v.paused) v.pause();
          });
          setPauseKey((k) => k + 1);
        }
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex) {
      prevIndexRef.current = activeIndex;
      setActiveIndex(idx);
    }
  }, [activeIndex]);

  // Pause video when scrolling away from its slide
  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev !== activeIndex) {
      const prevVideo = videoRefs.current[prev];
      if (prevVideo && !prevVideo.paused) {
        prevVideo.pause();
      }
      prevIndexRef.current = activeIndex;
    }
  }, [activeIndex]);

  const handleVideoPlay = useCallback((playingIndex: number) => {
    // Don't allow play if not visible
    if (!isVisibleRef.current) return;

    videoRefs.current.forEach((video, i) => {
      if (video && i !== playingIndex && !video.paused) {
        video.pause();
      }
    });
    notify(instanceId);
  }, [instanceId]);

  if (urls.length === 0) return null;

  const isVideo = (url: string) => {
    const clean = url.toLowerCase().split("?")[0].split("#")[0];
    return clean.endsWith(".mp4") || clean.endsWith(".mov") || clean.endsWith(".webm") || clean.endsWith(".avi") || clean.endsWith(".mkv");
  };

  const isTelegram = (url: string) =>
    url.includes("t.me/") || url.includes("telegram.me/") || url.includes("/api/v1/telegram/") || url.includes("/api/v1/files/telegram/preview");

  return (
    <div ref={containerRef} className="mt-3">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 gap-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {urls.map((url, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-[calc(100vw-2rem)] max-w-[calc(100%-0px)] rounded-xl overflow-hidden bg-black"
          >
            {isVideo(url) ? (
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={url}
                controls
                className="w-full aspect-video object-contain"
                onPlay={() => handleVideoPlay(i)}
              />
            ) : isTelegram(url) ? (
              <div className="aspect-video">
                {i === activeIndex ? (
                  <iframe
                    key={`tg-${pauseKey}`}
                    src={url}
                    className="w-full h-full border-none"
                    allow="encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/60">
                    <svg className="h-10 w-10 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ) : extractYouTubeId(url) ? (
              <div className="aspect-video">
                {i === activeIndex ? (
                  <YouTubePlayer key={`yt-${pauseKey}`} videoId={extractYouTubeId(url)!} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/60">
                    <svg className="h-10 w-10 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={url}
                controls
                className="w-full aspect-video object-contain"
                onPlay={() => handleVideoPlay(i)}
              />
            )}
          </div>
        ))}
      </div>

      {urls.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const el = scrollRef.current;
                if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
              aria-label={`Go to video ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
