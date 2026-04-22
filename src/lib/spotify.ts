
export async function getSpotifyAccessToken() {
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
    return data.access_token;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    return null;
  }
}

export async function getSpotifyMetadata(url: string) {
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

    if (type === "track") {
      return {
        title: data.name,
        artist: data.artists.map((a: any) => a.name).join(", "),
        image: data.album.images[0]?.url,
        duration_ms: data.duration_ms,
        preview_url: data.preview_url,
        type: "track",
      };
    }

    if (type === "episode") {
      return {
        title: data.name,
        artist: data.show.name,
        image: data.images[0]?.url,
        duration_ms: data.duration_ms,
        preview_url: data.audio_preview_url,
        type: "episode",
      };
    }

    if (type === "show") {
      return {
        title: data.name,
        artist: data.publisher,
        image: data.images[0]?.url,
        type: "show",
      };
    }

    if (type === "album") {
      return {
        title: data.name,
        artist: data.artists.map((a: any) => a.name).join(", "),
        image: data.images[0]?.url,
        type: "album",
      };
    }

    if (type === "playlist") {
      return {
        title: data.name,
        artist: `Curated by ${data.owner.display_name}`,
        image: data.images[0]?.url,
        type: "playlist",
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching Spotify metadata:", error);
    return null;
  }
}
