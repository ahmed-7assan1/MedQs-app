"use client";

import { useEffect, useState, useRef } from "react";

export function useDominantColor(imageUrl: string | null | undefined): string {
  const [color, setColor] = useState("transparent");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor("transparent");
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;

      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = 16;
      canvas.height = 16;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }

      if (cancelled) return;
      setColor(`rgb(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)})`);
    };

    img.onerror = () => {
      if (!cancelled) setColor("transparent");
    };

    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}
