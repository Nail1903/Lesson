"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import Link from "next/link";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import { cn } from "@/lib/utils";

const WIKILINK = /\[\[([^\]]+)\]\]/g;

/** Rewrite `[[Term name]]` → a normal markdown link to /terms/<slug> before parsing. */
function expandWikilinks(src: string): string {
  return src.replace(WIKILINK, (_m, name: string) => {
    const slug = name
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    return `[${name.trim()}](/terms/${slug})`;
  });
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  const src = React.useMemo(() => expandWikilinks(children ?? ""), [children]);
  return (
    <div className={cn("prose-note", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          a: ({ href, children: c }) => {
            const url = href ?? "#";
            if (url.startsWith("/")) return <Link href={url}>{c}</Link>;
            return (
              <a href={url} target="_blank" rel="noreferrer noopener">
                {c}
              </a>
            );
          },
        }}
      >
        {src}
      </ReactMarkdown>
    </div>
  );
}
