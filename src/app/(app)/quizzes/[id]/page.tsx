import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuizRunner } from "@/components/quiz/quiz-runner";

export const metadata = { title: "Test" };

export default async function QuizRunnerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const quiz = await db.quiz.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: {
      questions: {
        orderBy: { createdAt: "asc" },
        include: { term: { select: { name: true, slug: true } } },
      },
      answers: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!quiz) notFound();

  // last answer per question (for resuming a partially done quiz)
  const answered = new Map<string, { scorePct: number | null; feedback: string | null; isCorrect: boolean | null; response: string }>();
  for (const a of quiz.answers) {
    if (!answered.has(a.questionId)) {
      answered.set(a.questionId, {
        scorePct: a.scorePct,
        feedback: a.feedback,
        isCorrect: a.isCorrect,
        response: a.response,
      });
    }
  }

  return (
    <QuizRunner
      quizId={quiz.id}
      title={quiz.title}
      completedAt={quiz.completedAt?.toISOString() ?? null}
      scorePct={quiz.scorePct}
      questions={quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        choices: (q.choices as string[] | null) ?? null,
        termName: q.term?.name ?? null,
        termSlug: q.term?.slug ?? null,
        prior: answered.get(q.id) ?? null,
      }))}
    />
  );
}
