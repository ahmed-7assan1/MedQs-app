import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function formatScore(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
  if (score >= 60) return { label: "Good", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-900/20" };
  return { label: "Needs work", color: "text-red-700", bg: "bg-red-50 dark:bg-red-900/20" };
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}
