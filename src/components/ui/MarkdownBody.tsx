"use client";

import { cn } from "@/lib/utils";
import { enhancePlainImageUrls, normalizeImageUrl } from "@/lib/markdown-helpers";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const MarkdownImg: NonNullable<Components["img"]> = ({ src, alt, title }) => {
  if (!src || typeof src !== "string") return null;
  const url = normalizeImageUrl(src);
  if (!url || /^javascript:/i.test(url)) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
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

const baseComponents: Components = {
  img: MarkdownImg,
  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-primary underline-offset-2 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] before:content-none after:content-none">
      {children}
    </code>
  ),
};

const inlineComponents: Components = {
  ...baseComponents,
  p: ({ children }) => <span className="block leading-snug">{children}</span>,
  ul: ({ children }) => <span className="my-1 block pl-3">{children}</span>,
  ol: ({ children }) => <span className="my-1 block list-decimal pl-4">{children}</span>,
  li: ({ children }) => <span className="block before:mr-1.5 before:inline before:content-['•']">{children}</span>,
};

type Props = {
  /** Question/choice text from DB may be null or non-string at runtime */
  content: string | null | undefined;
  className?: string;
  /** Use inside buttons or tight rows — avoids extra paragraph margins */
  inline?: boolean;
  /** `span` for valid HTML inside `<button>` (choices) */
  as?: "div" | "span";
};

function toMarkdownSource(raw: string | null | undefined): string {
  if (typeof raw === "string") return raw;
  if (raw == null) return "";
  try {
    return String(raw);
  } catch {
    return "";
  }
}

export function MarkdownBody({ content, className, inline = false, as = "div" }: Props) {
  const Tag = as;
  const raw = toMarkdownSource(content);
  const src = enhancePlainImageUrls(raw);
  return (
    <Tag
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed prose-img:my-3",
        inline && "prose-p:my-0 prose-headings:my-0 prose-ul:my-1 prose-ol:my-1",
        className
      )}
    >
      <ReactMarkdown components={inline ? inlineComponents : baseComponents}>{src}</ReactMarkdown>
    </Tag>
  );
}

/** Shared markdown render map (forum, profile posts, etc.) */
export const markdownComponentsWithImages: Components = baseComponents;
