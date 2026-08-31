"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { reviewGradeSchema } from "@/lib/validations/misc";
import { applyReview } from "@/server/services/review-service";
import { ok, fromError, fail, type ActionResult } from "@/server/actions/_result";

export async function reviewGradeAction(
  raw: unknown,
): Promise<ActionResult<{ dueAt: string; mastered: boolean }>> {
  try {
    const user = await requireUser();
    const parsed = reviewGradeSchema.safeParse(raw);
    if (!parsed.success) return fail("Qiymət düzgün deyil");
    const { termId, grade, source } = parsed.data;
    const res = await applyReview(user.id, termId, grade, source);
    revalidatePath("/review");
    revalidatePath("/dashboard");
    return ok({ dueAt: res.dueAt.toISOString(), mastered: res.mastered });
  } catch (e) {
    return fromError(e);
  }
}
