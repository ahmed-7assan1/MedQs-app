"use client";

import { useEffect, useState } from "react";
import { ReelsContainer } from "@/components/videos/ReelsContainer";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ReelsPage() {
  const searchParams = useSearchParams();
  const initialVideoId = searchParams.get("v");
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    async function fetchReels() {
      try {
        const res = await fetch("/api/v1/videos/curriculum");
        const data = await res.json();
        
        // Transform data to fit Reels format
        const formatted = (Array.isArray(data) ? data : []).map((v: any) => ({
          id: v.id,
          videoUrl: v.url || `https://www.w3schools.com/html/mov_bbb.mp4`, // Fallback for testing
          authorName: v.channelTitle || "MedOneX Educator",
          authorImage: v.channelThumbnail,
          caption: v.title,
          likes: Math.floor(Math.random() * 1000) + 500,
          comments: Math.floor(Math.random() * 100) + 20,
        }));

        setReels(formatted);

        if (initialVideoId) {
          const idx = formatted.findIndex((r: any) => r.id === initialVideoId);
          if (idx !== -1) setStartIndex(idx);
        }
      } catch (err) {
        console.error("Failed to fetch reels", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReels();
  }, [initialVideoId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-500 mb-4" />
        <p className="text-sm font-black uppercase tracking-[0.2em]">Loading MedOneX Studio...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <h2 className="text-2xl font-black mb-2">No Videos Found</h2>
        <p className="text-white/40 max-w-xs">We couldn't find any videos to display in the reels feed.</p>
      </div>
    );
  }

  return <ReelsContainer reels={reels} initialIndex={startIndex} />;
}
