import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      name: "MedOneX Expert AI",
      short_name: "MedOneX AI",
      description: "AI-powered medical study assistant — chat, search, and learn.",
      start_url: "/ai-chat",
      scope: "/ai-chat",
      display: "standalone",
      orientation: "portrait",
      background_color: "#000000",
      theme_color: "#000000",
      icons: [
        {
          src: "/ai-chat-icons/icon.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable",
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
