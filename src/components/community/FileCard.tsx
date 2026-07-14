"use client";

import { FileIcon, getFileTypeInfo } from "./FileIcon";
import { cn } from "@/lib/utils";

export function FileCard({
  fileName,
  fileSize,
  onClick,
  className,
}: {
  fileName: string;
  fileSize?: string;
  onClick?: () => void;
  className?: string;
}) {
  const { label } = getFileTypeInfo(fileName);
  const displayName = fileName.length > 30 ? fileName.slice(0, 27) + "..." : fileName;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-2.5 w-full rounded-lg border border-border/20 bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted/50 active:scale-[0.98]",
        className
      )}
    >
      <FileIcon fileName={fileName} className="mt-0.5" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[11px] font-medium text-foreground/80 truncate">
          {displayName}
        </p>
        <p className="text-[10px] text-muted-foreground/50">
          {fileSize ? `${fileSize} · ${label}` : label}
        </p>
      </div>
    </button>
  );
}
