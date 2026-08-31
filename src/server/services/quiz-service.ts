import type { Prisma, QuestionType } from "@prisma/client";
import { db } from "@/lib/db";
import { getChatProvider } from "@/lib/ai";
import { logger } from "@/lib/logger";
import type { QuizConfigInput } from "@/lib/validations/misc";

interface TermForQuiz {
  id: string;
  name: string;
  shortDef: string | null;
  longDef: string | null;
  inMyWords: string | null;
  examples: { body: string }[];
  formulas: { latex: string; explanation: string | null }[];
}

async function pickTerms(userId: string, cfg: QuizConfigInput): Promise<string[]> {
  const base: Prisma.TermWhereInput = { userId, deletedAt: null };
  switch (cfg.source) {
    case "CATEGORY":
      base.categoryId = { in: cfg.categoryIds ?? [] };
      break;
    case "TERMS":
      return (cfg.termIds ?? []).slice(0, cfg.size);
    case "THIS_WEEK":
      base.createdAt = { gte: new Date(Date.now() - 7 * 864e5) };
      break;
    case "WEAK":
      base.confidence = { lte: 2 };
      break;
    case "DUE":
      base.nextReviewAt = { lte: new Date() };
      break;
    case "RANDOM":
    default:
      break;
  }
  const rows = await db.term.findMany({ where: base, select: { id: true }, take: 200 });
  return shuffle(rows.map((r) => r.id)).slice(0, cfg.size);
}

const TEMPLATE_TYPES: QuestionType[] = ["OPEN", "TRUE_FALSE", "IDENTIFY_TERM"];

function templateQuestions(term: TermForQuiz, types: QuestionType[]): {
  type: QuestionType;
  prompt: string;
  choices?: string[];
  correctAnswer: string;
  explanation: string;
}[] {
  const out: ReturnType<typeof templateQuestions> = [];
  const allowed = types.filter((t) => TEMPLATE_TYPES.includes(t));
  const use = allowed.length ? allowed : TEMPLATE_TYPES;

  if (use.includes("OPEN") && term.shortDef) {
    out.push({
      type: "OPEN",
      prompt: `"${term.name}" anlayışını öz sözlərinlə izah et.`,
      correctAnswer: [term.shortDef, term.longDef].filter(Boolean).join(" "),
      explanation: `Qeydindəki tərif: ${term.shortDef}`,
    });
  }
  if (use.includes("IDENTIFY_TERM") && term.shortDef) {
    out.push({
      type: "IDENTIFY_TERM",
      prompt: `Hansı termin bu tərifə uyğundur? — "${term.shortDef}"`,
      correctAnswer: term.name,
      explanation: `Bu, "${term.name}" termininin qısa izahıdır.`,
    });
  }
  if (use.includes("TRUE_FALSE") && term.shortDef) {
    out.push({
      type: "TRUE_FALSE",
      prompt: `Doğru/Yanlış: ${term.name} — ${term.shortDef}`,
      choices: ["Doğru", "Yanlış"],
      correctAnswer: "Doğru",
      explanation: "Bu ifadə terminin öz qısa izahıdır.",
    });
  }
  return out;
}

async function aiQuestions(
  term: TermForQuiz,
  types: QuestionType[],
  count: number,
): Promise<ReturnType<typeof templateQuestions>> {
  const provider = getChatProvider();
  if (provider.id === "echo") return [];

  const context = [
    `Termin: ${term.name}`,
    term.shortDef && `Qısa izah: ${term.shortDef}`,
    term.longDef && `Geniş izah: ${term.longDef}`,
    term.inMyWords && `Öz sözlərimlə: ${term.inMyWords}`,
    ...term.examples.slice(0, 2).map((e, i) => `Nümunə ${i + 1}: ${e.body}`),
    ...term.formulas.slice(0, 1).map((f) => `Düstur: ${f.latex}`),
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await provider.complete({
      json: true,
      temperature: 0.4,
      maxTokens: 900,
      messages: [
        {
          role: "system",
          content:
            "Sən öyrənmə testi generatorusan. YALNIZ verilən qeydə əsaslan. " +
            `İcazə verilən növlər: ${types.join(", ")}. ` +
            'JSON qaytar: {"questions":[{"type","prompt","choices"?,"correctAnswer","explanation"}]}. ' +
            "MCQ üçün 4 seçim ver. Azərbaycan dilində.",
        },
        { role: "user", content: `${context}\n\n${count} sual yarat.` },
      ],
    });
    const parsed = JSON.parse(res.text) as { questions?: unknown };
    const arr = Array.isArray(parsed.questions) ? parsed.questions : [];
    return arr
      .map((q) => q as Record<string, unknown>)
      .filter((q) => typeof q.prompt === "string" && typeof q.correctAnswer === "string")
      .map((q) => ({
        type: (types.includes(q.type as QuestionType) ? q.type : "OPEN") as QuestionType,
        prompt: String(q.prompt),
        choices: Array.isArray(q.choices) ? (q.choices as string[]) : undefined,
        correctAnswer: String(q.correctAnswer),
        explanation: String(q.explanation ?? ""),
      }))
      .slice(0, count);
  } catch (err) {
    logger.warn("quiz.ai_generation_failed", { term: term.name, err: String(err) });
    return [];
  }
}

