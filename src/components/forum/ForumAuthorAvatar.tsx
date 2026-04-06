"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const DATA_URI = /^data:/i;

interface ForumAuthorAvatarProps {
  src: string;
  alt: string;
  sizePx: number;
  className?: string;
}

/** Small forum avatars: `next/image` for remote URLs; plain `img` for data URIs. */
export function ForumAuthorAvatar({ src, alt, sizePx, className }: ForumAuthorAvatarProps) {
  const rounded = cn("rounded-full object-cover", className);

  if (DATA_URI.test(src)) {
    return <img src={src} alt={alt} width={sizePx} height={sizePx} className={rounded} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={sizePx}
      height={sizePx}
      unoptimized
      className={rounded}
    />
  );
}
