"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPE_LABEL } from "@/lib/labels";
import { gradeAnswerAction, finishQuizAction } from "@/server/actions/quiz";
import { cn } from "@/lib/utils";

interface Q {
  id: string;
  type: string;
  prompt: string;
  choices: string[] | null;
  termName: string | null;
  termSlug: string | null;
  prior: { scorePct: number | null; feedback: string | null; isCorrect: boolean | null; response: string } | null;
}

interface Result {
  isCorrect: boolean;
  scorePct: number;
  feedback: string;
  correctAnswer: string;
  explanation: string | null;
}

export function QuizRunner({
  quizId,
  title,
  questions,
  completedAt,
  scorePct,
}: {
  quizId: string;
  title: string;
  questions: Q[];
  completedAt: string | null;
  scorePct: number | null;
}) {
  const router = useRouter();
  const firstUnanswered = Math.max(0, questions.findIndex((q) => !q.prior));
  const [idx, setIdx] = React.useState(completedAt ? 0 : firstUnanswered === -1 ? 0 : firstUnanswered);
  const [response, setResponse] = React.useState("");
  const [result, setResult] = React.useState<Result | null>(null);
  const [pending, start] = React.useTransition();
  const [finished, setFinished] = React.useState(!!completedAt);
  const [finalScore, setFinalScore] = React.useState<number | null>(scorePct);
  const [answeredCount, setAnsweredCount] = React.useState(questions.filter((q) => q.prior).length);

  const q = questions[idx];

  function submit() {
    if (!q || !response.trim()) return;
    start(async () => {
      const res = await gradeAnswerAction({ questionId: q.id, quizId, response });
      if (res.ok) {
        setResult(res.data);
        setAnsweredCount((c) => c + 1);
      } else toast.error(res.error);
    });
  }

  function next() {
    setResult(null);
    setResponse("");
    if (idx + 1 < questions.length) setIdx(idx + 1);
    else finish();
  }

  function finish() {
    start(async () => {
      const res = await finishQuizAction(quizId);
      if (res.ok) {
        setFinalScore(res.data.scorePct);
        setFinished(true);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Nəticə</p>
            <p className="mt-1 text-5xl font-bold tabular-nums">{Math.round(finalScore ?? 0)}%</p>
            <p className="mt-2 text-sm text-muted-foreground">{questions.length} sualdan {answeredCount} cavablandırıldı</p>
            <div className="mt-6 flex justify-center gap-2">
              <Button asChild variant="outline"><Link href="/quizzes">Test mərkəzi</Link></Button>
              <Button onClick={() => { setFinished(false); setIdx(0); }}>Sualları yenidən bax</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!q) return null;

  const isChoice = q.type === "MCQ" || q.type === "TRUE_FALSE";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <span className="text-sm text-muted-foreground">{idx + 1} / {questions.length}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{QUESTION_TYPE_LABEL[q.type] ?? q.type}</Badge>
            {q.termName && q.termSlug && (
              <Link href={`/terms/${q.termSlug}`} className="text-xs text-primary hover:underline">
                {q.termName}
              </Link>
            )}
          </div>
          <CardTitle className="mt-2 text-base leading-relaxed">{q.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isChoice && q.choices ? (
            <div className="space-y-2">
              {q.choices.map((c) => (
                <button
                  key={c}
                  disabled={!!result}
                  onClick={() => setResponse(c)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    response === c ? "border-primary bg-accent" : "hover:bg-muted",
                    result && c === result.correctAnswer && "border-emerald-500 bg-emerald-500/10",
                    result && response === c && c !== result.correctAnswer && "border-destructive bg-destructive/10",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              disabled={!!result}
              placeholder="Cavabını yaz…"
              rows={4}
            />
          )}

          {result && (
            <div
              className={cn(
                "rounded-lg border p-3 text-sm",
                result.isCorrect ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10",
              )}
            >
              <p className="flex items-center gap-1.5 font-medium">
                {result.isCorrect ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-amber-600" />}
                {result.isCorrect ? "Düzgün" : "Tam deyil"} · {Math.round(result.scorePct)}%
              </p>
              {result.feedback && <p className="mt-1 text-muted-foreground">{result.feedback}</p>}
              {!result.isCorrect && (
                <p className="mt-2">
                  <span className="font-medium">Düzgün cavab: </span>
                  {result.correctAnswer}
                </p>
              )}
              {result.explanation && <p className="mt-1 text-muted-foreground">{result.explanation}</p>}
              {q.termSlug && (
                <Link href={`/terms/${q.termSlug}`} className="mt-2 inline-block text-xs text-primary underline">
                  Uyğun qeydə keç →
                </Link>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!result ? (
              <Button onClick={submit} disabled={pending || !response.trim()}>
                {pending ? "Yoxlanılır…" : "Cavabı yoxla"}
              </Button>
            ) : (
              <Button onClick={next} disabled={pending}>
                {idx + 1 < questions.length ? (
                  <>Növbəti <ArrowRight className="h-4 w-4" /></>
                ) : (
                  "Testi bitir"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
