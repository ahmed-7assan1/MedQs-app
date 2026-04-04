"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle2, Loader2, FileText, Image, Film, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

function fileMatchesAccept(file: File, accept?: string): boolean {
  if (!accept || accept.trim() === "") return true;
  const parts = accept.split(",").map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    if (p.startsWith(".")) {
      if (file.name.toLowerCase().endsWith(p.toLowerCase())) return true;
    } else if (p.endsWith("/*")) {
      const prefix = p.slice(0, -2);
      if (file.type.startsWith(`${prefix}/`)) return true;
    } else if (p === "*/*" || file.type === p) return true;
  }
  return false;
}

interface UploadedFile {
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

interface FileUploaderProps {
  folder: "lecture" | "pastpaper" | "avatar" | "ad";
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onUpload: (files: UploadedFile[]) => void;
  className?: string;
  compact?: boolean;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("video/")) return <Film className="h-5 w-5 text-blue-500" />;
  if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-emerald-500" />;
  return <FileText className="h-5 w-5 text-red-500" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileState {
  file: File;
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
}

export function FileUploader({
  folder,
  accept,
  maxSizeMB = 100,
  multiple = false,
  onUpload,
  className,
  compact = false,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileState[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, index: number) {
    // Update status to uploading
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "uploading", progress: 0 } : f))
    );

    const markDone = (publicUrl: string) => {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "done", progress: 100, url: publicUrl } : f
        )
      );
      onUpload([
        {
          name: file.name,
          url: publicUrl,
          mimeType: file.type,
          size: file.size,
        },
      ]);
    };

    try {
      const presignRes = await fetch("/api/v1/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          folder,
          fileSize: file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Failed to get upload URL");
      }

      const { uploadUrl, publicUrl } = await presignRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, progress: pct } : f))
            );
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.send(file);
      });

      markDone(publicUrl);
    } catch (err: any) {
      const directFolders = ["forum", "question", "ad", "lecture", "pastpaper"] as const;
      const canDirect = directFolders.includes(folder as (typeof directFolders)[number]);
      if (!canDirect) {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "error", error: err?.message ?? "Upload failed" } : f
          )
        );
        return;
      }
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/v1/upload/direct", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Direct upload failed");
        }
        if (typeof data.url !== "string") throw new Error("Invalid upload response");
        markDone(data.url);
      } catch (e2: any) {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  status: "error",
                  error: e2?.message ?? err?.message ?? "Upload failed",
                }
              : f
          )
        );
      }
    }
  }

  function addFiles(incoming: File[]) {
    const maxBytes = maxSizeMB * 1024 * 1024;
    const withinSize = incoming.filter((f) => f.size <= maxBytes);
    const oversized = incoming.length - withinSize.length;
    if (oversized > 0) {
      toast.error(`${oversized} file(s) exceed the ${maxSizeMB}MB limit and were skipped.`);
    }

    const valid = accept
      ? withinSize.filter((f) => {
          const ok = fileMatchesAccept(f, accept);
          return ok;
        })
      : withinSize;
    const typeRejected = withinSize.length - valid.length;
    if (typeRejected > 0) {
      toast.error(`${typeRejected} file(s) were skipped (type not allowed).`);
    }

    const newStates: FileState[] = valid.map((f) => ({
      file: f,
      status: "idle",
      progress: 0,
    }));

    const startIndex = files.length;
    setFiles((prev) => [...prev, ...newStates]);

    // Start uploading each
    newStates.forEach((_, i) => {
      uploadFile(valid[i], startIndex + i);
    });
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      addFiles(multiple ? dropped : [dropped[0]]);
    },
    [files, multiple]
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    addFiles(multiple ? selected : [selected[0]]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  if (compact) {
    return (
      <div className={className}>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors">
          <Upload className="h-4 w-4" />
          {files.length === 0 ? "Upload file" : `${files.filter((f) => f.status === "done").length} uploaded`}
          <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={onInputChange} />
        </label>
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                {f.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                {f.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                {f.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                <span className="truncate max-w-[200px]">{f.file.name}</span>
                {f.status === "uploading" && <span>{f.progress}%</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all",
          dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted"
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Max {maxSizeMB}MB {accept ? `· ${accept}` : ""}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
              <FileTypeIcon mimeType={f.file.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.file.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{formatBytes(f.file.size)}</p>
                  {f.status === "uploading" && (
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{f.progress}%</span>
                    </div>
                  )}
                  {f.status === "done" && <span className="text-xs text-emerald-600 dark:text-emerald-400">Uploaded</span>}
                  {f.status === "error" && <span className="text-xs text-red-500">{f.error}</span>}
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {f.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {f.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {f.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                <button
                  onClick={() => removeFile(i)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
