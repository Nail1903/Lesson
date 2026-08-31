import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/app/empty-state";
import { TrashRow } from "@/components/data/trash-row";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Səbət" };

export default async function TrashPage() {
  const user = await requireUser();
  const [terms, subjects] = await Promise.all([
    db.term.findMany({
      where: { userId: user.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, name: true, deletedAt: true },
    }),
    db.subject.findMany({
      where: { userId: user.id, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, name: true, deletedAt: true },
    }),
  ]);

  const empty = terms.length === 0 && subjects.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Səbət</h1>
        <p className="text-sm text-muted-foreground">Silinmiş elementlər burada 30 gün saxlanılır (soft delete).</p>
      </div>

      {empty ? (
        <EmptyState icon={Trash2} title="Səbət boşdur" description="Silinmiş terminlər və fənnlər burada görünəcək." />
      ) : (
        <div className="space-y-2">
          {terms.map((t) => (
            <TrashRow key={t.id} id={t.id} name={t.name} type="term" deletedAt={formatDate(t.deletedAt)} />
          ))}
          {subjects.map((s) => (
            <TrashRow key={s.id} id={s.id} name={s.name} type="subject" deletedAt={formatDate(s.deletedAt)} />
          ))}
        </div>
      )}
    </div>
  );
}
