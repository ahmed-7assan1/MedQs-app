import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search medical content across MedOneX. Find lectures, modules, past papers, videos, and study materials instantly.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
