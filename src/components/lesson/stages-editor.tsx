"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLessonAction } from "@/server/actions/lessons";

interface Stage {
  name: string;
  minutes: number;
}

export function StagesEditor({
  lessonId,
  stages: initial,
  durationMinutes,
}: {
  lessonId: string;
  stages: Stage[];
  durationMinutes: number | null;
}) {
  const router = useRouter();
  const [stages, setStages] = React.useState<Stage[]>(initial);
  const [pending, start] = React.useTransition();
  const [dirty, setDirty] = React.useState(false);

  const total = stages.reduce((n, s) => n + (Number(s.minutes) || 0), 0);
  const mismatch = durationMinutes != null && total !== durationMinutes;

  const update = (i: number, patch: Partial<Stage>) => {
    setStages((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    setDirty(true);
  };

  function save() {
    start(async () => {
      const clean = stages
        .map((s) => ({ name: s.name.trim(), minutes: Number(s.minutes) || 0 }))
        .filter((s) => s.name);
      const res = await updateLessonAction({ id: lessonId, stages: clean });
      if (res.ok) {
        toast.success("Mərhələlər saxlanıldı");
        setDirty(false);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">Dərsin mərhələləri</CardTitle>
          <p className="text-xs text-muted-foreground">
            Cəm: <b>{total} dəq</b>
            {durationMinutes != null && ` / dərs müddəti: ${durationMinutes} dəq`}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { setStages((s) => [...s, { name: "", minutes: 0 }]); setDirty(true); }}>
          <Plus className="h-3.5 w-3.5" /> Mərhələ
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {mismatch && (
          <p className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Mərhələ cəmi ({total} dəq) dərs müddəti ilə ({durationMinutes} dəq) uyğun gəlmir.
          </p>
        )}
        {stages.length === 0 && <p className="text-sm text-muted-foreground">Mərhələ yoxdur.</p>}
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              className="flex-1"
              placeholder="Mərhələnin adı (məs. Giriş, İzah, Tətbiq, Yekun)"
              value={s.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <Input
              className="w-20"
              type="number"
              placeholder="dəq"
              value={s.minutes}
              onChange={(e) => update(i, { minutes: Number(e.target.value) })}
            />
            <button
              className="text-muted-foreground hover:text-destructive"
              onClick={() => { setStages((x) => x.filter((_, j) => j !== i)); setDirty(true); }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {dirty && (
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saxlanılır…" : "Mərhələləri saxla"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
