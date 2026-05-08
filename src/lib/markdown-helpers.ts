/**
 * Normalize image URLs for <img> / markdown (upgrade http→https, protocol-relative).
 * Leaves same-origin paths as-is.
 */
export function normalizeImageUrl(src: string | null | undefined): string {
  if (src == null || typeof src !== "string") return "";
  const u = src.trim();
  if (!u) return "";
  if (u.startsWith("/") || u.startsWith("./")) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("http:") && !u.includes("localhost")) return `https:${u.slice(5)}`;
  return u;
}

/**
 * Turn a line that is only a direct image URL into markdown ![](url)
 * so ReactMarkdown renders it (users often paste the link without markdown).
 */
export function enhancePlainImageUrls(markdown: string): string {
  if (!markdown) return markdown;
  const imageExt = /\.(png|jpe?g|gif|webp|svg|avif)(\?[^\s]*)?$/i;
  return markdown.split("\n").map((line) => {
    const t = line.trim();
    if (!t) return line;
    if (t.startsWith("![")) return line;
    if (t.startsWith("<")) return line;
    if (/^https?:\/\/.+/i.test(t) && imageExt.test(t) && !/\s/.test(t)) {
      return `![](${t})`;
    }
    return line;
  }).join("\n");
}
