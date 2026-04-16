/**
 * Client-side UploadThing helpers — generated from our file router.
 * Import `useUploadThing` in client components for direct browser → UploadThing uploads.
 * This avoids Vercel's 10-second serverless timeout on large files.
 */
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "./uploadthing";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
