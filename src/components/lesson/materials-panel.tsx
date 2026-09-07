"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, FileText, Code2, Image as ImageIcon, Video, Presentation, Link2, File } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Markdown } from "@/components/markdown";
import { upsertMaterialAction, deleteMaterialAction } from "@/server/actions/lessons";

interface Material {
  id: string;
  kind: string;
  title: string | null;
  body: string | null;
  url: string | null;
}

const KINDS = [
  { v: "text", l: "Mətn", icon: FileText },
  { v: "example", l: "Nümunə", icon: FileText },
  { v: "code", l: "Kod", icon: Code2 },
  { v: "image", l: "Şəkil", icon: ImageIcon },
  { v: "video", l: "Video", icon: Video },
  { v: "slide", l: "Təqdimat", icon: Presentation },
  { v: "file", l: "Fayl", icon: File },
  { v: "link", l: "Keçid", icon: Link2 },
] as const;
const iconFor = (k: string) => KINDS.find((x) => x.v === k)?.icon ?? FileText;
const labelFor = (k: string) => KINDS.find((x) => x.v === k)?.l ?? k;

export function MaterialsPanel({ topicId, materials }: { topicId: string; materials: Material[] }) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [, start] = React.useTransition();

  function save(data: { id?: string; kind: string; title: string; body: string; url: string }) {
    start(async () => {
      const res = await upsertMaterialAction({ topicId, ...data });
      if (res.ok) {
        toast.success("Material saxlanıldı");
        setAdding(false);
        setEditId(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }
  function remove(id: string) {
    start(async () => {
      const res = await deleteMaterialAction(id, topicId);
      if (res.ok) {
        toast.success("Silindi");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Öyrənmə materialları ({materials.length})</CardTitle>
        <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Əlavə et</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && <MaterialEditor onCancel={() => setAdding(false)} onSave={save} />}
        {materials.length === 0 && !adding && <p className="text-sm text-muted-foreground">Material yoxdur.</p>}
        {materials.map((m) => {
          const Icon = iconFor(m.kind);
          return editId === m.id ? (
            <MaterialEditor key={m.id} initial={m} onCancel={() => setEditId(null)} onSave={(d) => save({ id: m.id, ...d })} />
          ) : (
            <div key={m.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{labelFor(m.kind)}</Badge>
                {m.title && <span className="text-sm font-medium">{m.title}</span>}
                <div className="ml-auto flex gap-1">
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setEditId(m.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {m.url && (
                <a href={m.url} target="_blank" rel="noreferrer" className="break-all text-xs text-primary underline">
                  {m.url}
                </a>
              )}
              {m.body && (
                <div className="mt-1">
                  {m.kind === "code" ? <Markdown>{`\`\`\`\n${m.body}\n\`\`\``}</Markdown> : <Markdown>{m.body}</Markdown>}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function MaterialEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Material>;
  onCancel: () => void;
  onSave: (d: { kind: string; title: string; body: string; url: string }) => void;
}) {
  const [kind, setKind] = React.useState(initial?.kind ?? "text");
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [url, setUrl] = React.useState(initial?.url ?? "");
  const [body, setBody] = React.useState(initial?.body ?? "");
  const needsUrl = ["image", "video", "slide", "file", "link"].includes(kind);

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex gap-2">
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
        </select>
        <Input placeholder="Başlıq" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
      </div>
      {needsUrl && <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />}
      {(!needsUrl || kind === "link") && (
        <MarkdownEditor value={body} onChange={setBody} minRows={3} placeholder={kind === "code" ? "Kod…" : "Mətn / qeyd (markdown)…"} />
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ kind, title, body, url })}>Saxla</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Ləğv et</Button>
      </div>
    </div>
  );
}
