import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    process.env.NEXTAUTH_URL ||
    "https://medonex.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/", "/tma/", "/claude-labs/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
