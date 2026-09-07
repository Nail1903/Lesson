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
        <div className="grid gap-4 md:grid-cols-2">
          {subjects.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: s.color ?? "#6d28d9" }}
                    />
                    <Link href={`/subjects/${s.slug}`} className="hover:text-primary">{s.name}</Link>
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s._count.topics} mövzu · {s._count.terms} termin
                  </p>
                </div>
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
              </CardHeader>
              <CardContent className="space-y-1">
                {s.topics.length === 0 && (
                  <p className="text-sm text-muted-foreground">Mövzu yoxdur.</p>
                )}
                {s.topics.map((t) => (
                  <Link
                    key={t.id}
                    href={`/subjects/${s.slug}#${t.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span>{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t._count.terms} termin</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
