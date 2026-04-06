import type { Components } from "react-markdown";
import { normalizeImageUrl } from "@/lib/markdown-helpers";

const MarkdownImg: NonNullable<Components["img"]> = ({ src, alt, title }) => {
  if (!src || typeof src !== "string") return null;
  const url = normalizeImageUrl(src);
  if (!url || /^javascript:/i.test(url)) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={url}
      alt={alt ?? ""}
      title={title ?? undefined}
      className="my-3 max-h-[min(24rem,70vh)] w-full rounded-lg border border-border bg-muted/20 object-contain"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
};

export const markdownComponentsWithImages: Components = {
  img: MarkdownImg,
  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} className="font-medium text-primary underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] before:content-none after:content-none">{children}</code>
  ),
};

