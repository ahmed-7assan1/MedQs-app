export const CACHE_TAGS = {
  DASHBOARD: "dashboard",
  QUIZ_CONTENT: "quiz-content",
  SITE_CONFIG: "site-config",
  ADS: "ads",
  YOUTUBE: "youtube",
  USER_PROFILE: "user-profile",
  COMMUNITY: "community",
} as const;

export const CACHE_TTL = {
  DASHBOARD: 60,
  QUIZ_CONTENT: 300,
  SITE_CONFIG: 300,
  ADS: 300,
  YOUTUBE: 3600,
  USER_PROFILE: 60,
  COMMUNITY: 30,
} as const;
