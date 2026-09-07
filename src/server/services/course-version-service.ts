import { db } from "@/lib/db";
import { logActivity } from "@/server/services/activity";

/** Default Azerbaijani syllabus section set (spec §4). */
export const DEFAULT_SECTIONS: { key: string; title: string; required: boolean }[] = [
  { key: "description", title: "Fənnin təsviri", required: true },
  { key: "topics", title: "Mövzular və saat bölgüsü", required: true },
  { key: "methods", title: "Tədris metodları", required: false },
  { key: "self_study", title: "Müstəqil iş", required: false },
  { key: "assessment_rules", title: "Qiymətləndirmə meyarları və qaydaları", required: true },
  { key: "policies", title: "Davamiyyət, gecikmiş tapşırıq və akademik dürüstlük", required: true },
  { key: "ai_policy", title: "AI istifadəsi qaydaları", required: false },
  { key: "literature_main", title: "Əsas ədəbiyyat", required: true },
  { key: "literature_extra", title: "Əlavə ədəbiyyat", required: false },
  { key: "software", title: "Proqram təminatı və avadanlıq tələbləri", required: false },
];

const versionInclude = {
  sections: { orderBy: { position: "asc" as const } },
  assessments: { orderBy: { position: "asc" as const } },
  outcomes: { where: { kind: "course" as const }, orderBy: { position: "asc" as const } },
  _count: { select: { offerings: true } },
} as const;

export async function listVersions(userId: string, subjectId: string) {
  return db.courseVersion.findMany({
    where: { userId, subjectId, deletedAt: null },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { sections: true, offerings: true } } },
  });
}

export async function getVersion(userId: string, id: string) {
  return db.courseVersion.findFirst({
    where: { id, userId, deletedAt: null },
    include: { ...versionInclude, subject: { select: { id: true, name: true, slug: true } } },
  });
}

export async function createVersion(
  userId: string,
  input: { subjectId: string; label: string; kind: "program" | "syllabus"; fromVersionId?: string },
) {
  const subject = await db.subject.findFirst({ where: { id: input.subjectId, userId, deletedAt: null }, select: { id: true } });
  if (!subject) throw new Error("NOT_FOUND");

  const version = await db.courseVersion.create({
    data: { userId, subjectId: input.subjectId, label: input.label, kind: input.kind, status: "draft" },
  });

  if (input.fromVersionId) {
    // clone sections + assessments + course outcomes from an existing version
    const src = await db.courseVersion.findFirst({
      where: { id: input.fromVersionId, userId, deletedAt: null },
      include: versionInclude,
    });
    if (src) {
      await db.$transaction([
        db.syllabusSection.createMany({
          data: src.sections.map((s) => ({
            userId,
            courseVersionId: version.id,
            key: s.key,
            title: s.title,
            body: s.body,
            position: s.position,
            hidden: s.hidden,
            required: s.required,
          })),
        }),
        db.assessmentComponent.createMany({
          data: src.assessments.map((a) => ({
            userId,
            courseVersionId: version.id,
            name: a.name,
            weight: a.weight,
            criteria: a.criteria,
            dueInfo: a.dueInfo,
            position: a.position,
          })),
        }),
        db.learningOutcome.createMany({
          data: src.outcomes.map((o) => ({
            userId,
            kind: "course",
            subjectId: input.subjectId,
            courseVersionId: version.id,
            code: o.code,
            text: o.text,
            bloomLevel: o.bloomLevel,
            position: o.position,
          })),
        }),
        db.courseVersion.update({
          where: { id: version.id },
          data: { description: src.description, objective: src.objective },
        }),
      ]);
    }
  } else {
    // seed the default section skeleton
    await db.syllabusSection.createMany({
      data: DEFAULT_SECTIONS.map((s, i) => ({
        userId,
        courseVersionId: version.id,
        key: s.key,
        title: s.title,
        body: "",
        position: i,
        required: s.required,
      })),
    });
  }

  await logActivity({ userId, type: "course_version.created", entity: "CourseVersion", entityId: version.id });
  return version;
}

