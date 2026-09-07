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

type SubjectMeta = {
  name?: string;
  description?: string;
  color?: string;
  position?: number;
  code?: string;
  faculty?: string;
  department?: string;
  specialty?: string;
  level?: string;
  courseYear?: number | null;
  objective?: string;
  prerequisites?: string;
  relatedCourses?: string;
  contentLanguage?: string;
};

const META_STR_KEYS = [
  "code",
  "faculty",
  "department",
  "specialty",
  "objective",
  "prerequisites",
  "relatedCourses",
] as const;

function metaData(input: SubjectMeta) {
  const data: Record<string, unknown> = {};
  for (const k of META_STR_KEYS) {
    if (input[k] !== undefined) data[k] = (input[k] as string)?.trim() || null;
  }
  if (input.level !== undefined) data.level = input.level || null;
  if (input.courseYear !== undefined) data.courseYear = input.courseYear ?? null;
  if (input.contentLanguage !== undefined) data.contentLanguage = input.contentLanguage || "az";
  return data;
}

export async function createSubject(userId: string, input: SubjectMeta & { name: string }) {
  return db.subject.create({
    data: {
      userId,
      name: input.name,
      slug: await uniqueSubjectSlug(userId, input.name),
      description: input.description?.trim() || null,
      color: input.color || null,
      position: input.position ?? 0,
      ...metaData(input),
    },
  });
}

export async function updateSubject(userId: string, id: string, input: SubjectMeta) {
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
      ...metaData(input),
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

export interface SubjectOverviewGap {
  level: "warn" | "info";
  message: string;
  href?: string;
}

/** "Ümumi baxış" — content gaps & unfinished preparation (spec §3). */
export async function getSubjectOverview(userId: string, subjectId: string, subjectSlug: string) {
  const [
    lessonsDraft,
    lessonsNeedUpdate,
    lessonsNoOutcome,
    lessonsTotal,
    publishedVersions,
    draftVersions,
    courseOutcomes,
    outcomesNoQuestion,
    termsNoLesson,
    activeOfferings,
  ] = await Promise.all([
    db.topic.count({ where: { userId, subjectId, deletedAt: null, prepStatus: "draft" } }),
    db.topic.count({ where: { userId, subjectId, deletedAt: null, prepStatus: "needs_update" } }),
    db.topic.count({ where: { userId, subjectId, deletedAt: null, outcomes: { none: { kind: "lesson" } } } }),
    db.topic.count({ where: { userId, subjectId, deletedAt: null } }),
    db.courseVersion.count({ where: { userId, subjectId, deletedAt: null, status: "published" } }),
    db.courseVersion.count({ where: { userId, subjectId, deletedAt: null, status: "draft" } }),
    db.learningOutcome.count({ where: { userId, subjectId, kind: "course" } }),
    db.learningOutcome.count({
      where: { userId, subjectId, kind: "course", questions: { none: {} } },
    }),
    db.term.count({
      where: { userId, deletedAt: null, subjects: { some: { id: subjectId } }, topicLinks: { none: {} } },
    }),
    db.semesterOffering.count({ where: { userId, subjectId, deletedAt: null, status: "active" } }),
  ]);

  const gaps: SubjectOverviewGap[] = [];
  if (lessonsDraft > 0)
    gaps.push({ level: "warn", message: `${lessonsDraft} dərs hələ qaralama statusundadır.` });
  if (lessonsNeedUpdate > 0)
    gaps.push({ level: "warn", message: `${lessonsNeedUpdate} dərs "yenilənməlidir" işarələnib.` });
  if (lessonsTotal > 0 && lessonsNoOutcome > 0)
    gaps.push({ level: "warn", message: `${lessonsNoOutcome} dərsdə öyrənmə nəticəsi yoxdur.` });
  if (outcomesNoQuestion > 0)
    gaps.push({
      level: "warn",
      message: `Qiymətləndirmə (sual) ilə əlaqələndirilməmiş ${outcomesNoQuestion} öyrənmə nəticəsi var.`,
      href: `/subjects/${subjectSlug}/program`,
    });
  if (courseOutcomes === 0)
    gaps.push({
      level: "info",
      message: "Fənn səviyyəsində öyrənmə nəticəsi əlavə edilməyib.",
      href: `/subjects/${subjectSlug}/program`,
    });
  if (publishedVersions === 0)
    gaps.push({
      level: "info",
      message: draftVersions > 0 ? "Proqram/sillabus qaralamadır, dərc edilməyib." : "Fənn proqramı hələ yaradılmayıb.",
      href: `/subjects/${subjectSlug}/program`,
    });
  if (termsNoLesson > 0)
    gaps.push({ level: "info", message: `${termsNoLesson} termin heç bir dərsə bağlı deyil.` });
  if (activeOfferings === 0)
    gaps.push({ level: "info", message: "Aktiv tədris planı yoxdur.", href: "/teaching" });

  return {
    gaps,
    stats: { lessonsTotal, lessonsDraft, publishedVersions, courseOutcomes, activeOfferings },
  };
}
