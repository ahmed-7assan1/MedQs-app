/**
 * lib/cloudinary.ts — Server-side Cloudinary image upload utility.
 *
 * Used for: avatars, forum images, ad banners, question images, site logos.
 * PDFs and non-image files still go through UploadThing.
 *
 * Env vars required:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from "cloudinary";

// Configure once — safe to call multiple times (idempotent)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryUploadResult = {
  url: string;       // HTTPS delivery URL (auto-optimized)
  key: string;       // public_id (used for deletion)
  width?: number;
  height?: number;
};

/**
 * Upload a Buffer directly to Cloudinary.
 *
 * @param buffer  - Raw file bytes
 * @param folder  - Cloudinary folder, e.g. "avatars", "forum", "ads"
 * @param options - Optional overrides (resource_type, transformation, etc.)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Auto-format → serve WebP to modern browsers, JPEG to older
        fetch_format: "auto",
        // Auto-quality → Cloudinary picks the best quality/size balance
        quality: "auto",
        ...options,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve({
          url: result.secure_url,
          key: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id (key).
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

/**
 * Generate a Cloudinary transformation URL.
 * Useful for creating thumbnails on the fly.
 *
 * Example: getTransformedUrl(url, { width: 200, height: 200, crop: "fill" })
 */
export function getTransformedUrl(
  url: string,
  transformation: Record<string, unknown>
): string {
  // Insert transformation into the Cloudinary URL
  return url.replace("/upload/", `/upload/${Object.entries(transformation).map(([k, v]) => `${k}_${v}`).join(",")}/`);
}
