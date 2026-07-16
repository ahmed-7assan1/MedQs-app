"use client";

import Link from "next/link";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarLabel } from "@/components/dashboard/shared/SidebarLabel";
import { useCommunityPosts } from "@/lib/dashboard-fetch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

export function CommunityStrip() {
  const { data: raw, error, isLoading } = useCommunityPosts();

  if (error) throw error;

  const body = (raw as any)?.data ?? raw;
  const rawPosts = body?.items ?? [];
  const posts = Array.isArray(rawPosts) ? rawPosts : [];

  return (
    <div className="space-y-3">
      <SidebarLabel icon={MessageCircle} label="Community Feed" />
      
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/20" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Link
          href="/social"
          className="flex items-center gap-2 p-4 rounded-xl border border-border/30 bg-card/30 text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <MessageCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
          <span>No posts yet. Start the conversation!</span>
        </Link>
      ) : (
        <div className="space-y-2">
          {posts.slice(0, 3).map((post: any) => {
            const authorName = post.author?.name || "Anonymous";
            const initial = authorName.charAt(0).toUpperCase();
            
            return (
              <Link
                key={post.id}
                href={`/social?post=${post.id}`}
                className="group block p-3 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm hover:border-primary/20 hover:bg-card/65 transition-all duration-200"
              >
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-5 w-5 rounded-full border border-border/40 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[9px] font-black bg-primary/10 text-primary">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-foreground truncate leading-none">
                        {authorName}
                      </span>
                      <span className="text-[9px] font-medium text-muted-foreground shrink-0">
                        {post.createdAt ? timeAgo(post.createdAt) : ""}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mt-1.5">
                      {stripHtml((post.content || "").slice(0, 120))}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
          
          <Link
            href="/social"
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-all pt-1 pl-1"
          >
            View all posts <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
