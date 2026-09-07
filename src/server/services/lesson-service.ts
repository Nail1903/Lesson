import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { reindexTerm } from "@/lib/rag/indexer";
import { logActivity } from "@/server/services/activity";
import type { LessonFieldsInput } from "@/lib/validations/lesson-content";

const PREP_LABEL: Record<string, string> = {
  draft: "Qaralama",
  in_progress: "Hazırlanır",
  ready: "Hazırdır",
  needs_update: "Yenilənməlidir",
};
export { PREP_LABEL };

export async function getLesson(userId: string, id: string) {
  return db.topic.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      subject: { select: { id: true, name: true, slug: true, color: true } },
      terms: {
        orderBy: { position: "asc" },
        include: { term: { select: { id: true, name: true, slug: true, shortDef: true } } },
      },
      materials: { orderBy: { position: "asc" } },
      outcomes: { where: { kind: "lesson" }, orderBy: { position: "asc" } },
      questions: {
        where: { quizId: null },
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, prompt: true, correctAnswer: true, difficulty: true, points: true },
      },
      sourceLinks: {
        include: { source: { select: { id: true, title: true, authors: true, year: true, url: true, kind: true } } },
      },
      _count: { select: { meetingTopics: true } },
    },
  });
}

export async function updateLessonFields(userId: string, input: LessonFieldsInput) {
  const existing = await db.topic.findFirst({
    where: { id: input.id, userId, deletedAt: null },
    select: { id: true, name: true, subjectId: true },
  });
  if (!existing) throw new Error("NOT_FOUND");

  const data: Prisma.TopicUpdateInput = {};
  const strFields = [
    "description",
    "objective",
    "teachingNotes",
    "preClassPrep",
    "prerequisites",
    "misconceptions",
    "expectedQuestions",
    "reflection",
    "nextLessonNote",
    "homework",
    "module",
  ] as const;
  for (const f of strFields) {
    if (input[f] !== undefined) (data as Record<string, unknown>)[f] = (input[f] as string)?.trim() || null;
  }
  if (input.name && input.name !== existing.name) {
    data.name = input.name;
    let slug = slugify(input.name);
    let n = 1;
    while (
      await db.topic.findFirst({
        where: { subjectId: existing.subjectId, slug, NOT: { id: existing.id } },
        select: { id: true },
      })
    ) {
      slug = `${slugify(input.name)}-${++n}`;
    }
    data.slug = slug;
  }
  if (input.lessonType !== undefined) data.lessonType = input.lessonType || null;
  if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes;
  if (input.week !== undefined) data.week = input.week;
  if (input.orderNo !== undefined) data.orderNo = input.orderNo;
  if (input.prepStatus !== undefined) data.prepStatus = input.prepStatus;
  if (input.stages !== undefined) data.stages = input.stages as unknown as Prisma.InputJsonValue;

  const lesson = await db.topic.update({ where: { id: existing.id }, data });
  await logActivity({ userId, type: "lesson.updated", entity: "Topic", entityId: lesson.id });
  return lesson;
}

/* ── Materials ───────────────────────────────────────────────────────────── */

export async function upsertMaterial(
  userId: string,
  input: { id?: string; topicId: string; kind: string; title?: string; body?: string; url?: string },
) {
  const owns = await db.topic.findFirst({ where: { id: input.topicId, userId, deletedAt: null }, select: { id: true } });
  if (!owns) throw new Error("NOT_FOUND");
  const payload = {
    kind: input.kind,
    title: input.title?.trim() || null,
    body: input.body?.trim() || null,
    url: input.url?.trim() || null,
  };
  if (input.id) return db.lessonMaterial.update({ where: { id: input.id }, data: payload });
  const last = await db.lessonMaterial.aggregate({ where: { topicId: input.topicId }, _max: { position: true } });
  return db.lessonMaterial.create({
    data: { ...payload, userId, topicId: input.topicId, position: (last._max.position ?? -1) + 1 },
  });
}

export async function deleteMaterial(userId: string, id: string) {
  await db.lessonMaterial.deleteMany({ where: { id, userId } });
}

/* ── Lesson-level learning outcomes ──────────────────────────────────────── */

export async function upsertLessonOutcome(
  userId: string,
  input: { id?: string; topicId: string; code?: string; text: string; bloomLevel?: string; criteria?: string },
) {
  const topic = await db.topic.findFirst({
    where: { id: input.topicId, userId, deletedAt: null },
    select: { id: true, subjectId: true },
  });
  if (!topic) throw new Error("NOT_FOUND");
  const payload = {
    code: input.code?.trim() || null,
    text: input.text.trim(),
    bloomLevel: input.bloomLevel || null,
    criteria: input.criteria?.trim() || null,
  };
  if (input.id) return db.learningOutcome.update({ where: { id: input.id }, data: payload });
  const last = await db.learningOutcome.aggregate({ where: { topicId: input.topicId, kind: "lesson" }, _max: { position: true } });
  return db.learningOutcome.create({
    data: {
      ...payload,
      userId,
      kind: "lesson",
      topicId: input.topicId,
      subjectId: topic.subjectId,
      position: (last._max.position ?? -1) + 1,
    },
  });
}

