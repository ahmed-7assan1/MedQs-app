// src/components/community-mobile/PostCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ThumbsUp,
  Brain,
  HelpCircle,
  Lightbulb,
  Handshake,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  Flag,
  EyeOff,
  FileText,
  Download,
  Copy,
  Ban,
  type LucideIcon,
} from "lucide-react";

import type { Post, ReactionType } from "./types";
import { REACTION_ORDER, REACTION_META } from "./types";
import {
  formatRelativeTime,
  formatCompactNumber,
  totalReactions,
  extractYouTubeId,
  extractFirstLink,
  getInitials,
} from "./utils";
import { toggleReaction, savePost, sharePost, deletePost, toggleBlock } from "./api";
import { useCommunityStore } from "./store";
import { useRouter } from "next/navigation";
import RichText from "./RichText";
import ImageCarousel from "./ImageCarousel";
import YouTubePlayer from "./YouTubePlayer";
import LinkPreview from "./LinkPreview";

const REACTION_ICONS: Record<ReactionType, LucideIcon> = {
  HEART: Heart,
  THUMBS_UP: ThumbsUp,
  BRAIN: Brain,
  QUESTION: HelpCircle,
  LIGHTBULB: Lightbulb,
  HANDSHAKE: Handshake,
};

interface PostCardProps {
  post: Post;
  currentUserId: string;
  isAdmin?: boolean;
  onHashtagClick?: (tag: string) => void;
  onAuthorClick?: (userId: string) => void;
}

