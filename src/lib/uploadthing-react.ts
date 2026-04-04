"use client";

import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

export const { uploadFiles, useUploadThing } = generateReactHelpers<OurFileRouter>();
