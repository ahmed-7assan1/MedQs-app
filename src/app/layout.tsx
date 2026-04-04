import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ChunkLoadRecovery } from "@/components/system/ChunkLoadRecovery";
import { prisma } from "@/lib/prisma";
import { ourFileRouter } from "@/lib/uploadthing";
import "../styles/globals.css";

// Fetch site config server-side — cached per request by Next.js
async function getSiteConfig() {
  try {
    const config = await prisma.siteConfig.findFirst();
    return config ?? {
      siteName: "MedQs",
      logoUrl: null,
      faviconUrl: null,
      primaryColor: "#1a7ef0",
      enableAI: true,
      enableForum: true,
      enableAds: true,
      enableNotifs: true,
      fontSans: "Inter",
      fontArabic: "Cairo",
    };
  } catch {
    return {
      siteName: "MedQs",
      logoUrl: null,
      faviconUrl: null,
      primaryColor: "#1a7ef0",
      enableAI: true,
      enableForum: true,
      enableAds: true,
      enableNotifs: true,
      fontSans: "Inter",
      fontArabic: "Cairo",
    };
  }
}

const DEFAULT_PRIMARY_HEX = "#1a7ef0";

function sanitizeHex(hex: string | null | undefined): string {
  const t = (hex ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(t) ? t : DEFAULT_PRIMARY_HEX;
}

// Convert hex color (#1a7ef0) → HSL values for Tailwind CSS variables
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const safe = sanitizeHex(hex);
  const r = parseInt(safe.slice(1, 3), 16) / 255;
  const g = parseInt(safe.slice(3, 5), 16) / 255;
  const b = parseInt(safe.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: `${config.siteName} — Medical Education Platform`,
    description: "AI-powered medical education with quizzes, forums, and adaptive learning.",
    icons: config.faviconUrl ? { icon: config.faviconUrl } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();
  const primary = hexToHsl(sanitizeHex(config.primaryColor));
  const darkS = clampPct(primary.s - 5);
  const darkL = clampPct(primary.l + 8);
  const accentS = clampPct(primary.s - 20);
  const accentL = clampPct(primary.l - 15);

  // Build dynamic CSS variables for the primary color
  const dynamicCSS = `
    :root {
      --primary: ${primary.h} ${primary.s}% ${primary.l}%;
      --primary-foreground: 0 0% 100%;
      --ring: ${primary.h} ${primary.s}% ${primary.l}%;
      --accent-foreground: ${primary.h} ${accentS}% ${accentL}%;
    }
    .dark {
      --primary: ${primary.h} ${darkS}% ${darkL}%;
      --primary-foreground: 0 0% 100%;
      --ring: ${primary.h} ${darkS}% ${darkL}%;
    }
  `.trim();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flicker theme script — runs before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('medqs-theme') || 'light';
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
                  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  if (isDark) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                  document.documentElement.style.setProperty('--font-sans-runtime', ${JSON.stringify(config.fontSans ?? "Inter")});
                  document.documentElement.style.setProperty('--font-arabic-runtime', ${JSON.stringify(config.fontArabic ?? "Cairo")});
                  // Inject site config for JS access
                  window.__MEDQS_CONFIG__ = ${JSON.stringify({ siteName: config.siteName, logoUrl: config.logoUrl })};
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* Dynamic primary color CSS variables */}
        <style dangerouslySetInnerHTML={{ __html: dynamicCSS }} />
        {/* Dynamic favicon */}
        {config.faviconUrl && <link rel="icon" href={config.faviconUrl} />}
      </head>
      <body>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ChunkLoadRecovery />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              "!bg-card !text-card-foreground !border !border-border !shadow-lg !rounded-xl !font-sans !text-sm",
            duration: 3500,
          }}
        />
      </body>
    </html>
  );
}
