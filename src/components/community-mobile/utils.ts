import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function getExtColor(ext: string): string {
  const map: Record<string, string> = {
    PDF: "#e84040",
    ZIP: "#f5a623",
    DOC: "#2563eb",
    DOCX: "#2563eb",
    XLS: "#10a37f",
    XLSX: "#10a37f",
    PPT: "#c44dff",
    PPTX: "#c44dff",
    MP3: "#ff6eb4",
    MP4: "#6e40ff",
    PNG: "#10a37f",
    JPG: "#f5a623",
    JPEG: "#f5a623",
  };
  return map[ext.toUpperCase()] || "#5c5c7a";
}
