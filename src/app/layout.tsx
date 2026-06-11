import type { Metadata, Viewport } from "next"; // Re-triggering build after cache clean
import { Toaster } from "react-hot-toast";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ChunkLoadRecovery } from "@/components/system/ChunkLoadRecovery";
import { DevServiceWorkerCleanup } from "@/components/system/DevServiceWorkerCleanup";
import { prisma } from "@/lib/prisma";
import { ourFileRouter } from "@/lib/uploadthing";
import { appFontVariableClassName, fontEnglish } from "@/lib/app-fonts";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { FirebaseProvider } from "@/components/providers/FirebaseProvider";
import { PageTransitionProvider } from "@/components/providers/PageTransitionProvider";
import { SupabaseAuthProvider } from "@/components/providers/SupabaseAuthProvider";
import { SessionPersistence } from "@/components/system/SessionPersistence";
import { ApplyLocale } from "@/components/system/ApplyLocale";
import "../styles/globals.css";

import { unstable_cache } from "next/cache";

const getCachedSiteConfig = unstable_cache(
  async () => {
    const fallback = {
      siteName: "MedOneX",
      logoUrl: null,
      pwaIconUrl: null,
      faviconUrl: null,
      primaryColor: "#0d9488",
      enableAI: true,
      enableForum: true,
      enableAds: true,
      enableNotifs: true,
      fontSans: "Plus Jakarta Sans",
      fontArabic: "Cairo",
    };

    try {
      // Add a timeout to prevent the entire app from hanging on Prisma/DB issues
      const config = await Promise.race([
        prisma.siteConfig.findFirst(),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
      ]);
      return config ?? fallback;
    } catch (err) {
      console.error("[Layout] SiteConfig fetch failed or timed out:", err);
      return fallback;
    }
  },
  ["global-site-config"],
  { revalidate: 3600, tags: ["site-config"] }
);

// Fetch site config server-side — cached per request by Next.js
async function getSiteConfig() {
  return getCachedSiteConfig();
}

const DEFAULT_PRIMARY_HEX = "#0ea5e9";

