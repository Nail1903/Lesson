import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { db } from "@/lib/db";
import { listReferenceData } from "@/server/services/teaching-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { OfferingDialog } from "@/components/teaching/offering-dialog";
import { formatDate } from "@/lib/utils";

const OFF_STATUS: Record<string, string> = { draft: "Qaralama", active: "Aktiv", archived: "Arxiv" };

export async function TeachingTab({
  userId,
  subject,
}: {
  userId: string;
  subject: { id: string; name: string };
}) {
  const [{ universities, groups }, offerings] = await Promise.all([
    listReferenceData(userId),
    db.semesterOffering.findMany({
      where: { userId, subjectId: subject.id, deletedAt: null },
      orderBy: [{ academicYear: "desc" }, { term: "asc" }],
      include: {
        university: { select: { name: true, shortName: true } },
        _count: { select: { groupLinks: true, meetings: true } },
        groupLinks: { include: { group: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Bu fənnin konkret semestrdə, universitetdə, qruplarla tədrisi. Hər tədris planında həftəlik cədvəl və görüşlər var.
        </p>
        <OfferingDialog
          mode="create"
          subjects={[{ id: subject.id, name: subject.name }]}
          universities={universities.map((u) => ({ id: u.id, name: u.name, faculties: u.faculties.map((f) => ({ id: f.id, name: f.name })) }))}
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        />
      </div>

      {offerings.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Tədris planı yoxdur"
          description="Bu fənni tədris ili + semestr + universitet + qruplarla əlaqələndirin."
        />
      ) : (
        <div className="space-y-2">
          {offerings.map((o) => (
            <Link
              key={o.id}
              href={`/teaching/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm hover:bg-muted"
            >
              <div>
                <span className="font-medium">{o.academicYear} · {o.term}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {o.university.shortName || o.university.name}
                  {o.groupLinks.length > 0 && ` · ${o.groupLinks.map((l) => l.group.name).join(", ")}`}
                  {` · ${o._count.meetings} görüş`}
                </span>
              </div>
              <Badge variant={o.status === "active" ? "success" : o.status === "archived" ? "outline" : "secondary"}>
                {OFF_STATUS[o.status]}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {universities.length === 0 && (
        <Card>
          <CardContent className="p-3 text-xs text-muted-foreground">
            Universitet və qruplar “Parametrlər → Universitetlər və qruplar” bölməsindən idarə olunur.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
