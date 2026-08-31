import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizBuilder } from "@/components/quiz/quiz-builder";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Test mərkəzi" };

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; categoryId?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const [categories, terms, pastQuizzes] = await Promise.all([
    db.category.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.term.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.quiz.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { _count: { select: { questions: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Test mərkəzi</h1>
        <p className="text-sm text-muted-foreground">
          Qeydlərindən avtomatik suallar. Açıq suallar mənaca (sözbəsöz deyil) qiymətləndirilir.
        </p>
      </div>

      <QuizBuilder
        categories={categories}
        terms={terms}
        preselectTermId={sp.termId}
        preselectCategoryId={sp.categoryId}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Keçmiş testlər</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {pastQuizzes.length === 0 && <p className="text-sm text-muted-foreground">Hələ test yoxdur.</p>}
          {pastQuizzes.map((q) => (
            <Link
              key={q.id}
              href={`/quizzes/${q.id}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <span>{q.title}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {q._count.questions} sual · {formatDate(q.createdAt)}
                {q.completedAt ? (
                  <Badge variant={(q.scorePct ?? 0) >= 60 ? "success" : "warning"}>{Math.round(q.scorePct ?? 0)}%</Badge>
                ) : (
                  <Badge variant="secondary">yarımçıq</Badge>
                )}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
