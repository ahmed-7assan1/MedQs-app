"use client";
/**
 * ImageCropModal — A professional crop dialog powered by react-easy-crop.
 *
 * Features:
 *   - Circular crop preview for avatars (or rectangular for banners)
 *   - Pinch-to-zoom on mobile / scroll-to-zoom on desktop
 *   - Drag to reposition
 *   - Rotation slider
 *   - Returns a cropped Blob ready for upload
 */

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { RotateCw, ZoomIn, ZoomOut, Check, X } from "lucide-react";

// ─── Canvas helper — converts crop area to a Blob ─────────────────────────────

export type CropArea = { x: number; y: number; width: number; height: number };

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation = 0,
  outputMime = "image/jpeg"
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width / 2 - pixelCrop.x,
    0 - safeArea / 2 + image.height / 2 - pixelCrop.y
  );

  return new Promise((res) =>
    canvas.toBlob((b) => res(b!), outputMime, 0.92)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  /** Object URL of the selected image (e.g. URL.createObjectURL(file)) */
  imageSrc: string;
  /** Shape of the crop area */
  cropShape?: "round" | "rect";
  /** Fixed aspect ratio. Default 1 (square) */
  aspect?: number;
  /** Called with the cropped Blob when user confirms */
  onConfirm: (blob: Blob, fileName: string) => void;
  /** Called when user dismisses without cropping */
  onCancel: () => void;
  /** Original file name for the output file */
  fileName?: string;
};

export function ImageCropModal({
  imageSrc,
  cropShape = "round",
  aspect = 1,
  onConfirm,
  onCancel,
  fileName = "cropped.jpg",
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedArea(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea, rotation);
      onConfirm(blob, fileName);
    } finally {
      setProcessing(false);
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/[0.03] bg-[#0e1117] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.03] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Crop Photo</h2>
            <p className="text-xs text-white/50">Drag to reposition · Scroll to zoom</p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop canvas area */}
        <div className="relative h-72 w-full bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: "black" },
              cropAreaStyle: {
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4 px-5 py-4">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 flex-shrink-0 text-white/40" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
            />
            <ZoomIn className="h-4 w-4 flex-shrink-0 text-white/40" />
          </div>

          {/* Rotation slider */}
          <div className="flex items-center gap-3">
            <RotateCw className="h-4 w-4 flex-shrink-0 text-white/40" />
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
            />
            <span className="w-10 text-right text-xs text-white/40">{rotation}°</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 border-t border-white/[0.03] px-5 py-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/[0.03] py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {processing ? "Processing…" : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

