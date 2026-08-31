import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollectionManager } from "@/components/collections/collection-manager";

export const metadata = { title: "Kolleksiyalar" };

export default async function CollectionsPage() {
  const user = await requireUser();
  const [collections, categories] = await Promise.all([
    db.collection.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { terms: true } } },
    }),
    db.category.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { terms: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kateqoriyalar və kolleksiyalar</h1>
        <p className="text-sm text-muted-foreground">
          Kateqoriya — bir terminin əsas qrupu. Kolleksiya — sərbəst toplu (bir termin bir neçə kolleksiyada ola bilər).
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Kolleksiyalar</CardTitle></CardHeader>
        <CardContent>
          <CollectionManager
            collections={collections.map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: c._count.terms }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Kateqoriyalar</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {categories.length === 0 && <p className="text-sm text-muted-foreground">Kateqoriya yoxdur.</p>}
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/terms?category=${c.id}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color ?? "#6d28d9" }} />
                {c.name}
              </span>
              <span className="text-xs text-muted-foreground">{c._count.terms}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
