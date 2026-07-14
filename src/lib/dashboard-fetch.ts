import useSWR from "swr";

// ── Shared fetcher ──

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return res.json();
};

// ── Types ──

export interface SuggestedRecord {
  id: string;
  url: string;
  title: string;
  image: string | null;
  artist: string;
  lectureId: string;
  lectureTitle: string;
  moduleId: string;
  subjectName: string;
}

export interface SuggestedVideo {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string | null;
  lectureId: string;
  lectureTitle: string;
  moduleId: string;
  subjectName: string;
  channelTitle: string;
  channelThumbnail: string | null;
}

export interface PostData {
  id: string;
  content: string;
  imageUrl: string | null;
  attachments?: unknown;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
  _count?: { likes: number; comments: number };
  youtubeUrl?: string;
  interactionsDisabled?: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ── SWR hooks ──

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  dedupingInterval: 30000,
  errorRetryCount: 1,
};

export function useRecords() {
  return useSWR<PaginatedResponse<SuggestedRecord>>(
    "/api/v1/records?page=1&limit=6",
    fetcher,
    SWR_OPTIONS
  );
}

export function useCurriculumVideos() {
  return useSWR<PaginatedResponse<SuggestedVideo>>(
    "/api/v1/videos/curriculum?page=1&limit=6",
    fetcher,
    SWR_OPTIONS
  );
}

export function useCommunityPosts() {
  const { data, ...rest } = useSWR<PaginatedResponse<PostData>>(
    "/api/v1/community/posts?limit=6",
    fetcher,
    SWR_OPTIONS
  );
  const unwrapped = (data as any)?.data ?? data;
  return { data: unwrapped, ...rest };
}
