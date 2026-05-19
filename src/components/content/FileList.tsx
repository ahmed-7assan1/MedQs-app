"use client";

import { useState } from "react";
import { FileText, Download, FileImage, FileCode, Loader2 } from "lucide-react";
import { downloadFileInline } from "@/lib/download-helper";

interface LectureFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes("image")) return <FileImage className="h-4 w-4 text-primary" />;
  if (mimeType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  return <FileCode className="h-4 w-4 text-muted-foreground" />;
}

export function FileList({ files }: { files: LectureFile[] }) {
  return (
    <div className="space-y-2">
      {files.map((file) => <FileItem key={file.id} file={file} />)}
    </div>
  );
}

function FileItem({ file }: { file: LectureFile }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    setProgress(0);
    await downloadFileInline(file.url, file.name, (p) => setProgress(p));
    setDownloading(false);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 hover:bg-muted transition-colors group text-left active:scale-[0.99] disabled:opacity-80"
    >
      <div className="flex items-center gap-3">
        <FileIcon mimeType={file.mimeType} />
        <div>
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">{file.mimeType}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {downloading ? (
          <>
            {progress > 0 && progress < 100 && (
              <span className="text-[10px] font-bold text-primary">{progress}%</span>
            )}
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </>
        ) : (
          <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </div>
    </button>
  );
}
