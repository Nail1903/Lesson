"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  plannerUniversitySchema,
  plannerSubjectSchema,
  weeklyClassSchema,
} from "@/lib/validations/planner";
import * as svc from "@/server/services/planner-service";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

const rev = () => {
  revalidatePath("/schedule");
  revalidatePath("/subjects");
  revalidatePath("/dashboard");
};

export async function upsertPlannerUniversityAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = plannerUniversitySchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const u = await svc.upsertPlannerUniversity(user.id, {
      ...p.data,
      shortName: p.data.shortName || undefined,
      logoEmoji: p.data.logoEmoji || undefined,
    });
    rev();
    return ok({ id: u.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deletePlannerUniversityAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deletePlannerUniversity(user.id, id);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertPlannerSubjectAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = plannerSubjectSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const s = await svc.upsertPlannerSubject(user.id, {
      id: p.data.id,
      name: p.data.name,
      universityId: p.data.universityId ?? null,
    });
    rev();
    return ok({ id: s.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deletePlannerSubjectAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deletePlannerSubject(user.id, id);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertWeeklyClassAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = weeklyClassSchema.safeParse(raw);
    if (!p.success) return fail(p.error.errors[0]?.message ?? "Formada xəta var");
    if (p.data.endTime <= p.data.startTime) return fail("Bitmə saatı başlama saatından sonra olmalıdır.");
    const c = await svc.upsertWeeklyClass(user.id, {
      ...p.data,
      groupLabel: p.data.groupLabel || undefined,
      room: p.data.room || undefined,
      color: p.data.color || undefined,
    });
    rev();
    return ok({ id: c.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteWeeklyClassAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteWeeklyClass(user.id, id);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}