export async function deleteLessonOutcome(userId: string, id: string) {
  await db.learningOutcome.deleteMany({ where: { id, userId } });
}

/* ── Source links ───────────────────────────────────────────────────────── */

export async function upsertSourceLink(
  userId: string,
  input: {
    id?: string;
    sourceId: string;
    topicId?: string | null;
    termId?: string | null;
    chapter?: string;
    pages?: string;
    videoTimestamp?: string;
    role?: string;
    isRead?: boolean;
  },
) {
  const src = await db.source.findFirst({ where: { id: input.sourceId, userId, deletedAt: null }, select: { id: true } });
  if (!src) throw new Error("NOT_FOUND");
  const payload = {
    topicId: input.topicId || null,
    termId: input.termId || null,
    chapter: input.chapter?.trim() || null,
    pages: input.pages?.trim() || null,
    videoTimestamp: input.videoTimestamp?.trim() || null,
    role: input.role || null,
    isRead: input.isRead ?? false,
  };
  if (input.id) return db.sourceLink.update({ where: { id: input.id }, data: payload });
  return db.sourceLink.create({ data: { ...payload, userId, sourceId: input.sourceId } });
}

export async function deleteSourceLink(userId: string, id: string) {
  await db.sourceLink.deleteMany({ where: { id, userId } });
}

/* ── Bulk lesson creation (spec §5: "15 boş dərs qaralaması") ─────────────── */

export async function bulkCreateLessons(
  userId: string,
  subjectId: string,
  input: { names?: string[]; count?: number; module?: string },
) {
  const subject = await db.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null }, select: { id: true } });
  if (!subject) throw new Error("NOT_FOUND");

  const last = await db.topic.aggregate({ where: { subjectId }, _max: { position: true } });
  let position = (last._max.position ?? -1) + 1;

  const names =
    input.names && input.names.length
      ? input.names
      : Array.from({ length: Math.min(Math.max(input.count ?? 0, 0), 60) }, (_, i) => `Dərs ${position + i + 1}`);

  const created: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    let slug = slugify(name);
    let n = 1;
    while (await db.topic.findFirst({ where: { subjectId, slug }, select: { id: true } })) {
      slug = `${slugify(name)}-${++n}`;
    }
    const t = await db.topic.create({
      data: {
        userId,
        subjectId,
        name,
        slug,
        position: position++,
        orderNo: position,
        module: input.module?.trim() || null,
        prepStatus: "draft",
      },
      select: { id: true },
    });
    created.push(t.id);
  }
  await logActivity({ userId, type: "lessons.bulk_created", entity: "Subject", entityId: subjectId, meta: { count: created.length } });
  return created;
}

export async function duplicateLesson(userId: string, id: string) {
  const src = await db.topic.findFirst({
    where: { id, userId, deletedAt: null },
    include: { terms: true, materials: true, outcomes: true, sourceLinks: true },
  });
  if (!src) throw new Error("NOT_FOUND");

  const baseName = `${src.name} (nüsxə)`;
  let slug = slugify(baseName);
  let n = 1;
  while (await db.topic.findFirst({ where: { subjectId: src.subjectId, slug }, select: { id: true } })) {
    slug = `${slugify(baseName)}-${++n}`;
  }
  const last = await db.topic.aggregate({ where: { subjectId: src.subjectId }, _max: { position: true } });

  const copy = await db.topic.create({
    data: {
      userId,
      subjectId: src.subjectId,
      name: baseName,
      slug,
      position: (last._max.position ?? -1) + 1,
      description: src.description,
      lessonType: src.lessonType,
      durationMinutes: src.durationMinutes,
      module: src.module,
      week: src.week,
      prepStatus: "draft",
      objective: src.objective,
      teachingNotes: src.teachingNotes,
      preClassPrep: src.preClassPrep,
      prerequisites: src.prerequisites,
      stages: src.stages ?? undefined,
      misconceptions: src.misconceptions,
      expectedQuestions: src.expectedQuestions,
      homework: src.homework,
      terms: {
        create: src.terms.map((t) => ({ userId, termId: t.termId, position: t.position, note: t.note })),
      },
      materials: {
        create: src.materials.map((m) => ({
          userId,
          kind: m.kind,
          title: m.title,
          body: m.body,
          url: m.url,
          position: m.position,
        })),
      },
    },
    select: { id: true },
  });
  return copy.id;
}
