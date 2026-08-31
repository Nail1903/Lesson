"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { upsertNoteAction, deleteNoteAction } from "@/server/actions/term-content";

interface Note {
  id: string;
  title: string | null;
  body: string;
  isAiGenerated: boolean;
}

export function NotesPanel({ termId, notes }: { termId: string; notes: Note[] }) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [, start] = React.useTransition();

  function save(d: { id?: string; title: string; body: string }) {
    start(async () => {
      const res = await upsertNoteAction({ termId, ...d });
      if (res.ok) {
        toast.success("Qeyd saxlanıldı");
        setAdding(false);
        setEditId(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteNoteAction(id);
      if (res.ok) {
        toast.success("Silindi");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Əlavə qeydlər ({notes.length})</CardTitle>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" /> Qeyd əlavə et
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && <NoteEditor onCancel={() => setAdding(false)} onSave={save} />}
        {notes.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">Hələ əlavə qeyd yoxdur.</p>
        )}
        {notes.map((n) =>
          editId === n.id ? (
            <NoteEditor key={n.id} initial={n} onCancel={() => setEditId(null)} onSave={(d) => save({ id: n.id, ...d })} />
          ) : (
            <div key={n.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2">
                {n.title && <span className="text-sm font-medium">{n.title}</span>}
                {n.isAiGenerated && <Badge variant="secondary"><Bot className="mr-1 h-3 w-3" />AI (təsdiqlənib)</Badge>}
                <div className="ml-auto flex gap-1">
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setEditId(n.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(n.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Markdown>{n.body}</Markdown>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}

function NoteEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Note>;
  onCancel: () => void;
  onSave: (d: { title: string; body: string }) => void;
}) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [body, setBody] = React.useState(initial?.body ?? "");
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <input
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Başlıq (opsional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <MarkdownEditor value={body} onChange={setBody} minRows={5} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => body.trim() && onSave({ title, body })}>Saxla</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Ləğv et</Button>
      </div>
    </div>
  );
}
