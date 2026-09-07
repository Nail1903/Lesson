import { db } from "@/lib/db";
import type {
  UniversityInput,
  OfferingInput,
} from "@/lib/validations/teaching";
import { logActivity } from "@/server/services/activity";

/* ── Reference lists: universities, faculties, groups ─────────────────────── */

export async function listReferenceData(userId: string) {
  const [universities, groups] = await Promise.all([
    db.university.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: "asc" },
      include: { faculties: { where: { deletedAt: null }, orderBy: { name: "asc" } } },
    }),
    db.studentGroup.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: "asc" },
      include: { university: { select: { name: true } } },
    }),
  ]);
  return { universities, groups };
}

export async function upsertUniversity(userId: string, input: UniversityInput) {
  const data = {
    name: input.name,
    shortName: input.shortName || null,
    city: input.city || null,
    academicHourMinutes: input.academicHourMinutes,
  };
  if (input.id) {
    const owned = await db.university.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!owned) throw new Error("NOT_FOUND");
    return db.university.update({ where: { id: input.id }, data });
  }
  // `@@unique([userId, name])` survives a soft delete — if a row with this name
  // already exists (active or in the trash), reuse/restore it instead of failing.
  const existing = await db.university.findFirst({
    where: { userId, name: input.name },
    select: { id: true },
  });
  if (existing) {
    return db.university.update({ where: { id: existing.id }, data: { ...data, deletedAt: null } });
  }
  return db.university.create({ data: { ...data, userId } });
}

export async function deleteUniversity(userId: string, id: string) {
  const inUse = await db.semesterOffering.count({ where: { universityId: id, userId, deletedAt: null } });
  if (inUse > 0) throw new Error("Bu universitet tədris planlarında istifadə olunur — əvvəlcə onları silin.");
  await db.university.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
}

export async function upsertFaculty(
  userId: string,
  input: { id?: string; universityId: string; name: string; department?: string },
) {
  const uni = await db.university.findFirst({ where: { id: input.universityId, userId }, select: { id: true } });
  if (!uni) throw new Error("NOT_FOUND");
  const data = { name: input.name, department: input.department?.trim() || null };
  if (input.id) return db.faculty.update({ where: { id: input.id }, data });
  return db.faculty.create({ data: { ...data, userId, universityId: input.universityId } });
}

export async function deleteFaculty(userId: string, id: string) {
  await db.faculty.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
}

export async function upsertGroup(
  userId: string,
  input: {
    id?: string;
    name: string;
    universityId?: string | null;
    studentCount?: number | null;
    specialty?: string;
    contactInfo?: string;
  },
) {
  const data = {
    name: input.name,
    universityId: input.universityId || null,
    studentCount: input.studentCount ?? null,
    specialty: input.specialty?.trim() || null,
    contactInfo: input.contactInfo?.trim() || null,
  };
  if (input.id) {
    const owned = await db.studentGroup.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!owned) throw new Error("NOT_FOUND");
    return db.studentGroup.update({ where: { id: input.id }, data });
  }
  return db.studentGroup.create({ data: { ...data, userId } });
}

export async function deleteGroup(userId: string, id: string) {
  await db.studentGroup.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
  await db.offeringGroup.deleteMany({ where: { groupId: id, userId } });
}

/* ── Semester offerings ──────────────────────────────────────────────────── */

const offeringInclude = {
  subject: { select: { id: true, name: true, slug: true } },
  university: { select: { id: true, name: true, shortName: true } },
  faculty: { select: { id: true, name: true } },
  groupLinks: {
    include: { group: { select: { id: true, name: true, studentCount: true } } },
  },
  _count: { select: { meetings: true } },
} as const;

export async function listOfferings(userId: string, subjectId?: string) {
  return db.semesterOffering.findMany({
    where: { userId, deletedAt: null, ...(subjectId ? { subjectId } : {}) },
    orderBy: [{ academicYear: "desc" }, { term: "asc" }],
    include: offeringInclude,
  });
}

export async function getOffering(userId: string, id: string) {
  return db.semesterOffering.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      ...offeringInclude,
      courseVersion: { select: { id: true, label: true, kind: true, status: true } },
      progress: { include: { lastLesson: { select: { id: true, name: true } } } },
      meetings: {
        orderBy: [{ date: "asc" }],
        include: {
          group: { select: { id: true, name: true } },
          topics: { include: { topic: { select: { id: true, name: true } } } },
        },
      },
    },
  });
}

