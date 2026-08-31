"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ok, fail, fromError, type ActionResult } from "@/server/actions/_result";

/* ── Profile / settings ───────────────────────────────────── */

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  locale: z.string().max(8).optional(),
  aiProvider: z.enum(["", "openai", "anthropic", "echo"]).optional(),
});

export async function updateProfileAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    const parsed = profileSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var");
    await db.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        ...(parsed.data.locale ? { locale: parsed.data.locale } : {}),
        aiProvider: parsed.data.aiProvider ? parsed.data.aiProvider : null,
      },
    });
    revalidatePath("/settings");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

/* ── Collections ──────────────────────────────────────────── */

export async function createCollectionAction(name: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const clean = name.trim();
    if (!clean) return fail("Ad boş ola bilməz");
    const base = slugify(clean);
    let slug = base;
    let n = 1;
    while (await db.collection.findFirst({ where: { userId: user.id, slug }, select: { id: true } })) {
      slug = `${base}-${++n}`;
    }
    const c = await db.collection.create({ data: { userId: user.id, name: clean, slug } });
    revalidatePath("/collections");
    return ok({ id: c.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteCollectionAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await db.collection.updateMany({ where: { id, userId: user.id }, data: { deletedAt: new Date() } });
    revalidatePath("/collections");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}

/* ── Sources ──────────────────────────────────────────────── */

const sourceSchema = z.object({
  id: z.string().cuid().optional(),
  termId: z.string().cuid().optional().nullable(),
  kind: z.enum(["BOOK", "ARTICLE", "PAPER", "WEBSITE", "VIDEO", "COURSE", "OTHER"]).default("WEBSITE"),
  title: z.string().trim().min(1).max(400),
  authors: z.string().trim().max(400).optional().or(z.literal("")),
  year: z.coerce.number().int().min(0).max(3000).optional().nullable(),
  doi: z.string().trim().max(200).optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
  pages: z.string().trim().max(60).optional().or(z.literal("")),
  personalNote: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function upsertSourceAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = sourceSchema.safeParse(raw);
    if (!parsed.success) return fail("Formada xəta var", parsed.error.flatten().fieldErrors);
    const { id, ...data } = parsed.data;
    const clean = {
      ...data,
      authors: data.authors || null,
      doi: data.doi || null,
      url: data.url || null,
      pages: data.pages || null,
      personalNote: data.personalNote || null,
      termId: data.termId || null,
    };
    const source = id
      ? await db.source.update({ where: { id }, data: clean })
      : await db.source.create({ data: { ...clean, userId: user.id } });
    revalidatePath("/sources");
    return ok({ id: source.id });
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteSourceAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();
    await db.source.updateMany({ where: { id, userId: user.id }, data: { deletedAt: new Date() } });
    revalidatePath("/sources");
    return ok(undefined);
  } catch (e) {
    return fromError(e);
  }
}
