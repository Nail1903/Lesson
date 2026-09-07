import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOffering, listReferenceData } from "@/server/services/teaching-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfferingDialog } from "@/components/teaching/offering-dialog";
import { GroupProgressEditor } from "@/components/teaching/group-progress-editor";
import { DeleteOfferingButton } from "@/components/teaching/delete-offering-button";
import { CloneOfferingDialog } from "@/components/teaching/clone-offering-dialog";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Tədris planı" };

const STATUS_LABEL: Record<string, string> = { draft: "Qaralama", active: "Aktiv", archived: "Arxiv" };
const MEETING_LABEL: Record<string, string> = {
  planned: "planlaşdırılıb",
  held: "keçirilib",
  postponed: "təxirə salınıb",
  cancelled: "ləğv edilib",
};

export default async function OfferingPage({ params }: { params: Promise<{ offeringId: string }> }) {
  const user = await requireUser();
  const { offeringId } = await params;
  const offering = await getOffering(user.id, offeringId);
  if (!offering) notFound();

  const [{ universities, groups }, subjects, lessons] = await Promise.all([
    listReferenceData(user.id),
    db.subject.findMany({ where: { userId: user.id, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.topic.findMany({
      where: { userId: user.id, subjectId: offering.subject.id, deletedAt: null },
      select: { id: true, name: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
  ]);

  const progressByGroup = new Map(offering.progress.map((p) => [p.groupId, p]));
  const hoursTotal =
    (offering.lectureHours ?? 0) +
    (offering.seminarHours ?? 0) +
    (offering.labHours ?? 0) +
    (offering.practiceHours ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/teaching" className="text-xs text-muted-foreground hover:text-foreground">← Tədris</Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              <Link href={`/subjects/${offering.subject.slug}`} className="hover:text-primary">{offering.subject.name}</Link>
            </h1>
            <Badge variant={offering.status === "active" ? "success" : offering.status === "archived" ? "outline" : "secondary"}>
              {STATUS_LABEL[offering.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {offering.university.name}
            {offering.faculty ? ` · ${offering.faculty.name}` : ""} · {offering.academicYear} · {offering.term} · {offering.language.toUpperCase()}
            {offering.teacherName ? ` · ${offering.teacherName}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <OfferingDialog
            mode="edit"
            subjects={subjects}
            universities={universities.map((u) => ({ id: u.id, name: u.name, faculties: u.faculties.map((f) => ({ id: f.id, name: f.name })) }))}
            groups={groups.map((g) => ({ id: g.id, name: g.name }))}
            initial={{
              id: offering.id,
              subjectId: offering.subject.id,
              universityId: offering.university.id,
              facultyId: offering.faculty?.id ?? null,
              academicYear: offering.academicYear,
              term: offering.term,
              language: offering.language,
              status: offering.status,
              teacherName: offering.teacherName,
              groupIds: offering.groupLinks.map((l) => l.group.id),
            }}
          />
          <CloneOfferingDialog
            offeringId={offering.id}
            currentGroups={offering.groupLinks.map((l) => ({ id: l.group.id, name: l.group.name }))}
            hasCourseVersion={!!offering.courseVersion}
          />
          <DeleteOfferingButton id={offering.id} />
        </div>
      </div>

      {(offering.creditHours != null || hoursTotal > 0) && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Yük</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {offering.creditHours != null && <span>Kredit: <b className="text-foreground">{offering.creditHours}</b></span>}
            {offering.lectureHours != null && <span>Mühazirə: {offering.lectureHours}</span>}
            {offering.seminarHours != null && <span>Seminar: {offering.seminarHours}</span>}
            {offering.labHours != null && <span>Lab: {offering.labHours}</span>}
            {offering.practiceHours != null && <span>Praktika: {offering.practiceHours}</span>}
            {offering.selfStudyHours != null && <span>Sərbəst iş: {offering.selfStudyHours}</span>}
            {hoursTotal > 0 && <span className="text-foreground">Auditoriya cəmi: {hoursTotal}</span>}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5" /> Qruplar və irəliləyiş
        </h2>
        {offering.groupLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bu tədris planına qrup bağlanmayıb — “Redaktə” ilə əlavə edin.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {offering.groupLinks.map((link) => {
              const p = progressByGroup.get(link.group.id);
              return (
                <Card key={link.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{link.group.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {link.group.studentCount != null ? `${link.group.studentCount} tələbə · ` : ""}
                      {p?.lastLesson ? `son: ${p.lastLesson.name}` : "irəliləyiş qeyd olunmayıb"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <GroupProgressEditor
                      offeringId={offering.id}
                      groupId={link.group.id}
                      lessons={lessons}
                      initial={{
                        lastLessonId: p?.lastLessonId ?? null,
                        note: p?.note ?? "",
                        nextStep: p?.nextStep ?? "",
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" /> Görüşlər ({offering.meetings.length})
          </CardTitle>
          <Badge variant="outline">Təqvim — Mərhələ 3</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {offering.meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Görüşlər (konkret tarixdə keçirilən dərslər) növbəti mərhələdə təqvimlə birlikdə gələcək.
              Hələlik hər qrupun irəliləyişini yuxarıdakı kartlarda idarə edin.
            </p>
          ) : (
            offering.meetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  {m.date ? formatDate(m.date) : "tarixsiz"} · {m.group.name}
                  {m.topics.length > 0 && ` — ${m.topics.map((t) => t.topic.name).join(", ")}`}
                </span>
                <Badge variant="secondary">{MEETING_LABEL[m.status]}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
