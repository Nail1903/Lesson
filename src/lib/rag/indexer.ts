import { db } from "@/lib/db";
import { getEmbeddingProvider } from "@/lib/ai";
import { sha256, estimateTokens } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { chunksForTerm, type Chunk } from "@/lib/rag/chunk";
import { toVectorLiteral } from "@/lib/rag/vector";

const termInclude = {
  aliases: true,
  notes: { where: { deletedAt: null } },
  examples: { where: { deletedAt: null } },
  codeExamples: { where: { deletedAt: null } },
  formulas: { where: { deletedAt: null } },
  sources: { where: { deletedAt: null } },
} as const;

/**
 * Incrementally (re)build the vector index for one term.
 * Only chunks whose content hash changed are re-embedded — everything else is
 * left untouched, keeping embedding-API spend proportional to real edits.
 */
export async function reindexTerm(termId: string, userId: string): Promise<{
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
}> {
  const term = await db.term.findFirst({
    where: { id: termId, userId, deletedAt: null },
    include: termInclude,
  });

  if (!term) {
    // term gone/soft-deleted → drop its whole index footprint
    const del = await db.embedding.deleteMany({ where: { termId, userId } });
    return { created: 0, updated: 0, deleted: del.count, unchanged: 0 };
  }

  const provider = getEmbeddingProvider();
  const desired = chunksForTerm(term as unknown as Parameters<typeof chunksForTerm>[0]);
  const desiredKey = (c: Chunk) => `${c.source}:${c.sourceId}:${c.chunkIndex}`;

  const existing = await db.embedding.findMany({
    where: { termId, userId },
    select: { id: true, source: true, sourceId: true, chunkIndex: true, contentHash: true, model: true },
  });
  const existingByKey = new Map(
    existing.map((e) => [`${e.source}:${e.sourceId}:${e.chunkIndex}`, e]),
  );

  const sigModel = provider.model;
  const toEmbed: { chunk: Chunk; hash: string; existingId?: string }[] = [];
  let unchanged = 0;

  for (const chunk of desired) {
    const hash = await sha256(chunk.content);
    const prev = existingByKey.get(desiredKey(chunk));
    if (prev && prev.contentHash === hash && prev.model === sigModel) {
      unchanged++;
      continue;
    }
    toEmbed.push({ chunk, hash, existingId: prev?.id });
  }

  // Delete rows that no longer correspond to any desired chunk.
  const desiredKeys = new Set(desired.map(desiredKey));
  const staleIds = existing
    .filter((e) => !desiredKeys.has(`${e.source}:${e.sourceId}:${e.chunkIndex}`))
    .map((e) => e.id);
  if (staleIds.length) {
    await db.embedding.deleteMany({ where: { id: { in: staleIds } } });
  }

  let created = 0;
  let updated = 0;

  if (toEmbed.length) {
    const vectors = await provider.embed(toEmbed.map((t) => t.chunk.content));

    for (let i = 0; i < toEmbed.length; i++) {
      const { chunk, hash, existingId } = toEmbed[i]!;
      const vec = vectors[i]!;
      const row = await db.embedding.upsert({
        where: {
          source_sourceId_chunkIndex: {
            source: chunk.source,
            sourceId: chunk.sourceId,
            chunkIndex: chunk.chunkIndex,
          },
        },
        create: {
          userId,
          termId: chunk.termId,
          source: chunk.source,
          sourceId: chunk.sourceId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenCount: estimateTokens(chunk.content),
          model: provider.model,
          dimensions: provider.dimensions,
          contentHash: hash,
        },
        update: {
          content: chunk.content,
          tokenCount: estimateTokens(chunk.content),
          model: provider.model,
          dimensions: provider.dimensions,
          contentHash: hash,
          termId: chunk.termId,
        },
        select: { id: true },
      });

      await db.$executeRawUnsafe(
        `UPDATE "Embedding" SET "embedding" = $1::vector, "updatedAt" = now() WHERE "id" = $2`,
        toVectorLiteral(vec),
        row.id,
      );

      if (existingId) updated++;
      else created++;
    }
  }

  logger.info("rag.reindex", { termId, created, updated, deleted: staleIds.length, unchanged });
  return { created, updated, deleted: staleIds.length, unchanged };
}

/** Reindex every non-deleted term for a user (used by seed + settings action). */
export async function reindexAll(userId: string) {
  const terms = await db.term.findMany({
    where: { userId, deletedAt: null },
    select: { id: true },
  });
  let totals = { created: 0, updated: 0, deleted: 0, unchanged: 0 };
  for (const t of terms) {
    const r = await reindexTerm(t.id, userId);
    totals = {
      created: totals.created + r.created,
      updated: totals.updated + r.updated,
      deleted: totals.deleted + r.deleted,
      unchanged: totals.unchanged + r.unchanged,
    };
  }
  return { terms: terms.length, ...totals };
}
