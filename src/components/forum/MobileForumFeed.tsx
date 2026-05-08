"use client";

import { useState, useEffect } from "react";
import { 
  InstagramPostCard 
} from "./InstagramPostCard";
import { 
  Camera, 
  PaperPlaneTilt, 
  Heart, 
  PlusSquare,
  Compass,
  User,
  House,
  MagnifyingGlass,
  CircleNotch
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  initialPosts: any[];
  currentUserId: string;
}

export function MobileForumFeed({ initialPosts, currentUserId }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await fetch('/api/v1/feed?mode=university');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      toast.error("Failed to refresh feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-[100] flex items-center justify-between px-4 py-3 bg-black border-b border-white/5 backdrop-blur-lg bg-black/80">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white">
            MedOneX
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-white active:scale-90 transition-transform">
            <PlusSquare size={26} weight="bold" />
          </button>
          <button className="text-white active:scale-90 transition-transform relative">
            <Heart size={26} weight="bold" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
          </button>
          <button className="text-white active:scale-90 transition-transform">
            <PaperPlaneTilt size={26} weight="bold" />
          </button>
        </div>
      </header>

      {/* Feed */}
      <main className="flex-1 pb-20">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <CircleNotch size={32} className="animate-spin text-white/20" />
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <Camera size={64} weight="thin" />
            <p className="mt-4 font-bold">No Posts Yet</p>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {posts.map((post) => (
            <InstagramPostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId} 
            />
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-black border-t border-white/5 px-6 py-3 pb-8 z-[100] flex items-center justify-between">
        <button className="text-white active:scale-90 transition-all">
          <House size={28} weight="fill" />
        </button>
        <button className="text-white/40 active:scale-90 transition-all hover:text-white">
          <MagnifyingGlass size={28} weight="bold" />
        </button>
        <button className="text-white/40 active:scale-90 transition-all hover:text-white">
          <Compass size={28} weight="bold" />
        </button>
        <button className="text-white/40 active:scale-90 transition-all hover:text-white">
          <User size={28} weight="bold" />
        </button>
      </nav>
    </div>
  );
}
