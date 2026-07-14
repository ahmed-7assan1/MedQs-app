"use client";

import {
  FileText,
  FileSpreadsheet,
  FileImage,
  Archive,
  Paperclip,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FILE_TYPE_MAP: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  pdf: { icon: FileText, color: "text-rose-500", label: "PDF" },
  doc: { icon: FileText, color: "text-blue-500", label: "DOC" },
  docx: { icon: FileText, color: "text-blue-500", label: "DOCX" },
  xls: { icon: FileSpreadsheet, color: "text-emerald-500", label: "XLS" },
  xlsx: { icon: FileSpreadsheet, color: "text-emerald-500", label: "XLSX" },
  ppt: { icon: Presentation, color: "text-orange-500", label: "PPT" },
  pptx: { icon: Presentation, color: "text-orange-500", label: "PPTX" },
  png: { icon: FileImage, color: "text-sky-500", label: "PNG" },
  jpg: { icon: FileImage, color: "text-sky-500", label: "JPG" },
  jpeg: { icon: FileImage, color: "text-sky-500", label: "JPEG" },
  gif: { icon: FileImage, color: "text-sky-500", label: "GIF" },
  webp: { icon: FileImage, color: "text-sky-500", label: "WEBP" },
  svg: { icon: FileImage, color: "text-sky-500", label: "SVG" },
  bmp: { icon: FileImage, color: "text-sky-500", label: "BMP" },
  zip: { icon: Archive, color: "text-amber-500", label: "ZIP" },
  rar: { icon: Archive, color: "text-amber-500", label: "RAR" },
  "7z": { icon: Archive, color: "text-amber-500", label: "7Z" },
  tar: { icon: Archive, color: "text-amber-500", label: "TAR" },
  gz: { icon: Archive, color: "text-amber-500", label: "GZ" },
};

function getExtension(fileName: string): string {
  const parts = (fileName || "").split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

export function getFileTypeInfo(fileName: string) {
  const ext = getExtension(fileName);
  return FILE_TYPE_MAP[ext] || {
    icon: Paperclip,
    color: "text-violet-500",
    label: ext.toUpperCase() || "FILE",
  };
}

export function FileIcon({
  fileName,
  className,
}: {
  fileName: string;
  className?: string;
}) {
  const { icon: Icon, color } = getFileTypeInfo(fileName);
  return <Icon className={cn("h-4 w-4 shrink-0", color, className)} />;
}
