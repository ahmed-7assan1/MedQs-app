import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const DEFAULT_PRIMARY = "#0d9488";
const DEFAULT_BG = "#f5f6fa";

function safeThemeColor(hex: string | null | undefined): string {
  const t = (hex ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(t) ? t : DEFAULT_PRIMARY;
}

function iconMime(src: string): string {
  const s = src.toLowerCase();
  if (s.includes(".webp")) return "image/webp";
  if (s.includes(".png")) return "image/png";
  if (s.includes(".jpg") || s.includes(".jpeg")) return "image/jpeg";
  if (s.includes(".gif")) return "image/gif";
  return "image/png";
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = "MedOneX";
  let themeColor = DEFAULT_PRIMARY;

  let pwaIcon: string | null = null;
  try {
    const row = await prisma.siteConfig.findFirst({
      select: { siteName: true, primaryColor: true, faviconUrl: true, pwaIconUrl: true },
    });
    if (row?.siteName?.trim()) siteName = row.siteName.trim();
    themeColor = safeThemeColor(row?.primaryColor);
    const u = row?.pwaIconUrl?.trim() || row?.faviconUrl?.trim();
    if (u) pwaIcon = u;
  } catch {
    /* DB unavailable — defaults */
  }

  const fullName = `${siteName} — Medical Education`;
  const icon192 = pwaIcon ?? "/icons/icon-192.png";
  const icon512 = pwaIcon ?? "/icons/icon-512.png";
  const mime192 = iconMime(icon192);
  const mime512 = iconMime(icon512);

  return {
    name: fullName,
    short_name: siteName,
    description: "Medical quizzes, lectures, community, and AI study tools for university students.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: DEFAULT_BG,
    theme_color: themeColor,
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: mime192,
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: mime512,
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: mime512,
        purpose: "maskable",
      },
    ],
  };
}
