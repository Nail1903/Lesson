import type { ReviewGrade } from "@prisma/client";
import { db } from "@/lib/db";
import { schedule, INITIAL_SRS } from "@/lib/srs";
import { logActivity } from "@/server/services/activity";

/**
 * Apply one spaced-repetition grade to a term: append a Review row, roll the
 * LearningProgress state forward, and sync the term's nextReviewAt + status.
 */
export async function applyReview(
  userId: string,
  termId: string,
  grade: ReviewGrade,
  source: "flashcard" | "quiz" | "manual" = "flashcard",
) {
  const term = await db.term.findFirst({
    where: { id: termId, userId, deletedAt: null },
    include: { progress: true },
  });
  if (!term) throw new Error("NOT_FOUND");

  const prev = term.progress
    ? {
        easeFactor: term.progress.easeFactor,
        intervalDays: term.progress.intervalDays,
        repetition: term.progress.repetition,
        lapses: term.progress.lapses,
      }
    : INITIAL_SRS;

  const next = schedule(prev, grade);
  const now = new Date();

  await db.review.create({
    data: {
      userId,
      termId,
      grade,
      source,
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetition: next.repetition,
      dueAt: next.dueAt,
    },
  });

  const progress = await db.learningProgress.upsert({
    where: { termId },
    create: {
      userId,
      termId,
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetition: next.repetition,
      dueAt: next.dueAt,
      lapses: next.lapses,
      totalReviews: 1,
      streak: grade === "FORGOT" ? 0 : 1,
      lastReviewedAt: now,
      masteredAt: next.mastered ? now : null,
    },
    update: {
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetition: next.repetition,
      dueAt: next.dueAt,
      lapses: next.lapses,
      totalReviews: { increment: 1 },
      streak: grade === "FORGOT" ? 0 : { increment: 1 },
      lastReviewedAt: now,
      masteredAt: next.mastered ? now : term.progress?.masteredAt ?? null,
    },
  });

  const status =
    next.mastered
      ? "UNDERSTOOD"
      : grade === "FORGOT"
        ? "NEEDS_REVIEW"
        : term.status === "NEW"
          ? "LEARNING"
          : term.status;

  const confidence =
    grade === "EASY"
      ? Math.min(5, term.confidence + 1)
      : grade === "FORGOT"
        ? Math.max(1, term.confidence - 1)
        : term.confidence;

  await db.term.update({
    where: { id: termId },
    data: { nextReviewAt: next.dueAt, status, confidence },
  });

  await logActivity({ userId, type: "review.done", entity: "Term", entityId: termId, meta: { grade, source } });

  return { progress, dueAt: next.dueAt, mastered: next.mastered };
}

export async function getReviewQueue(userId: string, take = 30) {
  return db.term.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [{ nextReviewAt: { lte: new Date() } }, { nextReviewAt: null }],
    },
    orderBy: [{ nextReviewAt: { sort: "asc", nulls: "first" } }, { importance: "desc" }],
    take,
    include: {
      category: { select: { name: true, color: true } },
      examples: { where: { deletedAt: null }, take: 1, select: { body: true } },
    },
  });
}
