"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Markdown } from "@/components/markdown";
import { updateLessonAction } from "@/server/actions/lessons";

type Field =
  | "objective"
  | "teachingNotes"
  | "preClassPrep"
  | "prerequisites"
  | "misconceptions"
  | "expectedQuestions"
  | "reflection"
  | "nextLessonNote"
  | "homework"
  | "description";

export function LessonTextSection({
  lessonId,
  field,
  title,
  hint,
  value,
  rich = false,
}: {
  lessonId: string;
  field: Field;
  title: string;
  hint?: string;
  value: string | null;
  rich?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? "");
  const [pending, start] = React.useTransition();

  function save() {
    start(async () => {
      const res = await updateLessonAction({ id: lessonId, [field]: draft });
      if (res.ok) {
        toast.success("Saxlanıldı");
        setEditing(false);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => { setDraft(value ?? ""); setEditing(true); }}>
            <Pencil className="h-3.5 w-3.5" /> {value ? "Redaktə" : "Əlavə et"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            {rich ? (
              <MarkdownEditor value={draft} onChange={setDraft} minRows={5} />
            ) : (
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={pending}>
                <Check className="h-3.5 w-3.5" /> Saxla
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" /> Ləğv et
              </Button>
            </div>
          </div>
        ) : value ? (
          rich ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Boşdur.</p>
        )}
      </CardContent>
    </Card>
  );
}
