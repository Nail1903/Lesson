"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, BookMarked } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { upsertSourceLinkAction, deleteSourceLinkAction } from "@/server/actions/lessons";

interface SLink {
  id: string;
  chapter: string | null;
  pages: string | null;
  videoTimestamp: string | null;
  role: string | null;
  isRead: boolean;
  source: { id: string; title: string; authors: string | null; year: number | null; url: string | null; kind: string };
}

const ROLES = ["", "əsas", "əlavə", "tələbəyə tövsiyə", "müəllim hazırlığı"];

export function SourceLinksPanel({
  topicId,
  links,
  sources,
}: {
  topicId: string;
  links: SLink[];
  sources: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [, start] = React.useTransition();
  const [f, setF] = React.useState({ sourceId: "", chapter: "", pages: "", videoTimestamp: "", role: "əsas" });

  function add() {
    if (!f.sourceId) {
      toast.error("Mənbə seçin");
      return;
    }
    start(async () => {
      const res = await upsertSourceLinkAction({ topicId, ...f });
      if (res.ok) {
        toast.success("Mənbə bağlandı");
        setF({ sourceId: "", chapter: "", pages: "", videoTimestamp: "", role: "əsas" });
        setAdding(false);
        router.refresh();
      } else toast.error(res.error);
    });
  }
  function remove(id: string) {
    start(async () => {
      const res = await deleteSourceLinkAction(id, topicId);
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
          <CardTitle className="text-base">Mənbələr və səhifələr ({links.length})</CardTitle>
          <p className="text-xs text-muted-foreground">
            Eyni kitab bu dərsdə 20–28, başqa dərsdə 65–70-ci səhifələrlə bağlana bilər.
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding((a) => !a)}><Plus className="h-3.5 w-3.5" /></Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {adding && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={f.sourceId}
              onChange={(e) => setF({ ...f, sourceId: e.target.value })}
            >
              <option value="">— mənbə seç —</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Input placeholder="Fəsil" value={f.chapter} onChange={(e) => setF({ ...f, chapter: e.target.value })} />
              <Input placeholder="Səhifə(lər)" value={f.pages} onChange={(e) => setF({ ...f, pages: e.target.value })} />
              <Input placeholder="Video vaxtı" value={f.videoTimestamp} onChange={(e) => setF({ ...f, videoTimestamp: e.target.value })} />
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r || "— rol —"}</option>)}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Mənbə siyahıda yoxdursa, əvvəlcə <a href="/sources" className="text-primary underline">Fayllar və mənbələr</a>də əlavə edin.
            </p>
            <Button size="sm" onClick={add}>Bağla</Button>
          </div>
        )}
        {links.length === 0 && !adding && <p className="text-sm text-muted-foreground">Bağlı mənbə yoxdur.</p>}
        {links.map((l) => (
          <div key={l.id} className="flex items-start gap-2 rounded-lg border p-2.5 text-sm">
            <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{l.source.title}</p>
              <p className="text-xs text-muted-foreground">
                {[l.source.authors, l.source.year, l.chapter && `Fəsil ${l.chapter}`, l.pages && `s. ${l.pages}`, l.videoTimestamp]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {l.role && <Badge variant="secondary" className="mt-1">{l.role}</Badge>}
            </div>
            <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(l.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
