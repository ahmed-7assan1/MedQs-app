import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See how you rank among medical students. Track your engagement score, compare progress, and compete with peers on MedOneX.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
