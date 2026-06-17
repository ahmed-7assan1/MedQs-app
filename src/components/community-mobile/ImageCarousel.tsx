// src/components/community-mobile/ImageCarousel.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getImageGridLayout } from "./utils";

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const { containerClass, itemClass } = getImageGridLayout(images.length);
  const visibleImages = images.slice(0, 4);
  const extraCount = images.length - 4;

  return (
    <>
      <div className={`${containerClass} overflow-hidden rounded-xl`}>
        {visibleImages.map((src, index) => (
          <button
            key={src + index}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className={`relative overflow-hidden bg-muted ${itemClass(index)}`}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 480px) 100vw, 400px"
              className="object-cover"
            />
            {index === 3 && extraCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-base font-semibold text-white">+{extraCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length));
                  }}
                  className="absolute left-2 rounded-full bg-white/10 p-2 text-white"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i === null ? 0 : (i + 1) % images.length));
                  }}
                  className="absolute right-2 rounded-full bg-white/10 p-2 text-white"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative h-[70vh] w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[lightboxIndex]}
                alt=""
                fill
                sizes="90vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
