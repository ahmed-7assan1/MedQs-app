"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/markdown-helpers";
import type { Components } from "react-markdown";

type Props = {
  content: string | null | undefined;
};

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match?.[1] || "text";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-border bg-[#1e1e2e]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, background: "transparent", padding: "1rem" }}
        showLineNumbers
        wrapLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const components: Components = {
  img: ({ src, alt, title }) => {
    if (!src) return null;
    const url = normalizeImageUrl(src);
    if (!url || /^javascript:/i.test(url)) return null;
    return (
      <img
        src={url}
        alt={alt ?? ""}
        title={title ?? undefined}
        className="my-6 max-h-[min(28rem,70vh)] w-full rounded-xl border border-border bg-muted/20 object-contain shadow-lg"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-primary underline-offset-2 transition-colors hover:text-primary/80 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...rest }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] font-semibold text-foreground before:content-none after:content-none">
          {children}
        </code>
      );
    }
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="my-6 overflow-hidden rounded-xl border border-border">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-border px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border/50 px-4 py-3 text-sm text-muted-foreground last-of-type:border-b-0">
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-4 border-primary/30 bg-primary/[0.03] py-3 pl-6 pr-4 text-base italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-border/50" />,
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-1.5 pl-6 marker:text-muted-foreground/40">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-1.5 pl-6 marker:text-muted-foreground/40">{children}</ol>
  ),
  li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-4 mt-10 text-2xl font-black tracking-tight text-foreground first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 text-xl font-black tracking-tight text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-lg font-bold tracking-tight text-foreground">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-5 text-base font-bold text-foreground">{children}</h4>
  ),
  p: ({ children }) => <p className="my-4 leading-relaxed text-muted-foreground">{children}</p>,
};

export function OverviewStory({ content }: Props) {
  if (!content || typeof content !== "string") return null;

  return (
    <div className="overview-story max-w-none">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