export default function PostCard({
  post,
  currentUserId,
  isAdmin = false,
  onHashtagClick,
  onAuthorClick,
}: PostCardProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const applyReaction = useCommunityStore((s) => s.applyReaction);
  const updatePost = useCommunityStore((s) => s.updatePost);
  const removePost = useCommunityStore((s) => s.removePost);
  const openComments = useCommunityStore((s) => s.openComments);
  const openReport = useCommunityStore((s) => s.openReport);
  const openComposer = useCommunityStore((s) => s.openComposer);

  const isOwnPost = post.author?.id === currentUserId;
  const youtubeId = extractYouTubeId(post.content);
  const linkUrl = !youtubeId ? extractFirstLink(post.content) : null;
  const total = totalReactions(post.reactionCounts);
  const topReactions = REACTION_ORDER.filter((type) => post.reactionCounts[type] > 0)
    .sort((a, b) => post.reactionCounts[b] - post.reactionCounts[a])
    .slice(0, 3);

  async function handleReact(type: ReactionType) {
    const previous = post.userReaction;
    const next = previous === type ? null : type;
    applyReaction(post.id, next, previous);
    setShowReactionPicker(false);
    try {
      await toggleReaction(post.id, next);
    } catch {
      applyReaction(post.id, previous, next);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    updatePost(post.id, { isSaved: !post.isSaved });
    try {
      await savePost(post.id);
    } catch {
      updatePost(post.id, { isSaved: post.isSaved });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShare() {
    try {
      await sharePost(post.id);
      updatePost(post.id, { shareCount: post.shareCount + 1 });
      if (navigator.share) {
        await navigator.share({ url: `${window.location.origin}/social/post/${post.id}` });
      }
    } catch {
      // sharing is best-effort
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    try {
      await deletePost(post.id);
      removePost(post.id);
    } catch {
      // surface via toast in real implementation
    }
  }

  async function handleCopyLink() {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/social/post/${post.id}`);
    } catch {
      // fallback
    }
  }

  async function handleBlockUser() {
    setMenuOpen(false);
    if (!post.author?.id) return;
    try {
      await toggleBlock(post.author.id);
      removePost(post.id);
    } catch {
      // surface via toast
    }
  }

  const authorName = post.isAnonymous ? "Anonymous" : post.author?.name ?? "Unknown";
  const backgroundClass =
    post.backgroundStyle && post.backgroundStyle !== "none"
      ? backgroundStyleClass(post.backgroundStyle)
      : "";

  return (
    <article
      className={`rounded-2xl border border-border/60 bg-background p-4 shadow-sm ${backgroundClass}`}
    >
      {/* Author row */}
      <div className="flex items-start justify-between gap-2">
        {post.isAnonymous || !post.author ? (
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-muted">
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              </div>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-foreground">Anonymous</span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {post.isPinned && <Pin className="h-3 w-3" strokeWidth={1.5} />}
                <span>{formatRelativeTime(post.createdAt)}</span>
                {post.forumName && <><span>·</span><span className="truncate">{post.forumName}</span></>}
              </div>
            </div>
          </div>
        ) : (
          <Link
            href={`/profile/u/${post.author.id}`}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-muted">
              {post.author.avatarUrl ? (
                <Image src={post.author.avatarUrl} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                  {getInitials(authorName)}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-foreground">{authorName}</span>
                {post.author.rankLabel && (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {post.author.rankLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {post.isPinned && <Pin className="h-3 w-3" strokeWidth={1.5} />}
                <span>{formatRelativeTime(post.createdAt)}</span>
                {post.forumName && <><span>·</span><span className="truncate">{post.forumName}</span></>}
              </div>
            </div>
          </Link>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors active:bg-muted"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-9 z-50 w-44 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-lg"
                >
                  {isOwnPost ? (
                    <>
                      <MenuItem
                        icon={Pencil}
                        label="Edit post"
                        onClick={() => {
                          setMenuOpen(false);
                          openComposer(post.id);
                        }}
                      />
                      <MenuItem
                        icon={Trash2}
                        label="Delete post"
                        destructive
                        onClick={handleDelete}
                      />
                    </>
                  ) : (
                    <>
                      <MenuItem
                        icon={Flag}
                        label="Report post"
                        onClick={() => {
                          setMenuOpen(false);
                          openReport("post", post.id);
                        }}
                      />
                      {post.author && (
                        <MenuItem
                          icon={Ban}
                          label="Block user"
                          destructive
                          onClick={handleBlockUser}
                        />
                      )}
                    </>
                  )}
                  <MenuItem
                    icon={Copy}
                    label="Copy link"
                    onClick={handleCopyLink}
                  />
                  {isAdmin && (
                    <MenuItem
                      icon={Pin}
                      label={post.isPinned ? "Unpin post" : "Pin post"}
                      onClick={() => {
                        setMenuOpen(false);
                        updatePost(post.id, { isPinned: !post.isPinned });
                      }}
                    />
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3">
        <RichText content={post.content} onHashtagClick={onHashtagClick} />
      </div>

      {/* Media */}
      {youtubeId && (
        <div className="mt-3">
          <YouTubePlayer videoId={youtubeId} />
        </div>
      )}
      {!youtubeId && post.attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {/* Images */}
          {post.attachments.filter((a) => a.type === "image").length > 0 && (
            <ImageCarousel images={post.attachments.filter((a) => a.type === "image").map((a) => a.url)} />
          )}
          {/* Audio */}
          {post.attachments.filter((a) => a.type === "audio").map((att) => (
            <div key={att.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <audio src={att.url} controls className="flex-1 h-8" />
            </div>
          ))}
          {/* Files */}
          {post.attachments.filter((a) => a.type === "file").map((att) => (
            <a
              key={att.id}
              href={att.url}
              download={att.name}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <span className="flex-1 truncate text-sm text-foreground">{att.name ?? "Attachment"}</span>
              <Download className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            </a>
          ))}
        </div>
      )}
      {!youtubeId && !post.attachments.length && post.imageUrl && (
        <div className="mt-3">
          <ImageCarousel images={[post.imageUrl]} />
        </div>
      )}
      {linkUrl && (
        <div className="mt-3">
          <LinkPreview url={linkUrl} />
        </div>
      )}

      {/* Shared question */}
      {post.sharedQuestionData && (
        <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {post.sharedQuestionData.subjectName ?? "Practice question"}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {post.sharedQuestionData.prompt}
          </p>
          <div className="mt-2 space-y-1.5">
            {post.sharedQuestionData.choices?.map((choice) => (
              <div
                key={choice.id}
                className="rounded-lg border border-border/60 px-2.5 py-1.5 text-xs text-foreground"
              >
                {choice.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Poll */}
      {post.poll && <PollBlock poll={post.poll} postId={post.id} />}

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.hashtags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onHashtagClick?.(tag)}
              className="text-xs text-primary"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Reaction summary row */}
      {total > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="flex -space-x-1">
            {topReactions.map((type) => {
              const Icon = REACTION_ICONS[type];
              return (
                <span
                  key={type}
                  className={`flex h-4 w-4 items-center justify-center rounded-full bg-background ring-1 ring-background ${REACTION_META[type].colorClass}`}
                >
                  <Icon className="h-2.5 w-2.5" strokeWidth={2} />
                </span>
              );
            })}
          </div>
          <span>{formatCompactNumber(total)}</span>
        </div>
      )}

      {/* Reaction bar + actions */}
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
        <div className="relative flex items-center gap-1">
          {post.userReaction ? (
            <ReactionButton
              type={post.userReaction}
              active
              onClick={() => handleReact(post.userReaction!)}
              onLongPress={() => setShowReactionPicker((v) => !v)}
            />
          ) : (
            <ReactionButton
              type="HEART"
              active={false}
              isPlaceholder
              onClick={() => setShowReactionPicker((v) => !v)}
              onLongPress={() => setShowReactionPicker((v) => !v)}
            />
          )}

          <AnimatePresence>
            {showReactionPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowReactionPicker(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-10 left-0 z-50 flex gap-1 rounded-full border border-border/60 bg-background p-1.5 shadow-lg"
                >
                  {REACTION_ORDER.map((type) => {
                    const Icon = REACTION_ICONS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleReact(type)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90 ${REACTION_META[type].colorClass} hover:bg-muted`}
                        aria-label={REACTION_META[type].label}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => openComments(post.id)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors active:text-foreground"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            {post.commentCount > 0 && <span>{formatCompactNumber(post.commentCount)}</span>}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors active:text-foreground"
            aria-label={post.isSaved ? "Unsave" : "Save"}
          >
            <Bookmark
              className={`h-4 w-4 ${post.isSaved ? "fill-foreground text-foreground" : ""}`}
              strokeWidth={1.5}
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors active:text-foreground"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.5} />
            {post.shareCount > 0 && <span>{formatCompactNumber(post.shareCount)}</span>}
          </button>
        </div>
      </div>
    </article>
  );
}

function ReactionButton({
  type,
  active,
  isPlaceholder,
  onClick,
  onLongPress,
}: {
  type: ReactionType;
  active: boolean;
  isPlaceholder?: boolean;
  onClick: () => void;
  onLongPress: () => void;
}) {
  const Icon = REACTION_ICONS[type];
  const meta = REACTION_META[type];
  let pressTimer: ReturnType<typeof setTimeout>;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => {
        pressTimer = setTimeout(onLongPress, 380);
      }}
      onPointerUp={() => clearTimeout(pressTimer)}
      onPointerLeave={() => clearTimeout(pressTimer)}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
        active && !isPlaceholder ? meta.activeClass : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${active && !isPlaceholder ? "" : ""}`}
        strokeWidth={1.5}
      />
      <span>{isPlaceholder ? "React" : meta.label}</span>
    </button>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors active:bg-muted ${
        destructive ? "text-red-500" : "text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
      {label}
    </button>
  );
}

function backgroundStyleClass(style: string): string {
  const map: Record<string, string> = {
    indigo: "bg-indigo-50/60 dark:bg-indigo-950/20",
    rose: "bg-rose-50/60 dark:bg-rose-950/20",
    emerald: "bg-emerald-50/60 dark:bg-emerald-950/20",
    amber: "bg-amber-50/60 dark:bg-amber-950/20",
    slate: "bg-slate-50/60 dark:bg-slate-950/20",
  };
  return map[style] ?? "";
}

function PollBlock({ poll: pollProp, postId }: { poll: Post["poll"]; postId: string }) {
  const updatePost = useCommunityStore((s) => s.updatePost);
  const [voting, setVoting] = useState(false);
  if (!pollProp) return null;
  const poll = pollProp;

  const hasVoted = Boolean(poll.userVotedOptionId);

  async function vote(optionId: string) {
    if (hasVoted || voting) return;
    setVoting(true);
    const updatedOptions = poll.options.map((o) =>
      o.id === optionId ? { ...o, votes: o.votes + 1 } : o
    );
    updatePost(postId, {
      poll: { ...poll, options: updatedOptions, totalVotes: poll.totalVotes + 1, userVotedOptionId: optionId },
    });
    try {
      await fetch(`/api/v1/posts/${postId}/poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border/60 p-3">
      <p className="text-sm font-medium text-foreground">{poll.question}</p>
      <div className="mt-2.5 space-y-2">
        {poll.options.map((option) => {
          const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
          const isSelected = poll.userVotedOptionId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => vote(option.id)}
              disabled={hasVoted}
              className="relative w-full overflow-hidden rounded-lg border border-border/60 px-3 py-2 text-left text-xs"
            >
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 ${isSelected ? "bg-primary/15" : "bg-muted"}`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className={isSelected ? "font-medium text-foreground" : "text-foreground"}>
                  {option.label}
                </span>
                {hasVoted && <span className="text-muted-foreground">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatCompactNumber(poll.totalVotes)} votes
      </p>
    </div>
  );
}