export async function updateVersionMeta(
  userId: string,
  id: string,
  data: { label?: string; description?: string; objective?: string },
) {
  const v = await db.courseVersion.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true, status: true } });
  if (!v) throw new Error("NOT_FOUND");
  if (v.status === "published") throw new Error("Dərc edilmiş versiya redaktə edilə bilməz — yeni qaralama yaradın.");
  return db.courseVersion.update({
    where: { id },
    data: {
      ...(data.label ? { label: data.label } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
      ...(data.objective !== undefined ? { objective: data.objective.trim() || null } : {}),
    },
  });
}

async function assertEditable(userId: string, courseVersionId: string) {
  const v = await db.courseVersion.findFirst({
    where: { id: courseVersionId, userId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!v) throw new Error("NOT_FOUND");
  if (v.status === "published") throw new Error("Dərc edilmiş versiya redaktə edilə bilməz.");
  return v;
}

/* ── Sections ────────────────────────────────────────────────────────────── */

export async function upsertSection(
  userId: string,
  input: { id?: string; courseVersionId: string; key?: string; title: string; body?: string; hidden?: boolean; required?: boolean },
) {
  await assertEditable(userId, input.courseVersionId);
  const data = {
    key: input.key?.trim() || null,
    title: input.title.trim(),
    body: (input.body ?? "").trim(),
    ...(input.hidden !== undefined ? { hidden: input.hidden } : {}),
    ...(input.required !== undefined ? { required: input.required } : {}),
  };
  if (input.id) return db.syllabusSection.update({ where: { id: input.id }, data });
  const last = await db.syllabusSection.aggregate({ where: { courseVersionId: input.courseVersionId }, _max: { position: true } });
  return db.syllabusSection.create({
    data: { ...data, userId, courseVersionId: input.courseVersionId, position: (last._max.position ?? -1) + 1 },
  });
}

export async function deleteSection(userId: string, id: string) {
  const s = await db.syllabusSection.findFirst({ where: { id, userId }, select: { courseVersionId: true } });
  if (!s) return;
  await assertEditable(userId, s.courseVersionId);
  await db.syllabusSection.delete({ where: { id } });
}

export async function reorderSections(userId: string, courseVersionId: string, orderedIds: string[]) {
  await assertEditable(userId, courseVersionId);
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.syllabusSection.updateMany({ where: { id, userId, courseVersionId }, data: { position: i } }),
    ),
  );
}

/* ── Assessment components ───────────────────────────────────────────────── */

export async function upsertAssessment(
  userId: string,
  input: { id?: string; courseVersionId: string; name: string; weight: number; criteria?: string; dueInfo?: string },
) {
  await assertEditable(userId, input.courseVersionId);
  const data = {
    name: input.name.trim(),
    weight: input.weight,
    criteria: input.criteria?.trim() || null,
    dueInfo: input.dueInfo?.trim() || null,
  };
  if (input.id) return db.assessmentComponent.update({ where: { id: input.id }, data });
  const last = await db.assessmentComponent.aggregate({ where: { courseVersionId: input.courseVersionId }, _max: { position: true } });
  return db.assessmentComponent.create({
    data: { ...data, userId, courseVersionId: input.courseVersionId, position: (last._max.position ?? -1) + 1 },
  });
}

export async function deleteAssessment(userId: string, id: string) {
  const a = await db.assessmentComponent.findFirst({ where: { id, userId }, select: { courseVersionId: true } });
  if (!a) return;
  await assertEditable(userId, a.courseVersionId);
  await db.assessmentComponent.delete({ where: { id } });
}

/* ── Course-level learning outcomes ──────────────────────────────────────── */

export async function upsertCourseOutcome(
  userId: string,
  input: { id?: string; courseVersionId: string; subjectId: string; code?: string; text: string; bloomLevel?: string },
) {
  await assertEditable(userId, input.courseVersionId);
  const data = {
    code: input.code?.trim() || null,
    text: input.text.trim(),
    bloomLevel: input.bloomLevel || null,
  };
  if (input.id) return db.learningOutcome.update({ where: { id: input.id }, data });
  const last = await db.learningOutcome.aggregate({
    where: { courseVersionId: input.courseVersionId, kind: "course" },
    _max: { position: true },
  });
  return db.learningOutcome.create({
    data: {
      ...data,
      userId,
      kind: "course",
      subjectId: input.subjectId,
      courseVersionId: input.courseVersionId,
      position: (last._max.position ?? -1) + 1,
    },
  });
}

