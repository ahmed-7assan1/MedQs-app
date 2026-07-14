"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

function ImageGridSkeleton({ count }: { count: number }) {
  const rows = count >= 3 ? 2 : 1;
  const cols = count >= 2 ? 2 : 1;
  return (
    <div
      className="grid gap-[2px] rounded-lg overflow-hidden w-full h-full"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: rows > 1 ? "1fr 1fr" : "1fr" }}
    >
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-muted/50 animate-pulse",
            count === 3 && i === 0 && "row-span-2"
          )}
        />
      ))}
    </div>
  );
}

function GalleryImage({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt?: string;
  onClick?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted/30">
      {!loaded && !failed && (
        <div className="absolute inset-0 bg-muted/50 animate-pulse" />
      )}
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted/20 text-muted-foreground/40">
          <span className="text-lg">🖼️</span>
          <span className="text-[9px] font-medium">Unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt || "Attached image"}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          onClick={onClick}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            onClick && "cursor-pointer hover:scale-105 transition-transform duration-200"
          )}
        />
      )}
    </div>
  );
}

export function ImageGallery({
  images,
  onImageClick,
  className,
}: {
  images: { url: string; alt?: string }[];
  onImageClick?: () => void;
  className?: string;
}) {
  const [skeletonDone, setSkeletonDone] = useState(false);
  const count = images.length;
  const shown = images.slice(0, 4);
  const extra = count - 4;

  const gridClass =
    count === 1
      ? "grid-cols-1"
      : "grid-cols-2";

  const handleLoad = useCallback(() => {
    setSkeletonDone(true);
  }, []);

  return (
    <div className={cn("relative w-full h-full", className)}>
      {!skeletonDone && <ImageGridSkeleton count={count} />}
      <div
        className={cn(
          "grid gap-[2px] rounded-lg overflow-hidden w-full h-full",
          gridClass,
          skeletonDone ? "block" : "hidden"
        )}
      >
        {shown.map((img, i) => {
          const isLastVisible = i === shown.length - 1 && extra > 0;
          return (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden bg-muted/20",
                count === 3 && i === 0 && "row-span-2",
                count === 3 && i >= 1 && "h-1/2",
                count >= 4 && "aspect-[4/3]",
                count <= 2 && "aspect-[4/3]",
                count === 3 && i === 0 && "aspect-[4/3]"
              )}
              style={
                count === 3 && i >= 1
                  ? { height: "50%" }
                  : count === 3 && i === 0
                  ? {}
                  : {}
              }
            >
              <GalleryImage
                src={img.url}
                alt={img.alt}
                onClick={onImageClick}
              />
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">+{extra}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Load callback - marks skeleton as done when images start loading */}
      <img
        src={shown[0]?.url}
        alt=""
        onLoad={handleLoad}
        onError={handleLoad}
        className="hidden"
      />
    </div>
  );
}
