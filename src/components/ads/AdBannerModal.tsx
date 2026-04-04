"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdBanner {
  id: string;
  imageUrl: string;
  linkUrl?: string;
}

export function AdBannerModal({ semesterId }: { semesterId?: string }) {
  const [ad, setAd] = useState<AdBanner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("medqs-ad-seen");
    if (seen) return;

    fetch(`/api/v1/ads/active?semesterId=${semesterId ?? ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setAd(data);
          // Small delay so it doesn't flash on first paint
          setTimeout(() => setVisible(true), 800);
        }
      })
      .catch(() => {});
  }, [semesterId]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("medqs-ad-seen", "1");
    setTimeout(() => setAd(null), 300);
  }

  if (!ad) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={dismiss}
    >
      <div
        className={cn(
          "relative max-w-md w-full overflow-hidden rounded-2xl bg-card shadow-2xl transition-all duration-300",
          visible ? "scale-100" : "scale-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ad image */}
        <img
          src={ad.imageUrl}
          alt="Advertisement"
          className="w-full object-cover max-h-80"
        />

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sponsored</span>
          {ad.linkUrl && (
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Learn more
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
