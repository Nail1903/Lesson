import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getReviewQueue } from "@/server/services/review-service";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewSession } from "@/components/review/review-session";

export const metadata = { title: "Təkrar rejimi" };

export default async function ReviewPage() {
  const user = await requireUser();
  const now = new Date();

  const [queue, dueCount, overdueCount, newCount, masteredCount] = await Promise.all([
    getReviewQueue(user.id, 40),
    db.term.count({ where: { userId: user.id, deletedAt: null, nextReviewAt: { lte: now } } }),
    db.learningProgress.count({ where: { userId: user.id, dueAt: { lt: new Date(now.getTime() - 864e5) } } }),
    db.term.count({ where: { userId: user.id, deletedAt: null, status: "NEW" } }),
    db.learningProgress.count({ where: { userId: user.id, masteredAt: { not: null } } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Təkrar rejimi</h1>
        <p className="text-sm text-muted-foreground">SM-2 aralıqlı təkrar. Hər cavabdan sonra növbəti tarix hesablanır.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Bu gün təkrar", value: dueCount },
          { label: "Gecikmiş", value: overdueCount },
          { label: "Yeni terminlər", value: newCount },
          { label: "Tam öyrənilmiş", value: masteredCount },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={Repeat2}
          title="Təkrar üçün termin yoxdur"
          description="Bütün terminlər gündəmdədir. Yeni terminlər əlavə edin və ya sabah qayıdın."
          actionLabel="Yeni termin"
          actionHref="/terms/new"
        />
      ) : (
        <ReviewSession
          cards={queue.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            shortDef: t.shortDef,
            longDef: t.longDef,
            inMyWords: t.inMyWords,
            example: t.examples[0]?.body ?? null,
            categoryName: t.category?.name ?? null,
          }))}
        />
      )}

      <p className="text-xs text-muted-foreground">
        Test formatında yoxlanış üçün{" "}
        <Link href="/quizzes" className="text-primary underline">Test mərkəzi</Link>nə keçin.
      </p>
    </div>
  );
}
