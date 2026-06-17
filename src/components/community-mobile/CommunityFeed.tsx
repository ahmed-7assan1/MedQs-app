// src/components/community-mobile/CommunityFeed.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";

import type { Post } from "./types";
import { fetchForums, fetchForumPosts } from "./api";
import { useCommunityStore } from "./store";
import PostCard from "./PostCard";
import CommentsSheet from "./CommentsSheet";
import ReportModal from "./ReportModal";

interface CommunityFeedProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatarUrl?: string | null;
  isAdmin?: boolean;
}

const PULL_THRESHOLD = 70;

export function CommunityFeed({
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  isAdmin = false,
}: CommunityFeedProps) {
  const forums = useCommunityStore((s) => s.forums);
  const activeForumId = useCommunityStore((s) => s.activeForumId);
  const activeFilter = useCommunityStore((s) => s.activeFilter);
  const posts = useCommunityStore((s) => s.posts);
  const setForums = useCommunityStore((s) => s.setForums);
  const setActiveFilter = useCommunityStore((s) => s.setActiveFilter);
  const setPosts = useCommunityStore((s) => s.setPosts);
  const appendPosts = useCommunityStore((s) => s.appendPosts);
  const setFeedScrolled = useCommunityStore((s) => s.setFeedScrolled);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const pullY = useMotionValue(0);
  const scrollRAF = useRef<number | null>(null);

  const handleFeedScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (scrollRAF.current !== null) return;
    scrollRAF.current = requestAnimationFrame(() => {
      scrollRAF.current = null;
      setFeedScrolled(top > 30);
    });
  }, [setFeedScrolled]);
  const pullIndicatorOpacity = useTransform(pullY, [0, PULL_THRESHOLD], [0, 1]);
  const pullIndicatorRotate = useTransform(pullY, [0, PULL_THRESHOLD], [0, 180]);
  const touchStartY = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load forums once
  useEffect(() => {
    fetchForums()
      .then(setForums)
      .catch(() => setError("Couldn't load forums."));
  }, [setForums]);

  const loadPosts = useCallback(
    async (forumId: string, options: { reset?: boolean } = {}) => {
      try {
        const response = await fetchForumPosts(forumId, {
          cursor: options.reset ? undefined : cursor ?? undefined,
        });
        if (options.reset) {
          setPosts(response.items);
        } else {
          appendPosts(response.items);
        }
        setCursor(response.nextCursor);
        setHasMore(response.hasMore);
        setError(null);
      } catch {
        setError("Couldn't load posts. Pull down to try again.");
      }
    },
    [cursor, setPosts, appendPosts]
  );

  // Reload feed when forum changes
  useEffect(() => {
    if (!activeForumId) return;
    setIsInitialLoading(true);
    setCursor(null);
    setHasMore(true);
    loadPosts(activeForumId, { reset: true }).finally(() => setIsInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeForumId]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !activeForumId) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isFetchingMore && !isInitialLoading) {
          setIsFetchingMore(true);
          loadPosts(activeForumId).finally(() => setIsFetchingMore(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [activeForumId, hasMore, isFetchingMore, isInitialLoading, loadPosts]);

  // Reset feedScrolled on unmount
  useEffect(() => {
    return () => setFeedScrolled(false);
  }, [setFeedScrolled]);

  async function handleRefresh() {
    if (!activeForumId || isRefreshing) return;
    setIsRefreshing(true);
    setCursor(null);
    setHasMore(true);
    await loadPosts(activeForumId, { reset: true });
    setIsRefreshing(false);
  }

  // Pull-to-refresh gesture handling
  function handleTouchStart(e: React.TouchEvent) {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      pullY.set(Math.min(delta * 0.5, PULL_THRESHOLD * 1.4));
    }
  }

  function handleTouchEnd() {
    if (touchStartY.current === null) return;
    const shouldRefresh = pullY.get() >= PULL_THRESHOLD;
    animate(pullY, 0, { type: "spring", damping: 24, stiffness: 300 });
    touchStartY.current = null;
    if (shouldRefresh) handleRefresh();
  }

  const filteredPosts = applyClientFilter(posts, activeFilter);

  return (
    <div className="flex h-screen flex-col bg-background">
      <div
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleFeedScroll}
        className="flex-1 overflow-y-auto pb-24 pt-[88px]"
      >
        <motion.div
          style={{ height: pullY }}
          className="flex items-center justify-center overflow-hidden"
        >
          <motion.span style={{ opacity: pullIndicatorOpacity, rotate: pullIndicatorRotate }}>
            <RefreshCw className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          </motion.span>
        </motion.div>

        {isRefreshing && (
          <div className="flex justify-center py-2">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1.5} />
          </div>
        )}

        {error && (
          <div className="px-4 py-3">
            <p className="text-center text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        <div className="space-y-3 px-4 pt-1">
          {isInitialLoading && <FeedSkeleton />}

          {!isInitialLoading && filteredPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">No posts yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Be the first to share something with your peers
              </p>
            </div>
          )}

          {!isInitialLoading &&
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            ))}
        </div>

        {hasMore && !isInitialLoading && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingMore && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1.5} />
            )}
          </div>
        )}
      </div>

      <CommentsSheet currentUserId={currentUserId} />
      <ReportModal />
    </div>
  );
}

function applyClientFilter(posts: Post[], filter: string): Post[] {
  switch (filter) {
    case "pinned":
      return posts.filter((p) => p.isPinned);
    case "media":
      return posts.filter((p) => p.attachments.length > 0 || p.imageUrl);
    case "trending":
      return [...posts].sort((a, b) => {
        const scoreA = Object.values(a.reactionCounts).reduce((s, v) => s + v, 0) + a.commentCount * 2;
        const scoreB = Object.values(b.reactionCounts).reduce((s, v) => s + v, 0) + b.commentCount * 2;
        return scoreB - scoreA;
      });
    default:
      return posts;
  }
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border/60 p-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-28 rounded bg-muted" />
              <div className="h-2 w-16 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-2.5 w-full rounded bg-muted" />
            <div className="h-2.5 w-4/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
