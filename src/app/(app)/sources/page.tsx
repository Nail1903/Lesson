import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SourceManager } from "@/components/sources/source-manager";

export const metadata = { title: "Fayllar və mənbələr" };

export default async function SourcesPage() {
  const user = await requireUser();
  const [sources, terms] = await Promise.all([
    db.source.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { term: { select: { name: true, slug: true } } },
    }),
    db.term.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fayllar və mənbələr</h1>
        <p className="text-sm text-muted-foreground">
          Kitab, məqalə və keçidləri qeyd et. Fayl yükləmə (PDF/DOCX mətn çıxarışı) növbəti mərhələdədir — bax README yol xəritəsi.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Mənbələr ({sources.length})</CardTitle></CardHeader>
        <CardContent>
          <SourceManager
            sources={sources.map((s) => ({
              id: s.id,
              kind: s.kind,
              title: s.title,
              authors: s.authors,
              year: s.year,
              url: s.url,
              pages: s.pages,
              doi: s.doi,
              personalNote: s.personalNote,
              termId: s.termId,
              termName: s.term?.name ?? null,
            }))}
            terms={terms}
          />
        </CardContent>
      </Card>
    </div>
  );
}
