import Link from "next/link";
import { GraduationCap, Building2, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listReferenceData, listOfferings } from "@/server/services/teaching-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { OfferingDialog } from "@/components/teaching/offering-dialog";
import { ReferencePanel } from "@/components/teaching/reference-panel";

export const metadata = { title: "Tədris" };

const STATUS_LABEL: Record<string, string> = { draft: "Qaralama", active: "Aktiv", archived: "Arxiv" };
const STATUS_VARIANT: Record<string, "secondary" | "success" | "outline"> = {
  draft: "secondary",
  active: "success",
  archived: "outline",
};

export default async function TeachingPage() {
  const user = await requireUser();
  const [{ universities, groups }, offerings, subjects] = await Promise.all([
    listReferenceData(user.id),
    listOfferings(user.id),
    db.subject.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // group offerings by "year · term"
  const byPeriod = new Map<string, typeof offerings>();
  for (const o of offerings) {
    const key = `${o.academicYear} · ${o.term}`;
    const arr = byPeriod.get(key) ?? [];
    arr.push(o);
    byPeriod.set(key, arr);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tədris</h1>
          <p className="text-sm text-muted-foreground">
            Fənnin semestr üzrə tədrisi, qruplar və hər qrupun irəliləyişi.
          </p>
        </div>
        <OfferingDialog
          mode="create"
          subjects={subjects}
          universities={universities.map((u) => ({ id: u.id, name: u.name, faculties: u.faculties.map((f) => ({ id: f.id, name: f.name })) }))}
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        />
      </div>

      {offerings.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Hələ tədris planı yoxdur"
          description="Bir fənni universitet, tədris ili və semestrlə əlaqələndir, sonra qrupları bağla."
        />
      ) : (
        <div className="space-y-5">
          {[...byPeriod.entries()].map(([period, items]) => (
            <div key={period}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{period}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((o) => (
                  <Link key={o.id} href={`/teaching/${o.id}`}>
                    <Card className="transition-colors hover:border-primary/40">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{o.subject.name}</CardTitle>
                          <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {o.university.shortName || o.university.name}
                          {o.faculty ? ` · ${o.faculty.name}` : ""} · {o.language.toUpperCase()}
                        </p>
                      </CardHeader>
                      <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {o.groupLinks.length} qrup
                          {o.groupLinks.length > 0 &&
                            ` (${o.groupLinks.map((l) => l.group.name).join(", ")})`}
                        </span>
                        <span>· {o._count.meetings} görüş</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <details className="rounded-xl border">
        <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-3 text-sm font-medium">
          <Building2 className="h-4 w-4" /> Universitetlər, fakültələr və qruplar
          <span className="text-xs font-normal text-muted-foreground">
            ({universities.length} universitet · {groups.length} qrup)
          </span>
        </summary>
        <div className="border-t p-4">
          <ReferencePanel
            universities={universities.map((u) => ({
              id: u.id,
              name: u.name,
              shortName: u.shortName,
              city: u.city,
              academicHourMinutes: u.academicHourMinutes,
              faculties: u.faculties.map((f) => ({ id: f.id, name: f.name, department: f.department })),
            }))}
            groups={groups.map((g) => ({
              id: g.id,
              name: g.name,
              universityId: g.universityId,
              universityName: g.university?.name ?? null,
              studentCount: g.studentCount,
              specialty: g.specialty,
            }))}
          />
        </div>
      </details>
    </div>
  );
}
