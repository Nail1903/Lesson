import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSubject } from "@/server/services/subject-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/labels";
import { AddTopicForm } from "@/components/subjects/add-topic-form";
import { TopicTermLinker } from "@/components/subjects/topic-term-linker";

export default async function SubjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const subject = await getSubject(user.id, slug);
  if (!subject) notFound();

  const allTerms = await db.term.findMany({
    where: { userId: user.id, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: subject.color ?? "#6d28d9" }} />
          <h1 className="text-2xl font-bold">{subject.name}</h1>
        </div>
        {subject.description && <p className="mt-1 text-sm text-muted-foreground">{subject.description}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          {subject.topics.length} mövzu · {subject.terms.length} termin
        </p>
      </div>

      <AddTopicForm subjectId={subject.id} />

      <div className="space-y-4">
        {subject.topics.map((topic) => (
          <Card key={topic.id} id={topic.slug}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">{topic.name}</CardTitle>
                {topic.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
                )}
              </div>
              <Badge variant="secondary">{topic.terms.length} termin</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {topic.terms.map((tt) => (
                <div key={tt.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <Link href={`/terms/${tt.term.slug}`} className="font-medium text-primary hover:underline">
                      {tt.term.name}
                    </Link>
                    {tt.term.shortDef && (
                      <p className="truncate text-xs text-muted-foreground">{tt.term.shortDef}</p>
                    )}
                    {tt.note && <p className="text-xs italic text-muted-foreground">Mövzu qeydi: {tt.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={STATUS_VARIANT[tt.term.status]}>{STATUS_LABEL[tt.term.status]}</Badge>
                    <TopicTermLinker.RemoveButton topicId={topic.id} termId={tt.term.id} />
                  </div>
                </div>
              ))}
              {topic.terms.length === 0 && (
                <p className="text-sm text-muted-foreground">Bu mövzuya hələ termin əlavə edilməyib.</p>
              )}
              <TopicTermLinker topicId={topic.id} terms={allTerms} />
            </CardContent>
          </Card>
        ))}
        {subject.topics.length === 0 && (
          <p className="text-sm text-muted-foreground">Hələ mövzu yoxdur — yuxarıdan əlavə edin.</p>
        )}
      </div>
    </div>
  );
}
