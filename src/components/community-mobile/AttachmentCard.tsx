"use client";

import {
  FilePdf,
  FileZip,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  File,
} from "@phosphor-icons/react";
import type { Attachment } from "./types";

interface AttachmentCardProps {
  attachment: Attachment;
}

function extIcon(ext: string) {
  const props = { size: 16, className: "flex-shrink-0" };
  switch (ext.toUpperCase()) {
    case "PDF": return <FilePdf {...props} />;
    case "ZIP":
    case "RAR":
    case "GZ": return <FileZip {...props} />;
    case "PNG":
    case "JPG":
    case "JPEG":
    case "GIF":
    case "WEBP": return <FileImage {...props} />;
    case "MP4":
    case "MOV":
    case "AVI":
    case "MKV": return <FileVideo {...props} />;
    case "MP3":
    case "WAV":
    case "FLAC":
    case "AAC": return <FileAudio {...props} />;
    case "DOC":
    case "DOCX":
    case "TXT":
    case "MD": return <FileText {...props} />;
    default: return <File {...props} />;
  }
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-glass)",
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${attachment.color}18` }}
      >
        {extIcon(attachment.ext)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {attachment.name}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {attachment.ext.toUpperCase()} &middot; {attachment.size}
        </p>
      </div>
    </div>
  );
}
