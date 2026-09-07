import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  listQuestions,
  countByDifficulty,
  type QuestionFilters,
} from "@/server/services/question-bank-service";
import { QuestionBankClient } from "@/components/question-bank/question-bank-client";
import type { QuestionType } from "@prisma/client";

export const metadata = { title: "Sual bankı" };

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; topic?: string; type?: string; difficulty?: string; q?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const filters: QuestionFilters = {
    subjectId: sp.subject,
    topicId: sp.topic,
    type: sp.type as QuestionType | undefined,
    difficulty: sp.difficulty,
    q: sp.q,
    onlyBank: true,
  };

  const [subjects, topics, terms, outcomes, questions, diffCounts] = await Promise.all([
    db.subject.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.topic.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true, name: true, subjectId: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    db.term.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.learningOutcome.findMany({
      where: { userId: user.id },
      select: { id: true, code: true, text: true, subjectId: true, kind: true },
      orderBy: { position: "asc" },
    }),
    listQuestions(user.id, filters),
    sp.subject ? countByDifficulty(user.id, sp.subject, sp.topic ? [sp.topic] : undefined) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sual bankı</h1>
        <p className="text-sm text-muted-foreground">
          Suallar dərsə, terminə və öyrənmə nəticəsinə bağlanır. Fənn seçdikdə imtahan bileti / yoxlama işi yarada bilərsiniz.
        </p>
      </div>
      <QuestionBankClient
        subjects={subjects}
        topics={topics}
        terms={terms}
        outcomes={outcomes.map((o) => ({
          id: o.id,
          label: `${o.code ? o.code + " — " : ""}${o.text.slice(0, 60)} (${o.kind === "course" ? "fənn" : "dərs"})`,
          subjectId: o.subjectId,
        }))}
        questions={questions.map((q) => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          points: q.points,
          term: q.term ? { name: q.term.name } : null,
          topic: q.topic ? { name: q.topic.name } : null,
          outcome: q.outcome ? { code: q.outcome.code, text: q.outcome.text } : null,
        }))}
        filters={{ subjectId: sp.subject, topicId: sp.topic, type: sp.type, difficulty: sp.difficulty, q: sp.q }}
        diffCounts={diffCounts}
      />
    </div>
  );
}
