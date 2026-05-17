import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://medqs-app.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/privacy",
        "/terms",
        "/founders",
        "/atlas",
        "/videos",
        "/community",
        "/leaderboard",
      ],
      disallow: [
        "/admin/",
        "/dashboard/",
        "/dashboard-mobile/",
        "/settings/",
        "/profile/",
        "/messages/",
        "/quiz/",
        "/quizzes/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
