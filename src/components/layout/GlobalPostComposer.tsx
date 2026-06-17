"use client";

import dynamic from "next/dynamic";
import { useCommunityStore } from "@/components/community-mobile/store";

const PostComposer = dynamic(
  () => import("@/components/community-mobile/PostComposer"),
  { ssr: false }
);

export function GlobalPostComposer({
  currentUserName,
  currentUserAvatarUrl,
}: {
  currentUserName: string;
  currentUserAvatarUrl: string | null;
}) {
  const activeForumId = useCommunityStore((s) => s.activeForumId);

  if (!activeForumId) return null;

  return (
    <PostComposer
      forumId={activeForumId}
      currentUserAvatarUrl={currentUserAvatarUrl}
      currentUserName={currentUserName}
    />
  );
}
