"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Sparkles, Trash2, Pencil, Check, X, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { EXAMPLE_KIND_LABEL } from "@/lib/labels";
import { upsertExampleAction, deleteExampleAction } from "@/server/actions/term-content";
import { suggestExampleAction, resolveSuggestionAction } from "@/server/actions/ai-content";

interface Example {
  id: string;
  kind: string;
  title: string | null;
  body: string;
  rating: number | null;
  isAiGenerated: boolean;
}

const KINDS = Object.keys(EXAMPLE_KIND_LABEL);

export function ExamplesPanel({ termId, examples }: { termId: string; examples: Example[] }) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const [suggestion, setSuggestion] = React.useState<{ id: string; text: string } | null>(null);

  function save(data: { id?: string; kind: string; title: string; body: string }) {
    start(async () => {
      const res = await upsertExampleAction({ termId, ...data });
      if (res.ok) {
        toast.success("Nümunə saxlanıldı");
        setAdding(false);
        setEditId(null);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteExampleAction(id);
      if (res.ok) {
        toast.success("Silindi");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function askAi(style: "simpler" | "technical" | "another" | "real_life") {
    start(async () => {
      const res = await suggestExampleAction({ termId, style });
      if (res.ok) setSuggestion({ id: res.data.id, text: res.data.text });
      else toast.error(res.error);
    });
  }

  function resolve(accept: boolean) {
    if (!suggestion) return;
    start(async () => {
      const res = await resolveSuggestionAction({ id: suggestion.id, accept, exampleKind: "USER" });
      if (res.ok) {
        toast.success(accept ? "Nümunə qeydə əlavə edildi" : "Təklif rədd edildi");
        setSuggestion(null);
        if (accept) router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Nümunələr ({examples.length})</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={() => askAi("simpler")} disabled={pending}>
            <Sparkles className="h-3.5 w-3.5" /> Sadə
          </Button>
          <Button size="sm" variant="outline" onClick={() => askAi("technical")} disabled={pending}>
            <Sparkles className="h-3.5 w-3.5" /> Texniki
          </Button>
          <Button size="sm" variant="outline" onClick={() => askAi("another")} disabled={pending}>
            <Sparkles className="h-3.5 w-3.5" /> Başqa nümunə
          </Button>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Əlavə et
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestion && (
          <div className="rounded-lg border border-primary/40 bg-accent/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
              <Bot className="h-3.5 w-3.5" /> AI təklifi — təsdiq etməsəniz qeydə əlavə olunmayacaq
            </p>
            <Markdown>{suggestion.text}</Markdown>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => resolve(true)} disabled={pending}>
                <Check className="h-3.5 w-3.5" /> Qəbul et
              </Button>
              <Button size="sm" variant="ghost" onClick={() => resolve(false)} disabled={pending}>
                <X className="h-3.5 w-3.5" /> Rədd et
              </Button>
            </div>
          </div>
        )}

        {adding && <ExampleEditor onCancel={() => setAdding(false)} onSave={save} />}

        {examples.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">Hələ nümunə yoxdur.</p>
        )}

        {examples.map((ex) =>
          editId === ex.id ? (
            <ExampleEditor
              key={ex.id}
              initial={ex}
              onCancel={() => setEditId(null)}
              onSave={(d) => save({ id: ex.id, ...d })}
            />
          ) : (
            <div key={ex.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline">{EXAMPLE_KIND_LABEL[ex.kind] ?? ex.kind}</Badge>
                {ex.isAiGenerated && <Badge variant="secondary"><Bot className="mr-1 h-3 w-3" />AI</Badge>}
                {ex.title && <span className="text-sm font-medium">{ex.title}</span>}
                <div className="ml-auto flex gap-1">
                  <button className="text-muted-foreground hover:text-foreground" onClick={() => setEditId(ex.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(ex.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Markdown>{ex.body}</Markdown>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}

function ExampleEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Partial<Example>;
  onCancel: () => void;
  onSave: (d: { kind: string; title: string; body: string }) => void;
}) {
  const [kind, setKind] = React.useState(initial?.kind ?? "EVERYDAY");
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [body, setBody] = React.useState(initial?.body ?? "");

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex gap-2">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>{EXAMPLE_KIND_LABEL[k]}</option>
          ))}
        </select>
        <input
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Başlıq (opsional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <MarkdownEditor value={body} onChange={setBody} minRows={4} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => body.trim() && onSave({ kind, title, body })}>Saxla</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Ləğv et</Button>
      </div>
    </div>
  );
}
