import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { reindexTerm } from "@/lib/rag/indexer";
import { logActivity } from "@/server/services/activity";
import type {
  CreateTermInput,
  UpdateTermInput,
} from "@/lib/validations/term";

export interface TermListFilters {
  q?: string;
  categoryId?: string;
  status?: Prisma.EnumLearningStatusFilter["equals"];
  difficulty?: Prisma.EnumDifficultyFilter["equals"];
  minConfidence?: number;
  maxConfidence?: number;
  minImportance?: number;
  tag?: string;
  dueOnly?: boolean;
  weakOnly?: boolean;
  collectionId?: string;
  subjectId?: string;
  topicId?: string;
  sort?: "recent" | "name" | "importance" | "due";
  page?: number;
  pageSize?: number;
}

const listInclude = {
  category: { select: { id: true, name: true, slug: true, color: true } },
  tags: { select: { id: true, name: true, slug: true } },
  _count: { select: { examples: true, notes: true, relationsFrom: true, relationsTo: true } },
} satisfies Prisma.TermInclude;

export async function listTerms(userId: string, filters: TermListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, filters.pageSize ?? 20);

  const where: Prisma.TermWhereInput = {
    userId,
    deletedAt: null,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.tag ? { tags: { some: { slug: filters.tag } } } : {}),
    ...(filters.collectionId ? { collections: { some: { id: filters.collectionId } } } : {}),
    ...(filters.subjectId ? { subjects: { some: { id: filters.subjectId } } } : {}),
    ...(filters.topicId ? { topicLinks: { some: { topicId: filters.topicId } } } : {}),
    ...(filters.dueOnly ? { nextReviewAt: { lte: new Date() } } : {}),
    ...(filters.weakOnly ? { confidence: { lte: 2 } } : {}),
    ...(filters.minConfidence || filters.maxConfidence
      ? {
          confidence: {
            gte: filters.minConfidence ?? 1,
            lte: filters.maxConfidence ?? 5,
          },
        }
      : {}),
    ...(filters.minImportance ? { importance: { gte: filters.minImportance } } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { shortDef: { contains: filters.q, mode: "insensitive" } },
            { longDef: { contains: filters.q, mode: "insensitive" } },
            { inMyWords: { contains: filters.q, mode: "insensitive" } },
            { aliases: { some: { value: { contains: filters.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.TermOrderByWithRelationInput =
    filters.sort === "name"
      ? { name: "asc" }
      : filters.sort === "importance"
        ? { importance: "desc" }
        : filters.sort === "due"
          ? { nextReviewAt: "asc" }
          : { updatedAt: "desc" };

  const [items, total] = await Promise.all([
    db.term.findMany({
      where,
      include: listInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.term.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getTerm(userId: string, idOrSlug: string) {
  return db.term.findFirst({
    where: {
      userId,
      deletedAt: null,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: true,
      tags: true,
      collections: true,
      subjects: { where: { deletedAt: null }, select: { id: true, name: true, slug: true, color: true } },
      topicLinks: {
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              slug: true,
              subject: { select: { id: true, name: true, slug: true, color: true } },
            },
          },
        },
      },
      aliases: true,
      notes: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
      examples: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      codeExamples: { where: { deletedAt: null } },
      formulas: { where: { deletedAt: null } },
      sources: { where: { deletedAt: null } },
      attachments: { where: { deletedAt: null } },
      progress: true,
      relationsFrom: {
        where: { deletedAt: null },
        include: { to: { select: { id: true, name: true, slug: true, category: { select: { color: true, name: true } } } } },
      },
      relationsTo: {
        where: { deletedAt: null },
        include: { from: { select: { id: true, name: true, slug: true, category: { select: { color: true, name: true } } } } },
      },
    },
  });
}

async function uniqueSlug(userId: string, name: string, exceptId?: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (
    await db.term.findFirst({
      where: { userId, slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

export async function ensureTags(userId: string, names: string[]) {
  const ids: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const slug = slugify(name);
    const tag = await db.tag.upsert({
      where: { userId_slug: { userId, slug } },
      create: { userId, name, slug },
      update: {},
      select: { id: true },
    });
    ids.push(tag.id);
  }
  return ids;
}

export async function createTerm(userId: string, input: CreateTermInput) {
  const slug = await uniqueSlug(userId, input.name);
  const tagIds = await ensureTags(userId, input.tags);

  const term = await db.term.create({
    data: {
      userId,
      name: input.name,
      slug,
      shortDef: emptyToNull(input.shortDef),
      longDef: emptyToNull(input.longDef),
      inMyWords: emptyToNull(input.inMyWords),
      practicalUse: emptyToNull(input.practicalUse),
      categoryId: input.categoryId ?? null,
      subcategory: emptyToNull(input.subcategory),
      difficulty: input.difficulty,
      status: input.status,
      confidence: input.confidence,
      importance: input.importance,
      aliases: { create: input.aliases.map((value) => ({ userId, value })) },
      tags: { connect: tagIds.map((id) => ({ id })) },
      collections: { connect: input.collectionIds.map((id) => ({ id })) },
      progress: { create: { userId, dueAt: new Date() } },
    },
  });

  await reindexTerm(term.id, userId).catch(() => undefined);
  await logActivity({ userId, type: "term.created", entity: "Term", entityId: term.id, meta: { name: term.name } });
  return term;
}

export async function updateTerm(userId: string, input: UpdateTermInput) {
  const existing = await db.term.findFirst({
    where: { id: input.id, userId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const data: Prisma.TermUpdateInput = {};
  if (input.name && input.name !== existing.name) {
    data.name = input.name;
    data.slug = await uniqueSlug(userId, input.name, existing.id);
  }
  for (const key of ["shortDef", "longDef", "inMyWords", "practicalUse", "subcategory"] as const) {
    if (input[key] !== undefined) data[key] = emptyToNull(input[key]);
  }
  if (input.difficulty) data.difficulty = input.difficulty;
  if (input.status) data.status = input.status;
  if (input.confidence !== undefined) data.confidence = input.confidence;
  if (input.importance !== undefined) data.importance = input.importance;
  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }
  if (input.tags) {
    const tagIds = await ensureTags(userId, input.tags);
    data.tags = { set: tagIds.map((id) => ({ id })) };
  }
  if (input.collectionIds) {
    data.collections = { set: input.collectionIds.map((id) => ({ id })) };
  }
  if (input.aliases) {
    await db.termAlias.deleteMany({ where: { termId: existing.id } });
    data.aliases = { create: input.aliases.map((value) => ({ userId, value })) };
  }

  const term = await db.term.update({ where: { id: existing.id }, data });
  await reindexTerm(term.id, userId).catch(() => undefined);
  await logActivity({ userId, type: "term.updated", entity: "Term", entityId: term.id });
  return term;
}

export async function softDeleteTerm(userId: string, id: string) {
  const term = await db.term.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (term.count) {
    await db.embedding.deleteMany({ where: { termId: id, userId } });
    await logActivity({ userId, type: "term.deleted", entity: "Term", entityId: id });
  }
  return term.count > 0;
}

export async function restoreTerm(userId: string, id: string) {
  const r = await db.term.updateMany({
    where: { id, userId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  if (r.count) {
    await reindexTerm(id, userId).catch(() => undefined);
    await logActivity({ userId, type: "term.restored", entity: "Term", entityId: id });
  }
  return r.count > 0;
}

export async function hardDeleteTerm(userId: string, id: string) {
  await db.term.deleteMany({ where: { id, userId } });
}

function emptyToNull(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}
