import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

async function uniqueSubjectSlug(userId: string, name: string, exceptId?: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (
    await db.subject.findFirst({
      where: { userId, slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

async function uniqueTopicSlug(subjectId: string, name: string, exceptId?: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (
    await db.topic.findFirst({
      where: { subjectId, slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

export async function listSubjects(userId: string) {
  return db.subject.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { terms: true, topics: true } },
      topics: {
        where: { deletedAt: null },
        orderBy: { position: "asc" },
        select: { id: true, name: true, slug: true, _count: { select: { terms: true } } },
      },
    },
  });
}

export async function getSubject(userId: string, idOrSlug: string) {
  return db.subject.findFirst({
    where: { userId, deletedAt: null, OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      topics: {
        where: { deletedAt: null },
        orderBy: { position: "asc" },
        include: {
          terms: {
            orderBy: { position: "asc" },
            include: {
              term: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  shortDef: true,
                  status: true,
                  confidence: true,
                  category: { select: { name: true, color: true } },
                },
              },
            },
          },
        },
      },
      terms: {
        where: { deletedAt: null },
        select: { id: true, name: true, slug: true, status: true },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function createSubject(
  userId: string,
  input: { name: string; description?: string; color?: string; position?: number },
) {
  return db.subject.create({
    data: {
      userId,
      name: input.name,
      slug: await uniqueSubjectSlug(userId, input.name),
      description: input.description?.trim() || null,
      color: input.color || null,
      position: input.position ?? 0,
    },
  });
}

export async function updateSubject(
  userId: string,
  id: string,
  input: { name?: string; description?: string; color?: string; position?: number },
) {
  const existing = await db.subject.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw new Error("NOT_FOUND");
  return db.subject.update({
    where: { id },
    data: {
      ...(input.name && input.name !== existing.name
        ? { name: input.name, slug: await uniqueSubjectSlug(userId, input.name, id) }
        : {}),
      ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
      ...(input.color !== undefined ? { color: input.color || null } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    },
  });
}

export async function deleteSubject(userId: string, id: string) {
  const r = await db.subject.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count > 0;
}

export async function createTopic(
  userId: string,
  input: { subjectId: string; name: string; description?: string; parentId?: string | null; position?: number },
) {
  const subject = await db.subject.findFirst({
    where: { id: input.subjectId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!subject) throw new Error("NOT_FOUND");
  const last = await db.topic.aggregate({
    where: { subjectId: input.subjectId, parentId: input.parentId ?? null },
    _max: { position: true },
  });
  return db.topic.create({
    data: {
      userId,
      subjectId: input.subjectId,
      parentId: input.parentId ?? null,
      name: input.name,
      slug: await uniqueTopicSlug(input.subjectId, input.name),
      description: input.description?.trim() || null,
      position: input.position ?? (last._max.position ?? -1) + 1,
    },
  });
}

export async function updateTopic(
  userId: string,
  id: string,
  input: { name?: string; description?: string; position?: number; parentId?: string | null },
) {
  const existing = await db.topic.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw new Error("NOT_FOUND");
  return db.topic.update({
    where: { id },
    data: {
      ...(input.name && input.name !== existing.name
        ? { name: input.name, slug: await uniqueTopicSlug(existing.subjectId, input.name, id) }
        : {}),
      ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
    },
  });
}

export async function deleteTopic(userId: string, id: string) {
  const r = await db.topic.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count > 0;
}
