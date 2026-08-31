"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  upsertSubjectSchema,
  upsertTopicSchema,
  linkTopicTermSchema,
  setTermSubjectsSchema,
} from "@/lib/validations/subject";
import {
  createSubject,
  updateSubject,
  deleteSubject,
  createTopic,
  updateTopic,
  deleteTopic,
} from "@/server/services/subject-service";
import { createTerm } from "@/server/services/term-service";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

export async function upsertSubjectAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = upsertSubjectSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    const { id, ...data } = parsed.data;
    const subject = id
      ? await updateSubject(user.id, id, data)
      : await createSubject(user.id, data);
    revalidatePath("/subjects");
    return ok({ id: subject.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteSubjectAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await deleteSubject(user.id, id);
    revalidatePath("/subjects");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function restoreSubjectAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await db.subject.updateMany({ where: { id, userId: user.id, deletedAt: { not: null } }, data: { deletedAt: null } });
    revalidatePath("/subjects");
    revalidatePath("/trash");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function purgeSubjectAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await db.subject.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/trash");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

export async function upsertTopicAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = upsertTopicSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    const { id, subjectId, ...data } = parsed.data;
    const topic = id
      ? await updateTopic(user.id, id, data)
      : await createTopic(user.id, { subjectId, ...data });
    revalidatePath("/subjects");
    return ok({ id: topic.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteTopicAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await deleteTopic(user.id, id);
    revalidatePath("/subjects");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

/** Attach an existing term (or create+attach a new one) to a lesson topic. */
export async function linkTopicTermAction(raw: unknown): Promise<ActionResult<{ termId: string }>> {
  try {
    const user = await requireUser();
    const parsed = linkTopicTermSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    const { topicId, note, position } = parsed.data;

    const topic = await db.topic.findFirst({
      where: { id: topicId, userId: user.id, deletedAt: null },
      select: { id: true, subjectId: true },
    });
    if (!topic) return fail("Mövzu tapılmadı");

    let termId = parsed.data.termId;
    if (!termId && parsed.data.newTermName) {
      const term = await createTerm(user.id, {
        name: parsed.data.newTermName,
        difficulty: "BEGINNER",
        status: "NEW",
        confidence: 1,
        importance: 3,
        aliases: [],
        tags: [],
        collectionIds: [],
      } as never);
      termId = term.id;
    }
    if (!termId) return fail("Termin seçin və ya yeni ad daxil edin");

    const owns = await db.term.findFirst({ where: { id: termId, userId: user.id, deletedAt: null }, select: { id: true } });
    if (!owns) return fail("Termin tapılmadı");

    const last = await db.topicTerm.aggregate({ where: { topicId }, _max: { position: true } });
    await db.topicTerm.upsert({
      where: { topicId_termId: { topicId, termId } },
      create: {
        userId: user.id,
        topicId,
        termId,
        note: note || null,
        position: position ?? (last._max.position ?? -1) + 1,
      },
      update: { note: note || null },
    });
    // keep the subject <-> term m2m in sync
    await db.term.update({
      where: { id: termId },
      data: { subjects: { connect: { id: topic.subjectId } } },
    });

    revalidatePath("/subjects");
    return ok({ termId });
  } catch (e) {
    return fromError(e);
  }
}

export async function unlinkTopicTermAction(topicId: string, termId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await db.topicTerm.deleteMany({ where: { topicId, termId, userId: user.id } });
    revalidatePath("/subjects");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

/** Replace the full set of subjects a term belongs to (from the term editor). */
export async function setTermSubjectsAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const parsed = setTermSubjectsSchema.safeParse(raw);
    if (!parsed.success) return fail("Məlumat düzgün deyil");
    const { termId, subjectIds } = parsed.data;

    const term = await db.term.findFirst({ where: { id: termId, userId: user.id, deletedAt: null }, select: { id: true, slug: true } });
    if (!term) return fail("Termin tapılmadı");

    const owned = await db.subject.findMany({
      where: { id: { in: subjectIds }, userId: user.id, deletedAt: null },
      select: { id: true },
    });

    await db.term.update({
      where: { id: termId },
      data: { subjects: { set: owned.map((s) => ({ id: s.id })) } },
    });

    // drop topic links that belong to subjects the term was just removed from
    const keep = new Set(owned.map((s) => s.id));
    const links = await db.topicTerm.findMany({
      where: { termId, userId: user.id },
      include: { topic: { select: { subjectId: true } } },
    });
    const stale = links.filter((l) => !keep.has(l.topic.subjectId)).map((l) => l.id);
    if (stale.length) await db.topicTerm.deleteMany({ where: { id: { in: stale } } });

    revalidatePath(`/terms/${term.slug}`);
    revalidatePath("/subjects");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}
