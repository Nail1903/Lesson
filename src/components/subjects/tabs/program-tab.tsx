import { AlertTriangle, FileText } from "lucide-react";
import {
  listVersions,
  getVersion,
  validateVersion,
} from "@/server/services/course-version-service";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { VersionList } from "@/components/program/version-list";
import { SectionEditor } from "@/components/program/section-editor";
import { AssessmentTable } from "@/components/program/assessment-table";
import { CourseOutcomes } from "@/components/program/course-outcomes";
import { VersionMeta } from "@/components/program/version-meta";

export async function ProgramTab({
  userId,
  subject,
  versionId,
}: {
  userId: string;
  subject: { id: string; slug: string };
  versionId?: string;
}) {
  const versions = await listVersions(userId, subject.id);
  const activeId = versionId ?? versions[0]?.id ?? null;
  const active = activeId ? await getVersion(userId, activeId) : null;
  const warnings = active ? await validateVersion(userId, active.id) : [];

  const lessonAgg = await db.topic.aggregate({
    where: { userId, subjectId: subject.id, deletedAt: null },
    _count: true,
    _sum: { durationMinutes: true },
  });
  const totalMin = lessonAgg._sum.durationMinutes ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <VersionList
          subjectId={subject.id}
          subjectSlug={subject.slug}
          versions={versions.map((x) => ({
            id: x.id,
            label: x.label,
            kind: x.kind,
            status: x.status,
            publishedAt: x.publishedAt?.toISOString() ?? null,
            updatedAt: x.updatedAt.toISOString(),
            sections: x._count.sections,
            offerings: x._count.offerings,
          }))}
          activeId={activeId}
        />
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Saat balansı</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>Dərs sayı: <b className="text-foreground">{lessonAgg._count}</b></p>
            <p>Dərs müddətləri cəmi: <b className="text-foreground">{totalMin} dəq</b></p>
            <p>≈ <b className="text-foreground">{(totalMin / 45).toFixed(1)}</b> akad. saat (45 dəq)</p>
          </CardContent>
        </Card>
      </div>

      {!active ? (
        <EmptyState icon={FileText} title="Versiya seçilməyib" description="Sol tərəfdən yeni proqram və ya sillabus versiyası yaradın." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{active.label}</h2>
            <Badge variant={active.status === "published" ? "success" : "secondary"}>
              {active.status === "published" ? "Dərc edilib — yalnız oxuma" : "Qaralama"}
            </Badge>
            <Badge variant="outline">{active.kind === "program" ? "Fənn proqramı" : "Sillabus"}</Badge>
          </div>

          {warnings.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> Yoxlama ({warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {warnings.map((wn, i) => (
                    <li key={i} className={wn.level === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-400"}>
                      • {wn.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <VersionMeta
            id={active.id}
            readOnly={active.status === "published"}
            label={active.label}
            description={active.description ?? ""}
            objective={active.objective ?? ""}
          />
          <CourseOutcomes
            courseVersionId={active.id}
            subjectId={subject.id}
            outcomes={active.outcomes.map((o) => ({ id: o.id, code: o.code, text: o.text, bloomLevel: o.bloomLevel }))}
            readOnly={active.status === "published"}
          />
          <SectionEditor
            courseVersionId={active.id}
            sections={active.sections.map((s) => ({ id: s.id, title: s.title, body: s.body, hidden: s.hidden, required: s.required }))}
            readOnly={active.status === "published"}
          />
          <AssessmentTable
            courseVersionId={active.id}
            rows={active.assessments.map((a) => ({ id: a.id, name: a.name, weight: a.weight, criteria: a.criteria, dueInfo: a.dueInfo }))}
            readOnly={active.status === "published"}
          />
        </div>
      )}
    </div>
  );
}
