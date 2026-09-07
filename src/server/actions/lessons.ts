"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  lessonFieldsSchema,
  lessonMaterialSchema,
  lessonOutcomeSchema,
  sourceLinkSchema,
} from "@/lib/validations/lesson-content";
import * as svc from "@/server/services/lesson-service";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

export async function updateLessonAction(raw: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireUser();
    const p = lessonFieldsSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const lesson = await svc.updateLessonFields(user.id, p.data);
    revalidatePath(`/lessons/${lesson.id}`);
    revalidatePath("/subjects");
    return ok({ id: lesson.id, slug: lesson.slug });
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertMaterialAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = lessonMaterialSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const m = await svc.upsertMaterial(user.id, {
      ...p.data,
      title: p.data.title || undefined,
      body: p.data.body || undefined,
      url: p.data.url || undefined,
    });
    revalidatePath(`/lessons/${p.data.topicId}`);
    return ok({ id: m.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteMaterialAction(id: string, topicId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteMaterial(user.id, id);
    revalidatePath(`/lessons/${topicId}`);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertLessonOutcomeAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = lessonOutcomeSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const o = await svc.upsertLessonOutcome(user.id, {
      ...p.data,
      code: p.data.code || undefined,
      bloomLevel: p.data.bloomLevel || undefined,
      criteria: p.data.criteria || undefined,
    });
    revalidatePath(`/lessons/${p.data.topicId}`);
    return ok({ id: o.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteLessonOutcomeAction(id: string, topicId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteLessonOutcome(user.id, id);
    revalidatePath(`/lessons/${topicId}`);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertSourceLinkAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const p = sourceLinkSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var", p.error.flatten().fieldErrors);
    const l = await svc.upsertSourceLink(user.id, {
      ...p.data,
      chapter: p.data.chapter || undefined,
      pages: p.data.pages || undefined,
      videoTimestamp: p.data.videoTimestamp || undefined,
      role: p.data.role || undefined,
    });
    if (p.data.topicId) revalidatePath(`/lessons/${p.data.topicId}`);
    return ok({ id: l.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteSourceLinkAction(id: string, topicId?: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await svc.deleteSourceLink(user.id, id);
    if (topicId) revalidatePath(`/lessons/${topicId}`);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

const bulkSchema = z.object({
  subjectId: z.string().cuid(),
  mode: z.enum(["count", "names"]),
  count: z.coerce.number().int().min(1).max(60).optional(),
  names: z.string().max(8000).optional(),
  module: z.string().trim().max(120).optional(),
});

export async function bulkCreateLessonsAction(raw: unknown): Promise<ActionResult<{ created: number }>> {
  try {
    const user = await requireUser();
    const p = bulkSchema.safeParse(raw);
    if (!p.success) return fail("Formada xəta var");
    const names =
      p.data.mode === "names"
        ? (p.data.names ?? "").split("\n").map((s) => s.trim()).filter(Boolean)
        : undefined;
    const created = await svc.bulkCreateLessons(user.id, p.data.subjectId, {
      names,
      count: p.data.count,
      module: p.data.module,
    });
    revalidatePath("/subjects");
    return ok({ created: created.length });
  } catch (e) {
    return fromError(e);
  }
}

export async function duplicateLessonAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const newId = await svc.duplicateLesson(user.id, id);
    revalidatePath("/subjects");
    return ok({ id: newId });
  } catch (e) {
    return fromError(e);
  }
}
