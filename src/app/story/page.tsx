"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Story } from "@/components/landing/Story";

export default function StoryPage() {
  return (
    <div className="relative">
      <Link
        href="/"
        className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>
      <Story />
    </div>
  );
}
