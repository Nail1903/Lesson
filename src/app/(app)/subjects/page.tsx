import Link from "next/link";
import { FolderTree } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listSubjects } from "@/server/services/subject-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/app/empty-state";
import { SubjectDialog } from "@/components/subjects/subject-dialog";

export const metadata = { title: "Fənnlər və mövzular" };

export default async function SubjectsPage() {
  const user = await requireUser();
  const subjects = await listSubjects(user.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fənnlər və mövzular</h1>
          <p className="text-sm text-muted-foreground">
            Fənn → mövzu (dərs) → terminlər. Eyni termin bir neçə fənndə görünə bilər, izah səhifəsi isə birdir.
          </p>
        </div>
        <SubjectDialog mode="create" />
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Hələ fənn yoxdur"
          description="İlk fənni yaradın, sonra ona mövzular və hər mövzuya terminlər əlavə edin."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const preview = s.topics.slice(0, 3);
            const more = s.topics.length - preview.length;
            return (
              <Card key={s.id} className="flex flex-col">
                <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color ?? "#6d28d9" }} />
                      <Link href={`/subjects/${s.slug}`} className="truncate hover:text-primary">{s.name}</Link>
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s._count.topics} dərs · {s._count.terms} termin
                    </p>
                  </div>
                  <div className="shrink-0">
                    <SubjectDialog
                      mode="edit"
                      subject={{
                        id: s.id,
                        name: s.name,
                        description: s.description ?? "",
                        color: s.color ?? "",
                        code: s.code,
                        faculty: s.faculty,
                        department: s.department,
                        specialty: s.specialty,
                        level: s.level,
                        courseYear: s.courseYear,
                        objective: s.objective,
                        prerequisites: s.prerequisites,
                        relatedCourses: s.relatedCourses,
                        contentLanguage: s.contentLanguage,
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-0.5 pt-0">
                  {s.topics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Dərs yoxdur.</p>
                  ) : (
                    preview.map((t) => (
                      <Link
                        key={t.id}
                        href={`/subjects/${s.slug}?tab=lessons#${t.slug}`}
                        className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{t._count.terms}</span>
                      </Link>
                    ))
                  )}
                  <Link
                    href={`/subjects/${s.slug}?tab=lessons`}
                    className="mt-auto pt-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    {more > 0 ? `+${more} dərs daha — hamısı →` : "Dərsləri aç →"}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
