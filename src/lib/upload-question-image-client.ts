"use client";

import { uploadFiles } from "@/lib/uploadthing-react";

function uploadthingConfigured(): boolean {
  return !!(typeof process !== "undefined" && process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID?.trim());
}

function fileUrlFromUt(file: { url?: string; ufsUrl?: string } | undefined): string | null {
  if (!file) return null;
  const u = file.url ?? file.ufsUrl;
  return typeof u === "string" && u.length > 0 ? u : null;
}

/**
 * Question / quiz images: Uploadthing first when `NEXT_PUBLIC_UPLOADTHING_APP_ID` is set,
 * otherwise server direct upload (`/api/v1/upload/direct`).
 */
export async function uploadQuestionImageClient(
  file: File
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (uploadthingConfigured()) {
    try {
      const uploaded = await uploadFiles("questionImage", { files: [file] });
      const url = fileUrlFromUt(uploaded[0]);
      if (url) return { ok: true, url };
    } catch (e) {
      console.warn("[uploadQuestionImageClient] UploadThing failed, trying direct upload", e);
    }
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "question");
  const res = await fetch("/api/v1/upload/direct", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data?.error === "string" ? data.error : "Upload failed",
    };
  }
  if (typeof data.url === "string") return { ok: true, url: data.url };
  return { ok: false, error: "Invalid response from server" };
}
