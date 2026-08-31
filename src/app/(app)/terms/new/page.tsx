import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TermForm } from "@/components/terms/term-form";

export const metadata = { title: "Yeni termin" };

export default async function NewTermPage() {
  const user = await requireUser();
  const categories = await db.category.findMany({
    where: { userId: user.id, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Yeni termin</h1>
        <p className="text-sm text-muted-foreground">
          Yalnız ad kifayətdir — qalan sahələri sonra doldura bilərsiniz. Yazdıqca qaralama avtomatik saxlanılır.
        </p>
      </div>
      <TermForm mode="create" categories={categories} />
    </div>
  );
}