export async function deleteCourseOutcome(userId: string, id: string) {
  const o = await db.learningOutcome.findFirst({ where: { id, userId }, select: { courseVersionId: true } });
  if (!o?.courseVersionId) return;
  await assertEditable(userId, o.courseVersionId);
  await db.learningOutcome.delete({ where: { id } });
}

/* ── Validation (spec §4: auto-check hours + weights + required sections) ── */

export interface VersionWarning {
  level: "error" | "warn";
  message: string;
}

export async function validateVersion(userId: string, id: string): Promise<VersionWarning[]> {
  const v = await getVersion(userId, id);
  if (!v) return [];
  const w: VersionWarning[] = [];

  for (const s of v.sections) {
    if (s.required && !s.hidden && !s.body.trim()) {
      w.push({ level: "warn", message: `«${s.title}» tələb olunan bölməsi boşdur.` });
    }
  }

  if (v.outcomes.length === 0) {
    w.push({ level: "warn", message: "Fənn səviyyəsində öyrənmə nəticəsi əlavə edilməyib." });
  }

  const weightSum = v.assessments.reduce((n, a) => n + a.weight, 0);
  if (v.assessments.length > 0 && Math.round(weightSum) !== 100) {
    w.push({
      level: "error",
      message: `Qiymətləndirmə çəkiləri cəmi ${weightSum}% — 100% olmalıdır.`,
    });
  }
  if (v.assessments.length === 0) {
    w.push({ level: "warn", message: "Qiymətləndirmə komponentləri əlavə edilməyib." });
  }

  // lesson coverage: outcomes not referenced by any lesson outcome text (soft check via count of lesson-level outcomes)
  const lessonOutcomes = await db.learningOutcome.count({
    where: { userId, subjectId: v.subject.id, kind: "lesson" },
  });
  if (v.outcomes.length > 0 && lessonOutcomes === 0) {
    w.push({
      level: "warn",
      message: `${v.outcomes.length} fənn nəticəsi var, amma heç bir dərs nəticəsi ilə əlaqələndirilməyib.`,
    });
  }

  return w;
}

export async function publishVersion(userId: string, id: string) {
  const v = await getVersion(userId, id);
  if (!v) throw new Error("NOT_FOUND");
  if (v.status === "published") return v;

  const errors = (await validateVersion(userId, id)).filter((x) => x.level === "error");
  if (errors.length) {
    throw new Error(`Dərc üçün düzəldilməli xətalar var: ${errors.map((e) => e.message).join(" ")}`);
  }

  const snapshot = {
    frozenAt: new Date().toISOString(),
    label: v.label,
    kind: v.kind,
    description: v.description,
    objective: v.objective,
    outcomes: v.outcomes.map((o) => ({ code: o.code, text: o.text, bloomLevel: o.bloomLevel })),
    sections: v.sections
      .filter((s) => !s.hidden)
      .map((s) => ({ title: s.title, body: s.body })),
    assessments: v.assessments.map((a) => ({ name: a.name, weight: a.weight, criteria: a.criteria, dueInfo: a.dueInfo })),
  };

  const updated = await db.courseVersion.update({
    where: { id },
    data: { status: "published", publishedAt: new Date(), snapshot: snapshot as object },
  });
  await logActivity({ userId, type: "course_version.published", entity: "CourseVersion", entityId: id });
  return updated;
}

export async function deleteVersion(userId: string, id: string) {
  const inUse = await db.semesterOffering.count({ where: { courseVersionId: id, userId, deletedAt: null } });
  if (inUse > 0) throw new Error("Bu versiya tədris planına bağlıdır — əvvəlcə onu ayırın.");
  await db.courseVersion.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
}