function sanitizeHex(hex: string | null | undefined): string {
  const t = (hex ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(t) ? t : DEFAULT_PRIMARY_HEX;
}

// Convert hex color → HSL values for Tailwind CSS variables
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

function safeMetadataBase(): URL | undefined {
  const raw = process.env.NEXTAUTH_URL?.trim() || "https://medonex.vercel.app";
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export async function generateViewport(): Promise<Viewport> {
  const config = await getSiteConfig();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: sanitizeHex(config.primaryColor),
    colorScheme: "light dark",
  };
}

/** Install / touch icon: prefer square PWA asset, else favicon, else bundled defaults. */
function appIconsFromConfig(
  faviconUrl: string | null | undefined,
  pwaIconUrl: string | null | undefined
): NonNullable<Metadata["icons"]> {
  const u = pwaIconUrl?.trim() || faviconUrl?.trim();
  if (!u) {
    return {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    };
  }
  return {
    icon: [
      { url: u, sizes: "192x192" },
      { url: u, sizes: "512x512" },
    ],
    apple: [{ url: u }],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const title = `${config.siteName} — AI-Powered Medical Education Platform`;
  const description =
    "MedOneX is the AI-powered medical education platform for medical students. Access past papers, interactive MCQs, video lectures, anatomy atlas, AI chat tutor, and a community of doctors. Study smarter for USMLE, PLAB, and medical exams.";
  const base = safeMetadataBase();
  const ogImage = base ? `${base.origin}/og-image.png` : "https://medonex.vercel.app/og-image.png";
  return {
    metadataBase: base,
    title: { default: title, template: `%s | ${config.siteName}` },
    description,
    keywords: [
      "Medical Education", "Medical Students", "MCQ", "Clinical Cases",
      "Medical University", "MedOneX", "Med Students Forum",
      "USMLE", "PLAB", "Medical Exam Prep", "Anatomy Atlas",
      "AI Medical Tutor", "Medical Past Papers", "Medical Quizzes",
      "Egypt Medical Students", "طب بشري", "امتحانات طب",
      "Online Medical Learning", "Medical Study Tools",
    ],
    applicationName: config.siteName,
    authors: [{ name: config.siteName }],
    creator: config.siteName,
    publisher: config.siteName,
    appleWebApp: {
      capable: true,
      title: config.siteName,
      statusBarStyle: "default",
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: config.siteName,
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${config.siteName} — AI-Powered Medical Education Platform`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    icons: appIconsFromConfig(config.faviconUrl, "pwaIconUrl" in config ? config.pwaIconUrl : null),
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
    <html className={appFontVariableClassName} data-theme="dark" suppressHydrationWarning>
      <head>
        {/* No-flicker theme + lang script — runs before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function applyTheme(isDark) {
                  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  document.documentElement.classList.toggle('dark', isDark);
                }
                try {
                  var theme = localStorage.getItem('medqs-theme') || 'dark';
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
                  applyTheme(isDark);
                  window.__MEDQS_CONFIG__ = ${JSON.stringify({ siteName: config.siteName, logoUrl: config.logoUrl })};
                } catch (e) {
                  applyTheme(false);
                  try {
                    window.__MEDQS_CONFIG__ = ${JSON.stringify({ siteName: config.siteName, logoUrl: config.logoUrl })};
                  } catch (_) {}
                }
                try {
                  var lang = localStorage.getItem('medqs-lang') || 'en';
                  document.documentElement.setAttribute('lang', lang);
                  if (lang === 'ar') {
                    document.documentElement.setAttribute('dir', 'rtl');
                    document.documentElement.style.setProperty('--font-geist-sans', 'var(--font-cairo)');
                  } else {
                    document.documentElement.setAttribute('dir', 'ltr');
                    document.documentElement.style.setProperty('--font-geist-sans', 'var(--font-nunito)');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* Dynamic primary color CSS variables */}
        <style dangerouslySetInnerHTML={{ __html: dynamicCSS }} />
        {/* JSON-LD — tells Google the site name is MedOneX, not Vercel */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${safeMetadataBase()?.origin ?? "https://medonex.vercel.app"}/#website`,
                  "url": safeMetadataBase()?.origin ?? "https://medonex.vercel.app",
                  "name": config.siteName,
                  "description": "The AI-powered medical education platform for students across Egypt and the Middle East.",
                  "inLanguage": "en",
                  "publisher": { "@id": `${safeMetadataBase()?.origin ?? "https://medonex.vercel.app"}/#organization` },
                },
                {
                  "@type": "EducationalOrganization",
                  "@id": `${safeMetadataBase()?.origin ?? "https://medonex.vercel.app"}/#organization`,
                  "name": config.siteName,
                  "url": safeMetadataBase()?.origin ?? "https://medonex.vercel.app",
                  "description": "AI-powered medical education platform offering past papers, quizzes, video lectures, and interactive anatomy tools for medical students.",
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${safeMetadataBase()?.origin ?? "https://medonex.vercel.app"}/og-image.png`,
                  },
                  "founder": [
                    {
                      "@type": "Person",
                      "name": "Ahmed Hassan",
                      "jobTitle": "Founder & Lead Developer",
                      "description": "Medical student and software engineer who built MedOneX to revolutionize medical education.",
                    },
                  ],
                },
                {
                  "@type": "WebApplication",
                  "@id": `${safeMetadataBase()?.origin ?? "https://medonex.vercel.app"}/#webapp`,
                  "name": config.siteName,
                  "url": safeMetadataBase()?.origin ?? "https://medonex.vercel.app",
                  "applicationCategory": "EducationalApplication",
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                  },
                },
              ],
            }),
          }}
        />
        {/* Puter.js — free AI, storage, and cloud services (user-pays model) */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script src="https://js.puter.com/v2/" defer></script>
      </head>
      <body className={`${fontEnglish.className} font-sans antialiased`}>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <DevServiceWorkerCleanup />
        <ChunkLoadRecovery />
        <FirebaseProvider>
          <ConfirmProvider>
            <SupabaseAuthProvider>
              <SessionPersistence />
              <ApplyLocale />
              {children}
            </SupabaseAuthProvider>
          </ConfirmProvider>
        </FirebaseProvider>
        <Toaster
          position="top-center"
          containerStyle={{
            top: "max(1rem, env(safe-area-inset-top, 0px))",
          }}
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
