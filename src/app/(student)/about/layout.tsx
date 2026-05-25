import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about MedOneX — the AI-powered medical education platform built by medical students for medical students. Our mission is to make medical education accessible, engaging, and effective.",
  openGraph: {
    title: "About MedOneX",
    description:
      "Discover the story behind the AI-powered medical education platform transforming how medical students learn across Egypt and the Middle East.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
