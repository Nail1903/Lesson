"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reindexTerm } from "@/lib/rag/indexer";
import { logActivity } from "@/server/services/activity";
import {
  upsertExampleSchema,
  upsertRelationSchema,
  upsertNoteSchema,
} from "@/lib/validations/term";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

async function assertOwnsTerm(userId: string, termId: string) {
  const t = await db.term.findFirst({ where: { id: termId, userId, deletedAt: null }, select: { id: true, slug: true } });
  if (!t) throw new Error("NOT_FOUND");
  return t;
}

/* ── Examples ─────────────────────────────────────────────── */

export async function upsertExampleAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = upsertExampleSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    const { id, termId, ...rest } = parsed.data;
    const term = await assertOwnsTerm(user.id, termId);

    const example = id
      ? await db.example.update({
          where: { id },
          data: { ...rest, title: rest.title || null },
        })
      : await db.example.create({
          data: { ...rest, title: rest.title || null, userId: user.id, termId },
        });

    await reindexTerm(termId, user.id).catch(() => undefined);
    await logActivity({ userId: user.id, type: id ? "example.updated" : "example.created", entity: "Example", entityId: example.id });
    revalidatePath(`/terms/${term.slug}`);
    return ok({ id: example.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteExampleAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const ex = await db.example.findFirst({ where: { id, userId: user.id }, include: { term: { select: { slug: true, id: true } } } });
    if (!ex) return fail("Tapılmadı");
    await db.example.update({ where: { id }, data: { deletedAt: new Date() } });
    await reindexTerm(ex.termId, user.id).catch(() => undefined);
    revalidatePath(`/terms/${ex.term.slug}`);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

/* ── Notes ────────────────────────────────────────────────── */

export async function upsertNoteAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = upsertNoteSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    const { id, termId, title, body } = parsed.data;
    const term = await assertOwnsTerm(user.id, termId);

    const note = id
      ? await db.note.update({ where: { id }, data: { title: title || null, body } })
      : await db.note.create({ data: { userId: user.id, termId, title: title || null, body } });

    await reindexTerm(termId, user.id).catch(() => undefined);
    revalidatePath(`/terms/${term.slug}`);
    return ok({ id: note.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteNoteAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const note = await db.note.findFirst({ where: { id, userId: user.id }, include: { term: { select: { slug: true, id: true } } } });
    if (!note) return fail("Tapılmadı");
    await db.note.update({ where: { id }, data: { deletedAt: new Date() } });
    await reindexTerm(note.termId, user.id).catch(() => undefined);
    revalidatePath(`/terms/${note.term.slug}`);
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

/* ── Relations ────────────────────────────────────────────── */

export async function upsertRelationAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = upsertRelationSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    const { id, fromId, toId, type, customLabel, note } = parsed.data;
    if (fromId === toId) return fail("Termin özü ilə əlaqələndirilə bilməz");

    const from = await assertOwnsTerm(user.id, fromId);
    await assertOwnsTerm(user.id, toId);

    const relation = id
      ? await db.termRelation.update({ where: { id }, data: { type, customLabel: customLabel || null, note: note || null } })
      : await db.termRelation.upsert({
          where: { fromId_toId_type: { fromId, toId, type } },
          create: { userId: user.id, fromId, toId, type, customLabel: customLabel || null, note: note || null },
          update: { customLabel: customLabel || null, note: note || null, deletedAt: null },
        });

    revalidatePath(`/terms/${from.slug}`);
    revalidatePath("/graph");
    return ok({ id: relation.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteRelationAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const rel = await db.termRelation.findFirst({ where: { id, userId: user.id }, include: { from: { select: { slug: true } } } });
    if (!rel) return fail("Tapılmadı");
    await db.termRelation.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidatePath(`/terms/${rel.from.slug}`);
    revalidatePath("/graph");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}
