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
import { upsertLessonOutcomeAction, deleteLessonOutcomeAction } from "@/server/actions/lessons";

interface Outcome {
  id: string;
  code: string | null;
  text: string;
  bloomLevel: string | null;
  criteria: string | null;
}

const BLOOM = ["", "Yadda saxlama", "Anlama", "Tətbiq", "Analiz", "Sintez", "Qiymətləndirmə"];

export function OutcomesPanel({ topicId, outcomes }: { topicId: string; outcomes: Outcome[] }) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [, start] = React.useTransition();

  function save(d: { id?: string; code: string; text: string; bloomLevel: string; criteria: string }) {
    start(async () => {
      const res = await upsertLessonOutcomeAction({ topicId, ...d });
      if (res.ok) {
        toast.success("Nəticə saxlanıldı");
        setAdding(false);
        setEditId(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }
  function remove(id: string) {
    start(async () => {
      const res = await deleteLessonOutcomeAction(id, topicId);
      if (res.ok) {
        toast.success("Silindi");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">Öyrənmə nəticələri ({outcomes.length})</CardTitle>
          <p className="text-xs text-muted-foreground">
            “izah edir”, “müqayisə edir”, “hesablayır”, “tətbiq edir” kimi müşahidə edilə bilən hərəkətlərlə yazın.
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Əlavə et</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {adding && <OutcomeEditor onCancel={() => setAdding(false)} onSave={save} />}
        {outcomes.length === 0 && !adding && <p className="text-sm text-muted-foreground">Nəticə yoxdur.</p>}
        {outcomes.map((o) =>
          editId === o.id ? (
            <OutcomeEditor key={o.id} initial={o} onCancel={() => setEditId(null)} onSave={(d) => save({ id: o.id, ...d })} />
          ) : (
            <div key={o.id} className="flex items-start gap-2 rounded-lg border p-2.5 text-sm">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p>
                  {o.code && <span className="mr-1 font-mono text-xs text-muted-foreground">{o.code}</span>}
                  {o.text}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {o.bloomLevel && <Badge variant="secondary">{o.bloomLevel}</Badge>}
                  {o.criteria && <span className="text-xs text-muted-foreground">Meyar: {o.criteria}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setEditId(o.id)}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(o.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}

function OutcomeEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Outcome>;
  onCancel: () => void;
  onSave: (d: { code: string; text: string; bloomLevel: string; criteria: string }) => void;
}) {
  const [code, setCode] = React.useState(initial?.code ?? "");
  const [text, setText] = React.useState(initial?.text ?? "");
  const [bloomLevel, setBloom] = React.useState(initial?.bloomLevel ?? "");
  const [criteria, setCriteria] = React.useState(initial?.criteria ?? "");

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex gap-2">
        <Input className="w-20" placeholder="Kod" value={code} onChange={(e) => setCode(e.target.value)} />
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={bloomLevel} onChange={(e) => setBloom(e.target.value)}>
          {BLOOM.map((b) => <option key={b} value={b}>{b || "— Bloom səviyyəsi —"}</option>)}
        </select>
      </div>
      <Textarea placeholder="Tələbə dərsin sonunda … edir" value={text} onChange={(e) => setText(e.target.value)} rows={2} />
      <Input placeholder="Nailiyyət meyarı (opsional)" value={criteria} onChange={(e) => setCriteria(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => text.trim() && onSave({ code, text, bloomLevel, criteria })}>Saxla</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Ləğv et</Button>
      </div>
    </div>
  );
}
