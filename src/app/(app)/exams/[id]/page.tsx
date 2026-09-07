import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getExam } from "@/server/services/question-bank-service";
import { QUESTION_TYPE_LABEL, DIFFICULTY3_LABEL } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { ExamToolbar } from "@/components/exam/exam-toolbar";

export const metadata = { title: "İmtahan bileti" };

export default async function ExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { variant } = await searchParams;
  const isTeacher = variant !== "student";

  const exam = await getExam(user.id, id);
  if (!exam) notFound();

  const totalPoints = exam.questions.reduce((n, q) => n + (q.points ?? 0), 0);
  const totalMin = exam.questions.reduce((n, q) => n + (q.estimatedMinutes ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="print:hidden">
        <Link href="/question-bank" className="text-xs text-muted-foreground hover:text-foreground">← Sual bankı</Link>
        <ExamToolbar examId={exam.id} isTeacher={isTeacher} />
      </div>

      <div className="rounded-xl border p-6 print:border-0 print:p-0">
        <div className="mb-4 border-b pb-3 text-center">
          <h1 className="text-xl font-bold">{exam.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {exam.questions.length} sual · {totalPoints} bal
            {totalMin > 0 && ` · ~${totalMin} dəq`}
            {isTeacher && " · MÜƏLLİM VARİANTI (cavablarla)"}
          </p>
          {!isTeacher && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ad, soyad: _______________________  Qrup: __________  Tarix: __________
            </p>
          )}
        </div>

        <ol className="space-y-5">
          {exam.questions.map((q, i) => {
            const choices = Array.isArray(q.choices) ? (q.choices as string[]) : [];
            return (
              <li key={q.id} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="font-medium">{q.prompt}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground print:hidden">
                      <Badge variant="outline">{QUESTION_TYPE_LABEL[q.type] ?? q.type}</Badge>{" "}
                      {q.difficulty && <Badge variant="secondary">{DIFFICULTY3_LABEL[q.difficulty] ?? q.difficulty}</Badge>}{" "}
                      {q.points != null && `${q.points} bal`}
                      {q.topic && ` · ${q.topic.name}`}
                      {q.outcome && ` · nəticə: ${q.outcome.code || q.outcome.text.slice(0, 40)}`}
                    </p>
                    <span className="hidden text-xs text-muted-foreground print:inline">({q.points ?? 0} bal)</span>

                    {choices.length > 0 ? (
                      <ul className="mt-1.5 space-y-1">
                        {choices.map((c, ci) => (
                          <li key={ci} className={isTeacher && c === q.correctAnswer ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}>
                            {String.fromCharCode(65 + ci)}) {c} {isTeacher && c === q.correctAnswer && "✓"}
                          </li>
                        ))}
                      </ul>
                    ) : !isTeacher ? (
                      <div className="mt-2 h-16 rounded border border-dashed" />
                    ) : null}

                    {isTeacher && choices.length === 0 && (
                      <p className="mt-1 rounded bg-emerald-500/10 p-2 text-emerald-800 dark:text-emerald-300">
                        <b>Cavab:</b> {q.correctAnswer}
                      </p>
                    )}
                    {isTeacher && q.criteria && (
                      <p className="mt-1 text-xs text-muted-foreground"><b>Meyar:</b> {q.criteria}</p>
                    )}
                    {isTeacher && q.explanation && (
                      <p className="mt-1 text-xs text-muted-foreground"><b>İzah:</b> {q.explanation}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
