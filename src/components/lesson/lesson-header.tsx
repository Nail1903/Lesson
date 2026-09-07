"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateLessonAction } from "@/server/actions/lessons";
import { PREP_LABEL } from "@/server/services/lesson-service";

const PREP_VARIANT: Record<string, "secondary" | "warning" | "success" | "danger"> = {
  draft: "secondary",
  in_progress: "warning",
  ready: "success",
  needs_update: "danger",
};
const TYPES = ["", "mühazirə", "seminar", "laboratoriya", "praktika"];

export function LessonHeader({
  lesson,
}: {
  lesson: {
    id: string;
    name: string;
    lessonType: string | null;
    module: string | null;
    week: number | null;
    durationMinutes: number | null;
    prepStatus: string;
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({
    name: lesson.name,
    lessonType: lesson.lessonType ?? "",
    module: lesson.module ?? "",
    week: lesson.week?.toString() ?? "",
    durationMinutes: lesson.durationMinutes?.toString() ?? "",
    prepStatus: lesson.prepStatus,
  });

  function save() {
    start(async () => {
      const res = await updateLessonAction({
        id: lesson.id,
        name: f.name,
        lessonType: f.lessonType as never,
        module: f.module,
        week: f.week ? Number(f.week) : null,
        durationMinutes: f.durationMinutes ? Number(f.durationMinutes) : null,
        prepStatus: f.prepStatus as never,
      });
      if (res.ok) {
        toast.success("Saxlanıldı");
        setEditing(false);
        if (res.data.slug) router.replace(`/lessons/${lesson.id}`);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
        <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="text-lg font-semibold" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.lessonType} onChange={(e) => setF({ ...f, lessonType: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t || "— növ —"}</option>)}
          </select>
          <Input placeholder="Modul" value={f.module} onChange={(e) => setF({ ...f, module: e.target.value })} />
          <Input placeholder="Həftə" type="number" value={f.week} onChange={(e) => setF({ ...f, week: e.target.value })} />
          <Input placeholder="Müddət (dəq)" type="number" value={f.durationMinutes} onChange={(e) => setF({ ...f, durationMinutes: e.target.value })} />
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.prepStatus} onChange={(e) => setF({ ...f, prepStatus: e.target.value })}>
            {Object.entries(PREP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={pending}><Check className="h-3.5 w-3.5" /> Saxla</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Ləğv et</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{lesson.name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          <Badge variant={PREP_VARIANT[lesson.prepStatus]}>{PREP_LABEL[lesson.prepStatus]}</Badge>
          {lesson.lessonType && <Badge variant="outline">{lesson.lessonType}</Badge>}
          {lesson.module && <Badge variant="secondary">Modul: {lesson.module}</Badge>}
          {lesson.week != null && <Badge variant="secondary">Həftə {lesson.week}</Badge>}
          {lesson.durationMinutes != null && <Badge variant="secondary">{lesson.durationMinutes} dəq</Badge>}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" /> Redaktə
      </Button>
    </div>
  );
}
