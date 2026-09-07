"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  versionSchema,
  sectionSchema,
  reorderSchema,
  assessmentSchema,
  courseOutcomeSchema,
} from "@/lib/validations/course-version";
import * as svc from "@/server/services/course-version-service";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

const rev = (subjectSlug?: string) => {
  revalidatePath("/subjects");
  if (subjectSlug) revalidatePath(`/subjects/${subjectSlug}/program`);
};

export async function createVersionAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = z
      .object({
        subjectId: z.string().cuid(),
        label: z.string().trim().min(1).max(80),
        kind: z.enum(["program", "syllabus"]).default("program"),
        fromVersionId: z.string().cuid().optional(),
      })
      .safeParse(raw);
    if (!p.success) return fail("Formada xəta var");
    const v = await svc.createVersion(user.id, p.data);
    rev();
    return ok({ id: v.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function updateVersionMetaAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const p = versionSchema.pick({ id: true, label: true, description: true, objective: true }).safeParse(raw);
    if (!p.success || !p.data.id) return fail("Formada xəta var");
    await svc.updateVersionMeta(user.id, p.data.id, {
      label: p.data.label,
      description: p.data.description || "",
      objective: p.data.objective || "",
    });
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertSectionAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = sectionSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const s = await svc.upsertSection(user.id, { ...p.data, key: p.data.key || undefined, body: p.data.body || undefined });
    rev();
    return ok({ id: s.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteSectionAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteSection(user.id, id);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function reorderSectionsAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const p = reorderSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var");
    await svc.reorderSections(user.id, p.data.courseVersionId, p.data.orderedIds);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertAssessmentAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = assessmentSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const a = await svc.upsertAssessment(user.id, {
      ...p.data,
      criteria: p.data.criteria || undefined,
      dueInfo: p.data.dueInfo || undefined,
    });
    rev();
    return ok({ id: a.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteAssessmentAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteAssessment(user.id, id);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertCourseOutcomeAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = courseOutcomeSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const o = await svc.upsertCourseOutcome(user.id, {
      ...p.data,
      code: p.data.code || undefined,
      bloomLevel: p.data.bloomLevel || undefined,
    });
    rev();
    return ok({ id: o.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteCourseOutcomeAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteCourseOutcome(user.id, id);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function publishVersionAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.publishVersion(user.id, id);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteVersionAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteVersion(user.id, id);
    rev();
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}
