import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Video Lectures",
  description: "Watch high-quality medical video lectures and surgical demonstrations. Learn anatomy, clinical skills, and exam preparation through expert-led videos.",
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
