/**
 * lib/uploadthing.ts — Uploadthing file upload core
 *
 * Free tier: 2GB storage, no credit card required
 * Get API key: https://uploadthing.com → Create App → API Keys
 *
 * Env var (v7): UPLOADTHING_TOKEN — dashboard → API Keys → V7 tab
 */
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return { userId: session.user.id, role: (session.user as any).role };
}

function requireAdmin() {
  return async () => {
    const { role, userId } = await requireAuth();
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") throw new Error("Forbidden");
    return { userId };
  };
}

export const ourFileRouter = {
  // Profile avatars — any authenticated user
  avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(requireAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),

  // Lecture files / PDFs — admin only
  lectureFile: f({
    pdf:   { maxFileSize: "32MB", maxFileCount: 5 },
    image: { maxFileSize: "8MB",  maxFileCount: 5 },
  })
    .middleware(requireAdmin())
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, name: file.name };
    }),

  // Past paper PDFs — admin only
  pastPaper: f({ pdf: { maxFileSize: "64MB", maxFileCount: 1 } })
    .middleware(requireAdmin())
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),

  // Ad banner images — admin only
  adBanner: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(requireAdmin())
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url };
    }),

  // Forum post images — any signed-in user
  forumImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(requireAuth)
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
