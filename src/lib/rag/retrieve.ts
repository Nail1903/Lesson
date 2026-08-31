import { db } from "@/lib/db";
import { getEmbeddingProvider } from "@/lib/ai";
import { toVectorLiteral } from "@/lib/rag/vector";
import type { EmbeddingSource } from "@prisma/client";

export interface RetrievedChunk {
  embeddingId: string;
  termId: string | null;
  termName: string | null;
  termSlug: string | null;
  source: EmbeddingSource;
  sourceId: string;
  content: string;
  vectorScore: number; // 0..1 cosine similarity
  keywordScore: number; // 0..1 lexical overlap
  score: number; // fused
}

export interface RetrieveOptions {
  userId: string;
  query: string;
  limit?: number;
  /** Restrict retrieval to these term ids (e.g. "compare X and Y"). */
  termIds?: string[];
  categoryIds?: string[];
  minScore?: number;
}

const VECTOR_WEIGHT = 0.65;
const KEYWORD_WEIGHT = 0.35;

/**
 * Hybrid retrieval: pgvector cosine search + trigram/ILIKE keyword search,
 * fused with a weighted sum and lightly re-ranked. Always scoped to `userId`.
 */
export async function retrieve(opts: RetrieveOptions): Promise<RetrievedChunk[]> {
  const limit = opts.limit ?? 8;
  const pool = Math.max(limit * 4, 24);

  const [vectorHits, keywordHits] = await Promise.all([
    vectorSearch(opts, pool),
    keywordSearch(opts, pool),
  ]);

  const merged = new Map<string, RetrievedChunk>();
  for (const h of vectorHits) merged.set(h.embeddingId, h);
  for (const h of keywordHits) {
    const existing = merged.get(h.embeddingId);
    if (existing) existing.keywordScore = Math.max(existing.keywordScore, h.keywordScore);
    else merged.set(h.embeddingId, h);
  }

  const out = [...merged.values()].map((c) => ({
    ...c,
    score: VECTOR_WEIGHT * c.vectorScore + KEYWORD_WEIGHT * c.keywordScore,
  }));

  out.sort((a, b) => b.score - a.score);

  const minScore = opts.minScore ?? 0.05;
  return out.filter((c) => c.score >= minScore).slice(0, limit);
}

async function vectorSearch(opts: RetrieveOptions, limit: number): Promise<RetrievedChunk[]> {
  const [embedding] = await getEmbeddingProvider().embed([opts.query]);
  if (!embedding) return [];

  const params: unknown[] = [toVectorLiteral(embedding), opts.userId];
  let where = `e."userId" = $2 AND e."embedding" IS NOT NULL`;

  if (opts.termIds?.length) {
    params.push(opts.termIds);
    where += ` AND e."termId" = ANY($${params.length}::text[])`;
  }
  if (opts.categoryIds?.length) {
    params.push(opts.categoryIds);
    where += ` AND t."categoryId" = ANY($${params.length}::text[])`;
  }
  params.push(limit);

  const rows = await db.$queryRawUnsafe<
    {
      id: string;
      termId: string | null;
      termName: string | null;
      termSlug: string | null;
      source: EmbeddingSource;
      sourceId: string;
      content: string;
      score: number;
    }[]
  >(
    `SELECT e."id", e."termId", t."name" AS "termName", t."slug" AS "termSlug",
            e."source", e."sourceId", e."content",
            1 - (e."embedding" <=> $1::vector) AS score
       FROM "Embedding" e
       LEFT JOIN "Term" t ON t."id" = e."termId"
      WHERE ${where}
      ORDER BY e."embedding" <=> $1::vector
      LIMIT $${params.length}`,
    ...params,
  );

  return rows.map((r) => ({
    embeddingId: r.id,
    termId: r.termId,
    termName: r.termName,
    termSlug: r.termSlug,
    source: r.source,
    sourceId: r.sourceId,
    content: r.content,
    vectorScore: clamp01(Number(r.score)),
    keywordScore: 0,
    score: 0,
  }));
}

async function keywordSearch(opts: RetrieveOptions, limit: number): Promise<RetrievedChunk[]> {
  const terms = tokenize(opts.query);
  if (!terms.length) return [];

  const rows = await db.embedding.findMany({
    where: {
      userId: opts.userId,
      ...(opts.termIds?.length ? { termId: { in: opts.termIds } } : {}),
      ...(opts.categoryIds?.length ? { term: { categoryId: { in: opts.categoryIds } } } : {}),
      OR: terms.map((t) => ({ content: { contains: t, mode: "insensitive" as const } })),
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      termId: true,
      source: true,
      sourceId: true,
      content: true,
      term: { select: { name: true, slug: true } },
    },
  });

  return rows.map((r) => {
    const lc = r.content.toLowerCase();
    const hits = terms.filter((t) => lc.includes(t)).length;
    return {
      embeddingId: r.id,
      termId: r.termId,
      termName: r.term?.name ?? null,
      termSlug: r.term?.slug ?? null,
      source: r.source,
      sourceId: r.sourceId,
      content: r.content,
      vectorScore: 0,
      keywordScore: clamp01(hits / terms.length),
      score: 0,
    };
  });
}

/** Distinct-term semantic search for the "Bütün terminlər" search box. */
export async function semanticTermSearch(
  userId: string,
  query: string,
  limit = 20,
): Promise<{ termId: string; name: string; slug: string; score: number; snippet: string }[]> {
  const chunks = await retrieve({ userId, query, limit: limit * 3, minScore: 0.03 });
  const byTerm = new Map<string, { name: string; slug: string; score: number; snippet: string }>();
  for (const c of chunks) {
    if (!c.termId || !c.termName || !c.termSlug) continue;
    const cur = byTerm.get(c.termId);
    if (!cur || c.score > cur.score) {
      byTerm.set(c.termId, {
        name: c.termName,
        slug: c.termSlug,
        score: c.score,
        snippet: c.content.slice(0, 200),
      });
    }
  }
  return [...byTerm.entries()]
    .map(([termId, v]) => ({ termId, ...v }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function tokenize(q: string): string[] {
  return Array.from(
    new Set(
      q
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2),
    ),
  ).slice(0, 12);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
