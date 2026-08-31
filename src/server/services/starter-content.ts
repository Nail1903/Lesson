import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { reindexTerm } from "@/lib/rag/indexer";
import {
  SEED_CATEGORIES,
  SEED_TERMS,
  SEED_RELATIONS,
  SEED_QUESTIONS,
  SEED_SUBJECTS,
} from "@/lib/seed-data";

/**
 * Populate a fresh user with the starter knowledge base. Idempotent: if the
 * user already has terms, it does nothing.
 */
export async function seedStarterContent(userId: string): Promise<{ terms: number } | null> {
  const existing = await db.term.count({ where: { userId } });
  if (existing > 0) return null;

  // Categories
  const catId = new Map<string, string>();
  for (const c of SEED_CATEGORIES) {
    const row = await db.category.upsert({
      where: { userId_slug: { userId, slug: c.slug } },
      create: { userId, slug: c.slug, name: c.name, color: c.color },
      update: {},
    });
    catId.set(c.slug, row.id);
  }

  const collection = await db.collection.upsert({
    where: { userId_slug: { userId, slug: "baslangic-toplusu" } },
    create: { userId, slug: "baslangic-toplusu", name: "Başlanğıc toplusu", color: "#6d28d9" },
    update: {},
  });

  // Terms
  const termId = new Map<string, string>();
  for (const t of SEED_TERMS) {
    const term = await db.term.create({
      data: {
        userId,
        name: t.name,
        slug: slugify(t.name),
        shortDef: t.shortDef,
        longDef: t.longDef,
        inMyWords: t.inMyWords ?? null,
        practicalUse: t.practicalUse ?? null,
        difficulty: t.difficulty,
        status: t.status,
        confidence: t.confidence,
        importance: t.importance,
        categoryId: catId.get(t.category) ?? null,
        nextReviewAt: new Date(Date.now() + 24 * 3600 * 1000),
        collections: { connect: { id: collection.id } },
        aliases: { create: (t.aliases ?? []).map((value) => ({ userId, value })) },
        tags: {
          connectOrCreate: (t.tags ?? []).map((name) => ({
            where: { userId_slug: { userId, slug: slugify(name) } },
            create: { userId, name, slug: slugify(name) },
          })),
        },
        examples: {
          create: (t.examples ?? []).map((e) => ({
            userId,
            kind: e.kind,
            title: e.title ?? null,
            body: e.body,
          })),
        },
        formulas: {
          create: (t.formulas ?? []).map((f) => ({
            userId,
            latex: f.latex,
            caption: f.caption ?? null,
            explanation: f.explanation ?? null,
          })),
        },
        codeExamples: {
          create: (t.codeExamples ?? []).map((c) => ({
            userId,
            language: c.language,
            title: c.title ?? null,
            code: c.code,
            explanation: c.explanation ?? null,
          })),
        },
        sources: {
          create: (t.sources ?? []).map((s) => ({
            userId,
            kind: s.kind,
            title: s.title,
            authors: s.authors ?? null,
            year: s.year ?? null,
            url: s.url ?? null,
            pages: s.pages ?? null,
          })),
        },
        progress: { create: { userId, dueAt: new Date() } },
      },
    });
    termId.set(t.name, term.id);
  }

  // Subjects → Topics → TopicTerm links
  for (const [si, s] of SEED_SUBJECTS.entries()) {
    const subject = await db.subject.upsert({
      where: { userId_slug: { userId, slug: s.slug } },
      create: {
        userId,
        slug: s.slug,
        name: s.name,
        color: s.color,
        description: s.description ?? null,
        position: si,
      },
      update: {},
    });
    for (const [ti, t] of s.topics.entries()) {
      const topic = await db.topic.upsert({
        where: { subjectId_slug: { subjectId: subject.id, slug: t.slug } },
        create: {
          userId,
          subjectId: subject.id,
          slug: t.slug,
          name: t.name,
          description: t.description ?? null,
          position: ti,
        },
        update: {},
      });
      for (const [pi, termName] of t.terms.entries()) {
        const tId = termId.get(termName);
        if (!tId) continue;
        // many-to-many Subject <-> Term
        await db.term.update({
          where: { id: tId },
          data: { subjects: { connect: { id: subject.id } } },
        });
        // ordered supplement link on the topic
        await db.topicTerm.upsert({
          where: { topicId_termId: { topicId: topic.id, termId: tId } },
          create: { userId, topicId: topic.id, termId: tId, position: pi },
          update: { position: pi },
        });
      }
    }
  }

  // Relations
  for (const r of SEED_RELATIONS) {
    const fromId = termId.get(r.from);
    const toId = termId.get(r.to);
    if (!fromId || !toId) continue;
    await db.termRelation.upsert({
      where: { fromId_toId_type: { fromId, toId, type: r.type } },
      create: { userId, fromId, toId, type: r.type, note: r.note ?? null },
      update: {},
    });
  }

  // Seed quiz questions (bank — not attached to a quiz)
  for (const q of SEED_QUESTIONS) {
    const tId = termId.get(q.term);
    if (!tId) continue;
    await db.question.create({
      data: {
        userId,
        termId: tId,
        type: q.type,
        prompt: q.prompt,
        choices: q.choices ?? undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isAiGenerated: false,
      },
    });
  }

  // Build the vector index for every seeded term.
  for (const id of termId.values()) {
    await reindexTerm(id, userId).catch(() => undefined);
  }

  return { terms: termId.size };
}
