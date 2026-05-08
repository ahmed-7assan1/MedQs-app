const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  reloadOnOnline: true,
  cacheStartUrl: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    // Never treat Next’s own assets as “offline document” fallbacks (avoids /_next/... → wrong shell).
    navigateFallbackDenylist: [/^\/_next\//, /^\/api\//],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Build ────────────────────────────────────────────────────────────────────
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // ── Runtime ──────────────────────────────────────────────────────────────────
  compress: true,                // gzip responses
  poweredByHeader: false,        // remove X-Powered-By header
  reactStrictMode: true,         // catch bugs early

  // Bundle next-auth through Next's compiler (fixes broken vendor-chunk paths on Windows).
  transpilePackages: ["next-auth"],

  // ── Images ───────────────────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"], // serve modern formats = 30-50% smaller
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "*.uploadthing.com" },
      { protocol: "https", hostname: "www.transparenttextures.com" },
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "*.telegram.org" },
    ],
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin/pdf_tools",
        destination: "/admin/pdf-tools",
        permanent: true,
      },
      {
        source: "/admin/creative_studio",
        destination: "/admin/creative-studio",
        permanent: true,
      },
    ];
  },

  // ── Experimental ─────────────────────────────────────────────────────────────
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
    serverActions: {
      bodySizeLimit: '100mb',
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "localhost:3002",
        "127.0.0.1:3000",
        "127.0.0.1:3001",
        "127.0.0.1:3002",
      ],
    },
  },

  // ── Webpack ───────────────────────────────────────────────────────────────────
  // NOTE: Do NOT disable cache in dev — it causes slow HMR and full rebuilds.
  // The cache=false workaround was masking a stale .next issue; instead, just
  // delete .next when you see stale chunk errors.
  webpack: (config) => config,
};

module.exports = withPWA(nextConfig);
