"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { Markdown } from "@/components/markdown";
import { updateVersionMetaAction } from "@/server/actions/course-version";

export function VersionMeta({
  id,
  readOnly,
  label,
  description,
  objective,
}: {
  id: string;
  readOnly: boolean;
  label: string;
  description: string;
  objective: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({ label, description, objective });

  function save() {
    start(async () => {
      const res = await updateVersionMetaAction({ id, ...f });
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
        <CardTitle className="text-base">Fənnin təsviri və məqsədi</CardTitle>
        {!readOnly && !editing && (
          <Button size="sm" variant="ghost" onClick={() => { setF({ label, description, objective }); setEditing(true); }}>
            <Pencil className="h-3.5 w-3.5" /> Redaktə
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <>
            <label className="block text-xs font-medium text-muted-foreground">
              Versiya adı
              <Input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} className="mt-1" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Təsvir
              <div className="mt-1"><MarkdownEditor value={f.description} onChange={(v) => setF({ ...f, description: v })} minRows={4} /></div>
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Məqsəd
              <div className="mt-1"><MarkdownEditor value={f.objective} onChange={(v) => setF({ ...f, objective: v })} minRows={3} /></div>
            </label>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={pending}><Check className="h-3.5 w-3.5" /> Saxla</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Ləğv et</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Təsvir</p>
              {description.trim() ? <Markdown>{description}</Markdown> : <p className="text-sm text-muted-foreground">Boşdur.</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Məqsəd</p>
              {objective.trim() ? <Markdown>{objective}</Markdown> : <p className="text-sm text-muted-foreground">Boşdur.</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
