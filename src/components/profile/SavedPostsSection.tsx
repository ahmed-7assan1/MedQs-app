"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";
import {
  FORUM_SAVED_POSTS_KEY,
  SAVED_POSTS_CHANGED_EVENT,
  loadSavedPosts,
  removeSavedPost,
  type SavedPostSnapshot,
} from "@/lib/forum-saved-posts";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

function snippet(md: string, max = 140) {
  const t = md.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function SavedPostsSection() {
  const [posts, setPosts] = useState<SavedPostSnapshot[]>([]);

  function refresh() {
    setPosts(loadSavedPosts());
  }

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === FORUM_SAVED_POSTS_KEY || e.key === null) refresh();
    };
    const onLocal = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(SAVED_POSTS_CHANGED_EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SAVED_POSTS_CHANGED_EVENT, onLocal);
    };
  }, []);

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-transparent bg-white/[0.02] px-4 py-8 text-center text-white">
        <Bookmark className="mx-auto mb-2 h-8 w-8 text-white/20" />
        <p className="text-sm font-medium text-white/70">Saved posts</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use the ··· menu on a forum post to save it here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <div
          key={p.id}
          className="flex gap-3 rounded-2xl border border-white/[0.02] bg-white/[0.02] p-5 shadow-sm transition-all hover:bg-white/[0.04]"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{p.authorName}</span>
              {p.forumName ? <span>· {p.forumName}</span> : null}
              <span>· {new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
            <p dir="auto" className="mt-2 text-sm leading-relaxed text-foreground/90">{snippet(p.content)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/forum/post/${p.id}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium",
                  "hover:border-primary/30 hover:bg-muted/60"
                )}
              >
                <ExternalLink className="h-3 w-3" />
                Open post
              </Link>
              <button
                type="button"
                onClick={() => {
                  removeSavedPost(p.id);
                  refresh();
                  toast.success("Removed from saved");
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-transparent px-3 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

