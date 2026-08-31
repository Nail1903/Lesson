import Link from "next/link";
import { Plus, Library } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listTerms } from "@/server/services/term-service";
import { semanticTermSearch } from "@/lib/rag/retrieve";
import { TermCard } from "@/components/terms/term-card";
import { TermFilters } from "@/components/terms/term-filters";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Bütün terminlər" };

type SP = Record<string, string | undefined>;

export default async function TermsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [categories, subjects] = await Promise.all([
    db.category.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.subject.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const semantic = sp.mode === "semantic" && !!sp.q;

  let cards: React.ReactNode;
  let total = 0;
  let pageCount = 1;

  if (semantic) {
    const results = await semanticTermSearch(user.id, sp.q!, 30);
    total = results.length;
    cards = results.length ? (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {await Promise.all(
          results.map(async (r) => {
            const term = await db.term.findFirst({
              where: { id: r.termId, userId: user.id },
              include: {
                category: { select: { name: true, color: true } },
                _count: { select: { examples: true, notes: true, relationsFrom: true, relationsTo: true } },
              },
            });
            return term ? <TermCard key={r.termId} term={term} snippet={r.snippet} score={r.score} /> : null;
          }),
        )}
      </div>
    ) : null;
  } else {
    const res = await listTerms(user.id, {
      q: sp.q,
      categoryId: sp.category,
      subjectId: sp.subject,
      topicId: sp.topic,
      collectionId: sp.collection,
      tag: sp.tag,
      status: sp.status as never,
      difficulty: sp.difficulty as never,
      weakOnly: sp.weak === "1",
      dueOnly: sp.due === "1",
      sort: (sp.sort as never) ?? "recent",
      page,
    });
    total = res.total;
    pageCount = res.pageCount;
    cards = res.items.length ? (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {res.items.map((t) => (
          <TermCard key={t.id} term={t} />
        ))}
      </div>
    ) : null;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bütün terminlər</h1>
          <p className="text-sm text-muted-foreground">{total} nəticə</p>
        </div>
        <Button asChild size="sm">
          <Link href="/terms/new"><Plus className="h-4 w-4" /> Yeni termin</Link>
        </Button>
      </div>

      <TermFilters
        categories={categories.map((c) => ({ value: c.id, label: c.name }))}
        subjects={subjects.map((s) => ({ value: s.id, label: s.name }))}
      />

      {cards ?? (
        <EmptyState
          icon={Library}
          title={sp.q ? "Nəticə tapılmadı" : "Hələ termin yoxdur"}
          description={
            sp.q
              ? "Fərqli açar sözlər sınayın və ya semantik axtarışı aktiv edin."
              : "İlk termininizi əlavə edin — yalnız ad kifayətdir, qalanını sonra doldurarsınız."
          }
          actionLabel={sp.q ? undefined : "Yeni termin əlavə et"}
          actionHref={sp.q ? undefined : "/terms/new"}
        />
      )}

      {!semantic && pageCount > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
            const next = new URLSearchParams(sp as Record<string, string>);
            next.set("page", String(p));
            return (
              <Button key={p} asChild size="sm" variant={p === page ? "default" : "outline"}>
                <Link href={`/terms?${next.toString()}`}>{p}</Link>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
