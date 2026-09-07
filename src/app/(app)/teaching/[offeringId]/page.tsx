import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOffering, listReferenceData } from "@/server/services/teaching-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferingDialog } from "@/components/teaching/offering-dialog";
import { GroupProgressRow } from "@/components/teaching/group-progress-row";
import { DeleteOfferingButton } from "@/components/teaching/delete-offering-button";
import { CloneOfferingDialog } from "@/components/teaching/clone-offering-dialog";
import { OfferingStatusControl } from "@/components/teaching/offering-status-control";
import { ScheduleEditor } from "@/components/teaching/schedule-editor";
import { MeetingsPanel } from "@/components/teaching/meetings-panel";

export const metadata = { title: "Tədris planı" };

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
  const offeringGroups = offering.groupLinks.map((l) => ({ id: l.group.id, name: l.group.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/teaching" className="text-xs text-muted-foreground hover:text-foreground">← Tədris</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              <Link href={`/subjects/${offering.subject.slug}`} className="hover:text-primary">{offering.subject.name}</Link>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {offering.university.name}
              {offering.faculty ? ` · ${offering.faculty.name}` : ""} · {offering.academicYear} · {offering.term} · {offering.language.toUpperCase()}
              {offering.teacherName ? ` · ${offering.teacherName}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OfferingStatusControl offeringId={offering.id} status={offering.status} />
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
              currentGroups={offeringGroups}
              hasCourseVersion={!!offering.courseVersion}
            />
            <DeleteOfferingButton id={offering.id} />
          </div>
        </div>
      </div>

      {/* Weekly schedule */}
      <ScheduleEditor
        offeringId={offering.id}
        startDate={offering.startDate ? offering.startDate.toISOString().slice(0, 10) : null}
        endDate={offering.endDate ? offering.endDate.toISOString().slice(0, 10) : null}
        slots={offering.slots.map((s) => ({
          id: s.id,
          groupId: s.groupId,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          kind: s.kind,
          room: s.room,
          group: { name: s.group.name },
        }))}
        exceptions={offering.exceptions.map((x) => ({ id: x.id, date: x.date.toISOString(), reason: x.reason }))}
        groups={offeringGroups}
        meetingsCount={offering.meetings.length}
      />

      {/* Meetings */}
      <MeetingsPanel
        offeringId={offering.id}
        groups={offeringGroups}
        lessons={lessons}
        meetings={offering.meetings.map((m) => ({
          id: m.id,
          groupId: m.groupId,
          groupName: m.group.name,
          date: m.date ? m.date.toISOString() : null,
          startTime: m.startTime,
          endTime: m.endTime,
          room: m.room,
          status: m.status,
          note: m.note,
          topics: m.topics.map((t) => ({ id: t.topic.id, name: t.topic.name })),
        }))}
      />

      {/* Groups & progress (compact) */}
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5" /> Qruplar və irəliləyiş
        </h2>
        {offeringGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Qrup bağlanmayıb — “Redaktə” ilə əlavə edin.</p>
        ) : (
          <div className="space-y-2">
            {offering.groupLinks.map((link) => {
              const p = progressByGroup.get(link.group.id);
              return (
                <GroupProgressRow
                  key={link.id}
                  offeringId={offering.id}
                  groupId={link.group.id}
                  groupName={link.group.name}
                  studentCount={link.group.studentCount}
                  lastLessonName={p?.lastLesson?.name ?? null}
                  lessons={lessons}
                  initial={{
                    lastLessonId: p?.lastLessonId ?? null,
                    note: p?.note ?? "",
                    nextStep: p?.nextStep ?? "",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {(offering.creditHours != null || (offering.lectureHours ?? 0) > 0) && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Yük</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {offering.creditHours != null && <span>Kredit: <b className="text-foreground">{offering.creditHours}</b></span>}
            {offering.lectureHours != null && <span>Mühazirə: {offering.lectureHours}</span>}
            {offering.seminarHours != null && <span>Seminar: {offering.seminarHours}</span>}
            {offering.labHours != null && <span>Lab: {offering.labHours}</span>}
            {offering.practiceHours != null && <span>Praktika: {offering.practiceHours}</span>}
            {offering.selfStudyHours != null && <span>Sərbəst iş: {offering.selfStudyHours}</span>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
