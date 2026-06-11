export interface Author {
  id: string;
  name: string;
  handle?: string;
  image?: string | null;
  avatar?: string;
  avatarColor?: string;
  verified?: boolean;
  role?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface MediaItem {
  type: "image" | "youtube";
  url: string;
  youtubeId?: string;
  thumbnail?: string;
  duration?: string;
  caption?: string;
}

export interface Attachment {
  name: string;
  ext: string;
  size: string;
  color: string;
  url?: string;
}

export interface CommentAuthor {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
  avatarColor?: string;
  verified?: boolean;
}

export interface Reply {
  id: string;
  author: CommentAuthor;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  replyTo?: string;
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  text?: string;
  time: string;
  likes: number;
  liked: boolean;
  replies?: Reply[];
  audioSeconds?: number;
  attachment?: Attachment;
}

export interface Post {
  id: string;
  author: Author;
  timestamp: string;
  text: string;
  tags?: string[];
  media: MediaItem[];
  attachments: Attachment[];
  reactions: Reaction[];
  commentCount: number;
  shareCount: number;
  viewCount?: string;
  pinned?: boolean;
  isOwner?: boolean;
  saved?: boolean;
}

export interface CommunityStats {
  onlineMembers: number;
  activeDiscussions: number;
}

export type TabType = "home" | "explore" | "create" | "activity" | "profile";
