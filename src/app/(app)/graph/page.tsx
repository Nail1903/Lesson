import { Network } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/app/empty-state";
import { KnowledgeGraph } from "@/components/graph/knowledge-graph";

export const metadata = { title: "Bilik qrafı" };

export default async function GraphPage() {
  const user = await requireUser();

  const [terms, relations] = await Promise.all([
    db.term.findMany({
      where: { userId: user.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        importance: true,
        category: { select: { name: true, color: true } },
      },
    }),
    db.termRelation.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true, fromId: true, toId: true, type: true },
    }),
  ]);

  if (terms.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Bilik qrafı</h1>
        <EmptyState icon={Network} title="Qraf boşdur" description="Terminlər və aralarındakı əlaqələr əlavə edildikcə qraf burada qurulacaq." actionLabel="Yeni termin" actionHref="/terms/new" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bilik qrafı</h1>
        <p className="text-sm text-muted-foreground">
          {terms.length} termin · {relations.length} əlaqə. Node-a klikləyin: yalnız onunla əlaqəli anlayışlar qalır. Təkərlə yaxınlaşdırın.
        </p>
      </div>
      <KnowledgeGraph
        nodes={terms.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          status: t.status,
          importance: t.importance,
          category: t.category?.name ?? "Kateqoriyasız",
          color: t.category?.color ?? "#94a3b8",
        }))}
        edges={relations.map((r) => ({ id: r.id, source: r.fromId, target: r.toId, type: r.type }))}
      />
    </div>
  );
}
