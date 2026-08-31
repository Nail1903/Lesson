import type { ReviewGrade } from "@prisma/client";

/**
 * SM-2 spaced-repetition scheduler (the algorithm behind Anki's default).
 *
 * Grade mapping (UI → SM-2 quality q):
 *   FORGOT → 1   HARD → 3   GOOD → 4   EASY → 5
 */
export interface SrsState {
  easeFactor: number; // ≥ 1.3
  intervalDays: number;
  repetition: number;
  lapses: number;
}

export interface SrsResult extends SrsState {
  dueAt: Date;
  mastered: boolean;
}

const Q: Record<ReviewGrade, number> = {
  FORGOT: 1,
  HARD: 3,
  GOOD: 4,
  EASY: 5,
};

export const INITIAL_SRS: SrsState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetition: 0,
  lapses: 0,
};

export function schedule(
  prev: SrsState,
  grade: ReviewGrade,
  now: Date = new Date(),
): SrsResult {
  const q = Q[grade];
  let { easeFactor, intervalDays, repetition, lapses } = prev;

  if (q < 3) {
    // Failed recall — reset the learning steps, bump the lapse counter.
    repetition = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    repetition += 1;
    if (repetition === 1) intervalDays = 1;
    else if (repetition === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);

    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
  }

  if (grade === "HARD") intervalDays = Math.max(1, Math.round(intervalDays * 0.7));

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  const mastered = repetition >= 3 && intervalDays >= 21 && easeFactor >= 2.3;

  return { easeFactor, intervalDays, repetition, lapses, dueAt, mastered };
}

/** How urgent a review is, for sorting the daily queue (higher = sooner). */
export function overdueScore(dueAt: Date, importance = 3, now = new Date()): number {
  const days = (now.getTime() - dueAt.getTime()) / 86_400_000;
  return days + importance * 0.5;
}
