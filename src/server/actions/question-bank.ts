"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { upsertQuestionSchema, examConfigSchema } from "@/lib/validations/question-bank";
import * as svc from "@/server/services/question-bank-service";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

export async function upsertQuestionAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = upsertQuestionSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const q = await svc.upsertQuestion(user.id, p.data);
    revalidatePath("/question-bank");
    revalidatePath("/subjects");
    return ok({ id: q.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteQuestionAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteQuestion(user.id, id);
    revalidatePath("/question-bank");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function generateExamAction(raw: unknown): Promise<ActionResult<{ quizId: string }>> {
  try {
    const user = await requireUser();
    const p = examConfigSchema.safeParse(raw);
    if (!p.success) return fail("Konfiqurasiya xətası", p.error.flatten().fieldErrors);
    const quizId = await svc.generateExam(user.id, p.data);
    revalidatePath("/question-bank");
    return ok({ quizId });
  } catch (e) {
    return fromError(e);
  }
}
