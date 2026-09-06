import { db } from "@/lib/db";

export type LearnReason = "due" | "new" | "weak";

export interface LearnCard {
  id: string;
  name: string;
  slug: string;
  shortDef: string | null;
  longDef: string | null;
  inMyWords: string | null;
  example: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  reason: LearnReason;
}

export interface LearnQueue {
  cards: LearnCard[];
  counts: { due: number; new: number; weak: number; total: number };
}

const SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDef: true,
  longDef: true,
  inMyWords: true,
  status: true,
  confidence: true,
  nextReviewAt: true,
  category: { select: { name: true, color: true } },
  examples: { where: { deletedAt: null }, take: 1, select: { body: true }, orderBy: { createdAt: "asc" as const } },
} as const;

/**
 * Build one smart study session. No configuration — the queue mixes what the
 * learner actually needs right now, in a sensible order:
 *   1. reviews that are due (spaced repetition)
 *   2. brand-new terms never studied
 *   3. weak terms (low self-confidence)
 */
export async function getLearnQueue(userId: string, limit = 12): Promise<LearnQueue> {
  const now = new Date();
  const base = { userId, deletedAt: null } as const;

  const [dueRows, newRows, weakRows, dueCount, newCount, weakCount] = await Promise.all([
    db.term.findMany({
      where: { ...base, nextReviewAt: { lte: now } },
      orderBy: [{ nextReviewAt: "asc" }, { importance: "desc" }],
      take: limit,
      select: SELECT,
    }),
    db.term.findMany({
      where: { ...base, status: "NEW", OR: [{ nextReviewAt: null }, { nextReviewAt: { gt: now } }] },
      orderBy: [{ importance: "desc" }, { createdAt: "asc" }],
      take: limit,
      select: SELECT,
    }),
    db.term.findMany({
      where: { ...base, confidence: { lte: 2 }, status: { not: "NEW" } },
      orderBy: [{ confidence: "asc" }, { importance: "desc" }],
      take: limit,
      select: SELECT,
    }),
    db.term.count({ where: { ...base, nextReviewAt: { lte: now } } }),
    db.term.count({ where: { ...base, status: "NEW" } }),
    db.term.count({ where: { ...base, confidence: { lte: 2 }, status: { not: "NEW" } } }),
  ]);

  const seen = new Set<string>();
  const cards: LearnCard[] = [];
  const push = (rows: typeof dueRows, reason: LearnReason) => {
    for (const t of rows) {
      if (cards.length >= limit || seen.has(t.id)) continue;
      seen.add(t.id);
      cards.push({
        id: t.id,
        name: t.name,
        slug: t.slug,
        shortDef: t.shortDef,
        longDef: t.longDef,
        inMyWords: t.inMyWords,
        example: t.examples[0]?.body ?? null,
        categoryName: t.category?.name ?? null,
        categoryColor: t.category?.color ?? null,
        reason,
      });
    }
  };

  push(dueRows, "due");
  push(newRows, "new");
  push(weakRows, "weak");

  return {
    cards,
    counts: { due: dueCount, new: newCount, weak: weakCount, total: dueCount + newCount + weakCount },
  };
}
