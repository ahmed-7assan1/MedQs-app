import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anatomy Atlas",
  description: "Interactive 3D anatomy atlas for medical students. Explore human anatomy with detailed illustrations, AI-powered explanations, and search.",
};

export default function AtlasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
