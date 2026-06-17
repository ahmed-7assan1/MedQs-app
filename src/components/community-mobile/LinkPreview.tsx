// src/components/community-mobile/LinkPreview.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link2 } from "lucide-react";

interface LinkMeta {
  title: string;
  description: string;
  imageUrl: string | null;
  domain: string;
}

interface LinkPreviewProps {
  url: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMeta(null);
    setFailed(false);

    fetch(`/api/v1/link-preview?url=${encodeURIComponent(url)}`)
      .then((res) => {
        if (!res.ok) throw new Error("preview failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setMeta(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) return null;

  let domain = "";
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch {
    domain = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex overflow-hidden rounded-xl border border-border/60 bg-background transition-colors active:bg-muted/40"
    >
      {meta?.imageUrl ? (
        <div className="relative h-20 w-20 flex-shrink-0 bg-muted">
          <Image src={meta.imageUrl} alt="" fill sizes="80px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center bg-muted">
          <Link2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
        <p className="truncate text-sm font-semibold text-foreground">
          {meta?.title ?? domain}
        </p>
        {meta?.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{meta.description}</p>
        )}
        <p className="truncate text-[11px] text-muted-foreground">{meta?.domain ?? domain}</p>
      </div>
    </a>
  );
}
