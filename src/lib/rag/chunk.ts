import type { EmbeddingSource } from "@prisma/client";
import { estimateTokens } from "@/lib/utils";

export interface Chunk {
  source: EmbeddingSource;
  sourceId: string;
  termId: string | null;
  chunkIndex: number;
  content: string;
}

const MAX_TOKENS = 320;
const OVERLAP_TOKENS = 40;

/**
 * Split a block of markdown/plain text into overlapping, roughly token-bounded
 * chunks. Splits on paragraph boundaries first, then packs paragraphs greedily.
 */
export function splitText(text: string, maxTokens = MAX_TOKENS): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (estimateTokens(clean) <= maxTokens) return [clean];

  const paragraphs = clean.split(/\n{2,}/).flatMap((p) =>
    estimateTokens(p) > maxTokens ? p.split(/(?<=[.!?])\s+/) : [p],
  );

  const chunks: string[] = [];
  let buf: string[] = [];
  let bufTokens = 0;

  for (const part of paragraphs) {
    const t = estimateTokens(part);
    if (bufTokens + t > maxTokens && buf.length) {
      chunks.push(buf.join("\n\n"));
      // carry a small overlap for context continuity
      const carry: string[] = [];
      let carryTokens = 0;
      for (let i = buf.length - 1; i >= 0 && carryTokens < OVERLAP_TOKENS; i--) {
        carry.unshift(buf[i]!);
        carryTokens += estimateTokens(buf[i]!);
      }
      buf = [...carry];
      bufTokens = carryTokens;
    }
    buf.push(part);
    bufTokens += t;
  }
  if (buf.length) chunks.push(buf.join("\n\n"));
  return chunks;
}

interface TermForChunking {
  id: string;
  name: string;
  shortDef: string | null;
  longDef: string | null;
  inMyWords: string | null;
  practicalUse: string | null;
  aliases: { value: string }[];
  notes: { id: string; title: string | null; body: string }[];
  examples: { id: string; kind: string; title: string | null; body: string }[];
  codeExamples: { id: string; language: string; title: string | null; code: string; explanation: string | null }[];
  formulas: { id: string; latex: string; caption: string | null; explanation: string | null }[];
  sources: { id: string; title: string; authors: string | null; year: number | null; pages: string | null; personalNote: string | null }[];
}

/** Produce every chunk that represents a term and its attached content. */
export function chunksForTerm(term: TermForChunking): Chunk[] {
  const out: Chunk[] = [];
  const push = (source: EmbeddingSource, sourceId: string, parts: string[]) => {
    parts
      .flatMap((p) => splitText(p))
      .forEach((content, i) =>
        out.push({ source, sourceId, termId: term.id, chunkIndex: i, content }),
      );
  };

  const header = `# ${term.name}${
    term.aliases.length ? ` (həmçinin: ${term.aliases.map((a) => a.value).join(", ")})` : ""
  }`;

  push("TERM", term.id, [
    [
      header,
      term.shortDef && `Qısa izah: ${term.shortDef}`,
      term.longDef && `Geniş izah: ${term.longDef}`,
      term.inMyWords && `Öz sözlərimlə: ${term.inMyWords}`,
      term.practicalUse && `Praktiki tətbiq: ${term.practicalUse}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  ]);

  for (const n of term.notes) {
    push("NOTE", n.id, [`${header}\n\n## Qeyd: ${n.title ?? ""}\n\n${n.body}`]);
  }
  for (const e of term.examples) {
    push("EXAMPLE", e.id, [
      `${header}\n\n## Nümunə (${e.kind}): ${e.title ?? ""}\n\n${e.body}`,
    ]);
  }
  for (const c of term.codeExamples) {
    push("CODE_EXAMPLE", c.id, [
      `${header}\n\n## Kod nümunəsi (${c.language}): ${c.title ?? ""}\n\n\`\`\`${c.language}\n${c.code}\n\`\`\`\n\n${c.explanation ?? ""}`,
    ]);
  }
  for (const f of term.formulas) {
    push("FORMULA", f.id, [
      `${header}\n\n## Düstur: ${f.caption ?? ""}\n\n$$${f.latex}$$\n\n${f.explanation ?? ""}`,
    ]);
  }
  for (const s of term.sources) {
    push("SOURCE", s.id, [
      `${header}\n\n## Mənbə: ${s.title}${s.authors ? ` — ${s.authors}` : ""}${
        s.year ? ` (${s.year})` : ""
      }${s.pages ? `, s. ${s.pages}` : ""}\n\n${s.personalNote ?? ""}`,
    ]);
  }

  return out.filter((c) => c.content.trim().length > 0);
}
