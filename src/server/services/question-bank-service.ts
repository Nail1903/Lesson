import type { Prisma, QuestionType } from "@prisma/client";
import { db } from "@/lib/db";
import { logActivity } from "@/server/services/activity";
import type { UpsertQuestionInput, ExamConfigInput } from "@/lib/validations/question-bank";

export interface QuestionFilters {
  subjectId?: string;
  topicId?: string;
  termId?: string;
  outcomeId?: string;
  type?: QuestionType;
  difficulty?: string;
  q?: string;
  onlyBank?: boolean; // quizId == null
}

const listInclude = {
  term: { select: { id: true, name: true, slug: true } },
  topic: { select: { id: true, name: true } },
  outcome: { select: { id: true, code: true, text: true } },
} satisfies Prisma.QuestionInclude;

export async function listQuestions(userId: string, f: QuestionFilters = {}) {
  const where: Prisma.QuestionWhereInput = {
    userId,
    ...(f.onlyBank ? { quizId: null } : {}),
    ...(f.topicId ? { topicId: f.topicId } : {}),
    ...(f.termId ? { termId: f.termId } : {}),
    ...(f.outcomeId ? { outcomeId: f.outcomeId } : {}),
    ...(f.type ? { type: f.type } : {}),
    ...(f.difficulty ? { difficulty: f.difficulty } : {}),
    ...(f.subjectId
      ? {
          OR: [
            { topic: { subjectId: f.subjectId } },
            { term: { subjects: { some: { id: f.subjectId } } } },
            { outcome: { subjectId: f.subjectId } },
          ],
        }
      : {}),
    ...(f.q ? { prompt: { contains: f.q, mode: "insensitive" } } : {}),
  };
  return db.question.findMany({ where, include: listInclude, orderBy: { createdAt: "desc" }, take: 300 });
}

export async function countByDifficulty(userId: string, subjectId: string, topicIds?: string[]) {
  const base: Prisma.QuestionWhereInput = {
    userId,
    quizId: null,
    ...(topicIds?.length
      ? { topicId: { in: topicIds } }
      : {
          OR: [
            { topic: { subjectId } },
            { term: { subjects: { some: { id: subjectId } } } },
            { outcome: { subjectId } },
          ],
        }),
  };
  const [easy, medium, hard, none] = await Promise.all([
    db.question.count({ where: { ...base, difficulty: "easy" } }),
    db.question.count({ where: { ...base, difficulty: "medium" } }),
    db.question.count({ where: { ...base, difficulty: "hard" } }),
    db.question.count({ where: { ...base, difficulty: null } }),
  ]);
  return { easy, medium, hard, none };
}

export async function upsertQuestion(userId: string, input: UpsertQuestionInput) {
  // validate ownership of any linked entities
  if (input.topicId) {
    const t = await db.topic.findFirst({ where: { id: input.topicId, userId, deletedAt: null }, select: { id: true } });
    if (!t) throw new Error("NOT_FOUND");
  }
  if (input.termId) {
    const t = await db.term.findFirst({ where: { id: input.termId, userId, deletedAt: null }, select: { id: true } });
    if (!t) throw new Error("NOT_FOUND");
  }
  if (input.outcomeId) {
    const o = await db.learningOutcome.findFirst({ where: { id: input.outcomeId, userId }, select: { id: true } });
    if (!o) throw new Error("NOT_FOUND");
  }

  const data = {
    type: input.type,
    prompt: input.prompt,
    choices: input.choices ?? undefined,
    correctAnswer: input.correctAnswer,
    explanation: input.explanation?.trim() || null,
    criteria: input.criteria?.trim() || null,
    difficulty: input.difficulty || null,
    points: input.points ?? null,
    estimatedMinutes: input.estimatedMinutes ?? null,
    topicId: input.topicId || null,
    termId: input.termId || null,
    outcomeId: input.outcomeId || null,
    isAiGenerated: false,
  };

  if (input.id) {
    const owned = await db.question.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!owned) throw new Error("NOT_FOUND");
    return db.question.update({ where: { id: input.id }, data });
  }
  const q = await db.question.create({ data: { ...data, userId } });
  await logActivity({ userId, type: "question.created", entity: "Question", entityId: q.id });
  return q;
}

export async function deleteQuestion(userId: string, id: string) {
  await db.question.deleteMany({ where: { id, userId, quizId: null } });
}

/* ── Exam / ticket paper generator (spec §10) ───────────────────────────── */

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export async function generateExam(userId: string, cfg: ExamConfigInput) {
  const subject = await db.subject.findFirst({ where: { id: cfg.subjectId, userId, deletedAt: null }, select: { id: true } });
  if (!subject) throw new Error("NOT_FOUND");

  const scopeWhere: Prisma.QuestionWhereInput = {
    userId,
    quizId: null,
    ...(cfg.types?.length ? { type: { in: cfg.types } } : {}),
    ...(cfg.topicIds?.length
      ? { topicId: { in: cfg.topicIds } }
      : {
          OR: [
            { topic: { subjectId: cfg.subjectId } },
            { term: { subjects: { some: { id: cfg.subjectId } } } },
            { outcome: { subjectId: cfg.subjectId } },
          ],
        }),
  };

  const pick = async (difficulty: string, n: number) => {
    if (n <= 0) return [];
    const pool = await db.question.findMany({
      where: { ...scopeWhere, difficulty },
      select: { id: true },
      take: 200,
    });
    return shuffle(pool).slice(0, n).map((x) => x.id);
  };

  const ids = [
    ...(await pick("easy", cfg.easy)),
    ...(await pick("medium", cfg.medium)),
    ...(await pick("hard", cfg.hard)),
  ];

  if (ids.length === 0) {
    throw new Error("Seçilmiş meyarlara uyğun sual tapılmadı — əvvəlcə sual bankına çətinlik səviyyəli suallar əlavə edin.");
  }

  const quiz = await db.quiz.create({
    data: {
      userId,
      title: cfg.title,
      source: cfg.topicIds?.length ? "TERMS" : "CATEGORY",
      config: {
        kind: "exam",
        subjectId: cfg.subjectId,
        easy: cfg.easy,
        medium: cfg.medium,
        hard: cfg.hard,
        topicIds: cfg.topicIds ?? [],
      } as object,
    },
  });

  // attach: copy the bank questions into the quiz (so bank stays intact)
  const originals = await db.question.findMany({ where: { id: { in: ids } } });
  for (const o of originals) {
    await db.question.create({
      data: {
        userId,
        quizId: quiz.id,
        termId: o.termId,
        topicId: o.topicId,
        outcomeId: o.outcomeId,
        type: o.type,
        prompt: o.prompt,
        choices: o.choices ?? undefined,
        correctAnswer: o.correctAnswer,
        explanation: o.explanation,
        criteria: o.criteria,
        difficulty: o.difficulty,
        points: o.points,
        estimatedMinutes: o.estimatedMinutes,
        isAiGenerated: o.isAiGenerated,
      },
    });
  }

  await logActivity({ userId, type: "exam.generated", entity: "Quiz", entityId: quiz.id, meta: { count: ids.length } });
  return quiz.id;
}

export async function getExam(userId: string, quizId: string) {
  return db.quiz.findFirst({
    where: { id: quizId, userId, deletedAt: null },
    include: {
      questions: {
        orderBy: { createdAt: "asc" },
        include: {
          term: { select: { name: true } },
          topic: { select: { name: true } },
          outcome: { select: { code: true, text: true } },
        },
      },
    },
  });
}
