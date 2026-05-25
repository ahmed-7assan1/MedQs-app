import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founders",
  description:
    "Meet the dedicated team of medical professionals and innovators behind MedOneX — the AI-powered medical education platform built by medics, for medics.",
  openGraph: {
    title: "Founders of MedOneX",
    description:
      "Meet the visionaries behind the AI-powered medical education platform. Built by medical students and innovators for the next generation of doctors.",
  },
};

export default function FoundersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
