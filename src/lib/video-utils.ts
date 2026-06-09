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

export function extractYouTubeLinks(text: string): string[] {
  const urlRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/[\w\-_]+(\?[\w\-_&=]+)?/g;
  return text.match(urlRegex) || [];
}
