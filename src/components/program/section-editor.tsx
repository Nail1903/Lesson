"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, EyeOff, ChevronUp, ChevronDown, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Markdown } from "@/components/markdown";
import {
  upsertSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
} from "@/server/actions/course-version";

interface Section {
  id: string;
  title: string;
  body: string;
  hidden: boolean;
  required: boolean;
}

export function SectionEditor({
  courseVersionId,
  sections,
  readOnly,
}: {
  courseVersionId: string;
  sections: Section[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [editId, setEditId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [, start] = React.useTransition();

  const run = (p: Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await p;
      if (r.ok) {
        toast.success(msg);
        setEditId(null);
        setAdding(false);
        router.refresh();
      } else toast.error(r.error);
    });

  function move(i: number, dir: -1 | 1) {
    const next = [...sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    run(reorderSectionsAction({ courseVersionId, orderedIds: next.map((s) => s.id) }), "Sıra dəyişdi");
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Bölmələr ({sections.length})</CardTitle>
        {!readOnly && (
          <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Bölmə</Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {adding && (
          <SectionForm
            onCancel={() => setAdding(false)}
            onSave={(d) => run(upsertSectionAction({ courseVersionId, ...d }), "Bölmə əlavə edildi")}
          />
        )}

        {sections.map((s, i) =>
          editId === s.id ? (
            <SectionForm
              key={s.id}
              initial={s}
              onCancel={() => setEditId(null)}
              onSave={(d) => run(upsertSectionAction({ id: s.id, courseVersionId, ...d }), "Saxlanıldı")}
            />
          ) : (
            <div key={s.id} className={`rounded-lg border p-3 ${s.hidden ? "opacity-50" : ""}`}>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium">{s.title}</span>
                {s.required && <Badge variant="outline">tələb olunur</Badge>}
                {s.hidden && <Badge variant="secondary">gizli</Badge>}
                {!readOnly && (
                  <div className="ml-auto flex items-center gap-0.5">
                    <button className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={() => move(i, -1)}><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={() => move(i, 1)}><ChevronDown className="h-3.5 w-3.5" /></button>
                    <button
                      className="rounded p-1 text-muted-foreground hover:bg-muted"
                      onClick={() => run(upsertSectionAction({ id: s.id, courseVersionId, title: s.title, body: s.body, hidden: !s.hidden }), s.hidden ? "Göstərilir" : "Gizlədildi")}
                    >
                      {s.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={() => setEditId(s.id)}><Pencil className="h-3.5 w-3.5" /></button>
                    {!s.required && (
                      <button
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                        onClick={() => run(deleteSectionAction(s.id), "Silindi")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {s.body.trim() ? (
                <Markdown>{s.body}</Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">{s.required ? "⚠️ Boşdur (tələb olunur)." : "Boşdur."}</p>
              )}
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}

function SectionForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Section>;
  onCancel: () => void;
  onSave: (d: { title: string; body: string }) => void;
}) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [body, setBody] = React.useState(initial?.body ?? "");
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bölmə başlığı" />
      <MarkdownEditor value={body} onChange={setBody} minRows={5} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => title.trim() && onSave({ title, body })}>
          <Check className="h-3.5 w-3.5" /> Saxla
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Ləğv et</Button>
      </div>
    </div>
  );
}
