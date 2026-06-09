"use client";

import React, { useRef, useEffect, useCallback } from "react";

interface YouTubePlayerProps {
  videoId: string;
}

let apiLoaded = false;
let apiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(cb: () => void) {
  if ((window as any).YT?.Player) {
    cb();
    return;
  }
  apiCallbacks.push(cb);
  if (apiLoaded) return;
  apiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  tag.async = true;
  (window as any).onYouTubeIframeAPIReady = () => {
    apiCallbacks.forEach((fn) => fn());
    apiCallbacks = [];
  };
  document.head.appendChild(tag);
}

export default function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playingRef = useRef(true);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !(window as any).YT?.Player) return;
    playerRef.current = new (window as any).YT.Player(containerRef.current, {
      videoId,
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        controls: 1,
        enablejsapi: 1,
        playsinline: 1,
      },
      events: {
        onReady: (event: any) => {
          event.target.playVideo();
        },
        onStateChange: (event: any) => {
          const YT = (window as any).YT;
          if (event.data === YT.PlayerState.PAUSED && playingRef.current) {
            setTimeout(() => {
              if (playerRef.current && playerRef.current.getPlayerState?.() === YT.PlayerState.PAUSED) {
                playerRef.current.playVideo();
              }
            }, 50);
          }
        },
      },
    });
  }, [videoId]);

  useEffect(() => {
    loadYouTubeAPI(() => {
      setTimeout(initPlayer, 100);
    });
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [initPlayer]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0, borderRadius: 14 }}
    />
  );
}