export async function generateQuiz(userId: string, cfg: QuizConfigInput) {
  const termIds = await pickTerms(userId, cfg);
  if (termIds.length === 0) throw new Error("Bu meyarlara uyğun termin tapılmadı");

  const terms = (await db.term.findMany({
    where: { id: { in: termIds }, userId },
    select: {
      id: true,
      name: true,
      shortDef: true,
      longDef: true,
      inMyWords: true,
      examples: { where: { deletedAt: null }, select: { body: true }, take: 3 },
      formulas: { where: { deletedAt: null }, select: { latex: true, explanation: true }, take: 2 },
    },
  })) as TermForQuiz[];

  const quiz = await db.quiz.create({
    data: {
      userId,
      title: quizTitle(cfg),
      source: cfg.source,
      config: cfg as unknown as object,
    },
  });

  const perTerm = Math.max(1, Math.ceil(cfg.size / terms.length));
  let made = 0;

  for (const term of terms) {
    if (made >= cfg.size) break;

    // 1) reuse bank questions
    const bank = await db.question.findMany({
      where: { userId, termId: term.id, quizId: null, type: { in: cfg.types } },
      take: perTerm,
    });

    // 2) top up with AI, then templates
    const need = Math.max(0, perTerm - bank.length);
    const ai = need > 0 ? await aiQuestions(term, cfg.types, need) : [];
    const stillNeed = Math.max(0, need - ai.length);
    const tpl = stillNeed > 0 ? templateQuestions(term, cfg.types).slice(0, stillNeed) : [];

    for (const b of bank) {
      if (made >= cfg.size) break;
      await db.question.update({ where: { id: b.id }, data: { quizId: quiz.id } });
      made++;
    }
    for (const q of [...ai, ...tpl]) {
      if (made >= cfg.size) break;
      await db.question.create({
        data: {
          userId,
          quizId: quiz.id,
          termId: term.id,
          type: q.type,
          prompt: q.prompt,
          choices: q.choices ?? undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          isAiGenerated: ai.includes(q as never),
        },
      });
      made++;
    }
  }

  if (made === 0) {
    await db.quiz.delete({ where: { id: quiz.id } });
    throw new Error("Sual yaradıla bilmədi — terminlərə qısa izah əlavə edin");
  }

  logger.info("quiz.generated", { userId, quizId: quiz.id, questions: made });
  return db.quiz.findUniqueOrThrow({
    where: { id: quiz.id },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
}

export async function gradeAnswer(
  userId: string,
  questionId: string,
  response: string,
  quizId?: string,
): Promise<{ isCorrect: boolean; scorePct: number; feedback: string; correctAnswer: string; explanation: string | null }> {
  const q = await db.question.findFirst({
    where: { id: questionId, userId },
    include: { term: { select: { slug: true, name: true } } },
  });
  if (!q) throw new Error("Sual tapılmadı");

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  let isCorrect = false;
  let scorePct = 0;
  let feedback = "";
  let gradedBy = "exact";

  if (q.type === "MCQ" || q.type === "TRUE_FALSE" || q.type === "IDENTIFY_TERM" || q.type === "FILL_BLANK") {
    isCorrect = norm(response) === norm(q.correctAnswer);
    scorePct = isCorrect ? 100 : 0;
    feedback = isCorrect ? "Düzgün." : `Düzgün cavab: ${q.correctAnswer}`;
  } else {
    const provider = getChatProvider();
    if (provider.id !== "echo") {
      try {
        const res = await provider.complete({
          json: true,
          temperature: 0,
          maxTokens: 400,
          messages: [
            {
              role: "system",
              content:
                "Sən müəllimsən. Tələbənin cavabını istinad cavabı ilə MƏNA baxımından müqayisə et (sözbəsöz yox). " +
                'JSON qaytar: {"scorePct":0-100,"isCorrect":bool,"feedback":"qısa izah, nə çatışmır"}. Azərbaycan dilində.',
            },
            {
              role: "user",
              content: `Sual: ${q.prompt}\n\nİstinad cavab: ${q.correctAnswer}\n\nTələbənin cavabı: ${response}`,
            },
          ],
        });
        const parsed = JSON.parse(res.text) as { scorePct?: number; isCorrect?: boolean; feedback?: string };
        scorePct = clamp(Number(parsed.scorePct ?? 0), 0, 100);
        isCorrect = parsed.isCorrect ?? scorePct >= 60;
        feedback = String(parsed.feedback ?? "");
        gradedBy = "ai";
      } catch {
        // fall through to lexical grading
      }
    }
    if (gradedBy !== "ai") {
      const refTokens = new Set(norm(q.correctAnswer).split(" ").filter((w) => w.length > 3));
      const ansTokens = new Set(norm(response).split(" ").filter((w) => w.length > 3));
      const overlap = [...ansTokens].filter((t) => refTokens.has(t)).length;
      scorePct = refTokens.size ? clamp(Math.round((overlap / refTokens.size) * 100), 0, 100) : 0;
      isCorrect = scorePct >= 50;
      feedback =
        (isCorrect ? "Əsas fikirlər var. " : "Cavab natamamdır. ") +
        `İstinad: ${q.correctAnswer}`;
      gradedBy = "lexical";
    }
  }

  await db.answer.create({
    data: {
      userId,
      quizId: quizId ?? q.quizId ?? null,
      questionId,
      response,
      isCorrect,
      scorePct,
      feedback,
      gradedBy,
    },
  });

  return {
    isCorrect,
    scorePct,
    feedback,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  };
}

function quizTitle(cfg: QuizConfigInput): string {
  const map: Record<QuizConfigInput["source"], string> = {
    CATEGORY: "Kateqoriya testi",
    TERMS: "Seçilmiş terminlər testi",
    THIS_WEEK: "Bu həftənin testi",
    WEAK: "Zəif terminlər testi",
    RANDOM: "Təsadüfi test",
    DUE: "Təkrar vaxtı çatmış test",
  };
  return `${map[cfg.source]} · ${new Date().toLocaleDateString("az-AZ")}`;
}

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
}