export async function upsertOffering(userId: string, input: OfferingInput) {
  const [subject, uni] = await Promise.all([
    db.subject.findFirst({ where: { id: input.subjectId, userId, deletedAt: null }, select: { id: true } }),
    db.university.findFirst({ where: { id: input.universityId, userId, deletedAt: null }, select: { id: true } }),
  ]);
  if (!subject || !uni) throw new Error("NOT_FOUND");

  const data = {
    subjectId: input.subjectId,
    universityId: input.universityId,
    facultyId: input.facultyId || null,
    academicYear: input.academicYear,
    term: input.term,
    language: input.language,
    format: input.format || null,
    teacherName: input.teacherName || null,
    contactInfo: input.contactInfo || null,
    consultationHours: input.consultationHours || null,
    creditHours: input.creditHours ?? null,
    lectureHours: input.lectureHours ?? null,
    seminarHours: input.seminarHours ?? null,
    labHours: input.labHours ?? null,
    practiceHours: input.practiceHours ?? null,
    selfStudyHours: input.selfStudyHours ?? null,
    status: input.status,
  };

  let offeringId: string;
  if (input.id) {
    const owned = await db.semesterOffering.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!owned) throw new Error("NOT_FOUND");
    await db.semesterOffering.update({ where: { id: input.id }, data });
    offeringId = input.id;
  } else {
    const created = await db.semesterOffering.create({ data: { ...data, userId } });
    offeringId = created.id;
  }

  // sync groups (only groups the user owns)
  const ownedGroups = await db.studentGroup.findMany({
    where: { id: { in: input.groupIds }, userId, deletedAt: null },
    select: { id: true },
  });
  const keep = new Set(ownedGroups.map((g) => g.id));
  const existing = await db.offeringGroup.findMany({ where: { offeringId }, select: { id: true, groupId: true } });
  const existingIds = new Set(existing.map((e) => e.groupId));

  const toAdd = [...keep].filter((id) => !existingIds.has(id));
  const toRemove = existing.filter((e) => !keep.has(e.groupId)).map((e) => e.id);

  if (toAdd.length) {
    await db.offeringGroup.createMany({ data: toAdd.map((groupId) => ({ userId, offeringId, groupId })) });
    // seed an empty progress row per new group
    for (const groupId of toAdd) {
      await db.groupProgress.upsert({
        where: { offeringId_groupId: { offeringId, groupId } },
        create: { userId, offeringId, groupId },
        update: {},
      });
    }
  }
  if (toRemove.length) {
    await db.offeringGroup.deleteMany({ where: { id: { in: toRemove } } });
  }

  await logActivity({ userId, type: input.id ? "offering.updated" : "offering.created", entity: "SemesterOffering", entityId: offeringId });
  return { id: offeringId };
}

export async function deleteOffering(userId: string, id: string) {
  await db.semesterOffering.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
}

/* ── Per-group progress ("Harada qaldım?") ───────────────────────────────── */

export async function saveGroupProgress(
  userId: string,
  input: { offeringId: string; groupId: string; lastLessonId?: string | null; note?: string; nextStep?: string },
) {
  const link = await db.offeringGroup.findFirst({
    where: { offeringId: input.offeringId, groupId: input.groupId, userId },
    select: { id: true },
  });
  if (!link) throw new Error("NOT_FOUND");

  return db.groupProgress.upsert({
    where: { offeringId_groupId: { offeringId: input.offeringId, groupId: input.groupId } },
    create: {
      userId,
      offeringId: input.offeringId,
      groupId: input.groupId,
      lastLessonId: input.lastLessonId || null,
      note: input.note?.trim() || null,
      nextStep: input.nextStep?.trim() || null,
    },
    update: {
      lastLessonId: input.lastLessonId || null,
      note: input.note?.trim() || null,
      nextStep: input.nextStep?.trim() || null,
    },
  });
}

/* ── Semestrə köçürmə (spec §12) ─────────────────────────────────────────── */

/**
 * Clone an offering into a new semester. Content (subject, course version) is
 * referenced, not copied — but delivery state (meetings, group progress) is
 * NOT carried over: the new semester starts clean.
 */
export async function cloneOfferingToSemester(
  userId: string,
  offeringId: string,
  input: { academicYear: string; term: string; groupIds: string[]; keepCourseVersion: boolean },
) {
  const src = await db.semesterOffering.findFirst({
    where: { id: offeringId, userId, deletedAt: null },
  });
  if (!src) throw new Error("NOT_FOUND");

  const ownedGroups = await db.studentGroup.findMany({
    where: { id: { in: input.groupIds }, userId, deletedAt: null },
    select: { id: true },
  });

  const clone = await db.semesterOffering.create({
    data: {
      userId,
      subjectId: src.subjectId,
      universityId: src.universityId,
      facultyId: src.facultyId,
      courseVersionId: input.keepCourseVersion ? src.courseVersionId : null,
      academicYear: input.academicYear,
      term: input.term,
      language: src.language,
      format: src.format,
      teacherName: src.teacherName,
      contactInfo: src.contactInfo,
      consultationHours: src.consultationHours,
      creditHours: src.creditHours,
      lectureHours: src.lectureHours,
      seminarHours: src.seminarHours,
      labHours: src.labHours,
      practiceHours: src.practiceHours,
      selfStudyHours: src.selfStudyHours,
      status: "draft",
    },
  });

  for (const g of ownedGroups) {
    await db.offeringGroup.create({ data: { userId, offeringId: clone.id, groupId: g.id } });
    await db.groupProgress.create({ data: { userId, offeringId: clone.id, groupId: g.id } });
  }

  await logActivity({
    userId,
    type: "offering.cloned",
    entity: "SemesterOffering",
    entityId: clone.id,
    meta: { from: offeringId, term: `${input.academicYear} ${input.term}` },
  });
  return { id: clone.id };
}
