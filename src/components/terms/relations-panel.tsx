"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RELATION_LABEL } from "@/lib/labels";
import { upsertRelationAction, deleteRelationAction } from "@/server/actions/term-content";

interface Relation {
  id: string;
  dir: "from" | "to";
  type: string;
  note: string | null;
  other: { id: string; name: string; slug: string };
}

const TYPES = Object.keys(RELATION_LABEL);

export function RelationsPanel({
  termId,
  relations,
  candidates,
}: {
  termId: string;
  relations: Relation[];
  candidates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [toId, setToId] = React.useState("");
  const [type, setType] = React.useState("SIMILAR");
  const [note, setNote] = React.useState("");
  const [, start] = React.useTransition();

  function add() {
    if (!toId) return;
    start(async () => {
      const res = await upsertRelationAction({ fromId: termId, toId, type, note });
      if (res.ok) {
        toast.success("Əlaqə əlavə edildi");
        setAdding(false);
        setToId("");
        setNote("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteRelationAction(id);
      if (res.ok) {
        toast.success("Silindi");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Əlaqəli terminlər ({relations.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setAdding((a) => !a)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {adding && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-2">
            <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="">— termin seç —</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{RELATION_LABEL[t]}</option>
              ))}
            </select>
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Qeyd (opsional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button size="sm" onClick={add} className="w-full">Əlavə et</Button>
          </div>
        )}

        {relations.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">Hələ əlaqə yoxdur.</p>
        )}

        {relations.map((r) => (
          <div key={r.id} className="flex items-start gap-2 rounded-md border px-2 py-1.5 text-sm">
            {r.dir === "from" ? (
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ArrowLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1">
              <span className="text-xs text-muted-foreground">{RELATION_LABEL[r.type]}</span>{" "}
              <Link href={`/terms/${r.other.slug}`} className="font-medium text-primary hover:underline">
                {r.other.name}
              </Link>
              {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
            </div>
            <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(r.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
