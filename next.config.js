const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  reloadOnOnline: false,
  cacheOnFrontendNav: true,
  aggressiveFrontEndNavCaching: true,
  cacheStartUrl: true,
  extendDefaultRuntimeCaching: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    // Don't precache anything — runtimeCaching handles all caching
    exclude: [/.*/],
    navigateFallbackDenylist: [/^\/_next\//, /^\/api\//],
    runtimeCaching: [
      // ─── Tier 1: Core framework — CacheFirst (immutable, content-hashed) ───
      {
        urlPattern: /\/_next\/static\/chunks\/(framework|main|webpack|_app-pages-browser)/,
        handler: "CacheFirst",
        options: {
          cacheName: "next-core",
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      // ─── Tier 2: Page chunks — StaleWhileRevalidate (instant after first visit) ───
      {
        urlPattern: /\/_next\/static\/chunks\/pages\//,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-pages",
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      // ─── Tier 3: Other static assets (media, images, fonts) ───
      {
        urlPattern: /\/_next\/static\/(media|images)\//,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      // ─── Tier 4: CSS chunks — CacheFirst ───
      {
        urlPattern: /\/_next\/static\/css\//,
        handler: "CacheFirst",
        options: {
          cacheName: "next-css",
          expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      // ─── Tier 5: Navigation requests (HTML) — NetworkFirst, 3s timeout, fallback cache ───
      {
        urlPattern: /^\/(?!_next\/|api\/|favicon|icons\/)/,
        handler: "NetworkFirst",
        options: {
          cacheName: "next-navigation",
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // ─── Tier 6: App icons — CacheFirst ───
      {
        urlPattern: /\/icons\//,
        handler: "CacheFirst",
        options: {
          cacheName: "next-icons",
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
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
  devIndicators: false,          // remove bottom-right build indicator in dev

  // ── Output ───────────────────────────────────────────────────────────────────
  // output: "standalone",       // uncomment for Docker/self-host deployments

  // Bundle auth packages through Next's compiler
  transpilePackages: [],

  // ── Images ───────────────────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"], // serve modern formats = 30-50% smaller
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
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
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
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
    // ── Bundle Performance ───────────────────────────────────────────────────────
    // Split heavy packages so only imported code lands in the client bundle
    optimizePackageImports: [
      "lucide-react",         // tree-shake icons → load only the ones you use
      "framer-motion",        // load only used exports (motion, AnimatePresence, etc.)
      "@phosphor-icons/react",// tree-shake icons
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "date-fns",             // tree-shake date utilities
      "@tiptap/react",        // only load editor code when used
      "@tiptap/starter-kit",
      "@tiptap/extension-underline",
      "@tiptap/extension-link",
      "@tiptap/extension-image",
      "@tiptap/extension-table",
      "@tiptap/extension-code-block-lowlight",
    ],
  },

  // ── Webpack ───────────────────────────────────────────────────────────────────
  // NOTE: Do NOT disable cache in dev — it causes slow HMR and full rebuilds.
  // The cache=false workaround was masking a stale .next issue; instead, just
  // delete .next when you see stale chunk errors.
  webpack: (config) => config,
};

module.exports = withPWA(nextConfig);
