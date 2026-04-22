import { NextRequest, NextResponse } from "next/server";
import { getSpotifyMetadata } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[spotify] Missing credentials in ENV");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  
  console.log("[spotify] Using Client ID:", clientId.substring(0, 5) + "...");

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  const metadata = await getSpotifyMetadata(url).catch(e => {
    console.error("[spotify-metadata] Error:", e);
    return null;
  });
  
  if (!metadata) {
    return NextResponse.json({ 
      error: "Failed to fetch metadata",
      details: "Check server logs for Spotify API response"
    }, { status: 404 });
  }

  return NextResponse.json(metadata);
}
