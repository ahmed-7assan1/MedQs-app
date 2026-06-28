export const CACHE_TTL = {
  FORUM_POSTS: 30,
  FORUM_LIST: 60,
  FEED: 30,
  PROFILE: 120,
  DASHBOARD: 60,
  LEADERBOARD: 120,
  RANK: 300,
  SITE_CONFIG: 600,
  SEMESTER_DATA: 300,
  PUBLIC_QUIZ: 60,
} as const satisfies Record<string, number>;

export const CACHE_TAGS = {
  FORUM: (id: string) => `forum-${id}`,
  POST: (id: string) => `post-${id}`,
  USER: (id: string) => `user-${id}`,
  UNIVERSITY: (id: string) => `university-${id}`,
  LECTURE: (id: string) => `lecture-${id}`,
  MODULE: (id: string) => `module-${id}`,
  DASHBOARD: (userId: string) => `dashboard-${userId}`,
  FEED: (forumId: string) => `feed-${forumId}`,
} as const;

export const RATE_LIMIT = {
  POST: 5,
  COMMENT: 10,
  LIKE: 20,
  SHARE: 5,
  REGISTER: 5,
  LOGIN: 10,
} as const satisfies Record<string, number>;
