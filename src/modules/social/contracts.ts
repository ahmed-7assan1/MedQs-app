export type CommunityPostInput = {
  tenantKey: string;
  authorUserId: string;
  communityId: string;
  title: string;
  body: string;
};

export type SocialServiceContract = {
  createPost: (input: CommunityPostInput) => Promise<{ postId: string }>;
  toggleReaction: (postId: string, userId: string, reaction: "LIKE" | "HELPFUL") => Promise<{ active: boolean }>;
};
