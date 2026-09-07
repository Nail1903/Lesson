"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertAssessmentAction, deleteAssessmentAction } from "@/server/actions/course-version";

interface Row {
  id: string;
  name: string;
  weight: number;
  criteria: string | null;
  dueInfo: string | null;
}

export function AssessmentTable({
  courseVersionId,
  rows,
  readOnly,
}: {
  courseVersionId: string;
  rows: Row[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [, start] = React.useTransition();

  const sum = rows.reduce((n, r) => n + r.weight, 0);
  const ok = Math.round(sum) === 100;

  const save = (d: { id?: string; name: string; weight: number; criteria: string; dueInfo: string }) =>
    start(async () => {
      const res = await upsertAssessmentAction({ courseVersionId, ...d });
      if (res.ok) {
        toast.success("Saxlanıldı");
        setAdding(false);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Qiymətləndirmə komponentləri</CardTitle>
          <p className={`flex items-center gap-1 text-xs ${ok ? "text-emerald-600" : "text-amber-600"}`}>
            {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            Çəkilər cəmi: {sum}% {ok ? "" : "(100% olmalıdır)"}
          </p>
        </div>
        {!readOnly && <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Komponent</Button>}
      </CardHeader>
      <CardContent className="space-y-2">
        {adding && <AssessmentForm onCancel={() => setAdding(false)} onSave={save} />}
        {rows.length === 0 && !adding && <p className="text-sm text-muted-foreground">Komponent yoxdur.</p>}
        {rows.map((r) => (
          <AssessmentRow key={r.id} row={r} readOnly={readOnly} onSave={(d) => save({ id: r.id, ...d })} onDelete={() =>
            start(async () => {
              const res = await deleteAssessmentAction(r.id);
              if (res.ok) { toast.success("Silindi"); router.refresh(); } else toast.error(res.error);
            })
          } />
        ))}
      </CardContent>
    </Card>
  );
}

function AssessmentRow({
  row,
  readOnly,
  onSave,
  onDelete,
}: {
  row: Row;
  readOnly: boolean;
  onSave: (d: { name: string; weight: number; criteria: string; dueInfo: string }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  if (editing)
    return <AssessmentForm initial={row} onCancel={() => setEditing(false)} onSave={(d) => { onSave(d); setEditing(false); }} />;
  return (
    <div className="flex items-start gap-3 rounded-lg border p-2.5 text-sm">
      <span className="w-12 shrink-0 font-mono font-semibold text-primary">{row.weight}%</span>
      <div className="flex-1">
        <p className="font-medium">{row.name}</p>
        {(row.criteria || row.dueInfo) && (
          <p className="text-xs text-muted-foreground">
            {[row.dueInfo, row.criteria].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      {!readOnly && (
        <div className="flex gap-1">
          <button className="text-xs text-primary hover:underline" onClick={() => setEditing(true)}>redaktə</button>
          <button className="text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}

function AssessmentForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Row>;
  onCancel: () => void;
  onSave: (d: { name: string; weight: number; criteria: string; dueInfo: string }) => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [weight, setWeight] = React.useState(initial?.weight?.toString() ?? "");
  const [criteria, setCriteria] = React.useState(initial?.criteria ?? "");
  const [dueInfo, setDueInfo] = React.useState(initial?.dueInfo ?? "");
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex gap-2">
        <Input className="flex-1" placeholder="Ad (məs. Aralıq imtahan)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input className="w-24" type="number" placeholder="Çəki %" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <Input placeholder="Müddət / vaxt (məs. 8-ci həftə)" value={dueInfo} onChange={(e) => setDueInfo(e.target.value)} />
      <Input placeholder="Qiymətləndirmə meyarı" value={criteria} onChange={(e) => setCriteria(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => name.trim() && onSave({ name, weight: Number(weight) || 0, criteria, dueInfo })}>Saxla</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Ləğv et</Button>
      </div>
    </div>
  );
}
