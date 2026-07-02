"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "./ImageCropModal";
import { uploadFiles } from "@/lib/uploadthing-react";
import toast from "react-hot-toast";

interface BannerUploaderProps {
  onUpload: (files: { name: string; url: string; mimeType: string; size: number }[]) => void;
}

export function BannerUploader({ onUpload }: BannerUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("banner.jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Max file size 10MB");
    setFileName(file.name);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.add("border-primary/50", "bg-primary/5");
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary/50", "bg-primary/5");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary/50", "bg-primary/5");
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Max file size 10MB");
    setFileName(file.name);
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(blob: Blob, name: string) {
    setCropSrc(null);
    setUploading(true);
    try {
      const file = new File([blob], name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      const uploaded = await uploadFiles("adBanner", { files: [file] });
      const url = uploaded?.[0]?.url;
      if (!url) throw new Error("Upload returned no URL");
      onUpload([{ name: file.name, url, mimeType: "image/jpeg", size: file.size }]);
      toast.success("Banner uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload banner");
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 transition-all hover:bg-muted/30 hover:border-primary/30",
          uploading && "pointer-events-none"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-5 w-5 text-primary/60" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-foreground/80">Drop banner image here</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">or click to browse — max 10MB</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          cropShape="rect"
          aspect={21 / 9}
          onConfirm={handleCropConfirm}
          onCancel={handleCancel}
          fileName={fileName}
        />
      )}
    </>
  );
}
