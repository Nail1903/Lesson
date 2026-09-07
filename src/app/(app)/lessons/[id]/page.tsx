import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLesson } from "@/server/services/lesson-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPE_LABEL } from "@/lib/labels";
import { LessonHeader } from "@/components/lesson/lesson-header";
import { LessonTextSection } from "@/components/lesson/lesson-text-section";
import { StagesEditor } from "@/components/lesson/stages-editor";
import { MaterialsPanel } from "@/components/lesson/materials-panel";
import { OutcomesPanel } from "@/components/lesson/outcomes-panel";
import { SourceLinksPanel } from "@/components/lesson/source-links-panel";
import { TopicTermLinker, RemoveButton } from "@/components/subjects/topic-term-linker";

export const metadata = { title: "Dərs" };

interface Stage {
  name: string;
  minutes: number;
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const lesson = await getLesson(user.id, id);
  if (!lesson) notFound();

  const [allTerms, sources] = await Promise.all([
    db.term.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.source.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const stages: Stage[] = Array.isArray(lesson.stages) ? (lesson.stages as unknown as Stage[]) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/subjects/${lesson.subject.slug}`} className="text-xs text-muted-foreground hover:text-foreground">
        ← {lesson.subject.name}
      </Link>

      <LessonHeader
        lesson={{
          id: lesson.id,
          name: lesson.name,
          lessonType: lesson.lessonType,
          module: lesson.module,
          week: lesson.week,
          durationMinutes: lesson.durationMinutes,
          prepStatus: lesson.prepStatus,
        }}
      />

      <LessonTextSection lessonId={lesson.id} field="objective" title="Ümumi məqsəd" hint="Dərsin nə üçün keçirildiyi." value={lesson.objective} rich />

      <OutcomesPanel
        topicId={lesson.id}
        outcomes={lesson.outcomes.map((o) => ({ id: o.id, code: o.code, text: o.text, bloomLevel: o.bloomLevel, criteria: o.criteria }))}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <LessonTextSection lessonId={lesson.id} field="prerequisites" title="İlkin biliklər" value={lesson.prerequisites} />
        <LessonTextSection lessonId={lesson.id} field="preClassPrep" title="Dərsöncəsi hazırlıq" value={lesson.preClassPrep} />
      </div>

      <LessonTextSection lessonId={lesson.id} field="teachingNotes" title="İzah qeydləri / danışıq planı" hint="Müəllim üçün — tələbəyə göstərilmir." value={lesson.teachingNotes} rich />

      <StagesEditor lessonId={lesson.id} stages={stages} durationMinutes={lesson.durationMinutes} />

      <MaterialsPanel
        topicId={lesson.id}
        materials={lesson.materials.map((m) => ({ id: m.id, kind: m.kind, title: m.title, body: m.body, url: m.url }))}
      />

      {/* Terms */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Terminlər ({lesson.terms.length})</CardTitle>
          <p className="text-xs text-muted-foreground">Kanonik termin bazasından — bir termin çox dərsə bağlana bilər.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {lesson.terms.map((tt) => (
            <div key={tt.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div className="min-w-0">
                <Link href={`/terms/${tt.term.slug}`} className="font-medium text-primary hover:underline">
                  {tt.term.name}
                </Link>
                {tt.note && <p className="text-xs italic text-muted-foreground">Bu dərs üçün: {tt.note}</p>}
              </div>
              <RemoveButton topicId={lesson.id} termId={tt.term.id} />
            </div>
          ))}
          {lesson.terms.length === 0 && <p className="text-sm text-muted-foreground">Termin bağlanmayıb.</p>}
          <TopicTermLinker topicId={lesson.id} terms={allTerms} />
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Yoxlama sualları ({lesson.questions.length})</CardTitle>
          <Link href={`/quizzes?topicId=${lesson.id}`} className="text-xs text-primary underline">
            Test mərkəzində sual əlavə et
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {lesson.questions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Bu dərsə bağlı sual yoxdur. Dərs materialı idxalında və ya Test mərkəzində əlavə edin.
            </p>
          )}
          {lesson.questions.map((q) => (
            <div key={q.id} className="rounded-md border px-3 py-2 text-sm">
              <div className="mb-0.5 flex items-center gap-2">
                <Badge variant="outline">{QUESTION_TYPE_LABEL[q.type] ?? q.type}</Badge>
                {q.difficulty && <Badge variant="secondary">{q.difficulty}</Badge>}
                {q.points != null && <span className="text-xs text-muted-foreground">{q.points} bal</span>}
              </div>
              <p>{q.prompt}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <LessonTextSection lessonId={lesson.id} field="homework" title="Ev tapşırığı" value={lesson.homework} rich />

      <SourceLinksPanel
        topicId={lesson.id}
        links={lesson.sourceLinks.map((l) => ({
          id: l.id,
          chapter: l.chapter,
          pages: l.pages,
          videoTimestamp: l.videoTimestamp,
          role: l.role,
          isRead: l.isRead,
          source: l.source,
        }))}
        sources={sources}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <LessonTextSection lessonId={lesson.id} field="misconceptions" title="Tez-tez qarışdırılan anlayışlar" value={lesson.misconceptions} />
        <LessonTextSection lessonId={lesson.id} field="expectedQuestions" title="Gözlənilən tələbə sualları" value={lesson.expectedQuestions} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LessonTextSection lessonId={lesson.id} field="reflection" title="Dərsdən sonrakı refleksiya" hint="Nə yaxşı alındı, nə çətin oldu, nə dəyişməli." value={lesson.reflection} />
        <LessonTextSection lessonId={lesson.id} field="nextLessonNote" title="Növbəti dərsə keçid qeydi" value={lesson.nextLessonNote} />
      </div>

      <p className="pb-4 text-center text-xs text-muted-foreground">
        <GraduationCap className="mr-1 inline h-3.5 w-3.5" />
        Bu dərs {lesson._count.meetingTopics} görüşdə keçirilib (görüş idarəetməsi — Mərhələ 3).
      </p>
    </div>
  );
}
