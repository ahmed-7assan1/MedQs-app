"use client";

import React, { useEffect, useRef, useState } from "react";
import Plyr from "plyr-react";
import "plyr/dist/plyr.css";
import { cn } from "@/lib/utils";

interface PlyrVideoPlayerProps {
  src: string;
  className?: string;
  playing?: boolean;
  onTimeUpdate?: (time: number) => void;
  startTime?: number;
}

export function PlyrVideoPlayer({
  src,
  className,
  playing,
  onTimeUpdate,
  startTime,
}: PlyrVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const [currentQuality, setCurrentQuality] = useState<string>("Auto");

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = extractYouTubeId(src);

  useEffect(() => {
    if (playerRef.current?.plyr) {
      const plyr = playerRef.current.plyr;

      // Listen for time updates to save progress
      plyr.on("timeupdate", (event: any) => {
        onTimeUpdate?.(event.detail.plyr.currentTime);
      });

      // Listen for quality changes
      plyr.on("qualitychange", (event: any) => {
        setCurrentQuality(event.detail.quality + "p");
      });

      // Handle start time
      if (startTime && startTime > 0) {
        plyr.once("ready", () => {
          plyr.currentTime = startTime;
        });
      }
    }
  }, [onTimeUpdate, startTime]);

  useEffect(() => {
    if (playerRef.current?.plyr) {
      if (playing) {
        playerRef.current.plyr.play();
      } else {
        playerRef.current.plyr.pause();
      }
    }
  }, [playing]);

  if (!videoId) return null;

  return (
    <div className={cn("plyr-container rounded-2xl overflow-hidden shadow-2xl bg-black", className)}>
      <Plyr
        ref={playerRef}
        source={{
          type: "video",
          sources: [
            {
              src: videoId,
              provider: "youtube",
            },
          ],
        }}
        options={{
          controls: [
            "play-large",
            "play",
            "progress",
            "current-time",
            "mute",
            "volume",
            "captions",
            "settings",
            "pip",
            "airplay",
            "fullscreen",
          ],
          settings: ["quality", "speed"],
          youtube: {
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            controls: 0, // This hides YouTube's native controls
          },
          // Customizing the labels to show the current quality in the UI if needed
          i18n: {
            quality: `Quality (${currentQuality})`,
          },
        }}
      />
      
      <style jsx global>{`
        .plyr--full-ui {
          --plyr-color-main: var(--primary, #0ea5e9);
        }
        .plyr__video-embed iframe {
          top: -50%;
          height: 200%;
        }
        .plyr--video .plyr__controls {
            padding-top: 40px;
            background: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.7));
        }
        .plyr__control--overlaid {
            background: rgba(var(--primary), 0.9);
        }
      `}</style>
    </div>
  );
}
