import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { WeeklyClassInput } from "@/lib/validations/planner";

/** Everything the weekly planner page needs, in one round trip. */
export async function getPlannerData(userId: string) {
  const [universities, subjects, classes] = await Promise.all([
    db.university.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortName: true, logoEmoji: true },
    }),
    db.subject.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ universityId: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, universityId: true, color: true },
    }),
    db.weeklyClass.findMany({
      where: { userId },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
      include: {
        subject: { select: { id: true, name: true, slug: true, color: true } },
        university: { select: { id: true, name: true, shortName: true, logoEmoji: true } },
      },
    }),
  ]);
  return { universities, subjects, classes };
}

/* ── Universities (planner) ─────────────────────────────────────────────── */

export async function upsertPlannerUniversity(
  userId: string,
  input: { id?: string; name: string; shortName?: string; logoEmoji?: string },
) {
  const data = {
    name: input.name,
    shortName: input.shortName?.trim() || null,
    logoEmoji: input.logoEmoji?.trim() || null,
  };
  if (input.id) {
    const owned = await db.university.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!owned) throw new Error("NOT_FOUND");
    return db.university.update({ where: { id: input.id }, data });
  }
  // reuse a soft-deleted row with the same name (unique on userId+name)
  const existing = await db.university.findFirst({ where: { userId, name: input.name }, select: { id: true } });
  if (existing) return db.university.update({ where: { id: existing.id }, data: { ...data, deletedAt: null } });
  return db.university.create({ data: { ...data, userId } });
}

export async function deletePlannerUniversity(userId: string, id: string) {
  await db.university.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
  // detach its subjects & classes (keep them, just un-university them)
  await db.subject.updateMany({ where: { universityId: id, userId }, data: { universityId: null } });
  await db.weeklyClass.updateMany({ where: { universityId: id, userId }, data: { universityId: null } });
}

/* ── Subjects (planner: free-text name under a university) ───────────────── */

async function uniqueSubjectSlug(userId: string, name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await db.subject.findFirst({ where: { userId, slug }, select: { id: true } })) slug = `${base}-${++n}`;
  return slug;
}

export async function upsertPlannerSubject(
  userId: string,
  input: { id?: string; name: string; universityId?: string | null },
) {
  if (input.id) {
    const owned = await db.subject.findFirst({ where: { id: input.id, userId, deletedAt: null }, select: { id: true, name: true } });
    if (!owned) throw new Error("NOT_FOUND");
    return db.subject.update({
      where: { id: input.id },
      data: {
        name: input.name,
        ...(input.name !== owned.name ? { slug: await uniqueSubjectSlug(userId, input.name) } : {}),
        ...(input.universityId !== undefined ? { universityId: input.universityId } : {}),
      },
    });
  }
  return db.subject.create({
    data: {
      userId,
      name: input.name,
      slug: await uniqueSubjectSlug(userId, input.name),
      universityId: input.universityId || null,
    },
  });
}

export async function deletePlannerSubject(userId: string, id: string) {
  // soft-delete the subject; its weekly classes go with it (cascade)
  await db.subject.updateMany({ where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() } });
}

/* ── Weekly classes ────────────────────────────────────────────────────── */

export async function upsertWeeklyClass(userId: string, input: WeeklyClassInput) {
  let subjectId = input.subjectId;

  if (!subjectId && input.newSubjectName) {
    const created = await upsertPlannerSubject(userId, {
      name: input.newSubjectName,
      universityId: input.universityId ?? null,
    });
    subjectId = created.id;
  }
  if (!subjectId) throw new Error("Fənn seçin və ya yeni ad daxil edin.");

  const owned = await db.subject.findFirst({
    where: { id: subjectId, userId, deletedAt: null },
    select: { id: true, universityId: true },
  });
  if (!owned) throw new Error("NOT_FOUND");

  // If the chosen subject has no university yet and this class is scheduled at
  // one, adopt that university so the management panel stays consistent.
  if (!owned.universityId && input.universityId) {
    await db.subject.update({ where: { id: subjectId }, data: { universityId: input.universityId } });
  }

  const data = {
    subjectId,
    universityId: input.universityId || null,
    weekday: input.weekday,
    startTime: input.startTime,
    endTime: input.endTime,
    groupLabel: input.groupLabel?.trim() || null,
    room: input.room?.trim() || null,
    color: input.color || null,
  };

  if (input.id) {
    const c = await db.weeklyClass.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!c) throw new Error("NOT_FOUND");
    return db.weeklyClass.update({ where: { id: input.id }, data });
  }
  return db.weeklyClass.create({ data: { ...data, userId } });
}

export async function deleteWeeklyClass(userId: string, id: string) {
  await db.weeklyClass.deleteMany({ where: { id, userId } });
}
