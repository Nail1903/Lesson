import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { createTerm } from "@/server/services/term-service";
import { createSubject, createTopic } from "@/server/services/subject-service";
import { logActivity } from "@/server/services/activity";
import type { LessonPack } from "@/lib/validations/lesson";

function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

export interface LessonImportResult {
  subject: string | null;
  topic: string | null;
  termsCreated: number;
  termsLinked: number;
  termsSkipped: number;
  questionsCreated: number;
  flashcardsCreated: number;
}

/**
 * Import a "lesson pack": optionally a subject + topic, a set of terms linked to
 * that topic, plus question-bank items and flashcards. Everything is scoped to
 * the user; existing terms (matched by name) are reused, never duplicated.
 */
export async function importLesson(userId: string, pack: LessonPack): Promise<LessonImportResult> {
  const res: LessonImportResult = {
    subject: pack.subject ?? null,
    topic: pack.topic ?? null,
    termsCreated: 0,
    termsLinked: 0,
    termsSkipped: 0,
    questionsCreated: 0,
    flashcardsCreated: 0,
  };

  // 1. Subject + Topic
  let subjectId: string | null = null;
  let topicId: string | null = null;

  if (pack.subject) {
    const slug = slugify(pack.subject);
    const existing = await db.subject.findFirst({
      where: { userId, slug, deletedAt: null },
      select: { id: true },
    });
    subjectId = existing?.id ?? (await createSubject(userId, { name: pack.subject, color: pack.subjectColor })).id;

    if (pack.topic) {
      const tSlug = slugify(pack.topic);
      const existingTopic = await db.topic.findFirst({
        where: { userId, subjectId, slug: tSlug, deletedAt: null },
        select: { id: true },
      });
      topicId =
        existingTopic?.id ??
        (await createTopic(userId, { subjectId, name: pack.topic, description: pack.topicDescription })).id;
    }
  }

  // 2. Terms
  const nameToId = new Map<string, string>();
  let position = 0;

  for (const row of pack.terms) {
    const name = row.name.trim();
    const existing = await db.term.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" }, deletedAt: null },
      select: { id: true },
    });

    let termId: string;
    if (existing) {
      termId = existing.id;
      res.termsSkipped++;
    } else {
      let categoryId: string | null = null;
      if (row.category) {
        const cSlug = slugify(row.category);
        const cat = await db.category.upsert({
          where: { userId_slug: { userId, slug: cSlug } },
          create: { userId, name: row.category, slug: cSlug },
          update: {},
          select: { id: true },
        });
        categoryId = cat.id;
      }
      const term = await createTerm(userId, {
        name,
        shortDef: row.shortDef ?? "",
        longDef: row.longDef ?? "",
        inMyWords: row.inMyWords ?? "",
        practicalUse: row.practicalUse ?? "",
        categoryId,
        subcategory: "",
        difficulty: row.difficulty ?? "BEGINNER",
        status: row.status ?? "NEW",
        confidence: row.confidence ?? 1,
        importance: row.importance ?? 3,
        aliases: toList(row.aliases),
        tags: toList(row.tags),
        collectionIds: [],
      });
      termId = term.id;
      res.termsCreated++;
    }
    nameToId.set(name.toLowerCase(), termId);

    // link to subject + topic
    if (subjectId) {
      await db.term.update({ where: { id: termId }, data: { subjects: { connect: { id: subjectId } } } });
    }
    if (topicId) {
      await db.topicTerm.upsert({
        where: { topicId_termId: { topicId, termId } },
        create: { userId, topicId, termId, position: position++ },
        update: {},
      });
      res.termsLinked++;
    }
  }

  const resolveTerm = async (name: string): Promise<string | null> => {
    const key = name.trim().toLowerCase();
    if (nameToId.has(key)) return nameToId.get(key)!;
    const t = await db.term.findFirst({
      where: { userId, name: { equals: name.trim(), mode: "insensitive" }, deletedAt: null },
      select: { id: true },
    });
    if (t) nameToId.set(key, t.id);
    return t?.id ?? null;
  };

  // 3. Question bank (skip an identical prompt already in the bank for this term)
  for (const q of pack.questions ?? []) {
    const termId = await resolveTerm(q.term);
    if (!termId) continue;
    const dup = await db.question.findFirst({
      where: { userId, termId, quizId: null, prompt: q.prompt },
      select: { id: true },
    });
    if (dup) continue;
    await db.question.create({
      data: {
        userId,
        termId,
        type: q.type,
        prompt: q.prompt,
        choices: q.choices ?? undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? null,
        isAiGenerated: false,
      },
    });
    res.questionsCreated++;
  }

  // 4. Flashcards → FLASHCARD-type bank questions
  for (const f of pack.flashcards ?? []) {
    const termId = await resolveTerm(f.term);
    if (!termId) continue;
    const dup = await db.question.findFirst({
      where: { userId, termId, quizId: null, type: "FLASHCARD", prompt: f.front },
      select: { id: true },
    });
    if (dup) continue;
    await db.question.create({
      data: {
        userId,
        termId,
        type: "FLASHCARD",
        prompt: f.front,
        correctAnswer: f.back,
        isAiGenerated: false,
      },
    });
    res.flashcardsCreated++;
  }

  await logActivity({
    userId,
    type: "lesson.imported",
    meta: {
      subject: res.subject,
      topic: res.topic,
      termsCreated: res.termsCreated,
      questionsCreated: res.questionsCreated,
    },
  });

  return res;
}
