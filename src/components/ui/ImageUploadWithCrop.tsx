"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Upload, X, Crop, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "./ImageCropModal";
import { uploadFiles } from "@/lib/uploadthing-react";
import toast from "react-hot-toast";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: number;
  cropShape?: "round" | "rect";
  className?: string;
}

export function ImageUploadWithCrop({
  value,
  onChange,
  label = "Upload Image",
  aspect = 1,
  cropShape = "round",
  className
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("image.jpg");
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      return toast.error("File is too large (max 10MB)");
    }

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  // 2. Handle crop confirmation -> Upload to Uploadcare
  async function handleCropConfirm(blob: Blob, name: string) {
    setCropSrc(null);
    setUploading(true);
    
    try {
      // Convert Blob to File for Uploadthing
      const file = new File([blob], name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      
      const res = await uploadFiles("avatar", {
        files: [file],
      });

      if (!res || res.length === 0) throw new Error("Upload failed");
      
      const fileUrl = res[0].url;
      
      setImageError(false);
      onChange(fileUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
        {label}
      </label>
      
      <div className="flex items-center gap-4">
        {/* Preview Container */}
        <div 
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary", "bg-primary/5"); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-primary", "bg-primary/5"); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-primary", "bg-primary/5");
            const file = e.dataTransfer.files?.[0];
            if (file) {
              if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
              setFileName(file.name);
              setCropSrc(URL.createObjectURL(file));
            }
          }}
          className={cn(
            "relative h-20 w-20 overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center transition-all cursor-pointer",
            cropShape === "round" ? "rounded-full" : "rounded-2xl",
            value && "border-solid border-primary/30"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {value && !imageError ? (
            <img 
              src={value} 
              alt="" 
              className="h-full w-full object-cover" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              {imageError ? <ImageIcon className="h-6 w-6 text-red-500/50" /> : <Upload className="h-6 w-6 text-muted-foreground/30" />}
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            {value ? "Change Photo" : "Upload Photo"}
          </button>
          
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          cropShape={cropShape}
          aspect={aspect}
          onConfirm={handleCropConfirm}
          onCancel={handleCancel}
          fileName={fileName}
        />
      )}
    </div>
  );
}
