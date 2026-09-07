import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSubject, getSubjectOverview } from "@/server/services/subject-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/labels";
import { SubjectTabs } from "@/components/subjects/subject-tabs";
import { SubjectDialog } from "@/components/subjects/subject-dialog";
import { AddTopicForm } from "@/components/subjects/add-topic-form";
import { BulkLessonsForm } from "@/components/subjects/bulk-lessons-form";
import { TopicTermLinker, RemoveButton } from "@/components/subjects/topic-term-linker";
import { ProgramTab } from "@/components/subjects/tabs/program-tab";
import { TeachingTab } from "@/components/subjects/tabs/teaching-tab";

type Tab = "overview" | "lessons" | "program" | "teaching" | "terms";

export default async function SubjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; v?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const sp = await searchParams;
  const tab = (["overview", "lessons", "program", "teaching", "terms"].includes(sp.tab ?? "")
    ? sp.tab
    : "overview") as Tab;

  const subject = await getSubject(user.id, slug);
  if (!subject) notFound();

  return (
    <div className="space-y-5">
      {/* Compact header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/subjects" className="text-xs text-muted-foreground hover:text-foreground">← Fənnlər</Link>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: subject.color ?? "#6d28d9" }} />
            <h1 className="text-2xl font-bold">{subject.name}</h1>
          </div>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            {subject.code && <span>Kod: {subject.code}</span>}
            {subject.faculty && <span>· {subject.faculty}</span>}
            {subject.level && <span>· {subject.level}</span>}
            {subject.courseYear && <span>· {subject.courseYear}-ci kurs</span>}
            <span>· {subject.topics.length} dərs · {subject.terms.length} termin</span>
          </p>
        </div>
        <SubjectDialog
          mode="edit"
          subject={{
            id: subject.id,
            name: subject.name,
            description: subject.description ?? "",
            color: subject.color ?? "",
            code: subject.code,
            faculty: subject.faculty,
            department: subject.department,
            specialty: subject.specialty,
            level: subject.level,
            courseYear: subject.courseYear,
            objective: subject.objective,
            prerequisites: subject.prerequisites,
            relatedCourses: subject.relatedCourses,
            contentLanguage: subject.contentLanguage,
          }}
        />
      </div>

      <SubjectTabs slug={subject.slug} active={tab} />

      {tab === "overview" && <OverviewTab userId={user.id} subject={subject} />}
      {tab === "lessons" && <LessonsTab userId={user.id} subject={subject} />}
      {tab === "program" && <ProgramTab userId={user.id} subject={{ id: subject.id, slug: subject.slug }} versionId={sp.v} />}
      {tab === "teaching" && <TeachingTab userId={user.id} subject={{ id: subject.id, name: subject.name }} />}
      {tab === "terms" && <TermsTab subject={subject} />}
    </div>
  );
}

/* ── Overview ────────────────────────────────────────────────────────────── */

async function OverviewTab({
  userId,
  subject,
}: {
  userId: string;
  subject: Awaited<ReturnType<typeof getSubject>>;
}) {
  if (!subject) return null;
  const overview = await getSubjectOverview(userId, subject.id, subject.slug);

  return (
    <div className="space-y-4">
      {subject.description && <p className="text-sm text-muted-foreground">{subject.description}</p>}
      {subject.objective && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Ümumi məqsəd</p>
            <p className="mt-1 text-sm">{subject.objective}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Dərs", value: overview.stats.lessonsTotal, href: `/subjects/${subject.slug}?tab=lessons` },
          { label: "Termin", value: subject.terms.length, href: `/subjects/${subject.slug}?tab=terms` },
          { label: "Dərc edilmiş proqram", value: overview.stats.publishedVersions, href: `/subjects/${subject.slug}?tab=program` },
          { label: "Aktiv tədris", value: overview.stats.activeOfferings, href: `/subjects/${subject.slug}?tab=teaching` },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <Card><CardContent className="p-3">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </CardContent></Card>
          </Link>
        ))}
      </div>

      <Card className={overview.gaps.some((g) => g.level === "warn") ? "border-amber-500/40" : ""}>
        <CardContent className="space-y-1.5 p-4">
          <p className="text-sm font-medium">Hazırlıq və məzmun boşluqları</p>
          {overview.gaps.length === 0 ? (
            <p className="text-sm text-emerald-600">✓ Bariz boşluq görünmür.</p>
          ) : (
            overview.gaps.map((g, i) => {
              const Icon = g.level === "warn" ? AlertTriangle : Info;
              const inner = (
                <span className="flex items-start gap-1.5 text-sm">
                  <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${g.level === "warn" ? "text-amber-600" : "text-muted-foreground"}`} />
                  {g.message}
                </span>
              );
              return <div key={i}>{g.href ? <Link href={g.href} className="hover:underline">{inner}</Link> : inner}</div>;
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Lessons ─────────────────────────────────────────────────────────────── */

async function LessonsTab({
  userId,
  subject,
}: {
  userId: string;
  subject: Awaited<ReturnType<typeof getSubject>>;
}) {
  if (!subject) return null;
  const allTerms = await db.term.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const PREP: Record<string, { l: string; v: "secondary" | "warning" | "success" | "danger" }> = {
    draft: { l: "qaralama", v: "secondary" },
    in_progress: { l: "hazırlanır", v: "warning" },
    ready: { l: "hazır", v: "success" },
    needs_update: { l: "yenilənməli", v: "danger" },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <AddTopicForm subjectId={subject.id} />
        <BulkLessonsForm subjectId={subject.id} />
      </div>

      {subject.topics.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hələ dərs yoxdur — yuxarıdan əlavə edin.</p>
      ) : (
        <div className="space-y-2">
          {subject.topics.map((topic) => (
            <details key={topic.id} className="rounded-lg border" id={topic.slug}>
              <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2.5 text-sm">
                <span className="font-medium">{topic.name}</span>
                {topic.prepStatus && PREP[topic.prepStatus] && (
                  <Badge variant={PREP[topic.prepStatus]!.v}>{PREP[topic.prepStatus]!.l}</Badge>
                )}
                <span className="text-xs text-muted-foreground">{topic.terms.length} termin</span>
                <Link href={`/lessons/${topic.id}`} className="ml-auto text-xs text-primary underline">
                  Dərsi planla →
                </Link>
              </summary>
              <div className="space-y-2 border-t p-3">
                {topic.terms.map((tt) => (
                  <div key={tt.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <Link href={`/terms/${tt.term.slug}`} className="font-medium text-primary hover:underline">{tt.term.name}</Link>
                      {tt.note && <p className="text-xs italic text-muted-foreground">Bu dərs üçün: {tt.note}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={STATUS_VARIANT[tt.term.status]}>{STATUS_LABEL[tt.term.status]}</Badge>
                      <RemoveButton topicId={topic.id} termId={tt.term.id} />
                    </div>
                  </div>
                ))}
                {topic.terms.length === 0 && <p className="text-sm text-muted-foreground">Bu dərsə termin əlavə edilməyib.</p>}
                <TopicTermLinker topicId={topic.id} terms={allTerms} />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Terms (of this subject, grouped by lesson) ──────────────────────────── */

function TermsTab({ subject }: { subject: Awaited<ReturnType<typeof getSubject>> }) {
  if (!subject) return null;
  const linked = new Set<string>();
  const byLesson = subject.topics
    .map((t) => ({
      topic: t,
      terms: t.terms.map((tt) => {
        linked.add(tt.term.id);
        return tt.term;
      }),
    }))
    .filter((x) => x.terms.length > 0);
  const orphan = subject.terms.filter((t) => !linked.has(t.id));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Terminlər kanonikdir — bir termin bir neçə dərsdə görünə bilər, izah səhifəsi birdir. Terminləri dərsə “Dərslər” tabında bağlayın.
      </p>
      {byLesson.map(({ topic, terms }) => (
        <div key={topic.id}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{topic.name}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {terms.map((t) => (
              <Link key={t.id} href={`/terms/${t.slug}`} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
                <span className="font-medium text-primary">{t.name}</span>
                {t.shortDef && <p className="truncate text-xs text-muted-foreground">{t.shortDef}</p>}
              </Link>
            ))}
          </div>
        </div>
      ))}
      {orphan.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dərsə bağlanmamış</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {orphan.map((t) => (
              <Link key={t.id} href={`/terms/${t.slug}`} className="rounded-md border border-dashed px-3 py-2 text-sm hover:bg-muted">
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {byLesson.length === 0 && orphan.length === 0 && (
        <p className="text-sm text-muted-foreground">Bu fənnə termin əlavə edilməyib.</p>
      )}
    </div>
  );
}
