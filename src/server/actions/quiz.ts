"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/env";
import { limit } from "@/lib/rate-limit";
import { quizConfigSchema, gradeAnswerSchema } from "@/lib/validations/misc";
import { generateQuiz, gradeAnswer } from "@/server/services/quiz-service";
import { applyReview } from "@/server/services/review-service";
import { logActivity } from "@/server/services/activity";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

export async function generateQuizAction(raw: unknown): Promise<ActionResult<{ quizId: string }>> {
  try {
    const user = await requireUser();
    if (!limit(`ai:${user.id}`, env.RATE_LIMIT_AI_PER_MINUTE).ok) {
      return fail("Çox tez-tez sorğu göndərirsiniz. Bir dəqiqə gözləyin.");
    }
    const parsed = quizConfigSchema.safeParse(raw);
    if (!parsed.success) return fail("Konfiqurasiya xətası", parsed.error.flatten().fieldErrors);

    const quiz = await generateQuiz(user.id, parsed.data);
    await logActivity({ userId: user.id, type: "quiz.created", entity: "Quiz", entityId: quiz.id });
    revalidatePath("/quizzes");
    return ok({ quizId: quiz.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function gradeAnswerAction(raw: unknown): Promise<
  ActionResult<{
    isCorrect: boolean;
    scorePct: number;
    feedback: string;
    correctAnswer: string;
    explanation: string | null;
  }>
> {
  try {
    const user = await requireUser();
    const parsed = gradeAnswerSchema.safeParse(raw);
    if (!parsed.success) return fail("Cavab düzgün deyil");
    const { questionId, quizId, response } = parsed.data;
    const result = await gradeAnswer(user.id, questionId, response, quizId);

    // Feed the result into spaced repetition for the underlying term.
    const q = await db.question.findFirst({ where: { id: questionId, userId: user.id }, select: { termId: true } });
    if (q?.termId) {
      const grade = result.scorePct >= 85 ? "EASY" : result.scorePct >= 60 ? "GOOD" : result.scorePct >= 30 ? "HARD" : "FORGOT";
      await applyReview(user.id, q.termId, grade, "quiz");
    }

    return ok(result);
  } catch (e) {
    return fromError(e);
  }
}

export async function finishQuizAction(quizId: string): Promise<ActionResult<{ scorePct: number }>> {
  try {
    const user = await requireUser();
    const quiz = await db.quiz.findFirst({
      where: { id: quizId, userId: user.id },
      include: { questions: { select: { id: true } } },
    });
    if (!quiz) return fail("Test tapılmadı");

    const answers = await db.answer.findMany({
      where: { quizId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    // last answer per question
    const seen = new Set<string>();
    const scores: number[] = [];
    for (const a of answers) {
      if (seen.has(a.questionId)) continue;
      seen.add(a.questionId);
      scores.push(a.scorePct ?? (a.isCorrect ? 100 : 0));
    }
    const scorePct = scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : 0;

    await db.quiz.update({ where: { id: quizId }, data: { completedAt: new Date(), scorePct } });
    await logActivity({ userId: user.id, type: "quiz.completed", entity: "Quiz", entityId: quizId, meta: { scorePct } });
    revalidatePath("/quizzes");
    revalidatePath("/stats");
    return ok({ scorePct });
  } catch (e) {
    return fromError(e);
  }
}
