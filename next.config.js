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
  // Bundle next-auth through Next’s compiler (can reduce broken vendor-chunk paths on Windows after partial .next deletes).
  transpilePackages: ["next-auth"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "*.uploadthing.com" },
    ],
  },
  experimental: {
    serverActions: {
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
  // Avoid stale webpack chunk maps after HMR on Windows (e.g. Cannot find module './8948.js').
  // Production builds still use webpack cache; `dev` is false during `next build`.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
