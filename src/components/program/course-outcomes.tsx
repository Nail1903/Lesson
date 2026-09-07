"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { upsertCourseOutcomeAction, deleteCourseOutcomeAction } from "@/server/actions/course-version";

interface Outcome {
  id: string;
  code: string | null;
  text: string;
  bloomLevel: string | null;
}
const BLOOM = ["", "Yadda saxlama", "Anlama", "Tətbiq", "Analiz", "Sintez", "Qiymətləndirmə"];

export function CourseOutcomes({
  courseVersionId,
  subjectId,
  outcomes,
  readOnly,
}: {
  courseVersionId: string;
  subjectId: string;
  outcomes: Outcome[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [, start] = React.useTransition();

  const save = (d: { id?: string; code: string; text: string; bloomLevel: string }) =>
    start(async () => {
      const res = await upsertCourseOutcomeAction({ courseVersionId, subjectId, ...d });
      if (res.ok) {
        toast.success("Nəticə saxlanıldı");
        setAdding(false);
        setEditId(null);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">Fənn öyrənmə nəticələri ({outcomes.length})</CardTitle>
          <p className="text-xs text-muted-foreground">Ölçülə bilən, müşahidə edilə bilən hərəkətlərlə.</p>
        </div>
        {!readOnly && <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Əlavə et</Button>}
      </CardHeader>
      <CardContent className="space-y-2">
        {adding && <Form onCancel={() => setAdding(false)} onSave={save} />}
        {outcomes.length === 0 && !adding && <p className="text-sm text-muted-foreground">Nəticə yoxdur.</p>}
        {outcomes.map((o) =>
          editId === o.id ? (
            <Form key={o.id} initial={o} onCancel={() => setEditId(null)} onSave={(d) => save({ id: o.id, ...d })} />
          ) : (
            <div key={o.id} className="flex items-start gap-2 rounded-lg border p-2.5 text-sm">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p>{o.code && <span className="mr-1 font-mono text-xs text-muted-foreground">{o.code}</span>}{o.text}</p>
                {o.bloomLevel && <Badge variant="secondary" className="mt-1">{o.bloomLevel}</Badge>}
              </div>
              {!readOnly && (
                <div className="flex gap-1">
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setEditId(o.id)}><Pencil className="h-3.5 w-3.5" /></button>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => start(async () => {
                      const res = await deleteCourseOutcomeAction(o.id);
                      if (res.ok) { toast.success("Silindi"); router.refresh(); } else toast.error(res.error);
                    })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}

function Form({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Outcome>;
  onCancel: () => void;
  onSave: (d: { code: string; text: string; bloomLevel: string }) => void;
}) {
  const [code, setCode] = React.useState(initial?.code ?? "");
  const [text, setText] = React.useState(initial?.text ?? "");
  const [bloomLevel, setBloom] = React.useState(initial?.bloomLevel ?? "");
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex gap-2">
        <Input className="w-24" placeholder="Kod (FN1)" value={code} onChange={(e) => setCode(e.target.value)} />
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={bloomLevel} onChange={(e) => setBloom(e.target.value)}>
          {BLOOM.map((b) => <option key={b} value={b}>{b || "— Bloom —"}</option>)}
        </select>
      </div>
      <Textarea rows={2} placeholder="Tələbə … edir" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => text.trim() && onSave({ code, text, bloomLevel })}>Saxla</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Ləğv et</Button>
      </div>
    </div>
  );
}
