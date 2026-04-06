import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const DEFAULT_PRIMARY = "#1a7ef0";
const DEFAULT_BG = "#f5f6fa";

function safeThemeColor(hex: string | null | undefined): string {
  const t = (hex ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(t) ? t : DEFAULT_PRIMARY;
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = "MedQs";
  let themeColor = DEFAULT_PRIMARY;

  try {
    const row = await prisma.siteConfig.findFirst({
      select: { siteName: true, primaryColor: true },
    });
    if (row?.siteName?.trim()) siteName = row.siteName.trim();
    themeColor = safeThemeColor(row?.primaryColor);
  } catch {
    /* DB unavailable — defaults */
  }

  const fullName = `${siteName} — Medical Education`;

  return {
    name: fullName,
    short_name: siteName,
    description: "Medical quizzes, lectures, community, and AI study tools for university students.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: DEFAULT_BG,
    theme_color: themeColor,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
