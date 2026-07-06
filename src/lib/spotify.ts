
// Simple in-memory cache for Spotify access token (1 hour TTL)
let cachedToken: string | null = null;
let tokenExpiry = 0;
const CACHE_TTL = 55 * 60 * 1000; // 55 min (tokens last 1h, refresh before expiry)

// In-memory cache for Spotify metadata by URL
const metadataCache = new Map<string, { data: any; expiry: number }>();
const METADATA_TTL = 24 * 60 * 60 * 1000; // 24 hours — record art doesn't change often

export async function getSpotifyAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Spotify credentials");
    return null;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[spotify] Token error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + CACHE_TTL;
    return cachedToken;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    return null;
  }
}

export async function getSpotifyMetadata(url: string) {
  // Check cache first
  const cached = metadataCache.get(url);
  if (cached && Date.now() < cached.expiry) return cached.data;

  const token = await getSpotifyAccessToken();
  if (!token) return null;

  // Extract ID and Type (track, episode, album, show, playlist)
  const match = url.match(/spotify\.com\/(track|episode|album|show|playlist)\/([a-zA-Z0-9]+)/);
  if (!match) return null;

  const type = match[1];
  const id = match[2];

  try {
    const res = await fetch(`https://api.spotify.com/v1/${type}s/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    let result: any = null;

    if (type === "track") {
      result = {
        title: data.name,
        artist: data.artists.map((a: any) => a.name).join(", "),
        image: data.album.images[0]?.url,
        duration_ms: data.duration_ms,
        preview_url: data.preview_url,
        type: "track",
      };
    } else if (type === "episode") {
      result = {
        title: data.name,
        artist: data.show.name,
        image: data.images[0]?.url,
        duration_ms: data.duration_ms,
        preview_url: data.audio_preview_url,
        type: "episode",
      };
    } else if (type === "show") {
      result = {
        title: data.name,
        artist: data.publisher,
        image: data.images[0]?.url,
        type: "show",
      };
    } else if (type === "album") {
      result = {
        title: data.name,
        artist: data.artists.map((a: any) => a.name).join(", "),
        image: data.images[0]?.url,
        type: "album",
      };
    } else if (type === "playlist") {
      result = {
        title: data.name,
        artist: `Curated by ${data.owner.display_name}`,
        image: data.images[0]?.url,
        type: "playlist",
      };
    }

    if (result) {
      metadataCache.set(url, { data: result, expiry: Date.now() + METADATA_TTL });
    }

    return result;
  } catch (error) {
    console.error("Error fetching Spotify metadata:", error);
    return null;
  }
}
