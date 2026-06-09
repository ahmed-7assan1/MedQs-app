export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);
  if (match && match[2].length === 11) return match[2];
  const shortsRegExp = /\/shorts\/([a-zA-Z0-9_-]{11})/;
  const shortsMatch = cleanUrl.match(shortsRegExp);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];
  const liveRegExp = /\/live\/([a-zA-Z0-9_-]{11})/;
  const liveMatch = cleanUrl.match(liveRegExp);
  if (liveMatch && liveMatch[1]) return liveMatch[1];
  return null;
}

export function getYouTubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

export function getYouTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1`;
}

const urlRegex = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[\w\-_]+(\?[\w\-_&=]+)?/g;

export function extractYouTubeLinks(text: string): string[] {
  return text.match(urlRegex) || [];
}

export function extractYouTubeIds(text: string): string[] {
  const links = extractYouTubeLinks(text);
  const ids: string[] = [];
  for (const link of links) {
    const id = getYouTubeId(link);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function stripYouTubeLinks(text: string): string {
  return text.replace(urlRegex, "").replace(/\n{2,}/g, "\n").trim();
}

const titleCache: Record<string, string> = {};

export async function fetchYouTubeTitle(id: string): Promise<string> {
  if (titleCache[id]) return titleCache[id];
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    const data = await res.json();
    titleCache[id] = data.title || `Video`;
    return titleCache[id];
  } catch {
    titleCache[id] = `Video`;
    return `Video`;
  }
}
