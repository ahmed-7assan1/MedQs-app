import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/get-site-config";

function safeThemeColor(hex: string | null | undefined): string {
  const t = (hex ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(t) ? t : "#0d9488";
}

function iconMime(src: string): string {
  const s = src.toLowerCase();
  if (s.includes(".webp")) return "image/webp";
  if (s.includes(".png")) return "image/png";
  if (s.includes(".jpg") || s.includes(".jpeg")) return "image/jpeg";
  if (s.includes(".gif")) return "image/gif";
  return "image/png";
}

export async function GET() {
  let siteName = "MedOneX";
  let themeColor = "#000000";
  let pwaIcon: string | null = null;
  try {
    const row = await getSiteConfig();
    if (row?.siteName?.trim()) siteName = row.siteName.trim();
    themeColor = safeThemeColor(row?.primaryColor);
    const u = row?.pwaIconUrl?.trim() || row?.faviconUrl?.trim();
    if (u) pwaIcon = u;
  } catch {
    /* defaults */
  }

  const icon192 = pwaIcon ?? "/icons/icon-192.png";
  const icon512 = pwaIcon ?? "/icons/icon-512.png";
  const mime192 = iconMime(icon192);
  const mime512 = iconMime(icon512);

  return NextResponse.json(
    {
      name: `${siteName} Expert AI`,
      short_name: `${siteName} AI`,
      description: "AI-powered medical study assistant — chat, search, and learn.",
      start_url: "/ai-chat",
      scope: "/ai-chat",
      display: "standalone",
      orientation: "portrait",
      background_color: "#000000",
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
    },
    {
      headers: {
        "content-type": "application/manifest+json",
      },
    }
  );
}
