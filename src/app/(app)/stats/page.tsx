import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABEL, DIFFICULTY_LABEL } from "@/lib/labels";

export const metadata = { title: "Statistika" };

function Bars({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{d.label}</span>
            <span className="text-muted-foreground tabular-nums">{d.value}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? "hsl(var(--primary))" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function StatsPage() {
  const user = await requireUser();
  const now = new Date();

  const [byStatus, byDifficulty, byCategory, reviews, quizzes, confAgg, mastered, total] = await Promise.all([
    db.term.groupBy({ by: ["status"], where: { userId: user.id, deletedAt: null }, _count: true }),
    db.term.groupBy({ by: ["difficulty"], where: { userId: user.id, deletedAt: null }, _count: true }),
    db.category.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { name: true, color: true, _count: { select: { terms: true } } },
      orderBy: { terms: { _count: "desc" } },
      take: 10,
    }),
    db.review.findMany({
      where: { userId: user.id, createdAt: { gte: new Date(now.getTime() - 30 * 864e5) } },
      select: { createdAt: true, grade: true },
    }),
    db.quiz.findMany({
      where: { userId: user.id, deletedAt: null, completedAt: { not: null } },
      orderBy: { completedAt: "asc" },
      select: { title: true, scorePct: true, completedAt: true },
      take: 20,
    }),
    db.term.aggregate({ where: { userId: user.id, deletedAt: null }, _avg: { confidence: true, importance: true } }),
    db.learningProgress.count({ where: { userId: user.id, masteredAt: { not: null } } }),
    db.term.count({ where: { userId: user.id, deletedAt: null } }),
  ]);

  const reviewsByDay = new Map<string, number>();
  for (const r of reviews) {
    const k = r.createdAt.toISOString().slice(0, 10);
    reviewsByDay.set(k, (reviewsByDay.get(k) ?? 0) + 1);
  }
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 864e5).toISOString().slice(0, 10);
    return { date: d, count: reviewsByDay.get(d) ?? 0 };
  });
  const maxRev = Math.max(1, ...last30.map((d) => d.count));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Statistika</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Ümumi termin", value: total },
          { label: "Tam öyrənilmiş", value: mastered },
          { label: "Orta əminlik", value: (confAgg._avg.confidence ?? 0).toFixed(1) },
          { label: "Orta vaciblik", value: (confAgg._avg.importance ?? 0).toFixed(1) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Statusa görə</CardTitle></CardHeader>
          <CardContent>
            <Bars data={byStatus.map((g) => ({ label: STATUS_LABEL[g.status] ?? g.status, value: g._count }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Çətinliyə görə</CardTitle></CardHeader>
          <CardContent>
            <Bars data={byDifficulty.map((g) => ({ label: DIFFICULTY_LABEL[g.difficulty] ?? g.difficulty, value: g._count }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Kateqoriyalara görə bilik bölgüsü</CardTitle></CardHeader>
        <CardContent>
          <Bars data={byCategory.map((c) => ({ label: c.name, value: c._count.terms, color: c.color ?? undefined }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Son 30 gün — təkrar aktivliyi</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1">
            {last30.map((d) => (
              <div key={d.date} className="flex-1" title={`${d.date}: ${d.count}`}>
                <div className="rounded-sm bg-primary/80" style={{ height: `${6 + (d.count / maxRev) * 70}px` }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Test nəticələri</CardTitle></CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hələ tamamlanmış test yoxdur.</p>
          ) : (
            <Bars data={quizzes.map((q) => ({ label: q.title, value: Math.round(q.scorePct ?? 0) }))} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
