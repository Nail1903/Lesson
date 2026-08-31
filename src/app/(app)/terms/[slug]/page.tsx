import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, GraduationCap, MessageSquareText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTerm } from "@/server/services/term-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { STATUS_LABEL, STATUS_VARIANT, DIFFICULTY_LABEL } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { ExamplesPanel } from "@/components/terms/examples-panel";
import { RelationsPanel } from "@/components/terms/relations-panel";
import { NotesPanel } from "@/components/terms/notes-panel";
import { DeleteTermButton } from "@/components/terms/delete-term-button";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function TermDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const term = await getTerm(user.id, slug);
  if (!term) notFound();

  const relatedTerms = await db.term.findMany({
    where: { userId: user.id, deletedAt: null, id: { not: term.id } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const relations = [
    ...term.relationsFrom.map((r) => ({ id: r.id, dir: "from" as const, type: r.type, note: r.note, other: r.to })),
    ...term.relationsTo.map((r) => ({ id: r.id, dir: "to" as const, type: r.type, note: r.note, other: r.from })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{term.name}</h1>
            <Badge variant={STATUS_VARIANT[term.status]}>{STATUS_LABEL[term.status]}</Badge>
            <Badge variant="outline">{DIFFICULTY_LABEL[term.difficulty]}</Badge>
          </div>
          {term.aliases.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              Sinonimlər: {term.aliases.map((a) => a.value).join(", ")}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {term.category && (
              <span
                className="rounded-md px-2 py-0.5 text-xs"
                style={{ background: `${term.category.color ?? "#6d28d9"}20`, color: term.category.color ?? "#6d28d9" }}
              >
                {term.category.name}
              </span>
            )}
            {term.tags.map((t) => (
              <Link key={t.id} href={`/terms?tag=${t.slug}`}>
                <Badge variant="secondary">#{t.name}</Badge>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/assistant?q=${encodeURIComponent(term.name + " nədir?")}`}>
              <MessageSquareText className="h-4 w-4" /> Sual ver
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/quizzes?termId=${term.id}`}>
              <GraduationCap className="h-4 w-4" /> Test et
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/terms/${term.slug}/edit`}><Pencil className="h-4 w-4" /> Redaktə</Link>
          </Button>
          <DeleteTermButton termId={term.id} termName={term.name} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {term.shortDef && (
            <Card>
              <CardHeader><CardTitle className="text-base">Qısa izah</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{term.shortDef}</p></CardContent>
            </Card>
          )}
          {term.longDef && (
            <Card>
              <CardHeader><CardTitle className="text-base">Geniş izah</CardTitle></CardHeader>
              <CardContent><Markdown>{term.longDef}</Markdown></CardContent>
            </Card>
          )}
          {term.inMyWords && (
            <Card className="border-primary/30 bg-accent/30">
              <CardHeader><CardTitle className="text-base">Öz sözlərimlə</CardTitle></CardHeader>
              <CardContent><Markdown>{term.inMyWords}</Markdown></CardContent>
            </Card>
          )}
          {term.practicalUse && (
            <Card>
              <CardHeader><CardTitle className="text-base">Praktiki tətbiq</CardTitle></CardHeader>
              <CardContent><Markdown>{term.practicalUse}</Markdown></CardContent>
            </Card>
          )}

          {term.formulas.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Düsturlar</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {term.formulas.map((f) => (
                  <div key={f.id}>
                    {f.caption && <p className="mb-1 text-sm font-medium">{f.caption}</p>}
                    <Markdown>{`$$${f.latex}$$`}</Markdown>
                    {f.explanation && <p className="mt-1 text-sm text-muted-foreground">{f.explanation}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {term.codeExamples.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Kod nümunələri</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {term.codeExamples.map((c) => (
                  <div key={c.id}>
                    {c.title && <p className="mb-1 text-sm font-medium">{c.title}</p>}
                    <Markdown>{`\`\`\`${c.language}\n${c.code}\n\`\`\``}</Markdown>
                    {c.explanation && <p className="mt-1 text-sm text-muted-foreground">{c.explanation}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <ExamplesPanel
            termId={term.id}
            examples={term.examples.map((e) => ({
              id: e.id,
              kind: e.kind,
              title: e.title,
              body: e.body,
              rating: e.rating,
              isAiGenerated: e.isAiGenerated,
            }))}
          />

          <NotesPanel
            termId={term.id}
            notes={term.notes.map((n) => ({ id: n.id, title: n.title, body: n.body, isAiGenerated: n.isAiGenerated }))}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Öyrənmə vəziyyəti</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Şəxsi əminlik" value={`${term.confidence}/5`} />
              <Row label="Vaciblik" value={`${term.importance}/5`} />
              <Row label="Yaradılıb" value={formatDate(term.createdAt)} />
              <Row label="Son yenilənmə" value={formatDate(term.updatedAt)} />
              <Row label="Növbəti təkrar" value={term.nextReviewAt ? formatDate(term.nextReviewAt) : "—"} />
              {term.progress && <Row label="Təkrar sayı" value={String(term.progress.totalReviews)} />}
            </CardContent>
          </Card>

          {(term.subjects.length > 0 || term.topicLinks.length > 0) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Fənn və mövzular</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {term.subjects.map((s) => (
                  <Link key={s.id} href={`/subjects/${s.slug}`} className="block rounded px-2 py-1 hover:bg-muted">
                    📚 {s.name}
                  </Link>
                ))}
                {term.topicLinks.map((tl) => (
                  <Link
                    key={tl.id}
                    href={`/subjects/${tl.topic.subject.slug}#${tl.topic.slug}`}
                    className="block rounded px-2 py-1 text-muted-foreground hover:bg-muted"
                  >
                    ↳ {tl.topic.subject.name} / {tl.topic.name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <RelationsPanel termId={term.id} relations={relations} candidates={relatedTerms} />

          {term.sources.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Mənbələr</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {term.sources.map((s) => (
                  <div key={s.id}>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[s.authors, s.year, s.pages ? `s. ${s.pages}` : null].filter(Boolean).join(" · ")}
                    </p>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                        keçid
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
