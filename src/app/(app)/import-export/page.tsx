import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportPanel } from "@/components/data/import-panel";
import { ReindexButton } from "@/components/data/reindex-button";

export const metadata = { title: "Import / Export" };

export default async function ImportExportPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import / Export</h1>
        <p className="text-sm text-muted-foreground">Bütün məlumatını başqa sistemə köçür və ya geri gətir.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İxrac</CardTitle>
          <CardDescription>Fayllar birbaşa yüklənir.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href="/api/export?format=json" download>Tam backup (JSON)</a></Button>
          <Button asChild variant="outline"><a href="/api/export?format=csv" download>Terminlər (CSV)</a></Button>
          <Button asChild variant="outline"><a href="/api/export?format=md" download>Terminlər (Markdown)</a></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İdxal</CardTitle>
          <CardDescription>
            JSON massivi, MyLesson backup faylı və ya CSV mətni. Eyni adlı terminlər ötürülür.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vektor indeksi</CardTitle>
          <CardDescription>
            Embedding modelini dəyişdikdən sonra bütün qeydləri yenidən indeksləyin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReindexButton />
        </CardContent>
      </Card>
    </div>
  );
}
