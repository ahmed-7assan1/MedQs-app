export type ApiV2Error = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiV2Response<TResult> = {
  requestId: string;
  tenantKey: string | null;
  actor: { id: string; role: string } | null;
  result: TResult | null;
  errors: ApiV2Error[];
};

export type ApiV2Pagination = {
  cursor?: string | null;
  limit?: number;
};

export type ApiV2ListResult<T> = {
  items: T[];
  nextCursor: string | null;
};

export const V2_ROUTES = {
  org: "/api/v2/org",
  content: "/api/v2/content",
  quiz: "/api/v2/quiz",
  ai: "/api/v2/ai",
  social: "/api/v2/social",
  marketplace: "/api/v2/marketplace",
  studySpace: "/api/v2/study-space",
} as const;
